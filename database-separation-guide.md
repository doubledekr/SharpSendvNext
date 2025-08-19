# Database Environment Separation Guide for SharpSend

## Executive Summary

This guide provides multiple strategies for separating demo and production database environments for your SharpSend application. Based on Replit's infrastructure and best practices, you can implement clean separation between environments to prevent data conflicts, improve security, and enable safe testing.

## Why Separate Demo and Production Databases?

### Benefits of Environment Separation
- **Data Safety**: Prevents demo activities from affecting real user data
- **Testing Freedom**: Allows safe experimentation without production impact
- **Performance Isolation**: Demo usage doesn't affect production performance
- **Security**: Reduces risk of accidental data exposure or corruption
- **Compliance**: Meets best practices for data governance and privacy

### Your Current Issue
The duplicate key constraint error occurs because your demo seeding script tries to create publishers that already exist in the shared database. Separating environments eliminates this conflict entirely.

## Solution Options for Replit

### Option 1: Replit Production Databases (RECOMMENDED)

Replit provides built-in support for separate development and production databases.

#### How It Works
- **Development Database**: Used during development and testing in your workspace
- **Production Database**: Dedicated database for your deployed application
- **Automatic Separation**: Replit handles the separation automatically based on environment

#### Implementation Steps

1. **Set Up Production Database**
   ```bash
   # In your Replit workspace, use the Database tool
   # Navigate to Database → Create Production Database
   ```

2. **Configure Environment Variables**
   Your app will automatically receive different database URLs:
   ```javascript
   // Development environment
   DATABASE_URL = "postgresql://dev-connection-string"
   
   // Production environment  
   DATABASE_URL = "postgresql://prod-connection-string"
   ```

3. **Update Your Database Connection**
   ```javascript
   // server/database/connection.js
   import postgres from 'postgres';
   
   const sql = postgres(process.env.DATABASE_URL, {
     // Connection options
   });
   
   export default sql;
   ```

4. **Environment-Specific Seeding**
   ```javascript
   // server/seeders/index.js
   import sql from '../database/connection.js';
   
   async function seedDatabase() {
     const isProduction = process.env.NODE_ENV === 'production';
     
     if (isProduction) {
       console.log('Production environment - skipping demo seeding');
       return;
     }
     
     // Only seed demo data in development
     await seedDemoPublishers();
     await seedDemoUsers();
     console.log('✓ Demo data seeded');
   }
   ```

#### Advantages
- ✅ Built into Replit platform
- ✅ Automatic environment detection
- ✅ No additional configuration needed
- ✅ Separate billing and resource management

#### Considerations
- 🔶 Requires Replit Pro plan for production databases
- 🔶 Limited to Replit ecosystem

### Option 2: Multiple Database URLs with Environment Variables

Use different database connections based on environment variables.

#### Implementation Steps

1. **Set Up Multiple Databases**
   Create two separate databases (can be on same or different providers):
   - Demo database: `sharpsend_demo`
   - Production database: `sharpsend_production`

2. **Configure Environment Variables**
   ```bash
   # In Replit Secrets (for production)
   DATABASE_URL=postgresql://prod-connection-string
   DEMO_DATABASE_URL=postgresql://demo-connection-string
   NODE_ENV=production
   
   # In development (.env file)
   DATABASE_URL=postgresql://demo-connection-string
   NODE_ENV=development
   ```

3. **Dynamic Database Connection**
   ```javascript
   // server/config/database.js
   import postgres from 'postgres';
   
   function getDatabaseConnection() {
     const isProduction = process.env.NODE_ENV === 'production';
     const isDemoMode = process.env.DEMO_MODE === 'true';
     
     let connectionString;
     
     if (isProduction && !isDemoMode) {
       connectionString = process.env.DATABASE_URL; // Production DB
     } else {
       connectionString = process.env.DEMO_DATABASE_URL || process.env.DATABASE_URL;
     }
     
     return postgres(connectionString);
   }
   
   export const sql = getDatabaseConnection();
   ```

4. **Demo Mode Toggle**
   ```javascript
   // server/middleware/demoMode.js
   export function enableDemoMode(req, res, next) {
     if (req.query.demo === 'true' || req.headers['x-demo-mode']) {
       process.env.DEMO_MODE = 'true';
     }
     next();
   }
   ```

#### Advantages
- ✅ Full control over database selection
- ✅ Can use any PostgreSQL provider
- ✅ Flexible demo mode switching
- ✅ Cost-effective

#### Considerations
- 🔶 Requires manual database setup
- 🔶 More complex configuration

### Option 3: Schema-Based Separation

Use different PostgreSQL schemas within the same database.

#### Implementation Steps

1. **Create Schemas**
   ```sql
   -- Create separate schemas
   CREATE SCHEMA IF NOT EXISTS demo;
   CREATE SCHEMA IF NOT EXISTS production;
   
   -- Set search path based on environment
   SET search_path TO demo, public;  -- For demo
   SET search_path TO production, public;  -- For production
   ```

2. **Environment-Based Schema Selection**
   ```javascript
   // server/config/database.js
   import postgres from 'postgres';
   
   const sql = postgres(process.env.DATABASE_URL, {
     onnotice: () => {}, // Suppress notices
     transform: {
       ...postgres.camel,
       undefined: null
     }
   });
   
   // Set schema based on environment
   async function setSchema() {
     const schema = process.env.NODE_ENV === 'production' ? 'production' : 'demo';
     await sql`SET search_path TO ${sql(schema)}, public`;
   }
   
   // Initialize schema on connection
   setSchema();
   
   export default sql;
   ```

3. **Schema-Aware Migrations**
   ```javascript
   // server/migrations/migrate.js
   async function runMigrations() {
     const schema = process.env.NODE_ENV === 'production' ? 'production' : 'demo';
     
     // Create tables in the appropriate schema
     await sql`
       CREATE TABLE IF NOT EXISTS ${sql(schema)}.publishers (
         id SERIAL PRIMARY KEY,
         subdomain VARCHAR(255) UNIQUE NOT NULL,
         name VARCHAR(255) NOT NULL,
         created_at TIMESTAMP DEFAULT NOW()
       )
     `;
   }
   ```

#### Advantages
- ✅ Single database instance
- ✅ Lower cost
- ✅ Shared connection pooling
- ✅ Easy backup and maintenance

#### Considerations
- 🔶 More complex query management
- 🔶 Risk of schema conflicts
- 🔶 Requires PostgreSQL knowledge

### Option 4: Subdomain-Based Database Routing

Route to different databases based on subdomain or request parameters.

#### Implementation Steps

1. **Database Router Middleware**
   ```javascript
   // server/middleware/databaseRouter.js
   import postgres from 'postgres';
   
   const connections = {
     demo: postgres(process.env.DEMO_DATABASE_URL),
     production: postgres(process.env.DATABASE_URL)
   };
   
   export function databaseRouter(req, res, next) {
     const subdomain = req.headers.host?.split('.')[0];
     const isDemo = subdomain === 'demo' || req.query.env === 'demo';
     
     req.db = isDemo ? connections.demo : connections.production;
     req.environment = isDemo ? 'demo' : 'production';
     
     next();
   }
   ```

2. **Use in Routes**
   ```javascript
   // server/routes/publishers.js
   import { databaseRouter } from '../middleware/databaseRouter.js';
   
   router.use(databaseRouter);
   
   router.get('/publishers', async (req, res) => {
     try {
       const publishers = await req.db`
         SELECT * FROM publishers 
         ORDER BY created_at DESC
       `;
       res.json(publishers);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   ```

3. **Environment-Specific Seeding**
   ```javascript
   // server/seeders/publishers.js
   export async function seedPublishers(db, environment) {
     const publisherData = environment === 'demo' 
       ? getDemoPublishers() 
       : getProductionPublishers();
   
     for (const publisher of publisherData) {
       await db`
         INSERT INTO publishers (subdomain, name, email)
         VALUES (${publisher.subdomain}, ${publisher.name}, ${publisher.email})
         ON CONFLICT (subdomain) DO NOTHING
       `;
     }
   }
   ```

#### Advantages
- ✅ Automatic environment detection
- ✅ Clean separation by subdomain
- ✅ Easy to understand and maintain
- ✅ Supports multiple demo environments

#### Considerations
- 🔶 Requires subdomain setup
- 🔶 Multiple database connections

## Recommended Implementation for SharpSend

### Quick Fix: Environment-Based Database Selection

Based on your current setup and the seeding error, here's the fastest solution:

#### Step 1: Update Your Database Configuration

```javascript
// server/config/database.js
import postgres from 'postgres';

function createDatabaseConnection() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDemoMode = process.env.DEMO_MODE === 'true';
  
  // Use different connection strings based on environment
  let connectionString;
  
  if (isProduction && !isDemoMode) {
    // Production database
    connectionString = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;
  } else {
    // Demo/development database
    connectionString = process.env.DEMO_DATABASE_URL || process.env.DATABASE_URL;
  }
  
  console.log(`🔗 Connecting to ${isProduction && !isDemoMode ? 'PRODUCTION' : 'DEMO'} database`);
  
  return postgres(connectionString, {
    max: isProduction ? 20 : 5, // Different connection pool sizes
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

export const sql = createDatabaseConnection();
```

#### Step 2: Set Up Environment Variables in Replit

1. **In your Replit Secrets, add:**
   ```
   PRODUCTION_DATABASE_URL=your_production_database_connection_string
   DEMO_DATABASE_URL=your_demo_database_connection_string
   NODE_ENV=production
   ```

2. **For local development, create `.env`:**
   ```
   DEMO_DATABASE_URL=your_local_or_demo_database_connection_string
   NODE_ENV=development
   ```

#### Step 3: Update Your Seeding Script

```javascript
// server/seeders/index.js
import { sql } from '../config/database.js';

async function seedDemoData() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDemoMode = process.env.DEMO_MODE === 'true';
  
  // Only seed demo data in development or demo mode
  if (isProduction && !isDemoMode) {
    console.log('🚫 Production environment - skipping demo seeding');
    return;
  }
  
  try {
    console.log('🌱 Starting demo data seeding...');
    
    // Seed demo publishers with conflict handling
    await seedDemoPublishers();
    await seedDemoUsers();
    await seedDemoSegments();
    
    console.log('✅ Demo data seeding completed successfully');
  } catch (error) {
    console.error('❌ Demo seeding failed:', error.message);
    // Don't throw - let the app continue running
  }
}

async function seedDemoPublishers() {
  const demoPublishers = [
    {
      subdomain: 'demo',
      name: 'Demo Publisher',
      email: 'demo@sharpsend.com',
      settings: JSON.stringify({ theme: 'default' })
    },
    {
      subdomain: 'sample',
      name: 'Sample Financial Newsletter',
      email: 'sample@sharpsend.com',
      settings: JSON.stringify({ theme: 'financial' })
    }
  ];
  
  for (const publisher of demoPublishers) {
    await sql`
      INSERT INTO publishers (subdomain, name, email, settings, created_at)
      VALUES (${publisher.subdomain}, ${publisher.name}, ${publisher.email}, ${publisher.settings}, NOW())
      ON CONFLICT (subdomain) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        updated_at = NOW()
    `;
  }
  
  console.log('✅ Demo publishers seeded');
}
```

## Current Fix Implementation

For immediate resolution of the duplicate key constraint error, we've implemented:

1. **Error Handling for Duplicate Keys**: Added PostgreSQL error code 23505 handling in seed.ts
2. **Non-Blocking Database Operations**: Database seeding errors no longer crash the server
3. **Optional Database Connection**: Server can start without DATABASE_URL configured
4. **Graceful Degradation**: Demo environment setup continues despite database errors

## Future Improvements

Consider implementing Option 1 (Replit Production Databases) for the cleanest separation:
- Complete isolation between demo and production data
- No risk of data conflicts
- Built-in Replit support
- Automatic environment detection

This ensures your SharpSend platform can safely demonstrate features without affecting production data.