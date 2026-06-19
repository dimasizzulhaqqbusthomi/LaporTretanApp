'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star } from 'lucide-react'

export default function SatisfactionRatingForm({
  reportId,
  userId,
}: {
  reportId: string
  userId: string
}) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!rating) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('satisfaction_ratings').insert({
      report_id: reportId,
      user_id: userId,
      rating,
      comment,
      is_resolved: true,
    })
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-5 text-center space-y-2 shadow-sm animate-fade-in">
        <span className="text-2xl">🎉</span>
        <h3 className="text-sm font-extrabold text-emerald-800">Terima kasih atas penilaian Anda!</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Ulasan Anda membantu kami meningkatkan pelayanan publik di Bangkalan.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
          Beri Penilaian Kepuasan
        </h3>
      </div>

      {/* Stars */}
      <div className="flex justify-center gap-3 py-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= (hovered || rating)
          return (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="transition-all hover:scale-115 active:scale-95 duration-150"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  isActive
                    ? 'fill-amber-400 stroke-amber-400 drop-shadow-sm'
                    : 'stroke-slate-350 hover:stroke-slate-400'
                }`}
              />
            </button>
          )
        })}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Komentar atau saran tambahan (opsional)..."
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-800 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-400 resize-none"
      />

      <button
        onClick={handleSubmit}
        disabled={!rating || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl shadow-sm shadow-blue-200 active:scale-[0.98] transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Mengirim...
          </>
        ) : (
          'Kirim Penilaian'
        )}
      </button>
    </div>
  )
}
