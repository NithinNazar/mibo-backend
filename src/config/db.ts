import pgPromise, { IInitOptions, IDatabase } from "pg-promise";
import { ENV } from "./env";

// Initialize options for pg-promise
const initOptions: IInitOptions = {
  capSQL: true,

  // Query logging for development
  query(e) {
    if (ENV.NODE_ENV === "development") {
      console.log("📊 QUERY:", e.query);
    }
  },

  // Log slow queries in production (> 1 second)
  receive(e: any) {
    if (ENV.NODE_ENV === "production" && e.ctx.duration > 1000) {
      console.warn(`⚠️  SLOW QUERY (${e.ctx.duration}ms):`, e.ctx.query);
    }
  },

  // Error handling
  error(err, e) {
    if (e.cn) {
      console.error("❌ Database connection error:", err);
    }
    if (e.query) {
      console.error("❌ Query error:", err.message || err);
      if (ENV.NODE_ENV === "development") {
        console.error("   Query:", e.query);
      }
    }
  },
};

const pgp = pgPromise(initOptions);

// Database connection with pooling configuration
export const db: IDatabase<any> = pgp(ENV.DATABASE_URL);

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await db.one("SELECT 1 as test");
    console.log("✅ Database connection established successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    return false;
  }
}

/**
 * Close database connections gracefully
 */
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await pgp.end();
    console.log("✅ Database connections closed");
  } catch (error) {
    console.error("❌ Error closing database connections:", error);
  }
}

/*
 Always use db.any, db.one, db.oneOrNone, db.none
 to avoid SQL injection and keep the code consistent.
 
 Example:
 const users = await db.any("SELECT * FROM users WHERE is_active = $1", [true]);
*/
