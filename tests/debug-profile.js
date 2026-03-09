/**
 * Debug script untuk check profile update
 * Run: node debug-profile.js
 */

const pool = require('./config/database');

async function debugProfile() {
  const userId = 14; // Your test user ID

  console.log('🔍 Debugging Profile Update...\n');

  try {
    const connection = await pool.getConnection();

    // 1. Check current data
    console.log('1️⃣ Current user data:');
    const [rows] = await connection.execute(
      'SELECT id, name, email, firstName, lastName, phone, bio, avatar FROM users WHERE id = ?',
      [userId]
    );
    console.table(rows);

    // 2. Try update
    console.log('\n2️⃣ Updating profile...');
    await connection.execute(
      'UPDATE users SET firstName = ?, lastName = ?, phone = ?, bio = ? WHERE id = ?',
      ['TestFirst', 'TestLast', '08123456789', 'Test bio', userId]
    );
    console.log('✅ Update query executed');

    // 3. Check after update
    console.log('\n3️⃣ After update:');
    const [updatedRows] = await connection.execute(
      'SELECT id, name, email, firstName, lastName, phone, bio, avatar FROM users WHERE id = ?',
      [userId]
    );
    console.table(updatedRows);

    // 4. Check table structure
    console.log('\n4️⃣ Table structure:');
    const [columns] = await connection.execute('DESCRIBE users');
    console.table(columns);

    connection.release();
    await pool.end();

    console.log('\n✅ Debug complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

debugProfile();
