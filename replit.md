# SharpSend.io Newsletter Platform

## Overview

SharpSend.io is an AI-powered newsletter personalization platform designed specifically for financial publishers. The application provides comprehensive dashboard functionality for managing subscribers, creating personalized content with AI, running A/B tests, analyzing campaign performance, and calculating revenue impact. The platform integrates with various email marketing services and offers advanced analytics to help financial newsletter publishers optimize their content and maximize subscriber engagement.

## User Preferences

Preferred communication style: Simple, everyday language.

## Pricing Strategy
B2B SaaS pricing with high-margin credit system:
- Starter: $99/month (2 cohorts, 1K emails, $0.15 overage)
- Professional: $299/month (5 cohorts, 5K emails, $0.12 overage)  
- Enterprise: $799/month (unlimited cohorts, 20K emails, $0.08 overage)
- Revenue focus on overage charges for scalable growth

## Recent Changes

**August 16, 2025 - Complete Platform Enhancement with Internal Dashboard**
- **Navigation & Organization Updates: COMPLETED**
  - ✅ Added Internal System dashboard to sidebar navigation  
  - ✅ Moved Email Platform Status to Email Integration submenu
  - ✅ Added Documentation/API/FAQ section at bottom of sidebar
  - ✅ Removed Email Platforms from top navigation bar
  
- **Internal SharpSend Dashboard: COMPLETED**
  - ✅ Segment categorization and management interface
  - ✅ User viewing and tracking system
  - ✅ Past and pending email sends monitoring
  - ✅ Email/event trigger management
  - ✅ Send status tracking with detailed logs
  
- **AI Assignment Generator Service: COMPLETED**
  - ✅ Market trigger to assignment link generation
  - ✅ AI-powered email creation when copywriters unavailable
  - ✅ Segment-specific variation generation
  - ✅ Assignment urgency calculation and tracking
  - ✅ Draft-to-variation adaptation system
  
- **Documentation System: COMPLETED**
  - ✅ Comprehensive Quick Start guide
  - ✅ API Reference with code examples
  - ✅ Platform capabilities matrix
  - ✅ FAQ and troubleshooting resources
  - ✅ Copy-to-clipboard functionality for code snippets
  
- **Email Variations Styling: ENHANCED**
  - ✅ Boxed variation display with color coding
  - ✅ Segment-specific visual identification
  - ✅ Performance prediction metrics
  - ✅ Interactive preview and edit capabilities
  - ✅ Copy, preview, and edit actions per variation

**August 16, 2025 - SharpSend Strategic Alignment Completed**
- **Phase 1 Core Intelligence Infrastructure: COMPLETED**
  - ✅ Fixed cohort detection service with sophisticated behavioral pattern recognition
  - ✅ Implemented investment sophistication assessment (beginner → professional)  
  - ✅ Built risk tolerance analysis (conservative → aggressive)
  - ✅ Added investment style identification (value, growth, income, trading)
  - ✅ Created market intelligence service with real-time financial context integration
  - ✅ Verified APIs working: Cohort Analysis, Market Context, Churn Prediction

- **Phase 2 Email Sharpening Engine: COMPLETED**
  - ✅ Enhanced AI personalization with financial content-specific prompts
  - ✅ Implemented cohort-specific content adaptation for all investor types
  - ✅ Built performance prediction and optimization algorithms
  - ✅ Created comprehensive email sharpening API with OpenAI integration

- **Phase 3 Advanced Dashboard: COMPLETED**
  - ✅ Built sophisticated Cohort Intelligence Dashboard with real-time analysis
  - ✅ Integrated Editorial Workflow with cohort targeting and AI suggestions
  - ✅ Created SharpSend Intelligence main page with comprehensive analytics
  - ✅ Implemented churn risk prediction with intervention recommendations

- **Phase 4 Financial Publisher Specialization: COMPLETED**
  - ✅ Market timing intelligence with volatility-based send optimization
  - ✅ Content emphasis recommendations based on market sentiment
  - ✅ Real-time market alerts and proactive content opportunities
  - ✅ Email content enhancement with live pricing and citations
  - ✅ Publisher intelligence dashboard with sector performance tracking

- **Technical Architecture Enhancements**
  - ✅ Multi-tenant platform with PostgreSQL database
  - ✅ MarketAux and Polygon API integrations for financial data
  - ✅ OpenAI GPT-4 integration for sophisticated email personalization
  - ✅ Demo authentication: demo@sharpsend.com / demo123
  - ✅ All core services validated and functioning
  - ✅ Publisher Intelligence Service with proactive market monitoring
  - ✅ Market Alert Service with real-time event detection
  - ✅ Content Enhancement Engine with live data integration

## System Architecture

### Frontend Architecture

The frontend is built as a React Single Page Application (SPA) using modern development tools:

- **Framework**: React 18 with TypeScript for type safety and better developer experience
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation for type-safe forms

### Backend Architecture

The backend follows a REST API architecture pattern:

- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **API Design**: RESTful endpoints organized by resource (subscribers, campaigns, A/B tests, etc.)
- **Middleware**: Custom logging and error handling middleware
- **Development**: Hot module replacement with Vite integration for seamless development experience

### Data Storage Solutions

The application uses PostgreSQL as the primary database:

- **Database**: PostgreSQL via Neon Database serverless platform
- **ORM**: Drizzle ORM for type-safe database queries and migrations
- **Schema Management**: Centralized schema definitions in shared directory for frontend/backend consistency
- **Validation**: Zod schemas for runtime validation and type generation
- **Migration Strategy**: Drizzle Kit for database schema migrations

### Key Data Models

The platform manages several core entities:

- **Users**: Authentication and authorization
- **Subscribers**: Newsletter subscriber management with segmentation
- **Campaigns**: Email campaign tracking and analytics
- **A/B Tests**: Testing framework for campaign optimization
- **Email Integrations**: Third-party email service provider connections
- **Analytics**: Performance metrics and engagement tracking

### Authentication and Authorization

The application implements session-based authentication:

- **Session Management**: Express sessions with PostgreSQL session store
- **Session Storage**: connect-pg-simple for persistent session storage
- **Security**: Secure session configuration with proper cookie settings

### Component Architecture

The frontend is organized into a modular component structure:

- **Dashboard Structure**: Multi-tab dashboard with sidebar navigation
- **Tab Components**: Specialized components for each functional area (Overview, Subscribers, Personalization, Analytics, A/B Testing, Revenue, Email Integration, Advanced Features)
- **UI Components**: Reusable shadcn/ui components for consistent design
- **Shared Types**: TypeScript interfaces shared between frontend and backend

## External Dependencies

### Database Services

- **Neon Database**: Serverless PostgreSQL hosting platform for scalable database management
- **Drizzle ORM**: Type-safe database ORM for PostgreSQL operations

### Email Service Integrations

The platform supports integration with major email marketing providers:

- **Mailchimp**: Popular email marketing platform integration
- **ConvertKit**: Creator-focused email marketing service
- **Campaign Monitor**: Enterprise email marketing solution
- **SendGrid**: Transactional and marketing email service

### Development and Build Tools

- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking for JavaScript
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS compilation

### UI and Design Libraries

- **Radix UI**: Headless, accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for creating component variants
- **Date-fns**: Date manipulation and formatting library

### Development Environment

- **Replit Integration**: Platform optimized for Replit development environment
- **Hot Module Replacement**: Development server with instant code updates
- **Runtime Error Handling**: Enhanced error overlays for development debugging

### AI and Analytics

The platform is designed to integrate with AI services for content personalization and analytics processing, though specific AI service integrations are implemented at the API level rather than as direct frontend dependencies.