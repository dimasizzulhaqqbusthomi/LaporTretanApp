import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ReportStatus, Urgency } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusLabel(status: ReportStatus): string {
  const labels: Record<ReportStatus, string> = {
    waiting_verification: 'Menunggu Verifikasi',
    verified: 'Terverifikasi',
    assigned: 'Ditugaskan',
    in_progress: 'Dalam Proses',
    completed: 'Selesai',
    rejected: 'Ditolak',
    duplicate: 'Duplikat',
    need_evidence: 'Butuh Bukti Tambahan',
  }
  return labels[status] || status
}

export function getStatusColor(status: ReportStatus): string {
  const colors: Record<ReportStatus, string> = {
    waiting_verification: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    verified: 'bg-blue-100 text-blue-700 border-blue-200',
    assigned: 'bg-purple-100 text-purple-700 border-purple-200',
    in_progress: 'bg-orange-100 text-orange-700 border-orange-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    duplicate: 'bg-gray-100 text-gray-600 border-gray-200',
    need_evidence: 'bg-amber-100 text-amber-700 border-amber-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-600 border-gray-200'
}

export function getUrgencyLabel(urgency: Urgency): string {
  const labels: Record<Urgency, string> = {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi',
    emergency: 'Darurat',
  }
  return labels[urgency] || urgency
}

export function getUrgencyColor(urgency: Urgency): string {
  const colors: Record<Urgency, string> = {
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    emergency: 'bg-red-100 text-red-700 border-red-200',
  }
  return colors[urgency] || 'bg-gray-100 text-gray-600'
}

export const KECAMATAN_LIST = [
  'Bangkalan',
  'Burneh',
  'Kamal',
  'Socah',
  'Arosbaya',
  'Klampis',
  'Tanjungbumi',
  'Sepulu',
  'Galis',
  'Blega',
]

export const CATEGORY_LIST = [
  'Jalan Rusak',
  'Lampu Jalan Mati',
  'Sampah Menumpuk',
  'Drainase Tersumbat',
  'Banjir / Genangan Air',
  'Fasilitas Umum Rusak',
  'Rambu Lalu Lintas Rusak',
  'Pohon Tumbang',
  'Kebersihan Lingkungan',
  'Lainnya',
]

export const URGENCY_LIST = [
  { value: 'low', label: 'Rendah' },
  { value: 'medium', label: 'Sedang' },
  { value: 'high', label: 'Tinggi' },
  { value: 'emergency', label: 'Darurat' },
]

export const STATUS_LIST = [
  { value: 'waiting_verification', label: 'Menunggu Verifikasi' },
  { value: 'verified', label: 'Terverifikasi' },
  { value: 'assigned', label: 'Ditugaskan' },
  { value: 'in_progress', label: 'Dalam Proses' },
  { value: 'completed', label: 'Selesai' },
  { value: 'rejected', label: 'Ditolak' },
]
