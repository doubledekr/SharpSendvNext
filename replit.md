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