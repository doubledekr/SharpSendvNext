# Replit Development Prompt: Integrated Assignment-to-Broadcast Workflow

## Project Overview
Enhance the existing Sharpsend platform by integrating the assignment desk with approvals, segments, and broadcast management into a unified workflow while preserving the excellent 3-step assignment creation form.

## Current Working Components to PRESERVE

### ✅ **Assignment Creation Form (KEEP AS-IS)**
The current 3-step progressive disclosure form is excellent and should be maintained:

**Step 1: Core Content**
- Title* (text input)
- Objective* (textarea)
- Angle/Hook* (text input)
- AI-Assisted Quick Start (prominent button)

**Step 2: Content Details**
- Key Points* (dynamic add/remove)
- CTA Label (optional)
- CTA URL (optional)

**Step 3: Project Settings**
- Type (dropdown, default: Newsletter)
- Priority (dropdown, default: Medium)
- Due Date (date picker)
- Notes (optional textarea)

### ✅ **Content Variation System (KEEP)**
- "View Variations" functionality
- Segment-specific content generation (Growth Investors, Conservative Investors, Day Traders, Crypto Enthusiasts)
- Email variations generated notification

### ✅ **Current UI/UX Elements (PRESERVE)**
- Dark theme with professional styling
- Color-coded progress indicators
- Step navigation with Back/Continue buttons
- Clean typography and spacing
- Responsive design elements

## New Features to IMPLEMENT

### 🆕 **Enhanced Assignment Creation**

#### **Add Step 3.5: Target Segments (NEW STEP)**
Insert between "Content Details" and "Project Settings":

```javascript
// New Step: Target Segments
{
  title: "Target Segments",
  fields: [
    {
      label: "Segment Selection*",
      type: "multi-select",
      options: [
        { value: "growth_investors", label: "Growth Investors", count: 2450 },
        { value: "conservative_investors", label: "Conservative Investors", count: 1890 },
        { value: "day_traders", label: "Day Traders", count: 890 },
        { value: "crypto_enthusiasts", label: "Crypto Enthusiasts", count: 1200 },
        { value: "income_focused", label: "Income Focused", count: 3200 }
      ]
    },
    {
      label: "Email Platform Source",
      type: "select",
      options: ["Auto-Detect", "Mailchimp", "Constant Contact", "HubSpot", "Custom"]
    },
    {
      label: "Segment Preview",
      type: "display",
      content: "Total Audience: {selectedCount} subscribers across {segmentCount} segments"
    }
  ]
}
```

#### **Add Step 4.5: Collaboration & Review (NEW STEP)**
Insert between "Target Segments" and "Project Settings":

```javascript
// New Step: Collaboration & Review
{
  title: "Collaboration & Review",
  fields: [
    {
      label: "Assign Reviewers",
      type: "user-multi-select",
      options: [
        { value: "sarah.editor", label: "Sarah (Editor)", role: "Content Review" },
        { value: "mike.compliance", label: "Mike (Compliance)", role: "Regulatory Review" },
        { value: "lisa.manager", label: "Lisa (Manager)", role: "Final Approval" }
      ]
    },
    {
      label: "Review Deadline",
      type: "datetime",
      default: "+24 hours"
    },
    {
      label: "Review Notes",
      type: "textarea",
      placeholder: "Special instructions for reviewers..."
    },
    {
      label: "Auto-Generate Variations",
      type: "checkbox",
      default: true,
      help: "Automatically create segment-specific content after approval"
    }
  ]
}
```

### 🆕 **Unified Assignment Dashboard**

#### **Enhanced Assignment Desk Layout**
Replace current assignment list with integrated dashboard:

```html
<!-- Assignment Desk Header -->
<div class="assignment-desk-header">
  <div class="status-overview">
    <div class="status-card">
      <h3>Draft</h3>
      <span class="count">12</span>
    </div>
    <div class="status-card">
      <h3>In Review</h3>
      <span class="count">5</span>
    </div>
    <div class="status-card">
      <h3>Approved</h3>
      <span class="count">8</span>
    </div>
    <div class="status-card">
      <h3>Queued</h3>
      <span class="count">3</span>
    </div>
    <div class="status-card">
      <h3>Sent</h3>
      <span class="count">45</span>
    </div>
  </div>
</div>

<!-- Assignment Pipeline -->
<div class="assignment-pipeline">
  <div class="assignment-card" data-status="in-review">
    <div class="assignment-header">
      <h3>Q4 Crypto Market Outlook: Bitcoin ETF Impact Analysis</h3>
      <div class="assignment-meta">
        <span class="status in-review">In Review</span>
        <span class="segments">3 Segments</span>
        <span class="due-date">Due: Tomorrow</span>
      </div>
    </div>
    
    <div class="assignment-progress">
      <div class="progress-bar">
        <div class="progress-fill" style="width: 60%"></div>
      </div>
      <span class="progress-text">60% Complete</span>
    </div>
    
    <div class="assignment-actions">
      <button class="btn-secondary">Edit</button>
      <button class="btn-primary">Review</button>
      <button class="btn-success" disabled>Generate Variations</button>
      <button class="btn-info" disabled>Queue Broadcast</button>
    </div>
    
    <!-- Embedded Review Section (when in review) -->
    <div class="review-section" v-if="status === 'in-review'">
      <div class="reviewers">
        <div class="reviewer">
          <span class="reviewer-name">@sarah.editor</span>
          <span class="review-status approved">✓ Approved</span>
        </div>
        <div class="reviewer">
          <span class="reviewer-name">@mike.compliance</span>
          <span class="review-status pending">⏳ Pending</span>
        </div>
      </div>
      
      <div class="review-comments">
        <div class="comment">
          <strong>@sarah.editor:</strong> "Great angle, content looks solid!"
        </div>
      </div>
      
      <div class="review-actions">
        <button class="btn-success">✓ Approve</button>
        <button class="btn-danger">✗ Reject</button>
        <button class="btn-warning">📝 Request Changes</button>
        <button class="btn-info">💬 Add Comment</button>
      </div>
    </div>
  </div>
</div>
```

### 🆕 **Segment Integration Features**

#### **Email Platform Connection**
```javascript
// Segment Detection API Integration
const segmentDetection = {
  async detectSegments(platformType) {
    const platforms = {
      mailchimp: () => this.getMailchimpTags(),
      constantcontact: () => this.getConstantContactLists(),
      hubspot: () => this.getHubspotLists(),
      custom: () => this.getCustomSegments()
    };
    
    return await platforms[platformType]();
  },
  
  async getSegmentPreview(segmentIds) {
    return {
      totalSubscribers: segmentIds.reduce((sum, id) => sum + segments[id].count, 0),
      segmentBreakdown: segmentIds.map(id => ({
        name: segments[id].name,
        count: segments[id].count,
        characteristics: segments[id].characteristics
      }))
    };
  }
};
```

### 🆕 **Broadcast Queue Integration**

#### **Unified Broadcast Management**
```html
<!-- Broadcast Queue (appears after approval) -->
<div class="broadcast-queue" v-if="assignment.status === 'approved'">
  <h3>Ready for Broadcast</h3>
  
  <div class="segment-variations">
    <div class="variation-card" v-for="segment in assignment.segments">
      <div class="variation-header">
        <h4>{{ segment.name }}</h4>
        <span class="subscriber-count">{{ segment.subscriberCount }} subscribers</span>
      </div>
      
      <div class="variation-preview">
        <p>{{ segment.contentPreview }}</p>
      </div>
      
      <div class="variation-actions">
        <button class="btn-info">Preview</button>
        <button class="btn-primary">Schedule</button>
        <button class="btn-success">Send Now</button>
      </div>
    </div>
  </div>
  
  <div class="broadcast-settings">
    <div class="setting-group">
      <label>Send Time</label>
      <select>
        <option>Send Now</option>
        <option>Schedule for Later</option>
      </select>
    </div>
    
    <div class="setting-group">
      <label>Pixel Tracking</label>
      <input type="checkbox" checked> Enable SharpSend Pixels
    </div>
    
    <div class="broadcast-actions">
      <button class="btn-success btn-large">Send All Segments</button>
      <button class="btn-primary">Send Selected</button>
      <button class="btn-secondary">Save as Draft</button>
    </div>
  </div>
</div>
```

## Database Schema Updates

### **Enhanced Assignment Model**
```javascript
// Update existing assignment schema
const assignmentSchema = {
  // Existing fields (KEEP)
  id: String,
  title: String,
  objective: String,
  angle: String,
  keyPoints: [String],
  ctaLabel: String,
  ctaUrl: String,
  type: String,
  priority: String,
  dueDate: Date,
  notes: String,
  
  // New fields (ADD)
  targetSegments: [{
    segmentId: String,
    segmentName: String,
    subscriberCount: Number,
    platform: String
  }],
  reviewers: [{
    userId: String,
    role: String,
    status: String, // pending, approved, rejected, changes_requested
    comments: [String],
    reviewedAt: Date
  }],
  reviewDeadline: Date,
  reviewNotes: String,
  autoGenerateVariations: Boolean,
  
  // Enhanced status tracking
  status: String, // draft, in_review, changes_requested, approved, variations_generated, queued, broadcasting, completed
  workflowStage: String, // creation, review, approval, variation, broadcast
  progressPercentage: Number,
  
  // Variation tracking
  variations: [{
    segmentId: String,
    content: String,
    status: String, // generated, approved, queued, sent
    campaignId: String,
    pixelId: String
  }],
  
  // Broadcast tracking
  broadcastSettings: {
    sendTime: Date,
    pixelTracking: Boolean,
    campaignIds: [String]
  }
};
```

## API Endpoints to Implement

### **Assignment Workflow APIs**
```javascript
// Enhanced assignment endpoints
POST /api/assignments - Create assignment (existing, enhance with new fields)
PUT /api/assignments/:id/segments - Update target segments
PUT /api/assignments/:id/reviewers - Assign reviewers
POST /api/assignments/:id/review - Submit review (approve/reject/request changes)
POST /api/assignments/:id/variations - Generate content variations
POST /api/assignments/:id/broadcast - Queue for broadcast

// New workflow endpoints
GET /api/assignments/dashboard - Get unified dashboard data
GET /api/segments/detect/:platform - Detect segments from email platform
GET /api/segments/preview - Get segment preview data
POST /api/broadcast/queue - Add to broadcast queue
POST /api/broadcast/send - Send broadcast with pixel tracking
```

## Implementation Priority

### **Phase 1: Preserve Current Form (Week 1)**
- Ensure existing 3-step assignment form continues working
- Maintain current variation generation
- Preserve all existing UI/UX elements

### **Phase 2: Add New Steps (Week 2)**
- Implement Step 3.5: Target Segments
- Implement Step 4.5: Collaboration & Review
- Update form navigation to handle 5 steps

### **Phase 3: Enhanced Dashboard (Week 3)**
- Replace assignment list with unified dashboard
- Add status overview cards
- Implement embedded review workflow

### **Phase 4: Segment Integration (Week 4)**
- Connect to email platform APIs
- Implement segment detection and preview
- Add variation generation based on segments

### **Phase 5: Broadcast Integration (Week 5)**
- Add broadcast queue functionality
- Implement pixel tracking integration
- Add unified send management

## Testing Requirements

### **Preserve Existing Functionality**
- ✅ 3-step assignment creation works
- ✅ Content variation generation works
- ✅ All existing UI elements render correctly
- ✅ Database operations continue working

### **Test New Features**
- ✅ New steps integrate seamlessly
- ✅ Segment selection and preview work
- ✅ Review workflow functions properly
- ✅ Broadcast queue operates correctly
- ✅ End-to-end workflow completes successfully

This prompt maintains everything that's currently working while adding the integrated workflow features you need for a complete assignment-to-broadcast pipeline.

