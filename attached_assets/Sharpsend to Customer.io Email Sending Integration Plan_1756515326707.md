# Sharpsend to Customer.io Email Sending Integration Plan

## Current State Analysis

### Existing Components
1. **Email Creation**: Sharpsend has email generation and campaign management systems
2. **Customer.io Integration**: Full bidirectional integration service exists (`CustomerIoIntegrationService`)
3. **Tracking Pixels**: Comprehensive tracking system (`EmailTrackingPixel`)
4. **Broadcast System**: Queue-based sending system that already uses Customer.io

### Current Workflow
```
Sharpsend Email Creation → Broadcast Queue → Customer.io Send → Tracking
```

## The Missing Piece: Sharpsend Pixel Injection

The current system sends emails through Customer.io but **doesn't inject Sharpsend tracking pixels**. Here's what needs to be implemented:

### 1. Enhanced Broadcast Service

**File**: `server/routes-broadcast.ts` (lines 376-382)

**Current Code**:
```typescript
const broadcastResult = await customerIo.sendBroadcast({
  subject: existingItem[0].emailSubject || assignmentData.title,
  content: assignmentData.content || `Assignment: ${assignmentData.title}`,
  segment: "all_users",
  campaignName: `Broadcast_${existingItem[0].id}`,
  sendNow: true
});
```

**Enhanced Code Needed**:
```typescript
// Import tracking pixel service
import { EmailTrackingPixel } from '../services/email-tracking-pixel';

// Get email content
let emailContent = assignmentData.content || `Assignment: ${assignmentData.title}`;

// Inject Sharpsend tracking pixels for each recipient
const pixelService = EmailTrackingPixel.getInstance();

// For Customer.io, we need to use their personalization syntax
const trackingPixelTag = pixelService.generatePixelTag(
  assignmentData.id, // emailId
  '{{customer.id}}', // Customer.io subscriber ID placeholder
  'https://your-sharpsend-domain.com', // Your tracking domain
  existingItem[0].id // campaignId
);

// Inject pixel before closing body tag
emailContent = emailContent.replace('</body>', `${trackingPixelTag}</body>`);
// If no body tag, append to end
if (!emailContent.includes('</body>')) {
  emailContent += trackingPixelTag;
}

const broadcastResult = await customerIo.sendBroadcast({
  subject: existingItem[0].emailSubject || assignmentData.title,
  content: emailContent, // Now includes Sharpsend tracking pixel
  segment: "all_users",
  campaignName: `Broadcast_${existingItem[0].id}`,
  sendNow: true
});
```

### 2. Pixel Tracking Endpoint

**File**: `server/routes-tracking.ts` (needs to be created or enhanced)

```typescript
// Handle pixel tracking requests
app.get('/api/tracking/pixel/:trackingId.gif', async (req, res) => {
  const { trackingId } = req.params;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip;
  
  const pixelService = EmailTrackingPixel.getInstance();
  const tracked = pixelService.trackOpen(trackingId, userAgent, ipAddress);
  
  // Return 1x1 transparent GIF
  const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.set({
    'Content-Type': 'image/gif',
    'Content-Length': gif.length,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.send(gif);
});
```

### 3. Customer.io Personalization Integration

Customer.io uses liquid templating for personalization. The tracking pixel needs to be personalized per recipient:

```html
<img src="https://your-domain.com/api/tracking/pixel/{{assignment_id}}-{{customer.id}}-{{campaign_id}}.gif" 
     alt="" width="1" height="1" border="0" 
     style="display:block;width:1px;height:1px;border:0;" />
```

### 4. Enhanced Customer.io Service Method

**File**: `server/services/customerio-integration.ts`

Add a new method for Sharpsend-enhanced broadcasts:

```typescript
/**
 * Send Sharpsend email with tracking through Customer.io
 */
async sendSharpSendEmail(emailData: {
  subject: string;
  content: string;
  assignmentId: string;
  campaignId: string;
  trackingDomain: string;
  segment?: string;
  sendNow?: boolean;
}): Promise<{ success: boolean; broadcastId?: number; message: string }> {
  
  // Inject Sharpsend tracking pixel with Customer.io personalization
  const trackingPixel = `<img src="${emailData.trackingDomain}/api/tracking/pixel/${emailData.assignmentId}-{{customer.id}}-${emailData.campaignId}.gif" alt="" width="1" height="1" border="0" style="display:block;width:1px;height:1px;border:0;" />`;
  
  let enhancedContent = emailData.content;
  
  // Inject pixel before closing body tag or at the end
  if (enhancedContent.includes('</body>')) {
    enhancedContent = enhancedContent.replace('</body>', `${trackingPixel}</body>`);
  } else {
    enhancedContent += trackingPixel;
  }
  
  // Send through existing Customer.io broadcast method
  return await this.sendBroadcast({
    subject: emailData.subject,
    content: enhancedContent,
    segment: emailData.segment || "all_users",
    campaignName: `SharpSend_${emailData.campaignId}`,
    sendNow: emailData.sendNow !== false
  });
}
```

## Implementation Steps

### Step 1: Update Broadcast Routes
- Modify `server/routes-broadcast.ts` to inject tracking pixels
- Import and use `EmailTrackingPixel` service

### Step 2: Create/Enhance Tracking Routes  
- Ensure pixel tracking endpoint exists
- Handle Customer.io personalized tracking IDs

### Step 3: Test Integration
- Create test email in Sharpsend
- Send through Customer.io
- Verify tracking pixels work
- Check engagement data flows back to Sharpsend

### Step 4: Dashboard Integration
- Display Customer.io sent emails in Sharpsend analytics
- Show engagement metrics from Sharpsend tracking
- Combine with Customer.io native analytics

## Benefits

1. **Unified Analytics**: All engagement data flows through Sharpsend regardless of sending platform
2. **Content Control**: Emails created in Sharpsend maintain their tracking capabilities
3. **Platform Flexibility**: Can send through Customer.io while keeping Sharpsend as the source of truth
4. **Enhanced Insights**: Combine Customer.io's delivery data with Sharpsend's engagement tracking

## Next Steps

Would you like me to implement any of these components? I can start with:
1. Updating the broadcast service to inject tracking pixels
2. Creating the tracking endpoint
3. Testing the integration with a sample email

