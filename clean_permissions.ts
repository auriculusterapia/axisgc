import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanPermissions() {
  console.log("Fetching all users to clean permissions...");
  
  const { data: users, error } = await supabase.from('users').select('id, permissions');
  
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }
  
  if (!users) {
    console.log("No users found.");
    return;
  }

  let updateCount = 0;

  for (const user of users) {
    if (!user.permissions || !Array.isArray(user.permissions)) continue;

    const originalLength = user.permissions.length;
    const newPermissions = user.permissions.filter((p: string) => !p.startsWith('auricular'));

    if (newPermissions.length !== originalLength) {
      console.log(`User ${user.id} has auricular permissions. Removing...`);
      const { error: updateError } = await supabase
        .from('users')
        .update({ permissions: newPermissions })
        .eq('id', user.id);
        
      if (updateError) {
        console.error(`Error updating user ${user.id}:`, updateError);
      } else {
        updateCount++;
      }
    }
  }

  console.log(`Done! Cleaned permissions for ${updateCount} users.`);
}

cleanPermissions();
