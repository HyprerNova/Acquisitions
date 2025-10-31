import { config } from 'dotenv';
import {neon, neonConfig} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";

config();

const sql = neon(process.env.DATABASE_URL);

const db = drizzle(sql);

export {db, sql};

