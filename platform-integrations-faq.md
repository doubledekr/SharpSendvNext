# Platform Integrations FAQ

## General Questions

### What platforms does SharpSend integrate with?

SharpSend integrates with three categories of platforms:

**Traditional Email Platforms:**
- Mailchimp (list management and basic automation)
- ConvertKit (creator-focused email marketing)
- Campaign Monitor (professional email campaigns)
- SendGrid (transactional and marketing emails)

**Advanced Cross-Channel Platforms:**
- **Iterable** - AI-powered cross-channel communication
- **Customer.io** - Omnichannel messaging with behavioral triggers
- **Keap** - Comprehensive CRM/CMS with sales automation

### How do I choose the right platform for my needs?

**Choose Iterable if you need:**
- Cross-channel messaging (email, SMS, push, in-app)
- Advanced template personalization with real-time data
- Sophisticated campaign automation
- CDN integration for optimized assets

**Choose Customer.io if you need:**
- Behavioral trigger automation
- In-app messaging capabilities
- Journey-based marketing workflows
- Real-time event tracking

**Choose Keap if you need:**
- Complete CRM functionality
- Sales pipeline management
- E-commerce integration
- Lead scoring and management

### Can I use multiple platforms simultaneously?

Yes! SharpSend supports multiple platform integrations. You can use different platforms for different purposes:
- Use Keap for CRM and lead management
- Use Iterable for cross-channel campaigns
- Use traditional platforms for specific newsletter segments

## Iterable Integration

### What makes Iterable different from other email platforms?

Iterable offers several advanced features:
- **Cross-channel messaging**: Send coordinated campaigns across email, SMS, push, and in-app
- **Real-time data feeds**: Pull live data from your APIs for personalization
- **Advanced templates**: Use handlebars logic for complex conditional content
- **CDN integration**: Optimized asset delivery and management

### How do data feeds work in Iterable?

Data feeds allow you to pull fresh data from external APIs at send time:
- Configure HTTP endpoints that return JSON, XML, RSS, or Atom data
- Data is cached for up to 1 hour for performance
- Use the data in templates with handlebars syntax
- Perfect for real-time pricing, inventory, or market data

### What are message channels in Iterable?

Message channels combine a communication medium (email, SMS, push) with a marketing/transactional designation. This gives you fine-grained control over:
- User subscription preferences
- Message delivery optimization
- Compliance and opt-out management

## Customer.io Integration

### What are the three Customer.io APIs?

Customer.io provides three specialized APIs:

1. **Track API**: For identifying users and tracking behavioral events
2. **App API**: For sending transactional messages and managing campaigns
3. **CDP API**: For data pipeline integration and object management

### How does in-app messaging work?

Customer.io's in-app messaging allows you to:
- Display modals, banners, and inline messages within your website/app
- Target messages based on user behavior and page rules
- Track engagement and conversion metrics
- Use liquid templating for personalization

### What are journeys in Customer.io?

Journeys are automated workflows that trigger based on:
- User actions (signups, purchases, page visits)
- Time-based rules (delays, scheduling)
- Segment membership changes
- Custom events from your application

## Keap Integration

### Why does Keap require OAuth 2.0?

Keap uses OAuth 2.0 for enhanced security:
- More secure than API keys
- Tokens expire every 24 hours for security
- Automatic token refresh prevents downtime
- Granular permission control

### How does the token refresh work?

SharpSend automatically handles token refresh:
- Access tokens expire every 24 hours
- Refresh tokens are used to get new access tokens
- The process happens automatically in the background
- You'll only need to re-authenticate if the refresh token expires

### What CRM features are available through the integration?

The Keap integration provides:
- **Contact Management**: Create, update, and organize contacts
- **Lead Scoring**: Automatic lead qualification and routing
- **Sales Pipeline**: Opportunity tracking and stage management
- **Marketing Automation**: Email sequences and follow-ups
- **E-commerce**: Order processing and payment tracking
- **Custom Fields**: Flexible data collection and organization

## Technical Questions

### How do I get API credentials for each platform?

**Iterable:**
1. Log into your Iterable account
2. Go to Integrations > API Keys
3. Create a new API key with appropriate permissions
4. Note your data center region (US or EU)

**Customer.io:**
1. Navigate to Settings > API Credentials
2. Copy your Site ID and API Key
3. For web tracking, also copy the Tracking Key
4. Ensure you have the correct region selected

**Keap:**
1. Go to the Keap Developer Portal
2. Create a new application
3. Configure OAuth 2.0 settings with your redirect URI
4. Get your Client ID and Client Secret
5. Complete OAuth flow to get access/refresh tokens

### What are the rate limits for each platform?

**Iterable:**
- Standard REST API limits
- Uses token bucket system
- Rate limits vary by endpoint and account type

**Customer.io:**
- Track API: 100 requests/second
- App API: 10 requests/second (general), 100/second (transactional)
- Broadcast API: 1 request per 10 seconds

**Keap:**
- Token-based system: 10,000 tokens per application
- 1 token consumed per API call
- 1 token restored every 500ms when idle

### How do I troubleshoot connection issues?

1. **Verify Credentials**: Use the test connection endpoint before saving
2. **Check Regions**: Ensure you're using the correct regional endpoint
3. **Review Permissions**: Verify your API keys have sufficient permissions
4. **Monitor Rate Limits**: Check if you're hitting rate limits
5. **Check Logs**: Review the lastError field in the integration record

### Can I sync historical data?

**Iterable**: Yes, you can import historical contacts and events through the API

**Customer.io**: Yes, you can backfill user data and events with timestamps

**Keap**: Yes, you can import contacts, opportunities, and historical transactions

### How do webhooks work with these platforms?

**Iterable**: Supports webhooks for campaign events, user updates, and list changes

**Customer.io**: Provides webhooks for message delivery, user actions, and campaign events

**Keap**: Offers webhooks for contact updates, form submissions, and sales events

Configure webhook URLs in each platform to receive real-time notifications in SharpSend.

## Billing and Usage

### Are there additional costs for these integrations?

The integrations themselves are included with your SharpSend subscription. However:
- Each platform may have its own pricing based on usage
- API call volumes may affect your platform costs
- Some features may require higher-tier plans on the integrated platforms

### How is usage tracked?

SharpSend tracks:
- Number of API calls made to each platform
- Sync frequency and data volume
- Last successful sync timestamps
- Error rates and response times

This information is available in your integration dashboard for monitoring and optimization.