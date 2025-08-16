# SharpSend Cohort Detection & Mailchimp Integration

## How SharpSend Detects Cohorts from Mailchimp Data

### Data Sources from Mailchimp API:
1. **Subscriber Engagement Metrics**
   - Open rates by email campaign
   - Click-through rates and timing
   - Email frequency preferences
   - Unsubscribe patterns
   - Time spent reading (estimated from click patterns)

2. **Behavioral Pattern Analysis**
   - Which links they click in newsletters
   - Time of day they engage with emails
   - Device usage patterns (mobile vs desktop)
   - Geographic location data
   - Campaign-specific engagement variations

3. **Content Interaction Data**
   - Subject line preferences (what gets opened)
   - Content section engagement (which links clicked)
   - Response to different content types
   - Seasonal engagement patterns

## AI Cohort Detection Algorithm

### Step 1: Behavioral Clustering
SharpSend analyzes engagement patterns to identify distinct groups:

**High Engagement + Technical Content = Professional Investors**
- Open rates >70%
- Click rates >25% 
- Fast click response (<5 minutes)
- Engages with technical analysis content

**Moderate Engagement + Educational Focus = Learning Investors**
- Open rates 40-65%
- Click rates 5-15%
- Slower response times (>30 minutes)
- Clicks on "how-to" and educational links

**Steady Engagement + Income Focus = Conservative Income**
- Consistent open rates 50-70%
- Moderate click rates 10-20%
- Engages with dividend/yield content
- Stable, predictable patterns

### Step 2: Investment Style Classification
Based on content preferences and market timing:

**Growth Investors:**
- High engagement during market volatility
- Clicks on growth stock analysis
- Active during earnings seasons

**Trading-Oriented:**
- Very fast email response times
- High engagement with technical analysis
- Active during market hours

## Mailchimp Integration & Campaign Management

### Automatic Segment Creation

When SharpSend detects cohorts, it creates corresponding segments in your Mailchimp account:

1. **Creates Mailchimp Tags**
   - "SS_Professional_Investors"
   - "SS_Learning_Investors" 
   - "SS_Income_Focused"
   - "SS_Growth_Investors"
   - "SS_Conservative_Investors"

2. **Applies Tags to Subscribers**
   - Each subscriber gets tagged based on AI analysis
   - Tags update automatically as behavior changes
   - Historical data preserved for analysis

### Campaign Deployment Process

**Step 1: Content Creation**
- Copywriter creates base newsletter content
- SharpSend AI generates 5 personalized versions

**Step 2: Mailchimp Campaign Creation**
SharpSend automatically creates 5 separate campaigns:
- "Weekly Update - Professional Investors" (targets SS_Professional_Investors tag)
- "Weekly Update - Learning Focus" (targets SS_Learning_Investors tag)  
- "Weekly Update - Income Strategy" (targets SS_Income_Focused tag)
- "Weekly Update - Growth Opportunities" (targets SS_Growth_Investors tag)
- "Weekly Update - Conservative Approach" (targets SS_Conservative_Investors tag)

**Step 3: Optimal Timing**
Each campaign scheduled for cohort-specific optimal times:
- Professional: 7:30 AM EST (pre-market)
- Learning: 9:30 AM EST (after explanations available)
- Income: 10:00 AM EST (stable timing)
- Growth: 8:30 AM EST (early for active traders)
- Conservative: 11:00 AM EST (after market settles)

## Dashboard Visualization

SharpSend provides comprehensive cohort visualization through multiple interfaces:

### 1. Cohort Analytics Dashboard
- Real-time cohort sizes and engagement metrics
- Migration tracking (subscribers moving between cohorts)
- Performance comparison across segments
- Churn risk assessment by cohort

### 2. Mailchimp Integration View  
- Shows all created segments and their sizes
- Campaign performance by cohort
- Subscriber movement between tags
- Sync status with Mailchimp

### 3. Intelligence Overview
- Market-responsive cohort behavior
- Seasonal pattern analysis
- Revenue impact by segment
- Optimization recommendations

## Live Example Data

Our system currently detects and manages these cohorts with real performance data from financial newsletter publishers.