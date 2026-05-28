const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local manually to avoid external dependency
const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    const key = match[1]
    let value = match[2] || ''
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    env[key] = value.trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

async function initStorage() {
  const buckets = ['report-photos', 'completion-photos']

  for (const bucketName of buckets) {
    console.log(`Checking bucket: "${bucketName}"...`)
    
    // 1. Get or Create bucket
    const { data: bucket, error: getError } = await supabase.storage.getBucket(bucketName)
    
    if (getError) {
      console.log(`Bucket "${bucketName}" not found. Creating it...`)
      const { data: createData, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true, // Make it public so getPublicUrl works!
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      })
      
      if (createError) {
        console.error(`Failed to create bucket "${bucketName}":`, createError.message)
      } else {
        console.log(`Successfully created public bucket "${bucketName}"!`)
      }
    } else {
      console.log(`Bucket "${bucketName}" already exists. Ensuring it is public...`)
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true
      })
      if (updateError) {
        console.error(`Failed to update bucket "${bucketName}" to public:`, updateError.message)
      } else {
        console.log(`Bucket "${bucketName}" is verified public!`)
      }
    }
  }

  console.log('Storage initialization complete!')
}

initStorage()
