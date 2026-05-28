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

async function getDepts() {
  const { data, error } = await supabase.from('departments').select('*')
  if (error) {
    console.error(error)
    return
  }
  console.log('DEPARTMENTS_JSON:', JSON.stringify(data, null, 2))
}

getDepts()
