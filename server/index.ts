import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { sql } from "drizzle-orm";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import { initializeDemoEnvironment } from "./demo-environment";
import { tenantMiddleware } from "./middleware/tenant";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add tenant middleware to identify publisher by subdomain
app.use(tenantMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log(`🚀 Starting server in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📍 Database URL configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
  
  // Test database connection first
  try {
    console.log("🔌 Testing database connection...");
    const { db } = await import("./db.js");
    await db.execute(sql`SELECT 1 as test`);
    console.log("✅ Database connection successful");
  } catch (dbError) {
    console.error("❌ Database connection failed:", dbError);
    console.error("This will likely cause the server to fail. Check DATABASE_URL environment variable.");
  }
  
  // Only seed the database in development mode
  if (process.env.NODE_ENV === "development") {
    try {
      const seedResult = await seedDatabase();
      if (seedResult.success) {
        console.log("Database seeding completed successfully");
      } else {
        console.warn("Database seeding failed but continuing startup:", seedResult.error);
      }
    } catch (seedError) {
      console.warn("Database seeding failed but continuing startup:", seedError);
    }
  } else {
    console.log("Production mode - skipping database seeding");
  }
  
  // Initialize demo environment in all environments (non-blocking)
  // This should never prevent server startup
  setImmediate(async () => {
    try {
      console.log("🔧 Initializing demo environment...");
      const demoResult = await initializeDemoEnvironment();
      if (demoResult && demoResult.success) {
        console.log("✅ Demo environment ready!");
        console.log("📧 Demo login available at /login");
      } else {
        console.log("⚠️ Demo environment setup skipped or failed - server continuing normally");
      }
    } catch (demoError) {
      console.warn("⚠️ Demo environment initialization failed - server continuing normally");
      console.warn("Error details:", demoError);
    }
  });
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error("Express error handler:", {
      status,
      message,
      stack: err.stack,
      url: _req.url,
      method: _req.method
    });

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  try {
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`🎉 Server successfully started on port ${port}`);
      log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      log(`🚀 Server ready to accept connections`);
    });
  } catch (listenError) {
    console.error("❌ Failed to start server on port", port, ":", listenError);
    process.exit(1);
  }
  
})().catch((startupError) => {
  console.error("💥 Fatal server startup error:", startupError);
  console.error("Stack trace:", startupError.stack);
  console.error("Environment variables:", {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? "configured" : "missing",
    PORT: process.env.PORT
  });
  process.exit(1);
});
