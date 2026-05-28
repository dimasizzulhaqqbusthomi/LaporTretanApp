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
      <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100 text-center">
        <p className="text-yellow-700 font-semibold text-sm">
          ⭐ Terima kasih atas penilaian Anda!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <h3 className="font-semibold text-slate-700 text-sm mb-3">
        ⭐ Beri Penilaian Kepuasan
      </h3>

      {/* Stars */}
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hovered || rating)
                  ? 'fill-yellow-400 stroke-yellow-400'
                  : 'stroke-slate-300'
              }`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Komentar tambahan (opsional)..."
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-yellow-100 resize-none mb-3"
      />

      <button
        onClick={handleSubmit}
        disabled={!rating || loading}
        className="w-full bg-yellow-500 text-white font-semibold py-2.5 rounded-xl hover:bg-yellow-600 disabled:opacity-40 text-sm"
      >
        {loading ? 'Mengirim...' : 'Kirim Penilaian'}
      </button>
    </div>
  )
}
