#!/usr/bin/env node

const { Client } = require('pg');

// Load environment variables
const POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
const POSTGRES_PORT = process.env.POSTGRES_PORT || 5432;
const POSTGRES_DATABASE = process.env.POSTGRES_DATABASE || 'duetright_db';
const POSTGRES_USERNAME = process.env.POSTGRES_USERNAME || 'postgres';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
const POSTGRES_SSL = process.env.POSTGRES_SSL === 'true';

if (!POSTGRES_PASSWORD) {
  console.error('❌ POSTGRES_PASSWORD environment variable is not set');
  console.error('Please add PostgreSQL credentials to your .env file:');
  console.error('');
  console.error('POSTGRES_HOST=localhost');
  console.error('POSTGRES_PORT=5432');
  console.error('POSTGRES_DATABASE=duetright_db');
  console.error('POSTGRES_USERNAME=postgres');
  console.error('POSTGRES_PASSWORD=your_password_here');
  console.error('POSTGRES_SSL=false');
  console.error('');
  console.error('Or use a cloud provider like:');
  console.error('• Supabase: https://supabase.com/');
  console.error('• Neon: https://neon.tech/');
  console.error('• AWS RDS: https://aws.amazon.com/rds/');
  process.exit(1);
}

console.log('🐘 Testing PostgreSQL Connection...');
console.log('====================================');

// Create PostgreSQL client
const client = new Client({
  host: POSTGRES_HOST,
  port: parseInt(POSTGRES_PORT),
  database: POSTGRES_DATABASE,
  user: POSTGRES_USERNAME,
  password: POSTGRES_PASSWORD,
  ssl: POSTGRES_SSL ? { rejectUnauthorized: false } : false,
});

async function testPostgreSQLConnection() {
  try {
    // Test 1: Connect to database
    console.log('1️⃣ Connecting to PostgreSQL...');
    console.log(`   Host: ${POSTGRES_HOST}:${POSTGRES_PORT}`);
    console.log(`   Database: ${POSTGRES_DATABASE}`);
    console.log(`   User: ${POSTGRES_USERNAME}`);
    console.log(`   SSL: ${POSTGRES_SSL ? 'enabled' : 'disabled'}`);
    
    await client.connect();
    console.log('✅ Connection successful!');
    console.log('');

    // Test 2: Check database version and basic info
    console.log('2️⃣ Checking database info...');
    const versionResult = await client.query('SELECT version()');
    const version = versionResult.rows[0].version;
    console.log(`   PostgreSQL Version: ${version.split(' ')[1]}`);
    
    const dbResult = await client.query('SELECT current_database(), current_user, current_timestamp');
    const dbInfo = dbResult.rows[0];
    console.log(`   Current Database: ${dbInfo.current_database}`);
    console.log(`   Current User: ${dbInfo.current_user}`);
    console.log(`   Server Time: ${dbInfo.current_timestamp}`);
    console.log('');

    // Test 3: Check existing tables
    console.log('3️⃣ Checking existing schema...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`   Found ${tablesResult.rows.length} table(s):`);
      tablesResult.rows.forEach(row => {
        console.log(`   • ${row.table_name}`);
      });
    } else {
      console.log('   No tables found - database is empty');
    }
    console.log('');

    // Test 4: Test basic CRUD operations
    console.log('4️⃣ Testing basic operations...');
    
    // Create a test table
    await client.query(`
      CREATE TABLE IF NOT EXISTS connection_test (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Table creation test passed');

    // Insert test data
    const insertResult = await client.query(`
      INSERT INTO connection_test (message) 
      VALUES ('DuetRight PostgreSQL test - ${new Date().toISOString()}')
      RETURNING id, message, created_at
    `);
    const insertedRow = insertResult.rows[0];
    console.log(`   ✅ Insert test passed (ID: ${insertedRow.id})`);

    // Select test data
    const selectResult = await client.query(`
      SELECT COUNT(*) as count FROM connection_test
    `);
    const count = selectResult.rows[0].count;
    console.log(`   ✅ Select test passed (${count} rows total)`);

    // Update test data
    await client.query(`
      UPDATE connection_test 
      SET message = message || ' - UPDATED' 
      WHERE id = $1
    `, [insertedRow.id]);
    console.log('   ✅ Update test passed');

    // Clean up test data
    await client.query('DROP TABLE IF EXISTS connection_test');
    console.log('   ✅ Cleanup completed');
    console.log('');

    // Test 5: Performance test
    console.log('5️⃣ Performance test...');
    const startTime = Date.now();
    await client.query('SELECT 1');
    const endTime = Date.now();
    const latency = endTime - startTime;
    console.log(`   ✅ Query latency: ${latency}ms`);
    
    if (latency < 50) {
      console.log('   🚀 Excellent performance');
    } else if (latency < 200) {
      console.log('   ⚡ Good performance');
    } else {
      console.log('   ⚠️  High latency - check network connection');
    }
    console.log('');

    console.log('🎉 PostgreSQL integration test completed successfully!');
    console.log('');
    console.log('💡 Available Database Features:');
    console.log('   • Customer management');
    console.log('   • Job tracking and management');
    console.log('   • Communication logging');
    console.log('   • Analytics and reporting');
    console.log('   • Data export and backup');
    console.log('');
    console.log('📊 Integration Status: ✅ Ready for Dashboard');

  } catch (error) {
    console.error(`❌ PostgreSQL integration test failed: ${error.message}`);
    console.error('');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused:');
      console.error('   • PostgreSQL server is not running');
      console.error('   • Wrong host or port configuration');
      console.error('   • Firewall blocking connection');
      console.error('');
      console.error('💡 Quick setup options:');
      console.error('   • Local: brew install postgresql && brew services start postgresql');
      console.error('   • Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=mypassword postgres');
      console.error('   • Cloud: Try Supabase, Neon, or AWS RDS');
      
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 Host not found:');
      console.error('   • Check POSTGRES_HOST setting');
      console.error('   • Verify DNS resolution');
      console.error('   • Check internet connection for cloud databases');
      
    } else if (error.code === '28P01') {
      console.error('🔐 Authentication failed:');
      console.error('   • Wrong username or password');
      console.error('   • Check POSTGRES_USERNAME and POSTGRES_PASSWORD');
      console.error('   • Verify user exists in PostgreSQL');
      
    } else if (error.code === '3D000') {
      console.error('🗄️  Database does not exist:');
      console.error('   • Create the database first');
      console.error('   • Check POSTGRES_DATABASE setting');
      console.error(`   • Run: createdb ${POSTGRES_DATABASE}`);
      
    } else if (error.code === '28000') {
      console.error('🚫 Access denied:');
      console.error('   • User does not have permission to connect');
      console.error('   • Check pg_hba.conf configuration');
      console.error('   • Verify user permissions');
      
    } else {
      console.error('🔧 Technical error:');
      console.error(`   • Error code: ${error.code || 'Unknown'}`);
      console.error('   • Check PostgreSQL server logs');
      console.error('   • Verify all connection parameters');
      console.error('   • Try connecting with psql command line tool');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Stopping PostgreSQL test...');
  await client.end();
  process.exit(0);
});

// Run the test
testPostgreSQLConnection();