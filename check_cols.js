const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://npfaaycfflzsfeynfspu.supabase.co', 'sb_publishable_AssGsJjupE7oHzMUekOcGg_39GH71vX');

async function testCols() {
  const candidateCols = [
    'amount', 'cost', 'odometer', 'date', 'vehicle_id', 'driver_id',
    'receipt_url', 'receipt_image_url', 'receipt_image', 'notes', 'created_at'
  ];
  for (const col of candidateCols) {
    const res = await supabase.from('fuel_logs').insert([{ [col]: null }]);
    // If it says PGRST204, column does NOT exist.
    // If it says 42501 (RLS) or 23502 (NOT NULL) or success, column DOES exist!
    const exists = res.error?.code !== 'PGRST204';
    console.log(`Column '${col}':`, exists ? 'EXISTS' : 'NOT FOUND', res.error?.code || 'OK');
  }
}
testCols();
