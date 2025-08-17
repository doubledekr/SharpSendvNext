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

### Data Architecture and Sources

The platform combines multiple data sources to provide comprehensive analytics:

#### **Pixel Tracking System (SharpSend Proprietary)**
The hierarchical email tracking pixel system provides:
- **Email Opens**: Direct tracking of when emails are opened, including multiple opens
- **Click Tracking**: Records which links are clicked within emails
- **Page Visits**: Tracks website activity following email opens (with session linking)
- **Purchase Attribution**: Connects purchases to specific email campaigns (7-day attribution window)
- **Device & Location Data**: Captures device types and geographic information
- **User Journey Mapping**: Full path from email open → website visit → purchase
- **Conversion Funnels**: Email sent → opened → clicked → visited → purchased

**Hierarchical Control Structure:**
1. Platform-wide toggle (master control for all emails)
2. Per-email overrides (disable tracking for specific emails)
3. Privacy-compliant mode (anonymized tracking option)

#### **Email Platform APIs (External Data)**
Connected platforms (Mailchimp, ConvertKit, SendGrid, etc.) provide:
- **Subscriber Counts**: Total active subscribers and list sizes
- **List Management**: New signups, unsubscribes, bounces
- **Delivery Metrics**: Sent, delivered, bounced, failed
- **Compliance Data**: Opt-in/opt-out status, GDPR compliance
- **Segmentation Data**: Tags, groups, custom fields

#### **Payment System Integration (Revenue Tracking)**
When connected to Stripe or payment processors:
- **Transaction Data**: Purchase amounts, products, timestamps
- **Subscription Status**: Active, cancelled, churned
- **Revenue Attribution**: Links revenue to email campaigns
- **Customer Lifetime Value**: Tracks total spend per subscriber

#### **Combined Analytics Dashboard**
The dashboard metrics come from these integrated sources:
- **Total Subscribers**: Email platform APIs
- **Engagement Rate**: Pixel data (opens/clicks) + Platform data (delivered)
- **Monthly Revenue**: Payment integration + Pixel attribution
- **Churn Rate**: Platform unsubscribes + Payment cancellations
- **Conversion Rate**: Pixel tracking (purchases/opens)

### Key Data Models

Core entities include Users, Subscribers, Campaigns, A/B Tests, Email Integrations, Analytics, and Email Images.

### Authentication and Authorization

Session-based authentication is implemented using Express sessions with a PostgreSQL session store (connect-pg-simple).

### Component Architecture

The frontend features a modular component structure, including a multi-tab dashboard with sidebar navigation, specialized tab components for functional areas, and reusable shadcn/ui components. Shared TypeScript interfaces ensure consistency between frontend and backend. The system also includes an AI Assignment Generator Service for market-triggered content creation and a comprehensive documentation system.

### System Design Choices

The platform is multi-tenant. It incorporates AI for cohort analysis, investment sophistication assessment, risk tolerance analysis, investment style identification, and real-time market intelligence. Email content is enhanced with market timing intelligence, volatility-based send optimization, and live pricing/citations. It features robust email fatigue tracking with dashboard monitoring and prevention features.

### Email Tracking & Attribution System

**Hierarchical Tracking Control:**
- Platform-wide master toggle for default tracking behavior
- Per-email override capability for granular control
- Privacy-compliant mode for anonymized tracking

**Conversion Attribution Features:**
- 7-day attribution window for purchase tracking
- Multi-touch attribution across email campaigns
- Session-based linking of email opens to website activity
- Full customer journey visualization

**Data Collection Points:**
1. **Pixel Events**: Opens, re-opens, device types, locations
2. **Click Events**: Link clicks with position and context
3. **Page Visits**: URL, duration, traffic source attribution
4. **Purchases**: Order ID, amount, products, email attribution

**Privacy & Compliance:**
- GDPR-compliant tracking options
- User consent management
- Anonymization capabilities
- Transparent tracking indicators

### Email Image Management System

**Image Upload & Storage:**
- Object storage integration for reliable image hosting
- Direct upload from file system with drag-and-drop support
- Base64 image conversion to hosted URLs
- Automatic image optimization for email delivery
- Public URL generation for email embedding

**Email Composer Features:**
- Rich text editor with WYSIWYG interface
- Image insertion via upload or URL
- Personalization token support ({{first_name}}, {{company}}, etc.)
- AI-powered content generation
- Segment-specific targeting
- Real-time preview capabilities

**Image Handling Methods:**
1. **Direct Upload**: Upload images to object storage via `/api/email-images/upload`
2. **URL Embedding**: Insert external images via URL reference
3. **Library Selection**: Choose from pre-uploaded image library
4. **Base64 Conversion**: Convert inline base64 images to hosted URLs

**Technical Implementation:**
- Frontend: EmailImageUploader and EmailComposer components
- Backend: Object storage service with signed URL generation
- Image serving: CDN-ready with proper caching headers
- Format support: PNG, JPG, GIF up to 10MB

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