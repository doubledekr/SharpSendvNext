# SharpSend Assignment Flow Redesign

## Simplified Status Flow
A cleaner, more intuitive workflow that matches real-world email creation:

### Assignment Statuses (6 total, down from 8+)
1. **draft** - Assignment created, ready to send to writer
2. **in_progress** - Writer is actively working on content
3. **review** - Writer submitted, awaiting review/approval
4. **approved** - Content approved, ready for segmentation
5. **ready** - Variations generated, pixels attached, ready to send
6. **sent** - Email campaign has been sent

## UI Organization (3 simple tabs)

### 1. Active Work
Shows assignments that need action:
- **Draft** assignments (send to writer button)
- **In Progress** assignments (view writer progress)
- **Review** assignments (approve/reject buttons)

### 2. Ready to Send
Shows approved content ready for campaign:
- **Approved** assignments (generate variations button)
- **Ready** assignments (schedule send button)
- Displays segment variations and pixel tracking

### 3. Campaign History
Shows completed campaigns:
- **Sent** assignments with performance metrics
- Open rates, click rates, conversion data
- Pixel tracking analytics

## Detailed Flow

### Step 1: Assignment Creation
- Marketing team creates assignment with brief
- System generates unique writer link
- Status: **draft**

### Step 2: Writer Assignment
- Link sent to copywriter (email/Slack/etc)
- Writer opens link, sees brief and requirements
- Writer clicks "Start Working"
- Status: **in_progress**

### Step 3: Content Creation
- Writer adds content using rich editor
- Uploads/selects images from CDN
- Saves progress automatically
- Clicks "Submit for Review"
- Status: **review**

### Step 4: Review & Approval
- Editor sees submission in review queue
- Can edit content directly if needed
- Approves or requests changes
- Status: **approved** (or back to **in_progress** if changes needed)

### Step 5: Segment & Variation Setup
- Define target segments (or use all subscribers)
- AI generates variations for each segment
- Unique pixels generated per variation
- Preview all versions
- Status: **ready**

### Step 6: Send Campaign
- Connect to email platform (Mailchimp, etc.)
- Schedule send time or send immediately
- System queues emails with proper pixels
- Status: **sent**

## Key Improvements

### Simpler Mental Model
- Only 3 UI sections instead of 5+
- Clear progression: Create → Write → Review → Send
- No confusing "unassigned" state

### Better Review Integration
- Reviews happen inline, not in separate queue
- Approve/reject buttons right on assignment card
- Edit-in-place for quick fixes

### Clearer Send Process
- Approved content clearly separated from drafts
- Segment selection happens after approval
- Send scheduling is the final step

## Database Changes Needed
```sql
-- Simplified assignment statuses
ALTER TABLE assignments 
ALTER COLUMN status 
CHECK (status IN ('draft', 'in_progress', 'review', 'approved', 'ready', 'sent'));

-- Add fields for better tracking
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS segment_config JSONB;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS send_config JSONB;
```

## UI Component Structure
```
AssignmentDesk/
├── ActiveWork/
│   ├── DraftCard (with "Send to Writer" action)
│   ├── InProgressCard (with progress indicator)
│   └── ReviewCard (with approve/reject/edit actions)
├── ReadyToSend/
│   ├── ApprovedCard (with "Generate Variations" action)
│   └── ReadyCard (with "Schedule Send" action)
└── CampaignHistory/
    └── SentCard (with performance metrics)
```

## Benefits
1. **Reduced Cognitive Load** - Fewer categories to understand
2. **Natural Progression** - Matches how people think about email campaigns
3. **Action-Oriented** - Clear next steps at each stage
4. **Unified Review** - No separate approval queue to manage
5. **Performance Focus** - Sent emails show ROI immediately

## Implementation Priority
1. Update status enum in schema
2. Redesign Assignment Desk UI with 3 tabs
3. Merge approval actions into assignment cards
4. Add segment configuration after approval
5. Implement send scheduling interface
6. Add performance tracking to sent items