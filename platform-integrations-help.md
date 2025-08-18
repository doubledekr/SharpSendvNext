# Platform Integrations Help Guide

## Getting Started

### Setting Up Your First Integration

1. **Navigate to Integrations**: Go to Settings > Platform Integrations in your SharpSend dashboard
2. **Choose Your Platform**: Select from Iterable, Customer.io, or Keap
3. **Gather Credentials**: Collect the required API credentials from your chosen platform
4. **Test Connection**: Use the test connection feature before saving
5. **Configure Settings**: Set up platform-specific configurations
6. **Start Syncing**: Enable data synchronization and begin using advanced features

### Prerequisites

Before setting up integrations, ensure you have:
- Active accounts on the platforms you want to integrate
- Administrator access to generate API credentials
- Understanding of your data synchronization requirements
- Clear goals for how you'll use each platform's features

## Platform-Specific Setup Guides

### Iterable Setup

#### Step 1: Get API Credentials
1. Log into your Iterable account
2. Navigate to **Integrations** > **API Keys**
3. Click **New API Key**
4. Select appropriate permissions:
   - `lists.read` - View subscriber lists
   - `campaigns.read` - Access campaign data
   - `campaigns.execute` - Send campaigns
   - `templates.read` - Access templates
   - `users.read/write` - Manage user data
5. Note your data center region (US or EU)

#### Step 2: Configure in SharpSend
1. Go to **Settings** > **Platform Integrations**
2. Click **Connect Iterable**
3. Enter your API Key and select region
4. Test the connection
5. Configure additional settings:
   - Default sender email
   - Reply-to address
   - Webhook URL for real-time updates

#### Step 3: Set Up Data Feeds (Optional)
For real-time market data integration:
1. Create endpoints in your system that return JSON data
2. Configure data feeds in Iterable pointing to these endpoints
3. Use the data in templates with handlebars syntax: `{{dataFeed.stockPrice}}`

### Customer.io Setup

#### Step 1: Get API Credentials
1. Log into your Customer.io account
2. Go to **Settings** > **API Credentials**
3. Copy the following:
   - **Site ID** (for Track API)
   - **API Key** (for App API)
   - **Tracking Key** (for web SDK, if needed)
4. Note your region (US or EU)

#### Step 2: Configure in SharpSend
1. Go to **Settings** > **Platform Integrations**
2. Click **Connect Customer.io**
3. Enter all required credentials
4. Test the connection
5. Select which features to enable:
   - Behavioral triggers
   - In-app messaging
   - Journey automation

#### Step 3: Set Up Event Tracking
Configure events you want to track:
- Email opens and clicks
- Website page views
- Purchase events
- Custom business events

### Keap Setup

#### Step 1: Create OAuth Application
1. Visit the [Keap Developer Portal](https://developer.infusionsoft.com/)
2. Create a new application
3. Configure OAuth 2.0 settings:
   - **Redirect URI**: Your SharpSend callback URL
   - **Scopes**: Select required permissions
4. Note your **Client ID** and **Client Secret**

#### Step 2: Complete OAuth Flow
1. Go to **Settings** > **Platform Integrations**
2. Click **Connect Keap**
3. Enter Client ID and Client Secret
4. Click **Authorize** to complete OAuth flow
5. You'll be redirected to Keap to grant permissions
6. After authorization, you'll return to SharpSend with access tokens

#### Step 3: Configure CRM Settings
Set up your CRM preferences:
- Default lead source
- Custom field mappings
- Sales pipeline stages
- Automation triggers

## Feature Configuration

### Cross-Channel Messaging (Iterable)

#### Setting Up Message Channels
1. **Email Channel**: Configure sender domains and authentication
2. **SMS Channel**: Set up phone number and carrier integrations
3. **Push Channel**: Configure mobile app credentials
4. **In-App Channel**: Set up web SDK integration

#### Creating Dynamic Templates
Use handlebars syntax for personalization:
```handlebars
Hello {{user.firstName}},

{{#if market.volatility > 20}}
Market Alert: Volatility is high at {{market.volatility}}%
{{/if}}

{{#each portfolio.stocks}}
- {{this.symbol}}: {{this.price}} ({{this.change}})
{{/each}}
```

### Behavioral Triggers (Customer.io)

#### Setting Up Journeys
1. **Define Trigger Events**: What actions start the journey
2. **Create Message Sequences**: Design the flow of communications
3. **Set Timing Rules**: Delays and scheduling between messages
4. **Add Conditions**: Branch logic based on user behavior

#### In-App Message Configuration
1. **Choose Display Type**: Modal, banner, or inline
2. **Set Targeting Rules**: Page URLs, user segments, behaviors
3. **Design Content**: HTML/CSS for custom appearance
4. **Configure Actions**: Click handlers and conversion tracking

### CRM Automation (Keap)

#### Lead Scoring Setup
1. **Define Scoring Criteria**: Actions that increase/decrease scores
2. **Set Score Thresholds**: When to trigger actions
3. **Configure Notifications**: Alert sales team of hot leads
4. **Automate Follow-ups**: Trigger campaigns based on scores

#### Sales Pipeline Configuration
1. **Define Pipeline Stages**: From lead to closed deal
2. **Set Stage Criteria**: Requirements to advance stages
3. **Configure Automations**: Actions triggered by stage changes
4. **Set Up Reporting**: Track conversion rates and sales velocity

## Troubleshooting Common Issues

### Connection Problems

#### Iterable Connection Fails
- **Check API Key**: Ensure it has correct permissions
- **Verify Region**: US vs EU endpoint mismatch
- **Review Rate Limits**: Too many requests in short time

#### Customer.io Connection Fails
- **Validate Credentials**: Site ID and API Key must match
- **Check Region**: Ensure correct regional endpoint
- **Verify Permissions**: API key needs appropriate scopes

#### Keap Connection Fails
- **OAuth Tokens Expired**: Refresh tokens automatically
- **Invalid Redirect URI**: Must match OAuth app settings
- **Permission Issues**: User must have admin access

### Data Sync Issues

#### Missing Contacts
1. Check API permissions for contact access
2. Verify sync filters and date ranges
3. Review error logs for specific failures
4. Ensure contact data format is valid

#### Campaign Sync Problems
1. Verify campaign access permissions
2. Check for API rate limiting
3. Review campaign status filters
4. Ensure template compatibility

#### Custom Field Mapping
1. Verify field IDs match between systems
2. Check data type compatibility
3. Review required field validation
4. Test with sample data first

### Performance Optimization

#### Reducing API Calls
1. **Batch Operations**: Group multiple updates together
2. **Smart Sync**: Only sync changed data
3. **Cache Results**: Store frequently accessed data locally
4. **Optimize Queries**: Use filters to reduce data volume

#### Managing Rate Limits
1. **Implement Backoff**: Exponential backoff on failures
2. **Queue Requests**: Process API calls sequentially
3. **Monitor Usage**: Track API call volumes
4. **Upgrade Plans**: Higher tiers often have higher limits

## Best Practices

### Data Management
- **Regular Backups**: Export data regularly from all platforms
- **Data Validation**: Verify data integrity during sync
- **Clean Data**: Remove duplicates and invalid records
- **Monitor Quality**: Set up alerts for data issues

### Security
- **Secure Credentials**: Use environment variables for API keys
- **Regular Rotation**: Update credentials periodically
- **Monitor Access**: Review API access logs regularly
- **Limit Permissions**: Use minimum required scopes

### Performance Monitoring
- **Track Metrics**: Monitor sync times and error rates
- **Set Alerts**: Get notified of integration failures
- **Regular Testing**: Verify connections periodically
- **Capacity Planning**: Monitor usage trends

## Getting Help

### Support Resources
1. **Platform Documentation**: Each platform has extensive docs
2. **SharpSend Support**: Contact our integration specialists
3. **Community Forums**: Connect with other users
4. **Video Tutorials**: Step-by-step setup guides

### Common Support Scenarios
- **Initial Setup**: First-time integration configuration
- **Data Migration**: Moving from other platforms
- **Custom Workflows**: Complex automation setup
- **Performance Issues**: Optimization and troubleshooting
- **Feature Requests**: Suggesting new integration capabilities

### Emergency Support
For critical issues:
1. **Check Status Pages**: Platform-specific status updates
2. **Review Error Logs**: Detailed error information in dashboard
3. **Contact Support**: 24/7 support for urgent issues
4. **Backup Plans**: Fallback procedures for service disruptions