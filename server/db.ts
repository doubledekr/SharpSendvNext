import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import postgres from 'postgres';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

function createDatabaseConnection() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDemoMode = process.env.DEMO_MODE === 'true';
  
  let connectionString: string | undefined;
  let environment: string;
  
  if (nodeEnv === 'production' && !isDemoMode) {
    // Production database (use original DATABASE_URL for production)
    connectionString = process.env.DATABASE_URL;
    environment = 'PRODUCTION';
  } else {
    // Demo/development database (use original DATABASE_URL for now, can switch to Supabase later)
    connectionString = process.env.DATABASE_URL;
    environment = nodeEnv === 'development' ? 'DEVELOPMENT' : 'DEMO';
  }
  
  if (!connectionString) {
    console.warn(`⚠️ Database URL not configured for ${environment} environment`);
    console.warn("Database features will be unavailable");
    return { pool: null, db: null as any, environment };
  }
  
  console.log(`🔗 Connecting to ${environment} database`);
  
  // Use postgres.js for Supabase connections (demo/dev), Neon for production
  if (environment === 'PRODUCTION' && connectionString.includes('neon')) {
    // Use Neon serverless for production
    const pool = new Pool({ connectionString });
    const db = drizzle({ client: pool, schema });
    return { pool, db, environment };
  } else {
    // Use postgres.js for Supabase (demo/development)
    const client = postgres(connectionString, {
      max: environment === 'PRODUCTION' ? 20 : 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    const db = drizzlePostgres(client, { schema });
    return { pool: null, db, environment };
  }
}

// Create database connection based on environment
const { pool, db, environment } = createDatabaseConnection();

export { pool, db };
export const databaseEnvironment = environment;
