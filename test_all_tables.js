const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://npfaaycfflzsfeynfspu.supabase.co', 'sb_publishable_AssGsJjupE7oHzMUekOcGg_39GH71vX');

async function testOtherTables() {
  const tables = [
    'profiles', 'vehicles', 'trips', 'maintenance_requests', 'equipment',
    'driver_details', 'contacts', 'inspections', 'issues', 'schedules',
    'reminders', 'documents', 'vendors', 'parts', 'services', 'alerts',
    'reports', 'custom_forms', 'form_submissions'
  ];
  for (const t of tables) {
    const sel = await supabase.from(t).select('*').limit(1);
    console.log(`Table '${t}' SELECT:`, sel.error ? sel.error.code : `OK (rows: ${sel.data.length})`);
  }
}
testOtherTables();
