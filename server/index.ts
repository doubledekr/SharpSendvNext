import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { sql } from "drizzle-orm";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
// Demo environment removed
import { tenantMiddleware } from "./middleware/tenant";

// CRITICAL DEBUG: Override process.exit to find what's trying to exit
const originalExit = process.exit;
(process as any).exit = function(code?: number) {
  console.error('🚨🚨🚨 PROCESS.EXIT INTERCEPTED 🚨🚨🚨');
  console.error('Exit code:', code);
  console.trace('Exit called from:');
  
  // In production, only allow exits from explicit signals
  if (process.env.NODE_ENV === 'production' && code === 0) {
    console.error('🚫 BLOCKING process.exit(0) in production - server will continue running');
    return;
  }
  
  // For actual errors or development, allow exit
  if (code !== 0 || process.env.NODE_ENV !== 'production') {
    originalExit.call(process, code);
  }
};

const app = express();

// Optimize for fast responses - disable unnecessary features
app.set('x-powered-by', false);
app.set('etag', false);

// Add process monitoring for debugging deployment issues
process.on('exit', (code) => {
  console.log(`🚨 Process exiting with code: ${code}`);
  if (code === 0) {
    console.log('🚨 Process attempting to exit normally - this should not happen in production!');
    console.trace('Exit stack trace');
  }
  
  // Try to prevent exit in production
  if (process.env.NODE_ENV === 'production' && code === 0) {
    console.error('🚫 Attempting to prevent exit in production');
    throw new Error('Preventing normal exit in production');
  }
});

process.on('beforeExit', (code) => {
  console.log(`🚨 Process about to exit with code: ${code}`);
  console.log('🚨 Active handles:', (process as any)._getActiveHandles?.()?.length || 'unknown');
  console.log('🚨 Active requests:', (process as any)._getActiveRequests?.()?.length || 'unknown');
  
  // In production, prevent normal exits
  if (process.env.NODE_ENV === 'production' && code === 0) {
    console.log('🚨 Preventing normal exit in production - keeping server alive');
    // Keep the event loop alive
    setImmediate(() => {
      console.log('🔄 Restarted event loop to prevent exit');
    });
  }
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  // Don't exit immediately - log the error but continue serving
  // In production, we want to be more resilient
  if (process.env.NODE_ENV === 'production') {
    console.error('🏭 Production mode: continuing to serve despite uncaught exception');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejections - log and continue
  // In production, log but keep serving
  if (process.env.NODE_ENV === 'production') {
    console.error('🏭 Production mode: continuing to serve despite unhandled rejection');
  }
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
  // Explicitly log the environment for debugging
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`🚀 Starting server in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🏭 Production mode detected: ${isProduction}`);
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
    console.log(`🩺 Health check endpoint responds at: http://0.0.0.0:${port}/ (returns JSON status)`);
    console.log(`⚡ Process ID: ${process.pid}`);
    
    // Add server error handling
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });
    
    // Initialize expensive operations AFTER server is responding to health checks
    setImmediate(() => {
      initializeServicesAsync();
    });
    
    // Keep the process alive indefinitely - prevent the async IIFE from completing
    // This ensures the server continues running and can handle health checks
    console.log("🔄 Keeping process alive - server will run until manually stopped or received shutdown signal");
    
    // Multiple mechanisms to keep the process alive
    // 1. Prevent stdin from closing (keeps event loop active)
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    
    // 2. Keep a reference to prevent garbage collection
    const keepAliveInterval = setInterval(() => {
      // This empty interval keeps the event loop active
      // Log periodically in production to show server is alive
      if (process.env.NODE_ENV === 'production') {
        const memUsage = process.memoryUsage();
        console.log(`[Keep-Alive] Server healthy - Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB, Uptime: ${Math.round(process.uptime())}s`);
      }
    }, 30000); // Check every 30 seconds in production
    
    // Store the interval reference globally
    (global as any).keepAliveInterval = keepAliveInterval;
    
    // 3. Keep the main thread alive - DON'T use await on infinite promise
    // Instead, set up the promise but don't await it
    const keepAlivePromise = new Promise<void>(() => {
      // This promise never resolves, keeping a reference in memory
      console.log('🔒 Server locked in running state - will continue until explicit shutdown');
    });
    
    // 4. For production deployment, add explicit server running confirmation
    if (process.env.NODE_ENV === 'production') {
      console.log('🏭 PRODUCTION MODE: Server successfully started and will remain running');
      console.log('🏭 Health endpoints available at /health and /api/health-check');
      
      // Set up a production heartbeat
      setInterval(() => {
        // Just keeping the event loop busy
      }, 1000);
    }
    
    // DO NOT await the keep-alive promise - let the event loop handle it
    // The server will stay alive due to active handles (server, intervals, stdin)
    
  } catch (listenError) {
    console.error("❌ Failed to start server on port", port, ":", listenError);
    process.exit(1);
  }
  
  // CRITICAL FOR DEPLOYMENT: Never let the main function complete
  // Block forever to prevent process exit
  console.log('⏳ Entering infinite wait - server will run until shutdown signal');
  await new Promise(() => {
    // This promise intentionally never resolves
    // This is the final blocker that prevents the process from exiting
    console.log('♾️ Server is now in permanent running state');
  });
  
  // This code should NEVER be reached
  console.error('❌❌❌ CRITICAL ERROR: Main function completed - this should never happen!');
  
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
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction && process.env.NODE_ENV === "development") {
      try {
        const seedResult = await seedDatabase();
        if (seedResult.success) {
          console.log("✅ Database seeding completed successfully");
        } else {
          console.warn("⚠️ Database seeding failed but continuing:", seedResult.error);
        }
      } catch (seedError) {
        console.warn("⚠️ Database seeding failed but continuing:", seedError);
        // Ensure server continues even if seeding fails
      }
    } else {
      console.log("🚀 Production mode - skipping all database seeding and demo data");
      console.log("🏭 Running in clean production state");
    }
    
    // Demo environment is now only initialized when explicitly requested via API
    console.log("🔧 Demo environment will be initialized on demand via /api/demo/initialize endpoint");
    
    console.log("✅ Background service initialization completed");
  } catch (error) {
    console.error("❌ Background service initialization failed:", error);
    // Don't crash the server - health checks should still work
    // Don't exit process - server should continue running
  }
}

// Graceful shutdown handling
let isShuttingDown = false;
const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) {
    console.log(`⚠️ Already shutting down, ignoring ${signal}`);
    return;
  }
  
  isShuttingDown = true;
  console.log(`🛑 Received ${signal}, shutting down gracefully`);
  
  // Clean up resources
  if ((global as any).keepAliveInterval) {
    clearInterval((global as any).keepAliveInterval);
    console.log('🧹 Cleaned up keep-alive interval');
  }
  if ((process as any).keepAliveInterval) {
    clearInterval((process as any).keepAliveInterval);
    console.log('🧹 Cleaned up process keep-alive interval');
  }
  
  // In production, only exit if we get an explicit termination signal
  if (process.env.NODE_ENV === 'production') {
    console.log('🏭 Production environment - graceful shutdown initiated');
    // Only exit on SIGTERM (deployment shutdown signal)
    if (signal === 'SIGTERM') {
      setTimeout(() => {
        console.log('✅ Production shutdown completed via SIGTERM');
        originalExit.call(process, 0);
      }, 1000);
    } else {
      console.log('⚠️ Ignoring non-SIGTERM signal in production');
      isShuttingDown = false;
    }
  } else {
    // In development, allow normal shutdown
    console.log('✅ Development graceful shutdown initiated');
    setTimeout(() => {
      originalExit.call(process, 0);
    }, 500);
  }
};

// Only handle SIGTERM in production, both in development
if (process.env.NODE_ENV === 'production') {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
} else {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Additional safety for preventing unwanted exits
process.on('SIGUSR1', () => {
  console.log('📡 Received SIGUSR1 (typically used by PM2/nodemon for restarts)');
});

process.on('SIGUSR2', () => {
  console.log('📡 Received SIGUSR2 (typically used by PM2/nodemon for restarts)');
});
