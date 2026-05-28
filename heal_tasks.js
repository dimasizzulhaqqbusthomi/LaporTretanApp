const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env.local file not found.')
    process.exit(1)
  }

  const content = fs.readFileSync(envPath, 'utf8')
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const index = trimmed.indexOf('=')
    if (index === -1) continue

    const key = trimmed.substring(0, index).trim()
    let value = trimmed.substring(index + 1).trim()

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1)
    }

    process.env[key] = value
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey)

// Map from Department ID -> Officer email (all 5 dinas)
const deptToEmailMap = {
  'a88d4a14-fae9-4922-ac27-9ba93492c761': 'petugas.pupr@lapor.com',   // PUPR
  '86254398-f621-4470-8b1e-c37dfc3b6def': 'petugas.dlh@lapor.com',    // DLH
  '64aaa38c-3abe-4636-b911-55cef6c64f82': 'petugas.dishub@lapor.com', // Dishub
  'b8f73d37-262c-478f-8527-4530071a1d57': 'petugas.bpbd@lapor.com',   // BPBD
  '1a9b334d-51cc-4aba-a054-93725235af5f': 'petugas.prkp@lapor.com',   // PRKP
}

async function heal() {
  console.log('🚀 Healing ALL dinas assignments for ALL reports...\n')

  // 1. Fetch all reports that have an assigned_department_id
  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select('id, title, assigned_department_id, assigned_officer_id, status')
    .not('assigned_department_id', 'is', null)

  if (reportsError) {
    console.error('❌ Error fetching reports:', reportsError)
    return
  }

  console.log(`📋 Found ${reports.length} reports with assigned departments.\n`)

  let fixed = 0
  let skipped = 0

  for (const report of reports) {
    const deptId = report.assigned_department_id
    const officerEmail = deptToEmailMap[deptId]

    if (!officerEmail) {
      console.log(`⚠️  [${report.title}] No email map found for department: ${deptId}. Skipping.`)
      skipped++
      continue
    }

    // Find the officer by email (avoids needing department_id column in profiles)
    const { data: officer, error: officerError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', officerEmail)
      .maybeSingle()

    if (officerError || !officer) {
      console.log(`⚠️  [${report.title}] Officer ${officerEmail} not found. Run seed_users.js first!`)
      skipped++
      continue
    }

    console.log(`📌 Processing: "${report.title}"`)
    console.log(`   Dinas: ${deptId} → Officer: ${officer.full_name} (${officer.id})`)

    // 2. Update report: bind correct officer_id and ensure status = 'assigned'
    const { error: updateReportError } = await supabase
      .from('reports')
      .update({
        assigned_officer_id: officer.id,
        status: report.status === 'assigned' || report.status === 'in_progress' || report.status === 'completed'
          ? report.status
          : 'assigned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', report.id)

    if (updateReportError) {
      console.error(`   ❌ Failed to update report:`, updateReportError.message)
      continue
    }

    // 3. Delete ALL existing officer_tasks for this report (cleans up stale tasks from old dinas)
    const { error: deleteError } = await supabase
      .from('officer_tasks')
      .delete()
      .eq('report_id', report.id)

    if (deleteError) {
      console.error(`   ❌ Failed to clear old tasks:`, deleteError.message)
      continue
    }

    // 4. Insert fresh officer_task for the correct officer
    const taskStatus = report.status === 'in_progress' ? 'in_progress'
      : report.status === 'completed' ? 'completed'
      : 'assigned'

    const { error: insertError } = await supabase
      .from('officer_tasks')
      .insert({
        report_id: report.id,
        officer_id: officer.id,
        department_id: deptId,
        status: taskStatus,
      })

    if (insertError) {
      console.error(`   ❌ Failed to create task:`, insertError.message)
    } else {
      console.log(`   ✅ Task created for ${officer.full_name} (status: ${taskStatus})`)
      fixed++
    }
  }

  console.log(`\n📊 Summary: ${fixed} fixed, ${skipped} skipped`)
  console.log('🎉 Healing completed! All dinas officers should now see their reports.')
}

heal()
