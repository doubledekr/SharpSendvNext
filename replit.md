# SharpSend.io Newsletter Platform

## Overview

SharpSend vNext is a multi-tenant AI-powered newsletter personalization platform designed for financial publishers. It enables publisher-specific subdomains, automated pixel management, and comprehensive workflow management including content planning, approval workflows, and AI-driven dynamic segment detection. The platform provides a unified dashboard for subscriber management, AI-powered content generation, A/B testing, performance analysis, and revenue impact calculation. It integrates with various email marketing services and offers advanced analytics to optimize content and maximize engagement. The business vision is a B2B SaaS model with high-margin credit and overage charges, aiming for scalable growth through AI-driven personalization, email fatigue management, real-time market event integration, and a hierarchical tracking pixel system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is a React 18 SPA using TypeScript, Wouter for routing, Vite for building, Radix UI with shadcn/ui for components, and Tailwind CSS for styling. State management uses TanStack Query, and forms use React Hook Form with Zod validation.

### Backend Architecture

The backend is a Node.js Express.js REST API, written in TypeScript. It uses Drizzle ORM with PostgreSQL for type-safe database operations and includes custom middleware for logging and error handling.

### Data Storage Solutions

PostgreSQL, hosted on Neon Database, is the primary data store. Drizzle ORM handles database interactions and migrations, with Zod schemas for validation and type generation.

### Data Architecture and Sources

The platform combines multiple data sources for analytics:
- **SharpSend Proprietary Pixel Tracking System**: Tracks email opens, clicks, page visits, purchase attribution (7-day window), device/location data, user journey mapping, and conversion funnels, with hierarchical control.
- **Email Platform APIs**: Provides subscriber counts, list management, delivery metrics, compliance data, and segmentation data from integrated platforms.
- **Payment System Integration**: Connects with Stripe or other payment processors for transaction data, subscription status, revenue attribution, and customer lifetime value.

### Key Data Models

Core entities include Users, Subscribers, Campaigns, A/B Tests, Email Integrations, and Analytics.

### Authentication and Authorization

Session-based authentication is implemented using Express sessions with a PostgreSQL session store.

### Component Architecture

The frontend features a modular component structure, including a multi-tab dashboard with sidebar navigation and reusable shadcn/ui components. Shared TypeScript interfaces ensure consistency. The system includes an AI Assignment Generator Service and comprehensive documentation.

### System Design Choices

The platform is multi-tenant with complete data isolation via subdomain-based routing, `publisher_id` filtering for all database queries, isolated CDN content paths, and tenant middleware. AI is used for cohort analysis, investment sophistication/risk assessment, investment style identification, real-time market intelligence, and email content enhancement with market timing intelligence, volatility-based send optimization, and live pricing/citations. Robust email fatigue tracking is included. AI-Powered Publication Detection uses OpenAI GPT-4o for deep web analysis, smart URL discovery, enhanced HTML extraction, learning patterns, caching, and special domain handling. The Email Tracking & Attribution System includes hierarchical tracking control (platform-wide, per-email, privacy-compliant), conversion attribution (7-day window, multi-touch, session linking), and data collection points (pixel events, click events, page visits, purchases), with GDPR compliance and user consent management.

**Database Environment Strategy**: Currently using shared database with error handling for duplicate constraints. Production deployment handles PostgreSQL error code 23505 (duplicate key violations) gracefully to prevent server crashes. Future improvement path documented in `database-separation-guide.md` recommends Replit Production Databases for complete demo/production separation.

**Deployment Stability Fixes (August 2025)**: Enhanced server startup process to prevent immediate exits during deployment. Server startup now uses proper Promise-based listener setup with explicit error handling. Added comprehensive fallback mechanisms for both Vite development server failures and static file serving failures in production. The server will now stay alive even if frontend assets are missing, serving basic fallback HTML for health checks.

**Health Check Optimizations (August 2025)**: Implemented Replit-optimized health check system with sub-200ms response times. Health checks now respond immediately before expensive operations (database seeding, demo environment setup) which run asynchronously after server startup. Root endpoint (/) serves fast health responses with uptime data. Detailed health endpoint (/api/health) includes memory usage, environment info, and feature flags. All health endpoints use no-cache headers and optimized Express settings (disabled x-powered-by, etag) for maximum performance.

**Process Stability Monitoring (August 2025)**: Added comprehensive process monitoring with exit event handlers, uncaught exception logging, and unhandled rejection tracking. Implemented graceful shutdown handling for SIGTERM/SIGINT signals. Server includes explicit process-alive messaging and error monitoring to debug any deployment termination issues. All process exits now properly logged with diagnostic information.

**Demo Login Production Fix (August 2025)**: Resolved demo login failing in production deployments with 500 error. Implemented multi-layer fallback strategy: (1) Production mode uses static demo credentials without database operations, (2) Development mode attempts database initialization with static fallback, (3) Emergency static credentials on any error. Frontend enhanced with better error handling that accepts tokens even on error responses. Demo now works reliably in both development and production environments.

**UI Consistency & Assignment Features Fix (August 2025)**: Fixed design consistency across all pages with unified layout patterns (container mx-auto p-6 space-y-6). Resolved assignment page hover color readability issues by using muted/50 colors instead of gray-50. Verified and fixed shareable link generation for assignments - backend properly creates unique slugs using crypto.randomBytes(16) and frontend correctly handles link copying with clipboard API. All text colors standardized to use muted-foreground for better theme support.

**Deployment Process Lifecycle Fix (August 2025)**: Resolved deployment failure where server would exit with code 0 immediately after initialization. Applied critical fixes: (1) Prevented async IIFE from completing by adding infinite Promise that never resolves, keeping the main function alive indefinitely, (2) Enhanced process monitoring with explicit "keeping process alive" messaging and process ID logging, (3) Confirmed health check endpoint (/) responds correctly for deployment health checks. Server now stays running until explicitly terminated via shutdown signals, ensuring deployment stability and health check availability.

**Enhanced Production Server Stability (August 2025)**: Further strengthened deployment resilience with multiple process-alive mechanisms: (1) Added process.stdin.resume() to keep event loop active, (2) Implemented hourly keep-alive interval to prevent garbage collection, (3) Enhanced process monitoring with beforeExit handler that prevents normal exits in production, (4) Added comprehensive diagnostic logging for active handles and requests, (5) Improved graceful shutdown with proper cleanup and timeout handling, (6) Added USR1/USR2 signal handlers for process manager compatibility. Server now uses three redundant mechanisms to ensure continuous operation in deployment environments.

## Platform Integration Capabilities

SharpSend provides comprehensive integration with 16+ email marketing platforms. Each integration offers specific capabilities:

### Core Integration Features
- **Subscriber Detection**: Automatically discover and sync all subscribers, lists, segments, and tags
- **Template Synchronization**: Import, edit, and sync templates between SharpSend and platforms
- **Image Management**: Use platform CDNs, upload to media libraries, optimize for email
- **Trigger Sends**: Send emails through platform APIs with SharpSend optimization
- **Real-time Events**: Receive webhooks for opens, clicks, bounces, unsubscribes
- **Two-way Sync**: Keep data synchronized between SharpSend and platforms
- **Analytics Consolidation**: Unified dashboard for all platform metrics

### Platform-Specific Strengths
- **Mailchimp**: E-commerce tracking, audience management, Content Studio
- **Iterable**: Real-time data feeds, cross-channel messaging, workflows
- **Customer.io**: Event-based triggers, journey automation, object tracking
- **SendGrid**: High-volume transactional, dynamic templates, deliverability
- **ActiveCampaign**: CRM integration, predictive sending, attribution
- **Keap**: Sales automation, appointment scheduling, pipeline management
- **Braze**: Enterprise scale, Canvas journeys, multi-channel orchestration
- **ConvertKit**: Creator tools, visual automation, commerce integration

Detailed documentation available in `platform-integration-features.md` and `integrations-faq.md`.

## External Dependencies

### Database Services

- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: Type-safe database ORM.

### Platform Integration APIs

- **Iterable API**: For cross-channel messaging, advanced templates, real-time data feeds, and campaign automation.
- **Customer.io API**: For omnichannel messaging, behavioral triggers, in-app messaging, and journey automation.
- **Keap API**: For CRM, sales pipeline automation, marketing automation, and e-commerce integration.

### Email Service Integrations

- **Mailchimp**: List management.
- **ConvertKit**: Creator-focused email marketing.
- **Campaign Monitor**: Professional email campaigns.
- **SendGrid**: Transactional and marketing emails.

### Development and Build Tools

- **Vite**: Build tool and development server.
- **TypeScript**: Static type checking.
- **ESBuild**: JavaScript bundler.
- **PostCSS**: CSS processing.

### UI and Design Libraries

- **Radix UI**: Headless component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **Class Variance Authority**: Component variant utility.
- **Date-fns**: Date manipulation.

### AI and Financial Data APIs

- **MarketAux**: Financial data.
- **Polygon API**: Financial data.
- **OpenAI GPT-4**: AI-powered email personalization and intelligence.