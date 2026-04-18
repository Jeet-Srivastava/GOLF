const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xfefisffzwrqsxdutamn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZWZpc2ZmendycXN4ZHV0YW1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ1NjE4NSwiZXhwIjoyMDkyMDMyMTg1fQ.tAXNMUERn_xIYBh4cLbpt1BKas02EMHT7y5we3jTsOc',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const email = 'admin@golfheroes.test';
  const password = 'Password!123';

  console.log('Creating admin user...');
  const { data: user, error: userError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { full_name: 'Admin User' }
  });

  if (userError) {
    if (userError.message.includes('already exists') || userError.message.includes('registered')) {
      console.log('User already exists, will try to update role anyway...');
    } else {
      console.error('User creation error:', userError);
      return;
    }
  } else {
    console.log('User created:', user?.user?.id);
  }

  console.log('Fetching profile...');
  // Wait a little bit for the trigger to create the profile
  await new Promise(r => setTimeout(r, 1000));
  
  const { data: profiles, error: getErr } = await supabase.from('profiles').select('id').eq('email', email).limit(1);
  if (getErr || !profiles || profiles.length === 0) {
      console.error('Could not find profile for email. Error:', getErr);
      return;
  }
  
  const userId = profiles[0].id;
  console.log('Profile found, id:', userId);

  const { error: updateError } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
  
  if (updateError) {
    console.error('Role update error:', updateError);
  } else {
    console.log('Admin user ready:', email, password);
  }
}
main();
