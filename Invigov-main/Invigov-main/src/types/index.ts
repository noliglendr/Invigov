export type EntitlementStatus = "none" | "inactive" | "pending_checkout" | "active" | "expired" | "canceled" | "completed";
export type SubscriptionStatus = "inactive" | "pending_checkout" | "active" | "expired" | "canceled";
export type SubscriptionTier = "free" | "intelligence" | "complete";

export interface Entitlement {
  // New tier-based fields
  subscription_tier: SubscriptionTier;
  subscription_status: string;
  subscription_start_at: string | null;
  subscription_end_at: string | null;
  // Legacy fields (kept for backward compatibility)
  sam_onboarding_status: EntitlementStatus;
  compliance_subscription_status: SubscriptionStatus;
  sam_onboarding_paid_at: string | null;
  sam_onboarding_completed_at: string | null;
}

export type BusinessType = "corporation" | "sole_proprietor" | "llc" | "partnership" | "nonprofit";

export interface BusinessInfo {
  business_type: BusinessType;
  legal_name: string;
  ein: string;
  address_line1: string;
  city: string;
  state: string;
  zip_code: string;
  dba_name?: string;
  address_line2?: string;
  uei_number?: string;
}

export interface NaicsCodesData {
  naics_codes: string[];
  primary_naics: string;
  annual_receipts_avg?: number;
  total_employees?: number;
}

export interface BankingInfo {
  routing_number: string;
  account_number: string;
  account_holder: string;
  bank_name: string;
}

export interface RepsCertsData {
  responses: Record<string, any>;
}

export interface StepData {
  business_info?: BusinessInfo;
  naics_codes?: NaicsCodesData;
  banking_info?: BankingInfo;
  reps_certs?: RepsCertsData;
}

export interface WorkflowSession {
  id: string;
  current_step: WorkflowStep;
  status: string;
  completed_steps: WorkflowStep[];
  step_data: StepData;
  last_active_at: string;
}

export type WorkflowStep =
  | "business_info"
  | "naics_codes"
  | "banking_info"
  | "reps_certs"
  | "document_review"
  | "preflight"
  | "complete";

export interface ComplianceDeadline {
  id: string;
  type: string;
  title: string;
  deadline_date: string;
  days_remaining: number;
  urgency: "ok" | "warning" | "critical";
  is_completed: boolean;
}
