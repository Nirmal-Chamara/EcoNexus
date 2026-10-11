import { Request, Response, NextFunction } from 'express';
import { PickupService } from '../services/pickup.service';
import { AppError } from '../utils/AppError';

export class PickupController {
  /**
   * POST /api/pickup/request
   * User creates a new pickup request
   */
  static async createRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { latitude, longitude, address, wasteType, estimatedWeight, notes, images, scheduledTime } = req.body;

      const result = await PickupService.createPickup({
        userId: req.user.id,
        lat: latitude,
        lng: longitude,
        address,
        wasteType,
        estimatedWeight,
        notes,
        images,
        scheduledTime,
      });

      res.status(201).json({
        message: 'Pickup request created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pickup/nearby
   * Collector searches for open requests within radius
   */
  static async getNearby(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 5000;

      const results = await PickupService.getNearbyPickups(latitude, longitude, radius);

      res.status(200).json({
        message: 'Nearby pickup requests retrieved',
        count: results.length,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pickup/my
   * User fetches all their pickup requests
   */
  static async getMyPickups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const results = await PickupService.getUserPickups(req.user.id);

      res.status(200).json({
        message: 'User pickup requests retrieved',
        count: results.length,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pickup/:id
   * Fetch specific pickup request by ID
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await PickupService.getPickupById(id);

      res.status(200).json({
        message: 'Pickup request retrieved',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/pickup/:id/accept
   * Collector claims / accepts a pending pickup
   */
  static async acceptPickup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { id } = req.params;
      const result = await PickupService.acceptPickup(id, req.user.id);

      res.status(200).json({
        message: 'Pickup request accepted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/pickup/:id/status
   * Collector updates the pickup status (IN_TRANSIT, COMPLETED, CANCELLED)
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { id } = req.params;
      const { status } = req.body;

      const result = await PickupService.updatePickupStatus(
        id,
        req.user.id,
        status,
        req.user.role
      );

      res.status(200).json({
        message: `Pickup status updated to ${status}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
