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

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const rolesToSeed = [
  {
    email: 'warga@lapor.com',
    password: '123456',
    full_name: 'Budi Santoso',
    role: 'citizen',
    phone_number: '081234567890',
  },
  {
    email: 'admin@lapor.com',
    password: '123456',
    full_name: 'Diana Putri Utami',
    role: 'admin',
    phone_number: '081234567891',
  },
  // 5 Dinas Officer Accounts
  {
    email: 'petugas.pupr@lapor.com',
    password: '123456',
    full_name: 'Petugas PUPR (Infrastruktur)',
    role: 'officer',
    department_id: 'a88d4a14-fae9-4922-ac27-9ba93492c761', // Dinas Pekerjaan Umum dan Penataan Ruang
    phone_number: '081234567892',
  },
  {
    email: 'petugas.dlh@lapor.com',
    password: '123456',
    full_name: 'Petugas DLH (Kebersihan)',
    role: 'officer',
    department_id: '86254398-f621-4470-8b1e-c37dfc3b6def', // Dinas Lingkungan Hidup
    phone_number: '081234567893',
  },
  {
    email: 'petugas.dishub@lapor.com',
    password: '123456',
    full_name: 'Petugas Dishub (Lalu Lintas)',
    role: 'officer',
    department_id: '64aaa38c-3abe-4636-b911-55cef6c64f82', // Dinas Perhubungan
    phone_number: '081234567894',
  },
  {
    email: 'petugas.bpbd@lapor.com',
    password: '123456',
    full_name: 'Petugas BPBD (Kebencanaan)',
    role: 'officer',
    department_id: 'b8f73d37-262c-478f-8527-4530071a1d57', // Badan Penanggulangan Bencana Daerah
    phone_number: '081234567895',
  },
  {
    email: 'petugas.prkp@lapor.com',
    password: '123456',
    full_name: 'Petugas PRKP (Permukiman)',
    role: 'officer',
    department_id: '1a9b334d-51cc-4aba-a054-93725235af5f', // Dinas Perumahan Rakyat dan Kawasan Permukiman
    phone_number: '081234567896',
  },
]

async function seed() {
  console.log('🚀 Starting to seed role accounts into Supabase...')

  for (const item of rolesToSeed) {
    try {
      console.log(`\nProcessing account: ${item.email} (${item.role})...`)

      // 1. Create or retrieve auth user
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email: item.email,
        password: item.password,
        email_confirm: true,
        user_metadata: { full_name: item.full_name },
      })

      let userId = ''

      if (createError) {
        if (createError.message.includes('already registered') || createError.message.includes('exists')) {
          console.log(`ℹ️ Account already registered in Auth. Fetching existing user...`)
          
          const { data: usersList, error: listError } = await supabase.auth.admin.listUsers()
          if (listError) throw listError

          const existingUser = usersList.users.find(u => u.email === item.email)
          if (!existingUser) {
            throw new Error(`Could not find existing user for ${item.email} even though it exists.`)
          }
          userId = existingUser.id

          // Update password to ensure it matches
          await supabase.auth.admin.updateUserById(userId, { password: item.password })
          console.log(`🔑 Password updated/reset to "${item.password}" successfully.`)
        } else {
          throw createError
        }
      } else {
        userId = userData.user.id
        console.log(`✅ Auth user created successfully with ID: ${userId}`)
      }

      // 2. Upsert profile in profiles table
      const profileData = {
        id: userId,
        full_name: item.full_name,
        email: item.email,
        phone_number: item.phone_number,
        role: item.role,
        updated_at: new Date().toISOString(),
      }

      // If item has department_id, add it (the schema column should be created first)
      if (item.department_id) {
        profileData.department_id = item.department_id
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })

      if (profileError) {
        if (profileError.message.includes('department_id')) {
          console.warn(`⚠️ Warning: Profiles does not have department_id column yet. Please run the SQL migration in your Supabase SQL Editor. Seeding without department_id for now...`)
          // Retry without department_id so the seed succeeds regardless!
          delete profileData.department_id
          const { error: retryError } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' })
          if (retryError) throw retryError
          console.log(`✨ Profile for "${item.full_name}" upserted without department_id!`)
        } else {
          throw new Error(`Profile upsert error: ${profileError.message}`)
        }
      } else {
        console.log(`✨ Profile for "${item.full_name}" upserted and set to role "${item.role}"!`)
      }

    } catch (err) {
      console.error(`❌ Failed processing ${item.email}:`, err.message || err)
    }
  }

  console.log('\n🎉 Seeding completed successfully!')
}

seed()
