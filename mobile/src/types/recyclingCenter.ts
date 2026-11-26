// recyclingCenter.ts — Type definitions for the Recycling Center module

export type IntakeStatus = 'RECEIVED' | 'SORTED' | 'PROCESSED';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RecyclingCenterProfile {
  user_id: string;
  organization_name: string | null;
  registration_no: string | null;
  contact_phone: string | null;
  address_text: string | null;
  total_capacity_kg: number;
  current_intake_kg: number;
  document_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined from users
  name?: string;
  email?: string;
  phone?: string;
  account_status?: string;
  // Joined from verification_requests
  verification_status?: VerificationStatus;
  review_note?: string | null;
  reviewed_at?: string | null;
}

export interface UpdateProfileInput {
  organization_name?: string;
  registration_no?: string;
  contact_phone?: string;
  address_text?: string;
  total_capacity_kg?: number;
  document_url?: string;
}

export interface VerificationStatusRecord {
  id: string;
  status: VerificationStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  organization_name: string | null;
  registration_no: string | null;
  document_url: string | null;
  reviewer_name?: string;
}

export interface AcceptedCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  added_at: string;
}

export interface IntakeRecord {
  id: string;
  quantity_kg: number;
  delivery_ref: string | null;
  notes: string | null;
  status: IntakeStatus;
  received_at: string;
  created_at: string;
  updated_at: string;
  category_id: number;
  category_name: string;
  category_icon: string | null;
}

export interface CreateIntakeInput {
  category_id: number;
  quantity_kg: number;
  received_at?: string;
  delivery_ref?: string;
  notes?: string;
}

export interface DashboardSummary {
  profile: {
    organization_name: string | null;
    total_capacity_kg: number;
    current_intake_kg: number;
    verification_status: VerificationStatus | null;
  };
  accepted_category_count: number;
  intake_summary: {
    received_count: string;
    sorted_count: string;
    processed_count: string;
    total_kg_all_time: string;
    kg_last_30_days: string;
  };
  recent_intake: IntakeRecord[];
}
