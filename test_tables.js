const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://npfaaycfflzsfeynfspu.supabase.co', 'sb_publishable_AssGsJjupE7oHzMUekOcGg_39GH71vX');

async function testInserts() {
  const insp = await supabase.from('inspections').insert([{
    status: 'pass',
    notes: 'test'
  }]).select();
  console.log('inspections insert:', insp);

  const issue = await supabase.from('issues').insert([{
    description: 'test issue',
    priority: 'low',
    status: 'open'
  }]).select();
  console.log('issues insert:', issue);
}
testInserts();
