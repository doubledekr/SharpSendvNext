import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema-multitenant";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create the connection
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// Export the client for cleanup if needed
export { client };