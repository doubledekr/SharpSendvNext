# SharpSend.io Newsletter Platform

## Overview

SharpSend.io is an AI-powered newsletter personalization platform built for financial publishers. It offers a comprehensive dashboard for managing subscribers, generating personalized content with AI, conducting A/B tests, analyzing campaign performance, and calculating revenue impact. The platform integrates with various email marketing services and provides advanced analytics to optimize content and maximize subscriber engagement. Its business vision includes a B2B SaaS pricing model with high-margin credit and overage charges, aiming for scalable growth. Key capabilities include AI-driven email personalization based on market sentiment, email fatigue management, real-time market event integration, and a hierarchical tracking pixel system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is a React 18 SPA utilizing TypeScript. It uses Wouter for routing, Vite for building, Radix UI with shadcn/ui for components, and Tailwind CSS for styling. State management is handled by TanStack Query, and forms use React Hook Form with Zod validation.

### Backend Architecture

The backend is a Node.js Express.js REST API, written in TypeScript. It uses Drizzle ORM with PostgreSQL for type-safe database operations and includes custom middleware for logging and error handling.

### Data Storage Solutions

PostgreSQL, hosted on Neon Database, serves as the primary data store. Drizzle ORM is used for database interactions and migrations, with Zod schemas for validation and type generation.

### Key Data Models

Core entities include Users, Subscribers, Campaigns, A/B Tests, Email Integrations, and Analytics.

### Authentication and Authorization

Session-based authentication is implemented using Express sessions with a PostgreSQL session store (connect-pg-simple).

### Component Architecture

The frontend features a modular component structure, including a multi-tab dashboard with sidebar navigation, specialized tab components for functional areas, and reusable shadcn/ui components. Shared TypeScript interfaces ensure consistency between frontend and backend. The system also includes an AI Assignment Generator Service for market-triggered content creation and a comprehensive documentation system.

### System Design Choices

The platform is multi-tenant. It incorporates AI for cohort analysis, investment sophistication assessment, risk tolerance analysis, investment style identification, and real-time market intelligence. Email content is enhanced with market timing intelligence, volatility-based send optimization, and live pricing/citations. It features robust email fatigue tracking with dashboard monitoring and prevention features, and an optional, privacy-compliant email tracking pixel system with hierarchical control.

## External Dependencies

### Database Services

- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: Type-safe database ORM.

### Email Service Integrations

- **Mailchimp**
- **ConvertKit**
- **Campaign Monitor**
- **SendGrid**

### Development and Build Tools

- **Vite**: Build tool and development server.
- **TypeScript**: Static type checking.
- **ESBuild**: JavaScript bundler.
- **PostCSS**: CSS processing.

### UI and Design Libraries

- **Radix UI**: Headless, accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **Class Variance Authority**: Component variant utility.
- **Date-fns**: Date manipulation.

### AI and Financial Data APIs

- **MarketAux**: For financial data.
- **Polygon API**: For financial data.
- **OpenAI GPT-4**: For AI-powered email personalization and intelligence.