import { pool } from '../config/database';
import { auditPhoneValues } from '../services/phone-audit.service';

export async function auditPhones() {
  const result = await pool.query<{ phone: string | null }>('SELECT phone FROM users');
  return auditPhoneValues(result.rows.map((row) => row.phone));
}

if (require.main === module) {
  void auditPhones()
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      if (report.canonicalCollisionGroups || report.invalidOrAmbiguous) process.exitCode = 1;
    })
    .catch(() => { console.error('Phone audit failed; check database access.'); process.exitCode = 1; })
    .finally(() => pool.end());
}
