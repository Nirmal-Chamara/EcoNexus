import { z } from 'zod';
import {
  createPickupRequestSchema,
  nearbyPickupQuerySchema,
  updatePickupStatusSchema,
  pickupIdParamSchema,
  pickupStatusEnum,
} from '../validators/pickup.validator';

function passes(schema: z.ZodSchema, value: unknown): boolean {
  return schema.safeParse(value).success;
}

function getErrors(schema: z.ZodSchema, value: unknown): string[] {
  const result = schema.safeParse(value);
  if (result.success) return [];
  return result.error.issues.map((i) => i.message);
}

describe('pickupStatusEnum', () => {
  it('accepts valid status transitions', () => {
    expect(passes(pickupStatusEnum, 'PENDING')).toBe(true);
    expect(passes(pickupStatusEnum, 'ACCEPTED')).toBe(true);
    expect(passes(pickupStatusEnum, 'IN_TRANSIT')).toBe(true);
    expect(passes(pickupStatusEnum, 'COMPLETED')).toBe(true);
    expect(passes(pickupStatusEnum, 'CANCELLED')).toBe(true);
  });

  it('rejects invalid statuses', () => {
    expect(passes(pickupStatusEnum, 'UNKNOWN_STATUS')).toBe(false);
    expect(passes(pickupStatusEnum, 'pending')).toBe(false); // Must be uppercase
    expect(passes(pickupStatusEnum, '')).toBe(false);
  });
});

describe('createPickupRequestSchema', () => {
  const validPayload = {
    body: {
      latitude: 6.9271,
      longitude: 79.8612,
      address: '123 Galle Road, Colombo 03',
      wasteType: 'Plastic',
      estimatedWeight: 15.5,
      notes: 'Near the blue gate',
    },
  };

  it('accepts a valid pickup creation payload', () => {
    expect(passes(createPickupRequestSchema, validPayload)).toBe(true);
  });

  it('rejects invalid latitude or longitude bounds', () => {
    const invalidLat = {
      body: { ...validPayload.body, latitude: 105.0 },
    };
    expect(passes(createPickupRequestSchema, invalidLat)).toBe(false);

    const invalidLng = {
      body: { ...validPayload.body, longitude: -195.0 },
    };
    expect(passes(createPickupRequestSchema, invalidLng)).toBe(false);
  });

  it('rejects short address or missing wasteType', () => {
    const shortAddress = {
      body: { ...validPayload.body, address: 'ab' },
    };
    expect(passes(createPickupRequestSchema, shortAddress)).toBe(false);

    const missingType = {
      body: { ...validPayload.body, wasteType: '' },
    };
    expect(passes(createPickupRequestSchema, missingType)).toBe(false);
  });

  it('rejects non-positive estimated weight', () => {
    const zeroWeight = {
      body: { ...validPayload.body, estimatedWeight: 0 },
    };
    expect(passes(createPickupRequestSchema, zeroWeight)).toBe(false);

    const negWeight = {
      body: { ...validPayload.body, estimatedWeight: -5 },
    };
    expect(passes(createPickupRequestSchema, negWeight)).toBe(false);
  });
});

describe('nearbyPickupQuerySchema', () => {
  it('parses valid query string parameters', () => {
    const validQuery = {
      query: {
        latitude: '6.9271',
        longitude: '79.8612',
        radius: '10000',
      },
    };
    expect(passes(nearbyPickupQuerySchema, validQuery)).toBe(true);
  });

  it('defaults radius to 5000 if omitted', () => {
    const withoutRadius = {
      query: {
        latitude: '6.9271',
        longitude: '79.8612',
      },
    };
    const parsed = nearbyPickupQuerySchema.parse(withoutRadius);
    expect(parsed.query.radius).toBe(5000);
  });

  it('rejects non-numeric latitude or longitude strings', () => {
    const badCoords = {
      query: {
        latitude: 'not-a-number',
        longitude: '79.8612',
      },
    };
    expect(passes(nearbyPickupQuerySchema, badCoords)).toBe(false);
  });
});

describe('updatePickupStatusSchema', () => {
  const validUpdate = {
    params: { id: 'c2b4d82b-0294-4b53-9a73-982c7d9bc301' },
    body: { status: 'IN_TRANSIT', notes: 'Vehicle on the way' },
  };

  it('accepts a valid status update with UUID and valid status enum', () => {
    expect(passes(updatePickupStatusSchema, validUpdate)).toBe(true);
  });

  it('rejects invalid UUID parameter', () => {
    const invalidId = {
      ...validUpdate,
      params: { id: 'not-a-uuid' },
    };
    expect(passes(updatePickupStatusSchema, invalidId)).toBe(false);
  });

  it('rejects invalid status value', () => {
    const invalidStatus = {
      ...validUpdate,
      body: { status: 'FLYING' },
    };
    expect(passes(updatePickupStatusSchema, invalidStatus)).toBe(false);
  });
});

describe('pickupIdParamSchema', () => {
  it('accepts valid UUID', () => {
    expect(
      passes(pickupIdParamSchema, { params: { id: 'd290f1ee-6c54-4b01-90e6-d701748f0851' } })
    ).toBe(true);
  });

  it('rejects non-UUID', () => {
    expect(passes(pickupIdParamSchema, { params: { id: '12345' } })).toBe(false);
  });
});
