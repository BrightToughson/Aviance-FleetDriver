const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://npfaaycfflzsfeynfspu.supabase.co', 'sb_publishable_AssGsJjupE7oHzMUekOcGg_39GH71vX');

async function test() {
  // Let's test what vehicles exist
  const { data: v, error: vErr } = await supabase.from('vehicles').select('*');
  console.log('Vehicles:', v, vErr);

  // Let's test what profiles exist
  const { data: p, error: pErr } = await supabase.from('profiles').select('*');
  console.log('Profiles:', p, pErr);
}
test();
