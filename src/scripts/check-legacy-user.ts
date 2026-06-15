// Check the legacy user's current data
import { db } from "../config/db";

async function checkLegacyUser() {
  try {
    const phone = "919048810697";

    console.log(`Checking user with phone: ${phone}\n`);

    const result = await db.oneOrNone(
      `
            SELECT 
                u.id,
                u.phone,
                u.first_name,
                u.last_name,
                u.full_name,
                u.email,
                u.created_at,
                p.age,
                p.gender,
                p.date_of_birth
            FROM users u
            LEFT JOIN patient_profiles p ON u.id = p.user_id
            WHERE u.phone = $1
        `,
      [phone],
    );

    if (!result) {
      console.log("❌ User not found");
      process.exit(1);
    }

    console.log("User Data:");
    console.table(result);

    // Check if legacy
    const isLegacyUser = !result.first_name || !result.last_name;
    const hasIncompleteProfile = result.age === null || result.gender === null;

    console.log("\nProfile Status:");
    console.log(
      `Is Legacy User (missing name): ${isLegacyUser ? "❌ YES" : "✅ NO"}`,
    );
    console.log(
      `Has Incomplete Profile (missing age/gender): ${hasIncompleteProfile ? "❌ YES" : "✅ NO"}`,
    );
    console.log(
      `Should Show Modal: ${isLegacyUser && hasIncompleteProfile ? "✅ YES" : "❌ NO"}`,
    );

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkLegacyUser();
