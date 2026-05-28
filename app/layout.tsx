import type { Metadata } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'

export const metadata: Metadata = {
  title: 'Lapor Tretan | Layanan Aspirasi & Pengaduan Rakyat Bangkalan',
  description:
    'Lapor Tretan - Layanan Aspirasi dan Pengaduan Online Rakyat Terpadu Bangkalan. Laporkan masalah fasilitas umum, pantau perkembangan laporan secara real-time, dan bantu tingkatkan kualitas Bangkalan.',
  keywords: 'lapor tretan, bangkalan, laporan, layanan publik, pengaduan, aspirasi, fasilitas umum',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
