const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD
const fullName = process.env.ADMIN_FULL_NAME || 'Client Admin'

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

if (!email || !password) {
  console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD.')
  console.error('Example:')
  console.error('ADMIN_EMAIL=client@example.com ADMIN_PASSWORD=StrongPass!123 node create-admin.js')
  process.exit(1)
}

async function main() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(`Creating or updating admin user for ${email}...`)

  const { data: user, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (userError) {
    if (userError.message.includes('already exists') || userError.message.includes('registered')) {
      console.log('User already exists, updating admin role and password...')
    } else {
      console.error('User creation error:', userError)
      process.exit(1)
    }
  } else if (user.user?.id) {
    console.log(`Auth user created: ${user.user.id}`)
  }

  await new Promise((resolve) => setTimeout(resolve, 1000))

  const { data: profiles, error: getErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .limit(1)

  if (getErr || !profiles || profiles.length === 0) {
    console.error('Could not find profile for email.', getErr)
    process.exit(1)
  }

  const userId = profiles[0].id

  const { error: roleError } = await supabase
    .from('profiles')
    .update({ role: 'admin', full_name: fullName })
    .eq('id', userId)

  if (roleError) {
    console.error('Role update error:', roleError)
    process.exit(1)
  }

  const { error: updatePasswordError } = await supabase.auth.admin.updateUserById(userId, {
    password,
    user_metadata: { full_name: fullName },
  })

  if (updatePasswordError) {
    console.error('Password update error:', updatePasswordError)
    process.exit(1)
  }

  console.log('Admin user ready.')
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
  console.log('Login URL: /auth/admin/login')
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
