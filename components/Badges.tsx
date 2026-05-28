import { cn, getStatusColor, getStatusLabel, getUrgencyColor, getUrgencyLabel } from '@/lib/utils'
import { ReportStatus, Urgency } from '@/lib/types'

interface StatusBadgeProps {
  status: ReportStatus
  className?: string
}

interface UrgencyBadgeProps {
  urgency: Urgency
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border',
        getStatusColor(status),
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  )
}

export function UrgencyBadge({ urgency, className }: UrgencyBadgeProps) {
  const dots: Record<Urgency, string> = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    emergency: '🔴',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border',
        getUrgencyColor(urgency),
        className
      )}
    >
      <span className="text-[10px]">{dots[urgency]}</span>
      {getUrgencyLabel(urgency)}
    </span>
  )
}
