const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://npfaaycfflzsfeynfspu.supabase.co', 'sb_publishable_AssGsJjupE7oHzMUekOcGg_39GH71vX');

async function test() {
  try {
    const sel = await supabase.from('fuel_logs').select('*');
    console.log('SELECT fuel_logs result:', JSON.stringify(sel, null, 2));

    const ins = await supabase.from('fuel_logs').insert([{
      amount: 15.5,
      cost: 45.0,
      date: new Date().toISOString()
    }]).select();
    console.log('INSERT fuel_logs result:', JSON.stringify(ins, null, 2));
  } catch (e) {
    console.error('Exception:', e);
  }
}
test();
