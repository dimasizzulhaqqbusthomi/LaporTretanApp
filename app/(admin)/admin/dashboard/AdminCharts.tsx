'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface ReportData {
  category_name: string
  kecamatan: string
  status: string
  created_at: string
  urgency: string
}

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#059669', '#b45309']

export default function AdminCharts({ reports }: { reports: ReportData[] }) {
  // Category chart
  const categoryMap: Record<string, number> = {}
  reports.forEach((r) => {
    categoryMap[r.category_name] = (categoryMap[r.category_name] || 0) + 1
  })
  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name: name.replace(' ', '\n'), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Kecamatan chart
  const kecMap: Record<string, number> = {}
  reports.forEach((r) => {
    if (r.kecamatan) kecMap[r.kecamatan] = (kecMap[r.kecamatan] || 0) + 1
  })
  const kecData = Object.entries(kecMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Monthly trend
  const monthMap: Record<string, number> = {}
  reports.forEach((r) => {
    const month = new Date(r.created_at).toLocaleDateString('id-ID', {
      month: 'short',
      year: '2-digit',
    })
    monthMap[month] = (monthMap[month] || 0) + 1
  })
  const monthData = Object.entries(monthMap).map(([name, value]) => ({
    name,
    value,
  }))

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* By Category */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-bold text-slate-800 text-sm mb-4">
          Laporan per Kategori
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* By Kecamatan */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-bold text-slate-800 text-sm mb-4">
          Laporan per Kecamatan
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={kecData} margin={{ top: 0, right: 0, left: -20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly trend */}
      {monthData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:col-span-2">
          <h3 className="font-bold text-slate-800 text-sm mb-4">
            Tren Laporan Bulanan
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Laporan" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
