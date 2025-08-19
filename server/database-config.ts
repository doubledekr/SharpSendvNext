import postgres from 'postgres';

export interface DatabaseConfig {
  connection: ReturnType<typeof postgres>;
  environment: 'demo' | 'production' | 'development';
}

function createDatabaseConnection(): DatabaseConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDemoMode = process.env.DEMO_MODE === 'true';
  
  let connectionString: string;
  let environment: 'demo' | 'production' | 'development';
  
  if (nodeEnv === 'production' && !isDemoMode) {
    // Production database (separate from demo)
    connectionString = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL || '';
    environment = 'production';
    console.log('🔗 Connecting to PRODUCTION database');
  } else {
    // Demo/development database (Supabase)
    connectionString = process.env.DEMO_DATABASE_URL || process.env.DATABASE_URL || '';
    environment = nodeEnv === 'development' ? 'development' : 'demo';
    console.log(`🔗 Connecting to ${environment.toUpperCase()} database (Supabase)`);
  }
  
  if (!connectionString) {
    console.warn('⚠️ No database URL configured');
    throw new Error('Database connection string not configured');
  }
  
  const connection = postgres(connectionString, {
    max: environment === 'production' ? 20 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {}, // Suppress notices
  });
  
  return {
    connection,
    environment
  };
}

// Global database configuration
let dbConfig: DatabaseConfig | null = null;

export function getDatabaseConfig(): DatabaseConfig {
  if (!dbConfig) {
    dbConfig = createDatabaseConnection();
  }
  return dbConfig;
}

export function getDatabase() {
  return getDatabaseConfig().connection;
}

export function getDatabaseEnvironment() {
  return getDatabaseConfig().environment;
}

// Reset connection (useful for testing or environment switches)
export function resetDatabaseConnection() {
  if (dbConfig) {
    dbConfig.connection.end();
    dbConfig = null;
  }
}