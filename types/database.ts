export type UserRole = 'client' | 'maker' | 'admin';
export type PrinterTechnology = 'FDM' | 'SLA' | 'SLS';
export type OrderStatus =
  | 'pending_matching'
  | 'assigned_pending_acceptance'
  | 'approved'
  | 'queued'
  | 'printing'
  | 'post_processing'
  | 'qa_review'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type QAStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  is_business: boolean;
  vat_number?: string;
  tax_id?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country: string;
  stripe_account_id?: string;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  rating_average: number;
  rating_count: number;
  completion_rate: number;
  max_active_orders: number;
  active_orders_count: number;
  created_at: string;
  updated_at: string;
}

export interface Printer {
  id: string;
  maker_id: string;
  name: string;
  technology: PrinterTechnology;
  build_volume_x_mm: number;
  build_volume_y_mm: number;
  build_volume_z_mm: number;
  materials: string[];
  hourly_machine_rate: number;
  cost_per_gram_map: Record<string, number>;
  base_startup_fee: number;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  client_id: string;
  maker_id?: string;
  status: OrderStatus;
  file_url: string;
  file_name: string;
  file_format: string;
  file_size_bytes: number;
  dimensions_x_mm: number;
  dimensions_y_mm: number;
  dimensions_z_mm: number;
  volume_cm3: number;
  scale_factor: number;
  infill_percentage: number;
  material_selected: string;
  technology: PrinterTechnology;
  price_total_cents: number;
  price_maker_cents: number;
  application_fee_cents: number;
  tax_cents: number;
  currency: string;
  stripe_payment_intent_id?: string;
  stripe_transfer_id?: string;
  escrow_released_at?: string;
  estimated_print_hours: number;
  print_started_at?: string;
  print_estimated_finish_at?: string;
  tos_accepted_at: string;
  ip_warranty_accepted_at: string;
  liability_waiver_accepted_at: string;
  user_ip_address: string;
  user_agent: string;
  qa_photo_url_1?: string;
  qa_photo_url_2?: string;
  qa_status?: QAStatus;
  qa_confidence_score?: number;
  qa_defect_summary?: string;
  qa_evaluated_at?: string;
  current_maker_notified_at?: string;
  routing_history: Array<{
    maker_id: string;
    notified_at: string;
    expired_at?: string;
    status: 'pending' | 'accepted' | 'timed_out' | 'declined';
  }>;
  created_at: string;
  updated_at: string;
}

export interface NearbyMaker {
  id: string;
  full_name: string;
  avatar_url?: string;
  city: string;
  distance_meters: number;
  rating_average: number;
  rating_count: number;
  completion_rate: number;
  active_orders_count: number;
  max_active_orders: number;
  materials: string[];
  hourly_machine_rate: number;
  lat: number;
  lng: number;
}
