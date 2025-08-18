# Platform Integrations API Reference

## Overview

SharpSend supports integration with three advanced platforms for enhanced cross-channel communication, marketing automation, and CRM functionality.

## Iterable Integration

### Platform Capabilities
- **Cross-Channel Messaging**: Email, SMS, push notifications, in-app messages
- **Template Management**: Advanced template system with handlebars logic and dynamic content
- **Data Feeds**: Real-time data integration from external APIs for personalization
- **Campaign Automation**: Triggered campaigns based on user behavior and events
- **Analytics**: Comprehensive reporting on campaign performance and user engagement
- **CDN Integration**: Asset management and optimization for images and media

### API Endpoints

#### Connection Management
```http
POST /api/integrations/iterable/test-connection
Content-Type: application/json

{
  "apiKey": "your-iterable-api-key",
  "region": "us" // or "eu"
}
```

```http
POST /api/integrations/iterable/connect
Content-Type: application/json

{
  "publisherId": "your-publisher-id",
  "apiKey": "your-iterable-api-key",
  "region": "us",
  "config": {
    "fromEmail": "newsletters@yourcompany.com",
    "replyTo": "support@yourcompany.com"
  }
}
```

#### Campaign Management
```http
GET /api/integrations/iterable/{publisherId}/campaigns
```

### Feature Capabilities
- ✅ Cross-channel communication
- ✅ Advanced templates with real-time data
- ✅ Marketing automation
- ✅ Comprehensive analytics
- ✅ In-app messaging
- ✅ SMS and push notifications
- ✅ Real-time data feeds
- ✅ Segmentation and targeting
- ✅ Webhook support

## Customer.io Integration

### Platform Capabilities
- **Omnichannel Messaging**: Email, SMS, push, in-app, and webhook messages
- **Behavioral Triggers**: Event-based automation and journey workflows
- **In-App Messaging**: Modals, banners, and inline messages with rich targeting
- **Segmentation**: Advanced audience segmentation and personalization
- **Real-Time Events**: Live event tracking and user journey mapping
- **Three APIs**: Specialized APIs for different use cases (Track, App, CDP)

### API Endpoints

#### Connection Management
```http
POST /api/integrations/customerio/test-connection
Content-Type: application/json

{
  "siteId": "your-site-id",
  "apiKey": "your-api-key",
  "region": "us" // or "eu"
}
```

```http
POST /api/integrations/customerio/connect
Content-Type: application/json

{
  "publisherId": "your-publisher-id",
  "siteId": "your-site-id",
  "apiKey": "your-api-key",
  "region": "us",
  "trackingKey": "your-tracking-key",
  "config": {
    "segmentIds": ["segment1", "segment2"],
    "journeyIds": ["journey1", "journey2"]
  }
}
```

### API Types
1. **Track API**: For identifying users and tracking events
2. **App API**: For sending transactional messages and managing campaigns
3. **CDP API**: For data pipeline integration and object management

### Feature Capabilities
- ✅ Omnichannel messaging
- ✅ Behavioral triggers and automation
- ✅ In-app messaging with rich targeting
- ✅ Real-time event tracking
- ✅ Journey and workflow management
- ✅ Advanced segmentation
- ✅ Transactional messaging
- ✅ Data pipeline integration
- ✅ Comprehensive analytics

## Keap Integration

### Platform Capabilities
- **CRM Management**: Complete contact and lead management system
- **Sales Pipeline**: Opportunity tracking and sales automation
- **Marketing Automation**: Email campaigns and follow-up sequences
- **E-commerce**: Order processing and payment integration
- **Custom Fields**: Flexible data collection and organization
- **Reporting**: Business intelligence and performance analytics

### API Endpoints

#### Connection Management
```http
POST /api/integrations/keap/test-connection
Content-Type: application/json

{
  "accessToken": "your-oauth-access-token"
}
```

```http
POST /api/integrations/keap/connect
Content-Type: application/json

{
  "publisherId": "your-publisher-id",
  "clientId": "your-oauth-client-id",
  "clientSecret": "your-oauth-client-secret",
  "accessToken": "your-oauth-access-token",
  "refreshToken": "your-oauth-refresh-token",
  "config": {
    "leadSourceId": 123,
    "campaignIds": [456, 789]
  }
}
```

#### Contact Management
```http
GET /api/integrations/keap/{publisherId}/contacts?limit=50&offset=0
```

### Authentication
Keap uses OAuth 2.0 with automatic token refresh. Access tokens expire every 24 hours and are automatically refreshed using the refresh token.

### Feature Capabilities
- ✅ Complete CRM functionality
- ✅ Sales pipeline automation
- ✅ Marketing automation
- ✅ E-commerce integration
- ✅ Custom field management
- ✅ Email campaign management
- ✅ Lead scoring and management
- ✅ Webhook notifications
- ✅ Comprehensive reporting
- ❌ Cross-channel messaging (email only)
- ❌ In-app messaging
- ❌ SMS and push notifications

## General Integration Management

### List All Integrations
```http
GET /api/integrations/{publisherId}
```

### Disconnect Integration
```http
DELETE /api/integrations/{publisherId}/{platform}
```

### Sync Integration Data
```http
POST /api/integrations/{publisherId}/{platform}/sync
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `INVALID_CREDENTIALS`: Authentication failed
- `CONNECTION_FAILED`: Unable to connect to platform
- `RATE_LIMIT_EXCEEDED`: API rate limit reached
- `INTEGRATION_NOT_FOUND`: Integration not configured
- `PERMISSION_DENIED`: Insufficient permissions

## Best Practices

1. **Test Connections**: Always test connections before saving integration settings
2. **Monitor Rate Limits**: Each platform has different rate limiting policies
3. **Sync Regularly**: Use sync endpoints to keep data fresh
4. **Handle Errors**: Implement proper error handling for all API calls
5. **Secure Credentials**: Store API keys and tokens securely
6. **Use Webhooks**: Configure webhooks for real-time data updates where available