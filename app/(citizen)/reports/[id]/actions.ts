'use server'

import { createClient } from '@supabase/supabase-js'

// Create a Supabase admin client that uses the service_role key to bypass RLS safely on the server
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL or Service Role Key is missing in server environment variables.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function submitAdditionalEvidence(reportId: string, userId: string, newPhotoUrls: string[], note: string) {
  try {
    const adminSupabase = createAdminClient()

    // 1. Fetch the report to check ownership and retrieve existing photo urls
    const { data: report, error: fetchError } = await adminSupabase
      .from('reports')
      .select('reporter_id, title, photo_urls')
      .eq('id', reportId)
      .single()

    if (fetchError || !report) {
      return { success: false, error: 'Laporan tidak ditemukan di database.' }
    }

    // 2. Validate that the logged in user is the owner of the report
    if (report.reporter_id !== userId) {
      return { success: false, error: 'Anda tidak memiliki hak akses untuk memperbarui laporan ini.' }
    }

    const mergedPhotoUrls = [...(report.photo_urls || []), ...newPhotoUrls]

    // 3. Update the report status to 'waiting_verification' and save final photo urls
    const { error: updateError } = await adminSupabase
      .from('reports')
      .update({
        status: 'waiting_verification',
        photo_urls: mergedPhotoUrls,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)

    if (updateError) {
      return { success: false, error: `Gagal memperbarui laporan: ${updateError.message}` }
    }

    // 4. Write to status history
    const historyNote = note.trim()
      ? `Bukti tambahan dikirim oleh warga: "${note.trim()}"`
      : 'Warga telah melengkapi foto bukti tambahan.'

    const { error: historyError } = await adminSupabase
      .from('report_status_histories')
      .insert({
        report_id: reportId,
        status: 'waiting_verification',
        note: historyNote,
        updated_by: userId,
        updated_by_role: 'citizen',
      })

    if (historyError) {
      return { success: false, error: `Gagal mencatat riwayat: ${historyError.message}` }
    }

    // 5. Send confirmation notification to citizen
    await adminSupabase.from('notifications').insert({
      user_id: userId,
      title: 'Bukti Tambahan Terkirim',
      message: `Bukti tambahan untuk laporan "${report.title}" telah diterima dan kini menunggu verifikasi ulang oleh admin.`,
      report_id: reportId,
      is_read: false,
    })

    // 6. Broadcast notification to all Admin users!
    const { data: adminProfiles } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    if (adminProfiles && adminProfiles.length > 0) {
      const adminNotifs = adminProfiles.map((adm) => ({
        user_id: adm.id,
        title: 'Bukti Laporan Baru Masuk',
        message: `Warga telah mengirimkan bukti tambahan baru untuk laporan "${report.title}".`,
        report_id: reportId,
        is_read: false,
      }))
      await adminSupabase.from('notifications').insert(adminNotifs)
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error inside submitAdditionalEvidence server action:', err)
    return { success: false, error: err.message || 'Terjadi kesalahan internal server.' }
  }
}

export async function getAdminNotifications() {
  try {
    const adminSupabase = createAdminClient()
    const { data, error } = await adminSupabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data }
  } catch (err: any) {
    console.error('Error inside getAdminNotifications server action:', err)
    return { success: false, error: err.message || 'Gagal mengambil notifikasi.' }
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
      .from('notifications')
      .update({ is_read: true })

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function performAdminReportAction(
  reportId: string,
  action: 'verify' | 'reject' | 'duplicate' | 'need_evidence' | 'assign',
  adminId: string,
  note: string,
  selectedDept?: string
) {
  try {
    const adminSupabase = createAdminClient()

    // 1. Fetch report details
    const { data: report, error: reportError } = await adminSupabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (reportError || !report) throw new Error('Laporan tidak ditemukan.')

    const statusMap: Record<string, string> = {
      verify: 'verified',
      reject: 'rejected',
      duplicate: 'duplicate',
      need_evidence: 'need_evidence',
      assign: 'assigned',
    }

    const newStatus = statusMap[action]

    const updates: Record<string, unknown> = {
      status: newStatus,
      admin_note: note,
      updated_at: new Date().toISOString(),
    }

    if (action === 'assign') {
      if (!selectedDept) {
        throw new Error('Pilih dinas terlebih dahulu.')
      }
      
      const deptToEmailMap: Record<string, string> = {
        'a88d4a14-fae9-4922-ac27-9ba93492c761': 'petugas.pupr@lapor.com',
        '86254398-f621-4470-8b1e-c37dfc3b6def': 'petugas.dlh@lapor.com',
        '64aaa38c-3abe-4636-b911-55cef6c64f82': 'petugas.dishub@lapor.com',
        'b8f73d37-262c-478f-8527-4530071a1d57': 'petugas.bpbd@lapor.com',
        '1a9b334d-51cc-4aba-a054-93725235af5f': 'petugas.prkp@lapor.com',
      }

      const targetEmail = deptToEmailMap[selectedDept]

      // Use email-only lookup — department_id column may not exist in profiles yet
      let deptOfficer: { id: string } | null = null
      if (targetEmail) {
        const { data: officerByEmail } = await adminSupabase
          .from('profiles')
          .select('id')
          .eq('role', 'officer')
          .eq('email', targetEmail)
          .maybeSingle()
        deptOfficer = officerByEmail
      }

      // Fallback: try matching by department_id column if it exists
      if (!deptOfficer) {
        const { data: officerByDept } = await adminSupabase
          .from('profiles')
          .select('id')
          .eq('role', 'officer')
          .eq('department_id', selectedDept)
          .maybeSingle()
        deptOfficer = officerByDept
      }

      if (deptOfficer) {
        updates.assigned_officer_id = deptOfficer.id
        updates.assigned_department_id = selectedDept
      } else {
        updates.assigned_officer_id = null
        updates.assigned_department_id = selectedDept
      }
    }

    // 2. Update report
    const { error: updateError } = await adminSupabase
      .from('reports')
      .update(updates)
      .eq('id', reportId)

    if (updateError) throw updateError

    // 3. Handle officer_tasks — reassignment: remove old task, insert fresh for new officer
    if (action === 'assign') {
      const newOfficerId = updates.assigned_officer_id as string | null

      // Delete ANY existing tasks for this report (regardless of which officer had it before)
      await adminSupabase
        .from('officer_tasks')
        .delete()
        .eq('report_id', reportId)

      // Insert fresh task for the newly assigned officer
      if (newOfficerId) {
        await adminSupabase.from('officer_tasks').insert({
          report_id: reportId,
          officer_id: newOfficerId,
          department_id: selectedDept,
          status: 'assigned',
        })
      }
    }

    // 4. Insert History
    const historyNote: Record<string, string> = {
      verify: 'Laporan diverifikasi oleh admin.',
      reject: note ? `Laporan ditolak: ${note}` : 'Laporan ditolak oleh admin.',
      duplicate: 'Laporan ditandai sebagai duplikat.',
      need_evidence: 'Admin meminta bukti tambahan.',
      assign: `Laporan ditugaskan ke Dinas.`,
    }

    await adminSupabase.from('report_status_histories').insert({
      report_id: reportId,
      status: newStatus,
      note: historyNote[action],
      updated_by: adminId,
      updated_by_role: 'admin',
    })

    // 5. Send Notification to reporter
    const notifTitles: Record<string, string> = {
      verify: 'Laporan Diverifikasi',
      reject: 'Laporan Ditolak',
      duplicate: 'Laporan Ditandai Duplikat',
      need_evidence: 'Bukti Tambahan Diperlukan',
      assign: 'Laporan Ditugaskan ke Dinas',
    }
    const notifMessages: Record<string, string> = {
      verify: `Laporan "${report.title}" Anda telah diverifikasi.`,
      reject: `Laporan "${report.title}" Anda ditolak. ${note ? `Alasan: ${note}` : ''}`,
      duplicate: `Laporan "${report.title}" ditandai sebagai duplikat.`,
      need_evidence: `Admin meminta bukti tambahan untuk laporan "${report.title}".`,
      assign: `Laporan "${report.title}" Anda telah dikirim dan ditugaskan ke dinas terkait.`,
    }

    await adminSupabase.from('notifications').insert({
      user_id: report.reporter_id,
      title: notifTitles[action],
      message: notifMessages[action],
      report_id: reportId,
    })

    return { success: true }
  } catch (err: any) {
    console.error('Error inside performAdminReportAction server action:', err)
    return { success: false, error: err.message || 'Terjadi kesalahan penanganan aduan.' }
  }
}
