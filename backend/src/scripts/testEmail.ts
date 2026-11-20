import { randomUUID } from 'crypto';
import { configuredMailProvider, sendTransactionalEmail } from '../services/email.service';

async function main() {
  const recipient = process.argv[2];
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error('An explicit test recipient is required');
  await sendTransactionalEmail(configuredMailProvider(), randomUUID(), recipient, 'EcoNexus sender configuration check', 'This is a sender configuration check. It contains no account reset or verification credential.');
  console.log('Email accepted by provider. Confirm actual receipt separately.');
}
if (require.main === module) void main().catch(() => { console.error('Email sender check failed; review configuration and provider status'); process.exitCode = 1; });