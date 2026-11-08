import { sendPasswordResetEmail } from '../services/email.service';
import { logger } from '../utils/logger';

async function main() {
  const recipient = process.argv[2] || 'econexus.lk@gmail.com';
  logger.info(`Sending test password-reset email to: ${recipient}...`);

  try {
    await sendPasswordResetEmail(recipient, 'TEST-RESET-123456');
    logger.info(`Test email sent successfully! Please check inbox / spam for: ${recipient}`);
  } catch (err: any) {
    logger.error(`Failed to send test email: ${err.message}`);
    process.exit(1);
  }
}

main();

