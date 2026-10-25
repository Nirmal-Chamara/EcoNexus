import path from 'path';

// Import seedAdmin routine from backend/src/scripts/seedAdmin
import { seedAdmin } from '../backend/src/scripts/seedAdmin';

seedAdmin()
  .then(() => {
    console.log('[Root Admin Seed] Completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Root Admin Seed Error]:', err);
    process.exit(1);
  });
