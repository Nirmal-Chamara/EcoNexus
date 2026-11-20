import { z } from 'zod';
import { pool } from '../config/database';
import { authenticateAccessToken, assertActive } from './access.service';
import { AppError } from '../utils/AppError';

export type SubscriptionKind = 'pickup' | 'collector' | 'available';

/** Used on subscription AND delivery, so stale rooms cannot retain access. */
export async function authorizeSubscription(
  token: unknown,
  kind: SubscriptionKind,
  id?: unknown
) {
  const user = await authenticateAccessToken(token);
  assertActive(user);
  if (kind === 'available') {
    if (user.role !== 'COLLECTOR' && user.role !== 'ADMIN')
      throw new AppError(403, 'Collector access required', 'FORBIDDEN');
    return user;
  }
  if (!z.string().uuid().safeParse(id).success)
    throw new AppError(
      400,
      'Invalid subscription identifier',
      'VALIDATION_ERROR'
    );
  if (
    user.role === 'ADMIN' ||
    (kind === 'collector' && user.role === 'COLLECTOR' && user.id === id)
  )
    return user;
  const result =
    kind === 'pickup'
      ? await pool.query(
          `SELECT p.id FROM pickup_requests p WHERE p.id = $1 AND
       (p.user_id = $2 OR ($3 = 'COLLECTOR' AND EXISTS (
         SELECT 1 FROM pickup_allocations a WHERE a.pickup_request_id = p.id
         AND a.collector_id = $2 AND a.status IN ('ACCEPTED', 'IN_TRANSIT', 'COMPLETED')
       )))`,
          [id, user.id, user.role]
        )
      : await pool.query(
          `SELECT p.id FROM pickup_requests p JOIN pickup_allocations a ON a.pickup_request_id = p.id
       WHERE a.collector_id = $1 AND p.user_id = $2
       AND p.status IN ('ACCEPTED', 'IN_TRANSIT') AND a.status IN ('ACCEPTED', 'IN_TRANSIT') LIMIT 1`,
          [id, user.id]
        );
  if (!result.rows.length)
    throw new AppError(403, 'Subscription is not permitted', 'FORBIDDEN');
  return user;
}
