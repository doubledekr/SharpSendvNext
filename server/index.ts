import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { sql } from "drizzle-orm";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import { initializeDemoEnvironment } from "./demo-environment";
import { tenantMiddleware } from "./middleware/tenant";

const app = express();

// Optimize for fast responses - disable unnecessary features
app.set('x-powered-by', false);
app.set('etag', false);

// Add process monitoring for debugging deployment issues
process.on('exit', (code) => {
  console.log(`🚨 Process exiting with code: ${code}`);
});

process.on('beforeExit', (code) => {
  console.log(`🚨 Process about to exit with code: ${code}`);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  // Don't exit immediately - log the error but continue serving
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejections - log and continue
});

// Basic middleware setup
app.use(express.json({ limit: '10mb' }));
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
  if (process.env.DATABASE_URL) {
    try {
      console.log("🔌 Testing database connection...");
      const { db } = await import("./db.js");
      await db.execute(sql`SELECT 1 as test`);
      console.log("✅ Database connection successful");
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError);
      console.error("Error details:", {
        message: (dbError as any).message,
        code: (dbError as any).code,
        detail: (dbError as any).detail
      });
      // Don't fail the server, continue anyway
    }
  } else {
    console.warn("⚠️ DATABASE_URL not configured - database features will be unavailable");
  }
  
  // Move expensive operations to run AFTER server starts
  // This ensures health checks can be answered immediately
  
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
    try {
      await setupVite(app, server);
      console.log("✅ Vite development server setup completed");
    } catch (viteError) {
      console.error("⚠️ Vite setup failed, but continuing with server startup:", viteError);
      // Don't exit - continue with basic static serving
      try {
        serveStatic(app);
        console.log("✅ Fallback to static file serving");
      } catch (staticError) {
        console.error("⚠️ Static file serving also failed:", staticError);
        // Serve a basic fallback response
        app.get("*", (req, res) => {
          res.status(200).send(`
            <!DOCTYPE html>
            <html>
              <head><title>SharpSend</title></head>
              <body>
                <h1>SharpSend API Server</h1>
                <p>Server is running but frontend assets are not available.</p>
                <p>API endpoints are available at /api/*</p>
              </body>
            </html>
          `);
        });
      }
    }
  } else {
    try {
      serveStatic(app);
      console.log("✅ Production static file serving setup completed");
    } catch (staticError) {
      console.error("⚠️ Static file serving failed, serving basic fallback:", staticError);
      // Serve a basic fallback response for production
      app.get("*", (req, res) => {
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head><title>SharpSend</title></head>
            <body>
              <h1>SharpSend API Server</h1>
              <p>Server is running in production mode.</p>
              <p>Frontend build may be missing. API endpoints are available at /api/*</p>
            </body>
          </html>
        `);
      });
    }
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  try {
    // Ensure the server starts and stays running
    await new Promise<void>((resolve, reject) => {
      server.listen({
        port,
        host: "0.0.0.0",
        reusePort: true,
      }, (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          log(`🎉 Server successfully started on port ${port}`);
          log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
          log(`🚀 Server ready to accept connections`);
          resolve();
        }
      });
    });
    
    // Keep the process alive
    console.log("✅ Server is running and will stay alive...");
    console.log(`🌐 Health check available at http://localhost:${port}/`);
    console.log(`🔄 Server process will continue running until manually stopped`);
    
    // Add server error handling
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });
    
    // Initialize expensive operations AFTER server is responding to health checks
    setImmediate(() => {
      initializeServicesAsync();
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

// Initialize services asynchronously after server is ready
async function initializeServicesAsync() {
  try {
    console.log("🔧 Starting background service initialization...");
    
    // Only seed the database in development mode
    if (process.env.NODE_ENV === "development") {
      try {
        const seedResult = await seedDatabase();
        if (seedResult.success) {
          console.log("✅ Database seeding completed successfully");
        } else {
          console.warn("⚠️ Database seeding failed but continuing:", seedResult.error);
        }
      } catch (seedError) {
        console.warn("⚠️ Database seeding failed but continuing:", seedError);
      }
    } else {
      console.log("🚀 Production mode - skipping database seeding");
    }
    
    // Initialize demo environment in development only
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction) {
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
        console.warn("⚠️ Demo environment initialization failed - server continuing normally:", demoError);
      }
    }
    
    console.log("✅ Background service initialization completed");
  } catch (error) {
    console.error("❌ Background service initialization failed:", error);
    // Don't crash the server - health checks should still work
  }
}

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`🛑 Received ${signal}, shutting down gracefully`);
  // Note: server is only available within the async function scope
  // In production, we rely on the process manager to handle shutdown
  console.log('✅ Graceful shutdown initiated');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
