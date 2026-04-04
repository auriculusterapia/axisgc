import { User } from './auth';

export type BillingItemStatus = 
  | 'draft'               // Criado automaticamente, falta dados
  | 'pending_review'      // Aguardando conferência
  | 'ready_to_bill'       // Pronto para entrar em lote
  | 'billed'              // Em lote enviado
  | 'partially_paid'      // Recebido com glosas parciais
  | 'paid'                // Liquidado
  | 'glossed_total'       // Glosa total
  | 'cancelled';          // Estornado

export type BatchStatus = 'open' | 'closed' | 'sent' | 'paid';

export type GlossStatus = 'pending' | 'appealed' | 'accepted';

export interface Insurer {
  id: string;
  name: string;
  ans_registration?: string;
  cnpj?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface InsurancePlan {
  id: string;
  insurer_id: string;
  name: string;
  external_code?: string;
  insurer?: Insurer;
  created_at: string;
  updated_at: string;
}

export interface Procedure {
  id: string;
  code: string; // TUSS
  name: string;
  description?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface InsurancePrice {
  id: string;
  plan_id: string;
  procedure_id: string;
  unit_price: number;
  valid_from?: string;
  valid_until?: string;
  procedure?: Procedure;
}

export interface PatientInsurance {
  id: string;
  patient_id: string;
  plan_id: string;
  card_number: string;
  validity_date?: string;
  is_active: boolean;
  notes?: string;
  plan?: InsurancePlan;
  created_at: string;
}

export interface BillingBatch {
  id: string;
  insurer_id: string;
  competence: string; // YYYY-MM
  status: BatchStatus;
  total_presented_value: number;
  total_paid_value: number;
  insurer?: Insurer;
  created_at: string;
}

export interface BillingItem {
  id: string;
  status: BillingItemStatus;
  competence: string;
  patient_id: string;
  professional_id: string;
  insurance_plan_id: string;
  procedure_id: string;
  appointment_id?: string;
  batch_id?: string;
  service_date: string;
  guia_number?: string;
  auth_number?: string;
  quantity: number;
  unit_value: number;
  total_presented_value: number;
  total_paid_value?: number;
  total_glossed_value?: number;
  notes?: string;
  
  // Relations (optional for hydration)
  patient?: any;
  professional?: User;
  plan?: InsurancePlan;
  procedure?: Procedure;
  batch?: BillingBatch;
  glosses?: BillingGloss[];
  
  created_at: string;
  updated_at: string;
}

export interface BillingGloss {
  id: string;
  billing_item_id: string;
  gloss_code?: string;
  reason?: string;
  value: number;
  status: GlossStatus;
  created_at: string;
}
