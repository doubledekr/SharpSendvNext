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

Core entities include Users, Subscribers, Campaigns, A/B Tests, Email Integrations, and Analytics.

### Authentication and Authorization

Session-based authentication is implemented using Express sessions with a PostgreSQL session store (connect-pg-simple).

### Component Architecture

The frontend features a modular component structure, including a multi-tab dashboard with sidebar navigation, specialized tab components for functional areas, and reusable shadcn/ui components. Shared TypeScript interfaces ensure consistency between frontend and backend. The system also includes an AI Assignment Generator Service for market-triggered content creation and a comprehensive documentation system.

### System Design Choices

The platform is multi-tenant with complete data isolation. It incorporates AI for cohort analysis, investment sophistication assessment, risk tolerance analysis, investment style identification, and real-time market intelligence. Email content is enhanced with market timing intelligence, volatility-based send optimization, and live pricing/citations. It features robust email fatigue tracking with dashboard monitoring and prevention features.

**AI-Powered Publication Detection:**
- **Deep Web Analysis**: Uses OpenAI GPT-4o to analyze multiple pages from publisher websites
- **Smart URL Discovery**: Automatically checks common patterns (/premium-newsletters, /editors, /team, /contributors)
- **Enhanced HTML Extraction**: Identifies newsletters, publications, and editors from HTML structure
- **Learning Patterns**: Stores successful detection patterns for continuous improvement
- **Caching System**: Ensures consistent results for repeated domain queries
- **Special Domain Handling**: Pre-configured accurate data for known publishers (investorsalley.com, porterandcompanyresearch.com)

**Multi-Tenant Architecture:**
- **Subdomain-based routing**: Each publisher has their own subdomain (e.g., demo.sharpsend.io, publish.sharpsend.io)
- **Complete data isolation**: All database queries filter by publisher_id to ensure tenant data separation
- **CDN content isolation**: Each publisher's assets are stored in isolated paths (publishers/{publisherId}/assets)
- **Tenant middleware**: Automatically loads publisher context based on subdomain for all API requests
- **Isolated storage paths**: Images, templates, and all CDN content are stored in tenant-specific directories to prevent data intermingling

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

## Recent Improvements & Lessons Learned

### Publication Detection Enhancement (January 2025)
- **Issue**: Inconsistent detection results for publisher domains
- **Solution**: Enhanced AI-powered detection with multi-page scraping
- **Key Learnings**:
  - Publisher sites often have dedicated /premium-newsletters and /editors pages
  - Newsletter names follow patterns: Letter, Report, Alert, Advisory, Intelligence
  - Editor pages contain structured data with names, roles, and expertise
  - Caching is essential for consistent results
  - Domain-specific configurations improve accuracy for known publishers

## External Dependencies

### Database Services

- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: Type-safe database ORM.

### Platform Integration APIs

#### Iterable API Integration
- **Base URLs**: 
  - US: `https://api.iterable.com/api`
  - EU: `https://api.eu.iterable.com/api`
- **Authentication**: API Key-based
- **Rate Limits**: Standard REST API limits with token bucket
- **Key Features**:
  - Cross-channel messaging (email, SMS, push, in-app)
  - Advanced template system with handlebars logic
  - Real-time data feeds for personalization
  - Campaign automation and triggered messages
  - CDN asset management and optimization
  - Message channel management
  - Comprehensive analytics and reporting

#### Customer.io API Integration
- **Base URLs**:
  - Track API: `https://track-{region}.customer.io/api/v1`
  - App API: `https://api.customer.io/v1/send` (US) / `https://api-eu.customer.io/v1/send` (EU)
  - CDP API: `https://cdp.customer.io/v1` (US) / `https://cdp-eu.customer.io/v1` (EU)
- **Authentication**: Basic Auth (Track/CDP) and Bearer Token (App)
- **Rate Limits**: 100/sec (Track), 10/sec (App), 1/10sec (Broadcasts)
- **Key Features**:
  - Three specialized APIs for different use cases
  - In-app messaging with modals, banners, and inline content
  - Behavioral trigger automation
  - Journey and workflow management
  - Real-time event tracking and segmentation
  - Transactional and broadcast messaging
  - Data pipeline integration

#### Keap API Integration
- **Base URL**: `https://api.infusionsoft.com/crm/rest/v1`
- **Authentication**: OAuth 2.0 with token refresh (24-hour expiration)
- **Rate Limits**: Token-based system (10,000 tokens, 1 per call, 500ms restoration)
- **Key Features**:
  - Complete CRM with contact and lead management
  - Sales pipeline automation and opportunity tracking
  - Marketing automation and email campaigns
  - E-commerce integration with order processing
  - Custom field management and tagging system
  - Webhook support for real-time notifications
  - Reporting and analytics dashboard integration

### Email Service Integrations

#### Traditional Email Platforms
- **Mailchimp**: List management and basic automation
- **ConvertKit**: Creator-focused email marketing
- **Campaign Monitor**: Professional email campaigns
- **SendGrid**: Transactional and marketing emails

#### Advanced Cross-Channel Platforms
- **Iterable**: AI-powered cross-channel communication platform with sophisticated templates, real-time data feeds, CDN integration, and omnichannel messaging (email, SMS, push, in-app)
- **Customer.io**: Omnichannel messaging platform with behavioral triggers, in-app messaging, journey automation, and three specialized APIs (Pipelines, Track, App)
- **Keap**: Comprehensive CRM/CMS platform with contact management, sales pipeline automation, e-commerce integration, and marketing automation workflows

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

## Platform Integration Documentation

### Comprehensive Integration Support
The platform now includes full documentation and support for three advanced integration platforms:

- **API Reference**: `platform-integrations-api-reference.md` - Complete API documentation with endpoints, authentication, and example requests
- **FAQ Guide**: `platform-integrations-faq.md` - Frequently asked questions about platform capabilities, setup, and troubleshooting
- **Help Documentation**: `platform-integrations-help.md` - Step-by-step setup guides, configuration instructions, and best practices

### Platform Capability Matrix

| Feature | Iterable | Customer.io | Keap |
|---------|----------|-------------|------|
| Cross-Channel Messaging | ✅ | ✅ | ❌ |
| Advanced Templates | ✅ | ✅ | ✅ |
| Marketing Automation | ✅ | ✅ | ✅ |
| In-App Messaging | ✅ | ✅ | ❌ |
| CRM Functionality | ❌ | ❌ | ✅ |
| E-commerce Integration | ❌ | ❌ | ✅ |
| Real-Time Data Feeds | ✅ | ✅ | ❌ |
| Behavioral Triggers | ✅ | ✅ | ✅ |
| Sales Pipeline | ❌ | ❌ | ✅ |
| SMS/Push Notifications | ✅ | ✅ | ❌ |

### Integration Benefits for Financial Publishers

**Enhanced Personalization**: 
- Real-time market data integration through Iterable data feeds
- Behavioral triggers based on portfolio performance (Customer.io)
- CRM integration for subscriber lifecycle management (Keap)

**Cross-Channel Coordination**:
- Send market alerts via email, SMS, and push simultaneously
- In-app messages for real-time portfolio updates
- Coordinated campaigns across all communication channels

**Advanced Automation**:
- Trigger campaigns based on market events and volatility
- Automate follow-ups based on subscriber engagement patterns
- Sales pipeline automation for premium subscription conversions