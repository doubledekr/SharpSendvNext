## Overview

SharpSend is a multi-tenant AI-powered newsletter personalization platform designed for financial publishers. It offers publisher-specific subdomains, automated pixel management, and comprehensive workflow tools for content planning and approvals. The platform provides a unified dashboard for subscriber management, AI-powered content generation, A/B testing, performance analysis, and revenue impact calculation. It integrates with various email marketing services and uses advanced analytics to optimize content and engagement. The business vision is a B2B SaaS model aiming for scalable growth through AI-driven personalization, email fatigue management, real-time market event integration, and a hierarchical tracking pixel system. It includes advanced email intelligence features like a Smart Pixel Engine with context-aware tracking and behavioral predictions, an AI-powered segmentation engine, and a real-time behavioral intelligence loop.

## Recent Changes (January 2025 - Latest Updates)
- Enhanced market sentiment component to allow creating assignments directly from opportunities
- Added "Create Assignment" functionality to all proactive campaign suggestions
- Implemented clickable news headlines and external link buttons for article access
- Added tooltips and improved UX for opening referenced news articles
- Integrated assignment creation dialog with market context preservation
- Fixed AI-detected segments to only show for demo accounts (demo-user-id)
- Removed local mock data from auto-segmentation component - now uses only API data
- Fixed `/api/segments` endpoint in routes-segments.ts to return empty array for all accounts
- Removed duplicate segmentsRoutes mounting in server/routes.ts to prevent routing conflicts
- All segment-related endpoints now properly return empty data for non-demo accounts
- Added clickable links to market intelligence dashboard news articles with external link icons
- Removed "vNext" from all SharpSend branding across the platform (navigation, onboarding, documentation)
- Created `/api/market-news` endpoint that fetches real news from MarketAux API when configured
- Updated Market Sentiment and Market Intelligence Dashboard components to fetch news from API endpoint
- Fixed MarketAux API integration by removing problematic date parameter - now successfully fetches real-time financial news
- News articles now display actual MarketAux data with working article URLs when API keys are configured
- System properly handles missing API keys and provides graceful fallback behavior
- Successfully integrated real-time news feed showing articles from sources like pymnts.com, argaam.com, businessinsider.com
- Fixed critical assignment creation bug by adding auto-generated UUID defaults to assignments table
- Implemented complete assignment review workflow with approval requests automatically created when status changes to "review"
- Enhanced approvals system to sync assignment status when approved/rejected through review queue
- Added publisher-specific CDN access control ensuring proper multi-tenant isolation for image assets
- **Implemented real URL content analysis with OpenAI integration** - System now fetches actual article content, analyzes it with AI, and generates tailored assignment suggestions based on specific article details rather than generic templates
- Enhanced web scraping with robust error handling and intelligent fallbacks using URL structure analysis
- Fixed character length constraints for assignment angle (max 120 chars) and objective (max 150 chars) fields
- **RESOLVED assignment workflow issues** - Fixed PATCH route for assignment updates to work for both authenticated publisher access and shareable link copywriter access, ensuring proper assignment status transitions from creation to review queue
- **Enhanced Assignment Creation Workflow (5-Step Process)** - Upgraded assignment creation from 3 to 5 steps:
  - Step 1: Core Content (Title, Objective, Angle)
  - Step 2: Content Details (Key Points, CTA)
  - Step 3: Target Segments (NEW) - Select audience segments with subscriber counts
  - Step 4: Collaboration & Review (NEW) - Assign reviewers with roles and deadlines
  - Step 5: Project Settings (Type, Priority, Due Date)
- **Unified Assignment-to-Broadcast Pipeline** - Integrated complete workflow from assignment creation to broadcast management
- **Enhanced Dashboard with Status Overview** - Added 5-stage status cards (Draft, In Review, Approved, Queued, Sent) with color-coded indicators
- **Database Schema Updates** - Added enhanced workflow fields: targetSegments, emailPlatform, reviewers, reviewDeadline, reviewNotes, autoGenerateVariations, workflowStage, progressPercentage, broadcastSettings
- **Automatic Review Workflow** - When reviewers are assigned, assignments automatically move to "In Review" status with progress tracking

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is a React 18 SPA using TypeScript, Wouter for routing, Vite for building, Radix UI with shadcn/ui for components, and Tailwind CSS for styling. State management uses TanStack Query, and forms use React Hook Form with Zod validation.

### Backend

The backend is a Node.js Express.js REST API, written in TypeScript. It utilizes Drizzle ORM with PostgreSQL for type-safe database operations and includes custom middleware for logging and error handling. Key backend services include the Smart Pixel Engine, Segmentation Engine, and Intelligence Loop for AI-powered features.

### Data Storage

PostgreSQL, hosted on Neon Database, is the primary data store. Drizzle ORM handles database interactions and migrations, with Zod schemas for validation and type generation.

### Data Architecture

The platform integrates data from its proprietary pixel tracking system (tracking opens, clicks, page visits, purchases, device/location data), email platform APIs (subscriber counts, metrics), and payment system integrations (transaction data, revenue attribution). Core data models include Users, Subscribers, Campaigns, A/B Tests, Email Integrations, and Analytics. SharpSend Intelligence models capture pixel events, behavioral predictions, segment definitions, and mappings.

### Authentication and Authorization

Session-based authentication is implemented using Express sessions with a PostgreSQL session store.

### Component Architecture

The frontend features a modular component structure with a multi-tab dashboard and reusable shadcn/ui components. The system includes an AI Assignment Generator Service.

### System Design Choices

The platform is multi-tenant with complete data isolation via subdomain-based routing, `publisher_id` filtering, isolated CDN paths, and tenant middleware. AI is used for cohort analysis, investment assessment, market intelligence, email content enhancement, volatility-based send optimization, live pricing, and email fatigue tracking. AI-Powered Publication Detection uses OpenAI GPT-4o for deep web analysis and content extraction. The Email Tracking & Attribution System includes hierarchical tracking control, conversion attribution, and GDPR compliance. A robust database environment strategy is in place with graceful error handling for duplicate constraints. The system has enhanced server startup processes, optimized health checks (sub-200ms response times), comprehensive process stability monitoring, and reliable demo login functionality across environments. UI consistency is maintained with standardized layouts and theme-aware components, and shareable link generation for assignments is robust.

### Platform Integration Capabilities

SharpSend integrates with 16+ email marketing platforms, offering core features like subscriber detection, template synchronization, image management, email sending, real-time event webhooks, two-way data sync, and analytics consolidation. Platform-specific strengths are leveraged for integrations (e.g., Mailchimp for e-commerce tracking, Iterable for real-time data feeds).

## External Dependencies

### Database Services

- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: Type-safe database ORM.

### Platform Integration APIs

- **Iterable API**: Cross-channel messaging, advanced templates.
- **Customer.io API**: Omnichannel messaging, behavioral triggers.
- **Keap API**: CRM, sales pipeline automation.

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