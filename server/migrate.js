const { db } = require('./database');

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  try {
    await db.initTables();
    console.log('✅ Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();