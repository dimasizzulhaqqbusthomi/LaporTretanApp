import { Report } from '@/lib/types'
import { StatusBadge, UrgencyBadge } from './Badges'
import {
  MapPin,
  Calendar,
  Construction,
  Lightbulb,
  Trash2,
  Layers,
  Droplets,
  Building,
  TrafficCone,
  Trees,
  ClipboardList,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface ReportCardProps {
  report: Report
  href?: string
  showReporter?: boolean
}

const categoryMeta: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  'Jalan Rusak': { icon: Construction, color: 'text-amber-600', bg: 'bg-amber-50' },
  'Lampu Jalan Mati': { icon: Lightbulb, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  'Sampah Menumpuk': { icon: Trash2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Drainase Tersumbat': { icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50' },
  'Banjir / Genangan Air': { icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  'Fasilitas Umum Rusak': { icon: Building, color: 'text-purple-600', bg: 'bg-purple-50' },
  'Rambu Lalu Lintas Rusak': { icon: TrafficCone, color: 'text-red-600', bg: 'bg-red-50' },
  'Pohon Tumbang': { icon: Trees, color: 'text-teal-600', bg: 'bg-teal-50' },
  'Kebersihan Lingkungan': { icon: Trash2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
}

export default function ReportCard({
  report,
  href,
  showReporter = false,
}: ReportCardProps) {
  const meta = categoryMeta[report.category_name] || {
    icon: ClipboardList,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
  }
  const IconComponent = meta.icon

  const cardContent = (
    <div className="bg-white rounded-2xl border border-slate-100/80 shadow-sm shadow-slate-100 hover:shadow-md hover:border-blue-100 transition-all duration-200 overflow-hidden">
      {/* Photo / Category Icon fallback */}
      {report.photo_urls && report.photo_urls.length > 0 ? (
        <div className="relative h-44 bg-slate-100 overflow-hidden">
          <img
            src={report.photo_urls[0]}
            alt={report.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute top-3 right-3">
            <UrgencyBadge urgency={report.urgency} />
          </div>
        </div>
      ) : (
        <div className="h-20 bg-gradient-to-r from-slate-50 to-slate-100/50 flex items-center justify-between px-5 border-b border-slate-50">
          <div className={`w-11 h-11 rounded-xl ${meta.bg} flex items-center justify-center shadow-inner`}>
            <IconComponent className={`w-6 h-6 ${meta.color}`} />
          </div>
          <UrgencyBadge urgency={report.urgency} />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 mb-2">
          {report.title}
        </h3>

        {/* Category Label */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className={`text-[10px] font-bold ${meta.color} ${meta.bg} px-2.5 py-0.5 rounded-full border border-slate-100`}>
            {report.category_name}
          </span>
        </div>

        {/* Description */}
        {report.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
            {report.description}
          </p>
        )}

        {/* Badges / Meta Info */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <StatusBadge status={report.status} />
          
          <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-300" />
              <span>{report.kecamatan || 'Bangkalan'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-300" />
              <span>{formatDate(report.created_at)}</span>
            </div>
          </div>
        </div>

        {showReporter && report.reporter_name && (
          <div className="text-[10px] text-slate-400 mt-2.5 pt-2.5 border-t border-dashed border-slate-100 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span>Dilaporkan oleh: <strong className="text-slate-500 font-semibold">{report.reporter_name}</strong></span>
          </div>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block transition-transform active:scale-[0.99]">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
