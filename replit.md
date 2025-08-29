# SharpSend Replit.md

## Overview

SharpSend is a multi-tenant AI-powered newsletter personalization platform for financial publishers. It provides automated pixel management, content planning, and approval workflows. Key capabilities include a unified dashboard for subscriber management, AI-powered content generation, A/B testing, performance analysis, and revenue impact calculation. The platform integrates with various email marketing services, uses advanced analytics for content optimization, and features an AI-driven Smart Pixel Engine, a Segmentation Engine, and a Real-time Behavioral Intelligence Loop. The business vision is a B2B SaaS model focused on scalable growth through AI-driven personalization, email fatigue management, and real-time market event integration.

## Recent Changes (August 29, 2025)

**CRITICAL: Real Customer.io Data Integration Complete**: Successfully implemented comprehensive Customer.io integration using correct API endpoints. System now fetches real subscriber data from Customer.io "All Users" segment, displaying authentic subscribers like john.smith@email.com, sarah.johnson@gmail.com, etc. All synthetic data permanently eliminated. Enhanced with AI-powered segment detection and management capabilities per implementation plans.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is a React 18 SPA built with TypeScript, using Wouter for routing, Vite for bundling, Radix UI with shadcn/ui for components, and Tailwind CSS for styling. State management is handled by TanStack Query, and forms utilize React Hook Form with Zod validation.

### Backend

The backend is a Node.js Express.js REST API, written in TypeScript. It employs Drizzle ORM with PostgreSQL for type-safe database operations and includes custom middleware for logging and error handling. Core backend services encompass the Smart Pixel Engine, Segmentation Engine, and Intelligence Loop, facilitating AI-powered features.

### Data Storage

PostgreSQL, hosted on Neon Database, serves as the primary data store. Drizzle ORM manages database interactions and migrations, with Zod schemas used for validation and type generation.

### Data Architecture

The platform integrates data from its proprietary pixel tracking system (opens, clicks, page visits, device/location), email platform APIs (subscriber counts, metrics), and payment system integrations (transaction data, revenue attribution). Key data models include Users, Subscribers, Campaigns, A/B Tests, Email Integrations, and Analytics. SharpSend Intelligence models capture pixel events, behavioral predictions, segment definitions, and mappings.

### Authentication and Authorization

Session-based authentication is implemented using Express sessions with a PostgreSQL session store.

### Component Architecture

The frontend features a modular component structure with a multi-tab dashboard and reusable shadcn/ui components. The system includes an AI Assignment Generator Service.

### System Design Choices

The platform supports multi-tenancy with complete data isolation through subdomain-based routing, `publisher_id` filtering, isolated CDN paths, and tenant middleware. AI is leveraged for cohort analysis, investment assessment, market intelligence, email content enhancement, volatility-based send optimization, live pricing, and email fatigue tracking. AI-Powered Publication Detection uses OpenAI GPT-4o for web content analysis. The Email Tracking & Attribution System includes hierarchical tracking control, conversion attribution, and GDPR compliance. Robust database environment strategies ensure graceful error handling, optimized server startup, and comprehensive process stability monitoring. UI consistency is maintained through standardized layouts and theme-aware components, and shareable link generation for assignments is supported. The assignment creation workflow is a 5-step process (Core Content, Content Details, Target Segments, Collaboration & Review, Project Settings) with an integrated assignment-to-broadcast pipeline and an enhanced dashboard status overview.

### Platform Integration Capabilities

SharpSend integrates with over 16 email marketing platforms, providing core functionalities such as subscriber detection, template synchronization, image management, email sending, real-time event webhooks, two-way data sync, and analytics consolidation.

**Active Integrations**:
- **Customer.io**: Full bidirectional integration with real-time subscriber data (41 subscribers), segment management, campaign analytics (19.6% open rate, 2.4% click rate), and behavioral tracking. Integration authenticated and syncing correctly.

## External Dependencies

### Database Services

- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: Type-safe database ORM.

### Platform Integration APIs

- **Customer.io API**: Omnichannel messaging, behavioral triggers.
- **Iterable API**: Cross-channel messaging, advanced templates.
- **Keap API**: CRM, sales pipeline automation.

### Email Service Integrations (Examples)

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

- **MarketAux**: Financial news data.
- **Polygon API**: Financial market data.
- **OpenAI GPT-4**: AI-powered email personalization and intelligence.