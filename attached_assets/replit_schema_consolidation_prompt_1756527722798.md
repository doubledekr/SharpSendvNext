# Replit Prompt: Consolidate SharpSend to Multi-Tenant Schema

## 🎯 **CRITICAL TASK: Fix Dual Schema System**

SharpSend currently has a **broken workflow** due to having TWO separate database schemas that aren't synchronized. This is causing assignments to not flow to the broadcast queue and publisher data to intermingle.

**GOAL**: Consolidate everything to use `schema-multitenant.ts` and eliminate `schema.ts` conflicts.

## 🚨 **IMMEDIATE ISSUES TO FIX**

### **1. Schema Import Conflicts**
**PROBLEM**: Routes are importing from both schemas inconsistently
**CURRENT**: Some routes use `schema.ts`, others use `schema-multitenant.ts`
**FIX**: Update ALL imports to use `schema-multitenant.ts` only

### **2. Assignment → Broadcast Queue Broken**
**PROBLEM**: Assignments saved to main schema, broadcast queue in multi-tenant schema
**RESULT**: No foreign key relationship, nothing flows to broadcast queue
**FIX**: Ensure assignments and broadcast queue use same schema

### **3. Publisher Isolation Failing**
**PROBLEM**: `routes-cleanup.ts` only clears multi-tenant schema, leaves main schema data
**RESULT**: Data intermingling between publishers
**FIX**: Consolidate all publisher data to multi-tenant schema

## 🔧 **STEP-BY-STEP IMPLEMENTATION**

### **STEP 1: Audit Current Imports (30 minutes)**
```bash
# Find all files importing from schema.ts
grep -r "from.*schema'" server/ --include="*.ts"
grep -r "import.*schema" server/ --include="*.ts"
```

**ACTION**: List every file that imports from `schema.ts` vs `schema-multitenant.ts`

### **STEP 2: Update All Route Imports (2 hours)**
**FIND**: All files with `import { ... } from '../shared/schema'`
**REPLACE**: With `import { ... } from '../shared/schema-multitenant'`

**CRITICAL FILES TO UPDATE**:
- `server/routes/assignments.ts`
- `server/routes/campaigns.ts` 
- `server/routes/broadcast-queue.ts`
- `server/routes/integrations.ts`
- `server/routes-cleanup.ts`

### **STEP 3: Fix Assignment Workflow (4 hours)**

**Current Broken Flow**:
```typescript
// WRONG - Different schemas
import { assignments } from '../shared/schema'; // Main schema
import { broadcastQueue } from '../shared/schema-multitenant'; // Multi-tenant schema
```

**Fixed Flow**:
```typescript
// CORRECT - Same schema
import { assignments, broadcastQueue } from '../shared/schema-multitenant';

// Assignment approval → Broadcast queue
app.post('/api/assignments/:id/approve', async (req, res) => {
  const assignment = await approveAssignment(assignmentId);
  
  // Add to broadcast queue (now works - same schema!)
  await db.insert(broadcastQueue).values({
    publisherId: assignment.publisherId,
    assignmentId: assignment.id,
    title: assignment.title,
    status: 'ready',
    audienceCount: calculateAudienceCount(assignment.targetSegments)
  });
});
```

### **STEP 4: Data Migration (3 hours)**

**BACKUP EXISTING DATA**:
```sql
-- Export existing assignments from main schema
SELECT * FROM assignments; -- Save to CSV

-- Export existing campaigns from main schema  
SELECT * FROM campaigns; -- Save to CSV
```

**MIGRATE TO MULTI-TENANT SCHEMA**:
```typescript
// Migration script
const existingAssignments = await db.select().from(mainSchema.assignments);
const existingCampaigns = await db.select().from(mainSchema.campaigns);

// Insert into multi-tenant schema with proper publisher isolation
for (const assignment of existingAssignments) {
  await db.insert(multiTenantSchema.assignments).values({
    ...assignment,
    publisherId: assignment.publisherId || 'default-publisher-id'
  });
}
```

### **STEP 5: Remove Schema Conflicts (1 hour)**

**DELETE CONFLICTING TABLES** from `schema.ts`:
- Remove `assignments` table definition
- Remove `campaigns` table definition  
- Keep only tables that don't exist in multi-tenant schema

**OR BETTER**: Rename `schema.ts` to `schema-legacy.ts` and stop importing from it

### **STEP 6: Fix Publisher Isolation (2 hours)**

**UPDATE MIDDLEWARE**:
```typescript
// Extract publisher from subdomain
app.use(async (req, res, next) => {
  const subdomain = req.hostname.split('.')[0];
  const publisher = await db.select().from(publishers)
    .where(eq(publishers.subdomain, subdomain))
    .limit(1);
    
  if (!publisher[0]) {
    return res.status(404).json({ error: 'Publisher not found' });
  }
  
  req.publisherId = publisher[0].id;
  req.publisher = publisher[0];
  next();
});
```

**UPDATE ALL QUERIES** to include publisher isolation:
```typescript
// BEFORE (broken)
const assignments = await db.select().from(assignments);

// AFTER (fixed)
const assignments = await db.select().from(assignments)
  .where(eq(assignments.publisherId, req.publisherId));
```

## 🧪 **TESTING REQUIREMENTS**

### **Test 1: Assignment Creation**
1. Create assignment
2. Verify it saves to multi-tenant schema
3. Check publisher isolation works

### **Test 2: Assignment → Broadcast Queue**
1. Create assignment
2. Approve assignment  
3. Verify it appears in broadcast queue
4. Check foreign key relationship works

### **Test 3: Publisher Isolation**
1. Create data for Publisher A
2. Create data for Publisher B
3. Verify Publisher A cannot see Publisher B's data
4. Test subdomain routing works

### **Test 4: Customer.io Integration**
1. Sync Customer.io data
2. Verify subscriber counts appear
3. Test assignment targeting with Customer.io segments

## ⚠️ **CRITICAL REQUIREMENTS**

### **DO NOT BREAK**:
- ✅ Assignment creation workflow (5-step process)
- ✅ Segment selection interface
- ✅ Customer.io integration credentials
- ✅ Existing UI components and styling

### **MUST PRESERVE**:
- ✅ All existing assignment data (migrate, don't delete)
- ✅ Publisher settings and configurations
- ✅ Integration credentials and connections
- ✅ User accounts and permissions

### **MUST FIX**:
- ❌ Assignment → Broadcast queue flow
- ❌ Publisher data isolation
- ❌ Schema import consistency
- ❌ Foreign key relationships

## 🎯 **SUCCESS CRITERIA**

After completion, verify:
1. **Assignment workflow works**: Create → Approve → Appears in broadcast queue
2. **Publisher isolation works**: Subdomain routing isolates data properly
3. **Customer.io integration works**: Subscriber counts sync correctly
4. **No data loss**: All existing assignments and data preserved
5. **Single schema**: All routes use `schema-multitenant.ts` only

## 📋 **DELIVERABLES**

1. **Updated route files** using consistent schema imports
2. **Data migration script** to move existing data
3. **Publisher isolation middleware** for subdomain routing
4. **Working assignment → broadcast queue flow**
5. **Test results** confirming all functionality works

## ⏰ **ESTIMATED TIMELINE**

- **Day 1**: Schema audit and import updates (4 hours)
- **Day 2**: Data migration and testing (6 hours)  
- **Day 3**: Publisher isolation and subdomain routing (4 hours)
- **Day 4**: Integration testing and bug fixes (6 hours)

**Total**: 3-4 days for complete consolidation

## 🚀 **START HERE**

1. **First**: Run the grep commands to audit current schema imports
2. **Then**: Update imports in `server/routes/assignments.ts` to use multi-tenant schema
3. **Test**: Create assignment and verify it flows to broadcast queue
4. **Continue**: Systematic migration of all routes

This consolidation will fix the fundamental architecture issue causing the workflow problems and enable proper multi-tenant operation with subdomain isolation.

