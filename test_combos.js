const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://npfaaycfflzsfeynfspu.supabase.co', 'sb_publishable_AssGsJjupE7oHzMUekOcGg_39GH71vX');

async function testCombinations() {
  // Test 1: Just amount and cost
  const res1 = await supabase.from('fuel_logs').insert([{ amount: 10, cost: 50, date: new Date().toISOString() }]);
  console.log('Test 1 (minimal):', res1.error);

  // Test 2: With dummy UUID for vehicle_id
  const res2 = await supabase.from('fuel_logs').insert([{
    amount: 10, cost: 50, date: new Date().toISOString(),
    vehicle_id: '00000000-0000-0000-0000-000000000000'
  }]);
  console.log('Test 2 (dummy vehicle_id):', res2.error);

  // Test 3: With driver_id 'user_3KCBM1zaQv8MNrnv8sZo0q1Pro8' (manager profile which exists)
  const res3 = await supabase.from('fuel_logs').insert([{
    amount: 10, cost: 50, date: new Date().toISOString(),
    driver_id: 'user_3KCBM1zaQv8MNrnv8sZo0q1Pro8'
  }]);
  console.log('Test 3 (existing profile driver_id):', res3.error);

  // Test 4: With random driver_id
  const res4 = await supabase.from('fuel_logs').insert([{
    amount: 10, cost: 50, date: new Date().toISOString(),
    driver_id: 'random_driver_not_in_profiles'
  }]);
  console.log('Test 4 (non-existent driver_id):', res4.error);
}
testCombinations();
