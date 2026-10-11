import { Request, Response, NextFunction } from 'express';
import { CollectorService } from '../services/collector.service';
import { AppError } from '../utils/AppError';

export class CollectorController {
  /**
   * PUT /api/collector/location
   * Collector updates live GPS coordinates
   */
  static async updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { latitude, longitude } = req.body;
      const result = await CollectorService.updateLocation(req.user.id, latitude, longitude);

      res.status(200).json({
        message: 'Location updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/collector/profile
   * Collector views their profile
   */
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const profile = await CollectorService.getProfile(req.user.id);

      res.status(200).json({
        message: 'Collector profile retrieved successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/collector/profile
   * Collector updates vehicle, capacity, or availability
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const result = await CollectorService.updateProfile(req.user.id, req.body);

      res.status(200).json({
        message: 'Collector profile updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/collector/pickups
   * Collector fetches their assigned pickup requests
   */
  static async getAssignedPickups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const pickups = await CollectorService.getAssignedPickups(req.user.id);

      res.status(200).json({
        message: 'Assigned pickups retrieved successfully',
        count: pickups.length,
        data: pickups,
      });
    } catch (error) {
      next(error);
    }
  }
}
