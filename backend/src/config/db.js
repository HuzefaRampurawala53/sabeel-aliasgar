import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// We support either a connection string or separate configuration keys
const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({ 
      connectionString, 
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false 
    })
  : new Pool({
      user: process.env.PGUSER || 'postgres',
      host: process.env.PGHOST || 'localhost',
      database: process.env.PGDATABASE || 'sabeel',
      password: process.env.PGPASSWORD || 'postgres',
      port: parseInt(process.env.PGPORT || '5432'),
    });

pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client', err);
});

// Helper to convert SQLite SQL to PostgreSQL SQL
function convertSql(sql) {
  let pgSql = sql;
  
  // Replace SQLite date() function with Postgres date cast
  pgSql = pgSql.replace(/date\(created_at\)/gi, 'created_at::date');
  
  // Replace SQLite ? with Postgres $1, $2, ...
  let index = 1;
  pgSql = pgSql.replace(/\?/g, () => `$${index++}`);
  
  return pgSql;
}

// Helper to run SQL queries as promises
export const queryRun = async (sql, params = []) => {
  let pgSql = convertSql(sql);
  
  // If it's an INSERT query and doesn't contain RETURNING, append RETURNING id
  // Note: daily_summaries has summary_date as primary key instead of id
  if (pgSql.trim().toUpperCase().startsWith('INSERT INTO') && !pgSql.toUpperCase().includes('RETURNING')) {
    if (pgSql.toLowerCase().includes('daily_summaries')) {
      pgSql += ' RETURNING summary_date';
    } else {
      pgSql += ' RETURNING id';
    }
  }
  
  const res = await pool.query(pgSql, params);
  const lastID = res.rows[0] 
    ? (res.rows[0].id !== undefined ? res.rows[0].id : res.rows[0].summary_date) 
    : null;
  return {
    lastID,
    changes: res.rowCount
  };
};

export const queryAll = async (sql, params = []) => {
  const pgSql = convertSql(sql);
  const res = await pool.query(pgSql, params);
  return res.rows;
};

export const queryGet = async (sql, params = []) => {
  const pgSql = convertSql(sql);
  const res = await pool.query(pgSql, params);
  return res.rows[0];
};

// Initialize database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the PostgreSQL database:', err.message);
  } else {
    console.log('Connected to the PostgreSQL database successfully');
    release();
    initializeDatabase();
  }
});

async function initializeDatabase() {
  try {
    // 1. Users Table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'member')),
        contribution_amount DOUBLE PRECISION DEFAULT 0.00 CHECK (contribution_amount >= 0),
        settled INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Expenses Table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        member_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        item_purchased VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        quantity DOUBLE PRECISION DEFAULT 1.00,
        amount DOUBLE PRECISION NOT NULL CHECK (amount > 0),
        vendor_name VARCHAR(255),
        payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Other')),
        approval_status VARCHAR(50) DEFAULT 'Pending' CHECK (approval_status IN ('Pending', 'Approved', 'Rejected')),
        approved_by INTEGER,
        proof_url TEXT,
        proof_type VARCHAR(50),
        purchase_date VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 3. Daily Summaries Table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS daily_summaries (
        summary_date VARCHAR(50) PRIMARY KEY,
        opening_balance DOUBLE PRECISION DEFAULT 0.00,
        contributions_total DOUBLE PRECISION DEFAULT 0.00,
        expenses_total DOUBLE PRECISION DEFAULT 0.00,
        closing_balance DOUBLE PRECISION DEFAULT 0.00,
        cash_expenses DOUBLE PRECISION DEFAULT 0.00,
        online_expenses DOUBLE PRECISION DEFAULT 0.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Audit Logs Table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 5. Notifications Table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 6. Donations Table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS donations (
        id SERIAL PRIMARY KEY,
        member_id INTEGER,
        donor_name VARCHAR(255) NOT NULL,
        amount DOUBLE PRECISION NOT NULL CHECK (amount > 0),
        payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Other')),
        approval_status VARCHAR(50) DEFAULT 'Pending' CHECK (approval_status IN ('Pending', 'Approved', 'Rejected')),
        proof_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 7. Uploads Table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS uploads (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        mimetype VARCHAR(255) NOT NULL,
        data BYTEA NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed Default Users if empty
    const userCount = await queryGet('SELECT COUNT(*) as count FROM users');
    if (parseInt(userCount.count) === 0) {
      console.log('Seeding default users...');
      
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      const member1PasswordHash = await bcrypt.hash('member123', 10);
      const member2PasswordHash = await bcrypt.hash('member123', 10);

      // Add Admin
      await queryRun(
        'INSERT INTO users (username, password_hash, full_name, role, contribution_amount) VALUES (?, ?, ?, ?, ?)',
        ['admin', adminPasswordHash, 'Sabeel Admin Manager', 'admin', 0.00]
      );

      // Add Member A
      await queryRun(
        'INSERT INTO users (username, password_hash, full_name, role, contribution_amount) VALUES (?, ?, ?, ?, ?)',
        ['member_a', member1PasswordHash, 'Sajjad Hussain', 'member', 10000.00]
      );

      // Add Member B
      await queryRun(
        'INSERT INTO users (username, password_hash, full_name, role, contribution_amount) VALUES (?, ?, ?, ?, ?)',
        ['member_b', member2PasswordHash, 'Ali Reza', 'member', 20000.00]
      );

      console.log('Default users seeded successfully! (admin/admin123, member_a/member123, member_b/member123)');
    }

  } catch (error) {
    console.error('Error initializing database tables:', error);
  }
}

export default pool;
