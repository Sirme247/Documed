import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const {Pool} = pg;

// export const pool = new Pool({
//     connectionString: process.env.DATABASE_URI
// });
export const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
    
max: 20, // Increase pool size for parallel operations
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: true }  // Verify SSL cert in production
        : { rejectUnauthorized: false } // Allow self-signed in dev
});


  
  // If using AWS RDS, consider:
 
