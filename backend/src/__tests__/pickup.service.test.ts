import { PickupService } from '../services/pickup.service';
import { PickupRequestModel } from '../models/pickupRequest.model';
import { AppError } from '../utils/AppError';
import * as socketModule from '../sockets/pickup.socket';

jest.mock('../models/pickupRequest.model');
jest.mock('../sockets/pickup.socket');

describe('PickupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPickup', () => {
    it('creates a pickup request and emits socket broadcast', async () => {
      const mockDto = {
        userId: 'user-1',
        lat: 6.9271,
        lng: 79.8612,
        address: 'Colombo',
        wasteType: 'Plastic',
      };
      const mockResult = { id: 'pickup-1', ...mockDto, status: 'PENDING' };

      (PickupRequestModel.createRequest as jest.Mock).mockResolvedValue(mockResult);

      const result = await PickupService.createPickup(mockDto as any);

      expect(PickupRequestModel.createRequest).toHaveBeenCalledWith(mockDto);
      expect(socketModule.emitToNearbyCollectors).toHaveBeenCalledWith(
        'new_pickup_request',
        mockResult
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getPickupById', () => {
    it('returns pickup details with allocation and timeline events', async () => {
      const mockPickup = {
        id: 'pickup-1',
        user_id: 'user-1',
        status: 'ACCEPTED',
        address_text: 'Colombo',
      };
      const mockAllocation = {
        collector_id: 'collector-1',
        collector_name: 'John Driver',
      };
      const mockEvents = [
        { id: 1, status: 'PENDING', note: 'Created' },
        { id: 2, status: 'ACCEPTED', note: 'Claimed' },
      ];

      (PickupRequestModel.findById as jest.Mock).mockResolvedValue(mockPickup);
      (PickupRequestModel.getAllocation as jest.Mock).mockResolvedValue(mockAllocation);
      (PickupRequestModel.getEvents as jest.Mock).mockResolvedValue(mockEvents);

      const result = await PickupService.getPickupById('pickup-1');

      expect(result).toEqual({
        ...mockPickup,
        allocation: mockAllocation,
        events: mockEvents,
      });
    });

    it('throws 404 AppError if pickup is not found', async () => {
      (PickupRequestModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(PickupService.getPickupById('non-existent')).rejects.toThrow(AppError);
    });
  });

  describe('acceptPickup', () => {
    it('successfully assigns collector to PENDING request and emits socket update', async () => {
      const mockPickup = { id: 'pickup-1', status: 'PENDING' };
      const mockAllocation = { id: 'alloc-1', collector_id: 'collector-1' };

      (PickupRequestModel.findById as jest.Mock).mockResolvedValue(mockPickup);
      (PickupRequestModel.assignCollector as jest.Mock).mockResolvedValue(mockAllocation);

      const result = await PickupService.acceptPickup('pickup-1', 'collector-1');

      expect(PickupRequestModel.assignCollector).toHaveBeenCalledWith('pickup-1', 'collector-1');
      expect(socketModule.emitPickupStatusUpdate).toHaveBeenCalledWith('pickup-1', {
        status: 'ACCEPTED',
        collectorId: 'collector-1',
      });
      expect(result.allocation).toEqual(mockAllocation);
    });

    it('rejects accept if pickup status is not PENDING', async () => {
      const mockPickup = { id: 'pickup-1', status: 'IN_TRANSIT' };

      (PickupRequestModel.findById as jest.Mock).mockResolvedValue(mockPickup);

      await expect(PickupService.acceptPickup('pickup-1', 'collector-1')).rejects.toThrow(
        AppError
      );
    });
  });

  describe('updatePickupStatus lifecycle state machine', () => {
    it('allows valid transition from ACCEPTED to IN_TRANSIT', async () => {
      const mockPickup = { id: 'pickup-1', status: 'ACCEPTED' };
      const mockAllocation = { collector_id: 'collector-1' };
      const mockUpdated = { id: 'pickup-1', status: 'IN_TRANSIT', updated_at: '2026-11-07' };

      (PickupRequestModel.findById as jest.Mock).mockResolvedValue(mockPickup);
      (PickupRequestModel.getAllocation as jest.Mock).mockResolvedValue(mockAllocation);
      (PickupRequestModel.updateStatus as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await PickupService.updatePickupStatus(
        'pickup-1',
        'collector-1',
        'IN_TRANSIT',
        'COLLECTOR'
      );

      expect(PickupRequestModel.updateStatus).toHaveBeenCalledWith('pickup-1', 'IN_TRANSIT');
      expect(socketModule.emitPickupStatusUpdate).toHaveBeenCalledWith('pickup-1', {
        status: 'IN_TRANSIT',
        updatedAt: '2026-11-07',
      });
      expect(result.status).toBe('IN_TRANSIT');
    });

    it('rejects invalid state jump (e.g. PENDING directly to COMPLETED)', async () => {
      const mockPickup = { id: 'pickup-1', status: 'PENDING' };
      const mockAllocation = { collector_id: 'collector-1' };

      (PickupRequestModel.findById as jest.Mock).mockResolvedValue(mockPickup);
      (PickupRequestModel.getAllocation as jest.Mock).mockResolvedValue(mockAllocation);

      await expect(
        PickupService.updatePickupStatus('pickup-1', 'collector-1', 'COMPLETED', 'COLLECTOR')
      ).rejects.toThrow(AppError);
    });

    it('rejects update if collector is not the assigned driver', async () => {
      const mockPickup = { id: 'pickup-1', status: 'ACCEPTED' };
      const mockAllocation = { collector_id: 'collector-DIFFERENT' };

      (PickupRequestModel.findById as jest.Mock).mockResolvedValue(mockPickup);
      (PickupRequestModel.getAllocation as jest.Mock).mockResolvedValue(mockAllocation);

      await expect(
        PickupService.updatePickupStatus('pickup-1', 'collector-1', 'IN_TRANSIT', 'COLLECTOR')
      ).rejects.toThrow(AppError);
    });
  });
});
