# Email Platform Template Capabilities Report

## Executive Summary
SharpSend can integrate with pre-existing templates on all major email platforms, allowing users to:
1. **Fetch existing templates** from their email platform
2. **Insert/update content** into templates via API
3. **Create new templates** programmatically
4. **Use dynamic content** with merge variables

## Platform-by-Platform Capabilities

### 1. Mailchimp
**Template Management: FULL SUPPORT**
- ✅ **Fetch Templates**: List and retrieve all templates via Marketing API
- ✅ **Update Templates**: Modify HTML content and metadata
- ✅ **Create Templates**: Build new templates programmatically
- ✅ **Dynamic Content**: Supports merge tags like `{{FNAME}}`, `{{CONTENT}}`
- ✅ **Template Types**: Classic templates (API), new editor (UI only)
- ⚡ **Transactional API**: Advanced Handlebars templating for transactional emails

**API Operations:**
```javascript
// Fetch all templates
GET /templates

// Update template
PATCH /templates/{template_id}

// Create template
POST /templates

// Use template in campaign
POST /campaigns with template_id
```

### 2. SendGrid
**Template Management: FULL SUPPORT**
- ✅ **Dynamic Templates**: Full CRUD operations on templates
- ✅ **Version Control**: Multiple versions per template
- ✅ **Fetch Templates**: Get all templates with filters
- ✅ **Update Content**: Modify HTML/text content via API
- ✅ **Handlebars Support**: Advanced templating with loops, conditionals
- ✅ **Template IDs**: Format: `d-{uuid}` for easy reference

**API Operations:**
```javascript
// Create template
POST /templates

// Create/update version
POST /templates/{template_id}/versions

// Fetch templates
GET /templates?generations=dynamic

// Send with template
POST /mail/send with template_id
```

### 3. ConvertKit
**Template Management: LIMITED**
- ✅ **Broadcasts**: Create and send one-off emails
- ✅ **Sequences**: Multi-part email series
- ⚠️ **Templates**: No dedicated template API endpoints
- ✅ **Content Creation**: Full HTML/text content in broadcasts
- ✅ **Automation Templates**: Pre-built workflow templates

**API Operations:**
```javascript
// Create broadcast with content
POST /v3/broadcasts

// Update broadcast
PUT /v3/broadcasts/{id}

// Fetch broadcasts
GET /v3/broadcasts

// Send broadcast
POST /v3/broadcasts/{id}/send
```

### 4. Iterable
**Template Management: FULL SUPPORT**
- ✅ **Email Templates**: Complete template management
- ✅ **Fetch Templates**: List all templates with filters
- ✅ **Update Templates**: Upsert operations for templates
- ✅ **Campaign Templates**: Templates receive copies (isolation)
- ✅ **Multiple Channels**: Email, push, SMS, in-app templates
- ✅ **Handlebars**: Full support for dynamic content

**API Operations:**
```javascript
// Fetch templates
GET /api/templates

// Upsert email template
POST /api/templates/email/upsert

// Create campaign from template
POST /api/campaigns/create with templateId

// Schedule with template
POST /api/campaigns/schedule
```

### 5. Customer.io
**Template Management: HYBRID**
- ✅ **Layouts**: Reusable email wrappers (header/footer)
- ✅ **Content Areas**: Dynamic content insertion via `{{content}}`
- ⚠️ **API Limitations**: Read-only for campaigns/templates
- ❌ **Template Updates**: Must use UI for create/update/delete
- ✅ **Liquid Support**: Advanced templating language
- ✅ **Collections**: Store reusable data snippets

**API Operations:**
```javascript
// Get campaigns (read-only)
GET /v1/campaigns/

// Trigger broadcast (with existing template)
POST /v1/campaigns/{broadcast_id}/triggers

// Template management: UI only
// Content updates: UI only
```

### 6. Keap (Infusionsoft)
**Template Management: LIMITED**
- ✅ **Email Builder**: Visual template creation (UI)
- ⚠️ **API Access**: Limited template endpoints documented
- ✅ **Campaign Sequences**: Automated email series
- ✅ **Merge Fields**: Personalization variables
- ✅ **Gallery Templates**: Pre-designed templates
- ⚡ **2024 Update**: New authentication (OAuth/Service Keys)

**API Operations:**
```javascript
// Limited template API documentation
// Most template operations via UI

// Send emails (uses existing templates)
POST /crm/rest/v1/emails

// Campaign management
Via Campaign Builder UI
```

## SharpSend Integration Strategy

### Recommended Approach by Platform:

1. **Mailchimp, SendGrid, Iterable** (Full API Support)
   - Fetch user's existing templates on connection
   - Allow template selection in SharpSend UI
   - Insert personalized content via API
   - Create SharpSend-branded templates

2. **ConvertKit** (Content-Focused)
   - Create broadcasts with SharpSend content
   - Use sequences for multi-part campaigns
   - Manage content directly, not templates

3. **Customer.io** (Hybrid Approach)
   - Use layouts for consistent branding
   - Insert content via broadcast triggers
   - Manage templates in Customer.io UI

4. **Keap** (UI-Heavy)
   - Guide users to create templates in Keap
   - Reference template IDs in SharpSend
   - Focus on campaign automation

## Implementation Features

### Core Capabilities to Build:

1. **Template Sync Service**
   ```typescript
   interface TemplateService {
     fetchTemplates(platform: string): Promise<Template[]>
     selectTemplate(templateId: string): Promise<void>
     updateContent(templateId: string, content: Content): Promise<void>
     createTemplate(template: Template): Promise<string>
   }
   ```

2. **Dynamic Content Injection**
   - Merge variable mapping
   - Personalization tokens
   - Segment-specific content
   - A/B test variants

3. **Template Preview**
   - Render with sample data
   - Mobile/desktop views
   - Dark mode testing

## Summary Matrix

| Platform | Fetch | Update | Create | Dynamic | API Level |
|----------|-------|--------|--------|---------|-----------|
| Mailchimp | ✅ | ✅ | ✅ | ✅ | Full |
| SendGrid | ✅ | ✅ | ✅ | ✅ | Full |
| ConvertKit | ⚠️ | ⚠️ | ✅ | ✅ | Limited |
| Iterable | ✅ | ✅ | ✅ | ✅ | Full |
| Customer.io | ✅ | ❌ | ❌ | ✅ | Read-only |
| Keap | ⚠️ | ⚠️ | ⚠️ | ✅ | Limited |

**Legend:**
- ✅ Full support via API
- ⚠️ Limited or indirect support
- ❌ Not supported via API (UI only)