import pgPromise from "pg-promise";
import { ENV } from "./env";

const pgp = pgPromise({
  capSQL: true,
  // You can add query logging here later if needed.
});

export const db = pgp(ENV.DATABASE_URL);

/*
 Always use db.any, db.one, db.oneOrNone, db.none
 to avoid SQL injection and keep the code consistent.
 
 Example:
 const users = await db.any("SELECT * FROM users WHERE is_active = $1", [true]);
*/
