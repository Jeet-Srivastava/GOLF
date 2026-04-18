const { Client } = require('pg');

const connectionString = 'postgresql://postgres.xfefisffzwrqsxdutamn:jeetPGD123jeetPGD@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString: connectionString,
});

async function main() {
  try {
    await client.connect();
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $function$
      BEGIN
        INSERT INTO public.profiles (id, email, full_name)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', '')
        );
        RETURN NEW;
      END;
      $function$;
    `);
    console.log("Replaced trigger function");
  } catch(e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}
main();
