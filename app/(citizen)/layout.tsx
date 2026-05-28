import BottomNav from '@/components/BottomNav'

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <main className="max-w-lg mx-auto">{children}</main>
      <BottomNav />
    </div>
  )
}
