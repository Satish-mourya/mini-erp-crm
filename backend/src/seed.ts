import bcrypt from 'bcrypt';
import { createPool } from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const dbUrl = new URL(process.env.DATABASE_URL || '');
  const pool = createPool({
    host: dbUrl.hostname === 'localhost' ? '127.0.0.1' : dbUrl.hostname,
    port: parseInt(dbUrl.port) || 3306,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.slice(1),
  });

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const salesPasswordHash = await bcrypt.hash('sales123', 10);
  const warehousePasswordHash = await bcrypt.hash('warehouse123', 10);
  const accountsPasswordHash = await bcrypt.hash('account123', 10);
  const conn = await pool.getConnection();

  try {
    await conn.query(
      `INSERT INTO User (email, name, password_hash, role, created_at) 
       VALUES (?, ?, ?, 'ADMIN', NOW()) 
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ['admin@erp.com', 'Admin User', adminPasswordHash]
    );
    await conn.query(
      `INSERT INTO User (email, name, password_hash, role, created_at) 
       VALUES (?, ?, ?, 'SALES', NOW()) 
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ['sales@test.com', 'Sales User', salesPasswordHash]
    );
    await conn.query(
      `INSERT INTO User (email, name, password_hash, role, created_at) 
       VALUES (?, ?, ?, 'WAREHOUSE', NOW()) 
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ['warehouse@test.com', 'Warehouse User', warehousePasswordHash]
    );
    await conn.query(
      `INSERT INTO User (email, name, password_hash, role, created_at) 
       VALUES (?, ?, ?, 'ACCOUNTS', NOW()) 
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ['accounts@test.com', 'Accounts User', accountsPasswordHash]
    );
    console.log('Seed data inserted for Admin, Sales, Warehouse, and Accounts roles.');
  } finally {
    conn.release();
    pool.end();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
