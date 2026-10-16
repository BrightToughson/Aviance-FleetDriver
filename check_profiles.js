const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://npfaaycfflzsfeynfspu.supabase.co', 'sb_publishable_AssGsJjupE7oHzMUekOcGg_39GH71vX');

async function check() {
  const { data, error } = await supabase.from('profiles').select('*');
  console.log('Error:', error);
  console.log('Profiles in DB:');
  console.log(data);
}

check();
