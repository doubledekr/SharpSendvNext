# SharpSend Integration Features - Frequently Asked Questions

## General Integration Questions

### Q: What can SharpSend do once I connect my email platform?
**A:** When you connect your email platform, SharpSend can:
- **Detect and import** all your existing subscribers, lists, segments, and tags
- **Sync templates** from your platform and use them in SharpSend campaigns  
- **Trigger sends** through your platform using SharpSend's AI optimization
- **Track engagement** with unified analytics across all your platforms
- **Upload images** to your platform's CDN or media library
- **Update subscriber data** bi-directionally between systems
- **Receive real-time events** like opens, clicks, and unsubscribes
- **Run A/B tests** using your platform's sending infrastructure

### Q: Do I need to migrate my subscribers to SharpSend?
**A:** No! SharpSend works with your existing subscriber base. We:
- Never move or duplicate your subscribers
- Keep all data in sync with your platform
- Respect your existing unsubscribe lists
- Maintain platform-specific preferences

### Q: Can I use templates from my email platform?
**A:** Yes! SharpSend can:
- Import all existing templates from your platform
- Detect merge tags and variables automatically
- Let you edit templates with our AI enhancement
- Push updated templates back to your platform
- Maintain template version history

### Q: How does image handling work?
**A:** SharpSend intelligently manages images by:
- Using your platform's CDN for image hosting
- Accessing existing images from your media library
- Uploading new images through platform APIs
- Optimizing images for email delivery
- Preserving tracking pixels and analytics

## Platform-Specific Features

### Mailchimp Integration

**Q: What Mailchimp features does SharpSend support?**
**A:** SharpSend fully integrates with:
- **Audiences**: All lists, segments, tags, and groups
- **Templates**: Entire template gallery including custom templates
- **Merge Tags**: All merge fields and personalization tokens
- **Automation**: Trigger Mailchimp automations from SharpSend
- **E-commerce**: Product recommendations and purchase tracking
- **Analytics**: Campaign reports, click maps, and engagement scores

**Q: Can I use Mailchimp's Content Studio?**
**A:** Yes, SharpSend can access and upload to Content Studio, including Giphy and Unsplash integrations.

### Iterable Integration

**Q: What makes Iterable integration special?**
**A:** Iterable's advanced features include:
- **Real-time Data Feeds**: Instant event streaming
- **User Profiles**: Full profile sync with custom fields
- **Workflows**: Trigger and monitor Iterable workflows
- **Dynamic Content**: Support for Handlebars templating
- **Cross-channel**: Email, SMS, push, and in-app messaging
- **Catalogs**: Access Iterable catalogs for dynamic content

**Q: How fast is Iterable data sync?**
**A:** Near real-time - events stream within milliseconds, profile updates within seconds.

### Customer.io Integration

**Q: What Customer.io features are available?**
**A:** Complete integration including:
- **People & Objects**: Sync both people and custom objects
- **Event Tracking**: Send custom events to trigger campaigns
- **Liquid Templates**: Full Liquid templating support
- **Journeys**: Trigger Customer.io campaigns and journeys
- **Segments**: Create and sync dynamic segments
- **Transactional API**: Send transactional emails

**Q: Can I track custom events?**
**A:** Yes, SharpSend can send any custom event to Customer.io to trigger campaigns or update profiles.

### SendGrid Integration

**Q: What can I do with SendGrid?**
**A:** SendGrid integration enables:
- **Dynamic Templates**: Sync and use dynamic templates
- **Transactional Sending**: High-volume transactional emails
- **Marketing Campaigns**: Create and send marketing emails
- **Event Webhooks**: Real-time engagement tracking
- **Suppression Management**: Automatic bounce and unsubscribe handling
- **IP Management**: Use dedicated IPs for sending

**Q: Is SendGrid good for transactional emails?**
**A:** Excellent - SendGrid specializes in high-volume transactional email with detailed analytics.

### ActiveCampaign Integration

**Q: How deep is ActiveCampaign integration?**
**A:** Very comprehensive:
- **CRM Integration**: Sync deals, contacts, and accounts
- **Automation**: Trigger any automation from SharpSend
- **Machine Learning**: Use ActiveCampaign's predictive features
- **Attribution**: Track revenue attribution
- **Site Tracking**: Integrate website behavior
- **Custom Fields**: Unlimited custom field sync

**Q: Can I use ActiveCampaign's CRM features?**
**A:** Yes, SharpSend can update deals, move contacts through pipelines, and track sales activities.

### Keap (Infusionsoft) Integration

**Q: What Keap features work with SharpSend?**
**A:** Full CRM and marketing features:
- **Contact Management**: Complete contact sync
- **Campaign Builder**: Trigger Keap campaigns
- **E-commerce**: Order and payment tracking
- **Appointments**: Appointment scheduling integration
- **Tags**: Apply and remove tags dynamically
- **Custom Fields**: All custom fields supported

**Q: Does Keap integration include CRM features?**
**A:** Yes, full CRM integration including pipeline management and sales automation.

## Technical Capabilities

### Q: How do you handle subscriber list detection?
**A:** SharpSend automatically:
1. Connects to your platform's API
2. Fetches all lists, segments, and tags
3. Imports subscriber counts and metadata
4. Detects custom fields and merge tags
5. Maps relationships between segments
6. Keeps everything synchronized

### Q: What about GDPR and privacy compliance?
**A:** SharpSend maintains compliance by:
- Never storing subscriber PII unnecessarily
- Respecting platform unsubscribe lists
- Honoring suppression lists
- Maintaining audit logs
- Supporting data deletion requests
- Using platform consent management

### Q: Can I trigger automated campaigns?
**A:** Yes! You can:
- Trigger platform automations via API
- Start journey/workflow sequences
- Send transactional emails
- Apply tags to trigger campaigns
- Update fields to meet trigger conditions
- Use webhooks for complex triggers

### Q: How do templates work across platforms?
**A:** SharpSend provides:
- **Import**: Pull templates from any platform
- **Edit**: Enhance with AI, maintain platform syntax
- **Variables**: Auto-detect platform-specific merge tags
- **Preview**: See how templates look with real data
- **Export**: Push back to platform or download
- **Versioning**: Track all template changes

### Q: What analytics can I see?
**A:** Comprehensive analytics including:
- Opens, clicks, bounces, unsubscribes
- Revenue attribution and ROI
- Engagement trends over time
- Segment performance comparison
- A/B test results
- Predictive metrics (where supported)
- Multi-platform consolidated view

## Setup & Configuration

### Q: How long does integration setup take?
**A:** Typically:
- **API Key platforms**: 2-3 minutes
- **OAuth platforms**: 5-10 minutes  
- **Initial sync**: 10-30 minutes depending on list size
- **Full feature activation**: Immediate after sync

### Q: What credentials do I need?
**A:** Depends on platform:
- **API Key only**: Mailchimp, SendGrid, ConvertKit, etc.
- **API Key + Secret**: Sailthru, Customer.io
- **OAuth**: Keap, Constant Contact
- **Multiple credentials**: Some platforms need account URL or site ID

### Q: Can I connect multiple accounts?
**A:** Yes! You can:
- Connect unlimited platform accounts
- Use different platforms simultaneously
- Keep accounts completely separated
- Switch between accounts easily
- Consolidate analytics across accounts

## Limitations & Considerations

### Q: Are there any platforms with limited features?
**A:** Some limitations exist:
- **Substack**: Read-only subscriber access, no template API
- **Ghost**: Newsletter features only, limited segmentation
- **Constant Contact**: Basic webhook events, simple templates

### Q: What about API rate limits?
**A:** SharpSend handles rate limits by:
- Respecting platform limits automatically
- Queuing requests when needed
- Using batch operations where possible
- Implementing exponential backoff
- Caching frequently accessed data

### Q: Can I disconnect and reconnect?
**A:** Yes, and:
- No data is lost when disconnecting
- Settings are preserved
- Reconnection is instant
- Historical data remains
- No disruption to active campaigns

## Advanced Features

### Q: Can I use multiple platforms together?
**A:** Absolutely! You can:
- Use Mailchimp for marketing, SendGrid for transactional
- Sync subscribers across platforms
- Consolidate analytics from all platforms
- Run multi-platform A/B tests
- Manage everything from one dashboard

### Q: How does AI enhancement work with platform templates?
**A:** SharpSend AI can:
- Enhance existing template copy
- Preserve platform merge tags
- Optimize subject lines
- Personalize content blocks
- Maintain platform compatibility
- Generate variant versions

### Q: What about custom integrations?
**A:** We offer:
- Custom platform integration development
- API endpoint configuration
- Webhook setup assistance
- Custom field mapping
- Enterprise integration support
- White-label solutions

## Troubleshooting

### Q: What if my platform isn't listed?
**A:** You can:
- Request a custom integration
- Use our webhook API
- Connect via Zapier (coming soon)
- Use our REST API directly
- Contact support for options

### Q: How do I test if integration is working?
**A:** SharpSend provides:
- Connection test button
- Sync status indicators
- Event log viewing
- Test email sending
- Webhook testing tools
- API call debugging

### Q: What if sync fails?
**A:** Automatic recovery includes:
- Retry with exponential backoff
- Error notifications
- Partial sync recovery
- Manual sync trigger option
- Detailed error logs
- Support team assistance

## Best Practices

### Q: Which platform should I choose for newsletters?
**A:** Consider:
- **High volume**: SendGrid, Braze
- **Simplicity**: MailerLite, ConvertKit
- **Monetization**: Substack, beehiiv
- **Enterprise**: Iterable, Braze
- **E-commerce**: Mailchimp, ActiveCampaign

### Q: How often should I sync?
**A:** Recommended sync frequency:
- **Subscribers**: Real-time or hourly
- **Templates**: On-demand
- **Analytics**: Real-time via webhooks
- **Segments**: Daily or on-change
- **Full sync**: Weekly maintenance

### Q: Should I use platform templates or SharpSend templates?
**A:** Best approach:
- Start with platform templates for compatibility
- Enhance with SharpSend AI
- Test thoroughly before sending
- Keep originals as backup
- Use SharpSend for new templates

## Getting Help

### Q: Where can I find platform-specific docs?
**A:** Available resources:
- In-app integration guides
- Platform API documentation
- Video tutorials
- Integration workspace
- Support chat
- Developer docs at docs.sharpsend.io

### Q: How do I report integration issues?
**A:** Contact us with:
- Platform name and account
- Error messages
- Time of occurrence  
- Steps to reproduce
- Expected behavior
- Screenshots if applicable

### Q: Is there a test environment?
**A:** Yes! You can:
- Use platform test accounts
- Create sandbox integrations
- Test with small lists first
- Preview before sending
- Use development API keys
- Access staging environment