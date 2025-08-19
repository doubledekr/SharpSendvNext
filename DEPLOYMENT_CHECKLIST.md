# SharpSend Deployment Checklist

## Pre-Deployment Requirements

### 1. Environment Variables
Ensure these are set in your Replit deployment environment:
- [ ] `NODE_ENV=production` - CRITICAL for production mode detection
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `PORT` - Usually auto-set by Replit

### 2. Health Check Endpoints
The following endpoints are available for health checks:
- `/health` - Simple health check (returns JSON)
- `/api/health-check` - Alternative health check endpoint
- `/api/health` - Detailed health check with metrics

### 3. Build Process
Before deployment, ensure:
- [ ] Frontend is built: `npm run build`
- [ ] Build outputs to `server/public` directory
- [ ] Static files are properly served in production

### 4. Database Setup
In production:
- [ ] Database migrations are applied
- [ ] NO demo data or seeding occurs
- [ ] Database connection errors are handled gracefully

## Deployment Process

### Step 1: Build Frontend
```bash
npm run build
```

### Step 2: Set Environment Variables
In Replit deployment settings:
```
NODE_ENV=production
DATABASE_URL=your_production_database_url
```

### Step 3: Deploy Command
The deployment should run:
```bash
npm run start
```

## Server Keep-Alive Mechanisms

The server implements multiple keep-alive strategies:

1. **Process stdin resume** - Keeps event loop active
2. **Global keep-alive interval** - 30-second heartbeat in production
3. **Infinite promise blocker** - Prevents main function from completing
4. **Production heartbeat** - 1-second interval in production mode

## Troubleshooting

### Server Exits with Code 0
- Check `NODE_ENV=production` is set
- Verify health check endpoints are accessible
- Check deployment logs for "PRODUCTION MODE" confirmation

### Health Checks Failing
- Ensure server responds at `/health` or `/api/health-check`
- Check server logs for startup confirmation
- Verify port binding to `0.0.0.0:PORT`

### Frontend Not Loading
- Verify build process completed successfully
- Check that `server/public` directory exists
- Ensure static file serving is configured

### Database Issues
- Verify `DATABASE_URL` is correct
- Check that production mode skips seeding
- Ensure database is accessible from deployment

## Production Logs to Expect

Successful production startup should show:
```
🚀 Starting server in production mode
🏭 Production mode detected: true
📍 Database URL configured: Yes
✅ Database connection successful
🎉 Server successfully started on port 5000
🏭 PRODUCTION MODE: Server successfully started and will remain running
🏭 Health endpoints available at /health and /api/health-check
🚀 Production mode - skipping all database seeding and demo data
🏭 Running in clean production state
[Keep-Alive] Server healthy - Memory: XXXmb, Uptime: XXs (every 30 seconds)
```

## Post-Deployment Verification

1. [ ] Access `/health` endpoint - should return JSON
2. [ ] Access root URL - should load frontend
3. [ ] Check server logs for keep-alive messages
4. [ ] Verify no demo data is being created
5. [ ] Test API endpoints are responding

## Important Notes

- The server MUST NOT exit after initialization
- Production mode MUST skip all demo/seed operations
- Health checks MUST be available immediately after server starts
- The main async function MUST NOT complete (blocked by infinite promise)
- Multiple keep-alive mechanisms ensure server stays running

## Contact for Issues

If deployment continues to fail after following this checklist:
1. Check deployment logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure the build process completed successfully
4. Contact Replit support if infrastructure issues persist