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

const officerMappings = [
  { email: 'petugas.pupr@lapor.com', deptId: 'a88d4a14-fae9-4922-ac27-9ba93492c761', name: 'PUPR' },
  { email: 'petugas.dlh@lapor.com', deptId: '86254398-f621-4470-8b1e-c37dfc3b6def', name: 'DLH' },
  { email: 'petugas.dishub@lapor.com', deptId: '64aaa38c-3abe-4636-b911-55cef6c64f82', name: 'Dishub' },
  { email: 'petugas.bpbd@lapor.com', deptId: 'b8f73d37-262c-478f-8527-4530071a1d57', name: 'BPBD' },
  { email: 'petugas.prkp@lapor.com', deptId: '1a9b334d-51cc-4aba-a054-93725235af5f', name: 'PRKP' },
]

async function fixProfiles() {
  console.log('🚀 Starting to heal profiles department_id columns for ALL Dinas officers...')

  // 1. Ensure the column department_id exists on profiles table (try to run SQL if supported, or gracefully catch)
  // Let's directly update each profile. Since the Supabase JS client will automatically fail if the column doesn't exist,
  // we will try to update. If it fails due to missing column, we warn the user.
  
  for (const mapping of officerMappings) {
    console.log(`\nProcessing ${mapping.name} (${mapping.email})...`)

    // First check if profile exists
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', mapping.email)
      .maybeSingle()

    if (fetchError) {
      console.error(`❌ Error fetching profile for ${mapping.email}:`, fetchError)
      continue
    }

    if (!profile) {
      console.log(`⚠️ Officer profile for ${mapping.email} not found in database. Skipping...`)
      continue
    }

    // Try to update with department_id
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ department_id: mapping.deptId })
      .eq('id', profile.id)

    if (updateError) {
      if (updateError.message.includes('department_id')) {
        console.error(`❌ Profiles table is missing the "department_id" column.`)
        console.log(`💡 To fix this, please run the following SQL command in your Supabase SQL Editor:`)
        console.log(`   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id);`)
        console.log(`   (After running it, execute this script again!)`)
        break
      } else {
        console.error(`❌ Failed to update department_id for ${mapping.email}:`, updateError.message)
      }
    } else {
      console.log(`✅ Success! Bound ${profile.full_name} to Department ID: ${mapping.deptId}`)
    }
  }

  console.log('\n🎉 Finished profiles department fix execution!')
}

fixProfiles()
