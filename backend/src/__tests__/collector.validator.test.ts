import { z } from 'zod';
import {
  vehicleTypeSchema,
  updateCollectorProfileSchema,
  updateCollectorLocationSchema,
  acceptPickupRequestSchema,
} from '../validators/collector.validator';

function passes(schema: z.ZodSchema, value: unknown): boolean {
  return schema.safeParse(value).success;
}

describe('vehicleTypeSchema', () => {
  it('accepts supported vehicle types', () => {
    expect(passes(vehicleTypeSchema, 'TRUCK')).toBe(true);
    expect(passes(vehicleTypeSchema, 'VAN')).toBe(true);
    expect(passes(vehicleTypeSchema, 'THREE_WHEELER')).toBe(true);
    expect(passes(vehicleTypeSchema, 'MOTORCYCLE')).toBe(true);
    expect(passes(vehicleTypeSchema, 'BICYCLE')).toBe(true);
  });

  it('rejects unsupported vehicle types', () => {
    expect(passes(vehicleTypeSchema, 'PLANE')).toBe(false);
    expect(passes(vehicleTypeSchema, 'boat')).toBe(false);
  });
});

describe('updateCollectorProfileSchema', () => {
  it('accepts valid profile update values', () => {
    const valid = {
      body: {
        vehicleType: 'TRUCK',
        vehicleCapacity: 500,
        isAvailable: true,
        serviceAreaRadiusKm: 25,
      },
    };
    expect(passes(updateCollectorProfileSchema, valid)).toBe(true);
  });

  it('accepts partial profile update', () => {
    const partial = {
      body: {
        isAvailable: false,
      },
    };
    expect(passes(updateCollectorProfileSchema, partial)).toBe(true);
  });

  it('rejects negative capacity or radius exceeding 100km', () => {
    const negCapacity = {
      body: { vehicleCapacity: -10 },
    };
    expect(passes(updateCollectorProfileSchema, negCapacity)).toBe(false);

    const hugeRadius = {
      body: { serviceAreaRadiusKm: 500 },
    };
    expect(passes(updateCollectorProfileSchema, hugeRadius)).toBe(false);
  });
});

describe('updateCollectorLocationSchema', () => {
  it('accepts valid coordinates', () => {
    const valid = {
      body: {
        latitude: 6.9271,
        longitude: 79.8612,
      },
    };
    expect(passes(updateCollectorLocationSchema, valid)).toBe(true);
  });

  it('rejects latitude or longitude out of bounds', () => {
    const badLat = {
      body: { latitude: 91, longitude: 79.8612 },
    };
    expect(passes(updateCollectorLocationSchema, badLat)).toBe(false);

    const badLng = {
      body: { latitude: 6.9271, longitude: 181 },
    };
    expect(passes(updateCollectorLocationSchema, badLng)).toBe(false);
  });
});

describe('acceptPickupRequestSchema', () => {
  it('accepts valid UUID parameter', () => {
    expect(
      passes(acceptPickupRequestSchema, {
        params: { id: 'd290f1ee-6c54-4b01-90e6-d701748f0851' },
      })
    ).toBe(true);
  });

  it('rejects malformed ID', () => {
    expect(
      passes(acceptPickupRequestSchema, {
        params: { id: 'invalid-id' },
      })
    ).toBe(false);
  });
});
