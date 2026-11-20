import { Request, Response, NextFunction } from 'express';
import { PickupService } from '../services/pickup.service';
import { MatchingService } from '../algorithms/matching/matching.service';
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

  /**
   * POST /api/pickup/:id/verify-weigh
   * Collector verifies handshake PIN and records scale weights
   */
  static async verifyWeigh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { id } = req.params;
      const result = await PickupService.verifyAndWeighPickup(
        id,
        req.user.id,
        req.body,
        req.user.role
      );

      res.status(200).json({
        message: 'Pickup verified and weighed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pickup/:id/suggested-collectors
   * Retrieve ranked suggested collectors for a pickup request
   */
  static async getSuggestedCollectors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 25000;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const ranked = await MatchingService.findRankedCollectorsForPickup(id, radius, limit);

      res.status(200).json({
        message: 'Suggested collectors retrieved successfully',
        count: ranked.length,
        data: ranked,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pickup/recommended
   * Suggest collectors near given GPS coordinates
   */
  static async getRecommended(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lat = parseFloat(req.query.latitude as string);
      const lng = parseFloat(req.query.longitude as string);
      const wasteType = (req.query.wasteType as string) || 'PLASTIC';
      const weight = req.query.weight ? parseFloat(req.query.weight as string) : 5;
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 25000;

      if (isNaN(lat) || isNaN(lng)) {
        throw new AppError(400, 'Valid latitude and longitude query params are required', 'INVALID_COORDINATES');
      }

      const results = await MatchingService.getRecommendedCollectors(lat, lng, wasteType, weight, radius);

      res.status(200).json({
        message: 'Recommended collectors retrieved',
        count: results.length,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
}
