# SharpSend - AI-Powered Newsletter Platform

## Overview

SharpSend is a sophisticated multi-tenant AI-powered newsletter personalization platform designed for financial publishers. It delivers hyper-personalized financial content through advanced opportunity detection, intelligent market triggers, and comprehensive email platform integrations.

### Key Features

- 🤖 **AI-Powered Personalization** - Dynamic content optimization using OpenAI GPT-4
- 📧 **16+ Email Platform Integrations** - Seamless connection with major email services
- 🎯 **Smart Opportunity Detection** - AI-driven revenue opportunity identification
- 📊 **Advanced Analytics** - Comprehensive tracking and performance metrics
- 🔄 **Dynamic Segmentation** - Real-time audience analysis and targeting
- 📝 **Assignment Desk** - Complete content planning and workflow management
- 🏢 **Multi-Tenant Architecture** - Isolated environments for each publisher
- 🚀 **Market Intelligence** - Real-time financial data integration

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL (via Neon Database)
- OpenAI API Key (for AI features)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Database
   DATABASE_URL=your_neon_database_url
   
   # AI
   OPENAI_API_KEY=your_openai_api_key
   
   # Session
   SESSION_SECRET=your_session_secret
   ```

4. Initialize the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Access the platform at `http://localhost:5000`

### Demo Access

Use the demo login to explore the platform:
- **Email**: demo@sharpsend.io
- **Password**: demo123

## Testing Documentation

### 📧 Email Platform Integration Testing

SharpSend supports 16+ email platforms with comprehensive testing capabilities that don't require real API keys.

#### Available Test Endpoints

##### 1. Test Individual Platform Connections

```bash
# Test Mailchimp integration
curl -X POST http://localhost:5000/api/platform-integrations/mailchimp/test \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"test-key-123"}'

# Test SendGrid integration  
curl -X POST http://localhost:5000/api/platform-integrations/sendgrid/test \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"test-key-456"}'

# Test ConvertKit integration
curl -X POST http://localhost:5000/api/platform-integrations/convertkit/test \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"test-key-789"}'
```

##### 2. List All Available Integrations

```bash
curl http://localhost:5000/api/platform-integrations/list
```

Returns all 16 supported platforms with their capabilities.

##### 3. Test All Platforms At Once

```bash
curl http://localhost:5000/api/platform-integrations/test-all
```

Runs a comprehensive test suite for all integrations.

##### 4. Advanced Platform Testing

**Iterable Integration:**
```bash
curl -X POST http://localhost:5000/api/integrations/iterable/test-connection \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"test-key","region":"us"}'
```

**Customer.io Integration:**
```bash
curl -X POST http://localhost:5000/api/integrations/customerio/test-connection \
  -H "Content-Type: application/json" \
  -d '{"siteId":"test-site","apiKey":"test-key","region":"us"}'
```

**Keap Integration:**
```bash
curl -X POST http://localhost:5000/api/integrations/keap/test-connection \
  -H "Content-Type: application/json" \
  -d '{"clientId":"test-client","clientSecret":"test-secret"}'
```

#### Platform Capabilities Matrix

| Platform | Lists | Templates | Automation | Analytics | SMS | Push | In-App |
|----------|-------|-----------|------------|-----------|-----|------|--------|
| **Mailchimp** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **SendGrid** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **ConvertKit** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Campaign Monitor** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Constant Contact** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **AWeber** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **GetResponse** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Drip** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **ActiveCampaign** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Klaviyo** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Omnisend** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Sendinblue (Brevo)** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Iterable** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Customer.io** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Braze** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Keap** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

#### Testing Through the UI

1. Log in with demo credentials
2. Navigate to **Settings → Integrations**
3. Click **"Connect"** on any platform
4. Use test credentials:
   - API Key: `test-api-key-demo`
   - Region: `us` (if required)
   - Site ID: `test-site-demo` (if required)

#### Complete Test Workflow

```bash
# 1. Check available platforms
curl http://localhost:5000/api/platform-integrations/list

# 2. Test a specific platform
curl -X POST http://localhost:5000/api/platform-integrations/mailchimp/test \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"demo-test-key"}'

# 3. Simulate fetching lists
curl http://localhost:5000/api/integrations/mailchimp/lists

# 4. Test campaign sending (simulated)
curl -X POST http://localhost:5000/api/integrations/mailchimp/send \
  -H "Content-Type: application/json" \
  -d '{"listId":"test-list","subject":"Test Email","content":"Hello World"}'
```

#### What's Being Simulated

- **Authentication validation** - Accepts test keys starting with "test-"
- **List discovery** - Returns 3-5 sample lists per platform
- **Template fetching** - Provides sample templates with metrics
- **Subscriber metrics** - Generates realistic counts and growth rates
- **Campaign sending** - Logs actions without sending emails
- **Webhook registration** - Simulates webhook setup
- **Error scenarios** - Trigger errors with specific test keys

### 🧪 API Testing

#### Core API Endpoints

```bash
# Health Check
curl http://localhost:5000/api/health

# Assignments
curl http://localhost:5000/api/assignments
curl -X POST http://localhost:5000/api/assignments \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Assignment","type":"newsletter"}'

# Opportunities
curl http://localhost:5000/api/opportunities
curl -X POST http://localhost:5000/api/opportunities \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Opportunity","type":"sponsorship","potentialValue":10000}'

# Segments
curl http://localhost:5000/api/segments

# Campaigns
curl http://localhost:5000/api/campaigns
```

#### Authentication Testing

```bash
# Demo Login
curl -X POST http://localhost:5000/api/demo/login

# Initialize Demo Environment
curl -X POST http://localhost:5000/api/demo/initialize

# Check Demo Status
curl http://localhost:5000/api/demo/status
```

### 🔍 Testing Features

#### AI-Powered Features

1. **Opportunity Detection**
   - Navigate to Opportunities page
   - Click "Detect Opportunities"
   - AI analyzes market data and suggests revenue opportunities

2. **Content Personalization**
   - Create an assignment
   - Click "Generate AI Draft"
   - System creates personalized content variants

3. **Segment Analysis**
   - View Segments page
   - Click "Analyze Segments"
   - AI identifies cohort patterns and behaviors

#### Tracking & Analytics

1. **Pixel Tracking**
   - Each email variant gets unique tracking pixel
   - Test tracking at `/api/pixels/track/:pixelId`

2. **Campaign Analytics**
   - View campaign performance metrics
   - Test analytics at `/api/analytics/campaign/:campaignId`

3. **Conversion Attribution**
   - 7-day attribution window
   - Test conversion tracking at `/api/track/conversion`

## Architecture

### Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Neon), Drizzle ORM
- **AI**: OpenAI GPT-4
- **Authentication**: Session-based with PostgreSQL store
- **Deployment**: Replit

### Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   ├── hooks/      # Custom React hooks
│   │   └── lib/        # Utilities
├── server/              # Express backend
│   ├── routes*.ts      # API routes
│   ├── services/       # Business logic
│   ├── db.ts          # Database connection
│   └── storage.ts     # Data access layer
├── shared/             # Shared TypeScript types
│   └── schema.ts      # Database schema
└── migrations/         # Database migrations
```

### Multi-Tenant Architecture

- **Data Isolation**: Complete separation via `publisher_id`
- **Subdomain Routing**: Publisher-specific URLs
- **CDN Paths**: Isolated content delivery
- **Tenant Middleware**: Automatic context injection

## Production Deployment

### Environment Variables

```bash
# Required for Production
DATABASE_URL=          # PostgreSQL connection string
OPENAI_API_KEY=       # OpenAI API key
SESSION_SECRET=       # Session encryption key
NODE_ENV=production   # Environment mode

# Optional
REPLIT_DOMAINS=       # Replit domain configuration
PUBLIC_OBJECT_SEARCH_PATHS=  # Object storage paths
PRIVATE_OBJECT_DIR=   # Private file storage
```

### Deployment Steps

1. Set up PostgreSQL database (Neon recommended)
2. Configure environment variables
3. Run database migrations: `npm run db:push`
4. Build the application: `npm run build`
5. Start the server: `npm start`

### Health Monitoring

- Health check endpoint: `GET /api/health`
- Uptime monitoring: `GET /`
- Database status: Included in health response

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact the development team
- Check the documentation

## License

Proprietary - All rights reserved

---

**SharpSend** - Transforming newsletter engagement through AI-powered personalization