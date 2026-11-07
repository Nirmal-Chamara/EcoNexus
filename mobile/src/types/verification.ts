export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** GET /admin/verifications joined row, not the full database record. */
export interface VerificationRequest {
  id: string;
  requested_role: 'COLLECTOR' | 'RECYCLING_CENTER';
  organization_name: string | null;
  registration_no: string | null;
  document_url: string | null;
  status: VerificationStatus;
  created_at: string;
  user_id: string;
  user_name: string;
  user_email: string;
}
