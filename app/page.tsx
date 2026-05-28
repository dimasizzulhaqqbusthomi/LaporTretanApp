'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Zap, CheckCircle2 } from 'lucide-react'

const ONBOARDING_SLIDES = [
  {
    title: "Lapor Tretan",
    subtitle: "Layanan Aspirasi & Pengaduan Rakyat",
    description: "Sampaikan keluhan dan laporan fasilitas umum di sekitar Bangkalan dengan aman, cepat, dan transparan.",
    badge: "Aspirasi & Pengaduan",
    illustration: (
      <div className="relative w-40 h-40 flex items-center justify-center bg-blue-50/50 rounded-[2.5rem] border border-blue-100/50 shadow-sm">
        <img src="/logo.png" alt="Lapor Tretan Logo" className="w-24 h-24 object-contain rounded-3xl shadow-sm" />
      </div>
    ),
  },
  {
    title: "Sinergi Dinas Terpadu",
    subtitle: "PUPR • DLH • Dishub • BPBD • PRKP",
    description: "Setiap laporan didelegasikan langsung ke instansi kedinasan yang berwenang untuk penyelesaian akurat.",
    badge: "Sistem Terintegrasi",
    illustration: (
      <div className="relative w-40 h-40 flex items-center justify-center bg-blue-50/50 rounded-[2.5rem] border border-blue-100/50 shadow-sm">
        <div className="absolute w-28 h-28 rounded-full border-2 border-dashed border-blue-200/50 animate-spin" style={{ animationDuration: '25s' }} />
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md relative z-10">
          <Zap className="w-7 h-7 text-white" />
        </div>
      </div>
    ),
  },
  {
    title: "Pantau Real-Time",
    subtitle: "Transparansi Penuh untuk Warga",
    description: "Kawal proses penanganan laporan Anda dari awal verifikasi hingga terbit bukti foto pengerjaan selesai.",
    badge: "Proses Transparan",
    illustration: (
      <div className="relative w-40 h-40 flex items-center justify-center bg-emerald-50/40 rounded-[2.5rem] border border-emerald-100/50 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md">
          <CheckCircle2 className="w-7 h-7 text-white" />
        </div>
      </div>
    ),
  }
]

export default function OnboardingPage() {
  const router = useRouter()
  const [activeSlide, setActiveSlide] = useState(0)

  function handleNext() {
    if (activeSlide < ONBOARDING_SLIDES.length - 1) {
      setActiveSlide((prev) => prev + 1)
    } else {
      router.push('/login')
    }
  }

  function handleSkip() {
    router.push('/login')
  }

  const current = ONBOARDING_SLIDES[activeSlide]

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between text-slate-800 font-sans transition-all duration-300 ease-in-out overflow-hidden relative">
      
      {/* Top Header */}
      <header className="relative z-10 px-6 pt-6 flex items-center justify-between w-full max-w-md mx-auto">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Lapor Tretan Brand Icon" className="w-7 h-7 object-contain rounded-lg" />
          <h1 className="font-extrabold text-xs tracking-wider uppercase text-slate-850">Lapor Tretan</h1>
        </div>
        
        {activeSlide < ONBOARDING_SLIDES.length - 1 && (
          <button
            onClick={handleSkip}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 px-3.5 py-1.5 rounded-full"
          >
            Lewati
          </button>
        )}
      </header>

      {/* Slide Content / Illustration */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center max-w-md mx-auto w-full">
        {/* Dynamic Illustration Container */}
        <div className="mb-8 transform hover:scale-[1.02] transition-transform duration-300">
          {current.illustration}
        </div>

        {/* Badge */}
        <div className="inline-flex items-center bg-slate-50 px-3.5 py-1.5 rounded-full mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-100">
          {current.badge}
        </div>

        {/* Slide Title */}
        <h2 className="text-2xl font-extrabold tracking-tight mb-2 text-slate-900 leading-tight">
          {current.title}
        </h2>

        {/* Slide Subtitle */}
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3 max-w-xs">
          {current.subtitle}
        </p>

        {/* Slide Description */}
        <p className="text-slate-500 text-sm leading-relaxed max-w-sm font-medium">
          {current.description}
        </p>
      </main>

      {/* Bottom Actions & Slide indicators */}
      <footer className="relative z-10 px-8 pb-10 max-w-md mx-auto w-full space-y-6">
        {/* Indicators */}
        <div className="flex items-center justify-center gap-1.5">
          {ONBOARDING_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeSlide
                  ? "w-6 bg-blue-600 shadow-sm shadow-blue-100"
                  : "w-1.5 bg-slate-200 hover:bg-slate-300"
              }`}
              aria-label={`Ke slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleNext}
            className="w-full bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider py-4 rounded-2xl shadow-lg shadow-blue-100/50 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            {activeSlide === ONBOARDING_SLIDES.length - 1 ? (
              <>
                Mulai Sekarang
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </>
            ) : (
              <>
                Lanjut
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>

          {activeSlide === ONBOARDING_SLIDES.length - 1 && (
            <div className="text-center">
              <Link
                href="/register"
                className="text-xs text-slate-400 hover:text-slate-650 font-bold transition-all"
              >
                Belum punya akun? <span className="underline text-blue-650">Daftar sekarang</span>
              </Link>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
