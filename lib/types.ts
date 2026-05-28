export type UserRole = 'citizen' | 'admin' | 'officer'
export type ReportStatus =
  | 'waiting_verification'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'duplicate'
  | 'need_evidence'
export type Urgency = 'low' | 'medium' | 'high' | 'emergency'

export interface Profile {
  id: string
  full_name: string
  email: string
  phone_number?: string
  role: UserRole
  kecamatan?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface ReportCategory {
  id: string
  name: string
  icon_name?: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  name: string
  description?: string
  contact_number?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  reporter_id: string
  reporter_name: string
  title: string
  description: string
  category_id?: string
  category_name: string
  urgency: Urgency
  status: ReportStatus
  kecamatan?: string
  address?: string
  latitude?: number
  longitude?: number
  photo_urls: string[]
  assigned_department_id?: string
  assigned_officer_id?: string
  admin_note?: string
  completion_note?: string
  completion_photo_urls: string[]
  is_public: boolean
  created_at: string
  updated_at: string
  completed_at?: string
  // joined
  reporter?: Profile
  assigned_officer?: Profile
  department?: Department
}

export interface ReportStatusHistory {
  id: string
  report_id: string
  status: ReportStatus
  note?: string
  updated_by?: string
  updated_by_role?: string
  created_at: string
}

export interface OfficerTask {
  id: string
  report_id: string
  officer_id: string
  department_id?: string
  status: string
  note?: string
  deadline?: string
  created_at: string
  updated_at: string
  report?: Report
  officer?: Profile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  report_id?: string
  is_read: boolean
  created_at: string
}

export interface SatisfactionRating {
  id: string
  report_id: string
  user_id: string
  rating: number
  comment?: string
  is_resolved: boolean
  created_at: string
}
