# SharpSend Segment Creation & Management Implementation Plan

## 🎯 **Implementation Overview**

This plan details how to implement comprehensive segment creation and management capabilities in SharpSend, leveraging Customer.io's API to provide advanced subscriber targeting and automation.

## 🏗️ **Technical Architecture**

### **Backend Services**

#### **1. Segment Management Service**
```javascript
// services/SegmentService.js
class SegmentService {
  constructor(customerIOClient) {
    this.customerIO = customerIOClient;
    this.cache = new SegmentCache();
  }

  // Core segment operations
  async getAllSegments() {
    try {
      const segments = await this.customerIO.getSegments();
      const segmentsWithCounts = await this.enrichWithCounts(segments);
      await this.cache.updateSegments(segmentsWithCounts);
      return segmentsWithCounts;
    } catch (error) {
      console.error('Failed to fetch segments:', error);
      return this.cache.getSegments(); // Fallback to cached data
    }
  }

  async enrichWithCounts(segments) {
    return await Promise.all(
      segments.map(async (segment) => {
        const count = await this.customerIO.getSegmentCount(segment.id);
        const members = await this.customerIO.getSegmentMembers(segment.id, { limit: 10 });
        
        return {
          ...segment,
          subscriber_count: count.count,
          sample_members: members.identifiers.slice(0, 5),
          last_updated: new Date().toISOString()
        };
      })
    );
  }

  async createSegment(segmentData) {
    const newSegment = await this.customerIO.createSegment({
      segment: {
        name: segmentData.name,
        description: segmentData.description
      }
    });

    // If dynamic segment, apply criteria
    if (segmentData.type === 'dynamic' && segmentData.criteria) {
      await this.applyDynamicCriteria(newSegment.id, segmentData.criteria);
    }

    // Refresh segment list
    await this.getAllSegments();
    
    return newSegment;
  }

  async applyDynamicCriteria(segmentId, criteria) {
    // Search for subscribers matching criteria
    const matchingSubscribers = await this.customerIO.searchCustomers({
      filter: this.buildCriteriaFilter(criteria)
    });

    // Add subscribers to segment (if manual segment)
    // Note: Customer.io doesn't have direct API for adding to segments
    // This would require using the Track API to update customer attributes
    // or creating campaigns that add people to segments
    
    return matchingSubscribers;
  }

  buildCriteriaFilter(criteria) {
    const filters = [];

    if (criteria.baseSegment) {
      filters.push({
        segment: { id: criteria.baseSegment }
      });
    }

    if (criteria.portfolioValue) {
      filters.push({
        attribute: {
          field: 'portfolio_value',
          operator: 'gt',
          value: criteria.portfolioValue.min
        }
      });
    }

    if (criteria.engagementScore) {
      filters.push({
        attribute: {
          field: 'engagement_score',
          operator: 'gt',
          value: criteria.engagementScore
        }
      });
    }

    if (criteria.location) {
      filters.push({
        attribute: {
          field: 'location',
          operator: 'in',
          value: criteria.location
        }
      });
    }

    return filters.length > 1 ? { and: filters } : filters[0];
  }
}
```

#### **2. Subscriber Search Service**
```javascript
// services/SubscriberSearchService.js
class SubscriberSearchService {
  constructor(customerIOClient) {
    this.customerIO = customerIOClient;
  }

  async searchSubscribers(searchCriteria) {
    const filter = this.buildSearchFilter(searchCriteria);
    
    const results = await this.customerIO.searchCustomers({
      filter,
      start: searchCriteria.start || null,
      limit: searchCriteria.limit || 50
    });

    // Enrich with additional data
    const enrichedResults = await this.enrichSubscriberData(results.identifiers);

    return {
      subscribers: enrichedResults,
      total: results.identifiers.length,
      next: results.next,
      hasMore: !!results.next
    };
  }

  async enrichSubscriberData(subscribers) {
    return await Promise.all(
      subscribers.map(async (subscriber) => {
        try {
          const attributes = await this.customerIO.getCustomerAttributes(subscriber.cio_id);
          return {
            ...subscriber,
            attributes: attributes.customer,
            engagement_score: this.calculateEngagementScore(attributes.customer),
            segments: await this.getSubscriberSegments(subscriber.cio_id)
          };
        } catch (error) {
          console.error(`Failed to enrich subscriber ${subscriber.email}:`, error);
          return subscriber;
        }
      })
    );
  }

  buildSearchFilter(criteria) {
    const filters = [];

    // Email or name search
    if (criteria.query) {
      filters.push({
        or: [
          {
            attribute: {
              field: 'email',
              operator: 'contains',
              value: criteria.query
            }
          },
          {
            attribute: {
              field: 'name',
              operator: 'contains',
              value: criteria.query
            }
          }
        ]
      });
    }

    // Segment membership
    if (criteria.segments && criteria.segments.length > 0) {
      const segmentFilters = criteria.segments.map(segmentId => ({
        segment: { id: segmentId }
      }));
      
      filters.push(
        segmentFilters.length > 1 
          ? { or: segmentFilters }
          : segmentFilters[0]
      );
    }

    // Attribute filters
    if (criteria.attributes) {
      Object.entries(criteria.attributes).forEach(([field, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          filters.push({
            attribute: {
              field,
              operator: this.getOperatorForField(field, value),
              value
            }
          });
        }
      });
    }

    return filters.length > 1 ? { and: filters } : filters[0] || {};
  }

  calculateEngagementScore(attributes) {
    // Calculate engagement score based on available attributes
    let score = 0;
    
    if (attributes.email_opens) score += Math.min(attributes.email_opens * 2, 40);
    if (attributes.email_clicks) score += Math.min(attributes.email_clicks * 5, 30);
    if (attributes.last_login) {
      const daysSinceLogin = (Date.now() - new Date(attributes.last_login)) / (1000 * 60 * 60 * 24);
      score += Math.max(30 - daysSinceLogin, 0);
    }
    
    return Math.min(score, 100);
  }
}
```

### **Frontend Components**

#### **1. Segment Management Dashboard**
```jsx
// components/SegmentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { SegmentCard } from './SegmentCard';
import { CreateSegmentModal } from './CreateSegmentModal';
import { SubscriberSearchModal } from './SubscriberSearchModal';

export const SegmentDashboard = () => {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/segments');
      const data = await response.json();
      setSegments(data.segments);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load segments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSegment = async (segmentData) => {
    try {
      const response = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(segmentData)
      });
      
      if (response.ok) {
        await loadSegments(); // Refresh list
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Failed to create segment:', error);
    }
  };

  return (
    <div className="segment-dashboard">
      <div className="dashboard-header">
        <h1>Subscribers</h1>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">{stats.totalSubscribers?.toLocaleString()}</span>
            <span className="stat-label">Total Subscribers</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.activeSegments}</span>
            <span className="stat-label">Active Segments</span>
          </div>
          <div className="stat">
            <span className="stat-value">+{stats.recentGrowth}</span>
            <span className="stat-label">Recent Growth (24h)</span>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <button 
          className="btn btn-primary"
          onClick={() => setShowSearchModal(true)}
        >
          🔍 Search Subscribers
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => setShowCreateModal(true)}
        >
          ➕ Create Segment
        </button>
        <button className="btn btn-outline">📤 Export</button>
        <button className="btn btn-outline" onClick={loadSegments}>
          🔄 Refresh
        </button>
      </div>

      <div className="segments-grid">
        {loading ? (
          <div className="loading">Loading segments...</div>
        ) : (
          segments.map(segment => (
            <SegmentCard 
              key={segment.id} 
              segment={segment}
              onUpdate={loadSegments}
            />
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateSegmentModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSegment}
        />
      )}

      {showSearchModal && (
        <SubscriberSearchModal
          onClose={() => setShowSearchModal(false)}
          segments={segments}
        />
      )}
    </div>
  );
};
```

#### **2. Create Segment Modal**
```jsx
// components/CreateSegmentModal.jsx
import React, { useState } from 'react';

export const CreateSegmentModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'manual',
    criteria: {
      baseSegment: null,
      portfolioValue: { min: null, max: null },
      engagementScore: null,
      location: [],
      attributes: {}
    }
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePreview = async () => {
    if (formData.type === 'dynamic') {
      setLoading(true);
      try {
        const response = await fetch('/api/segments/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData.criteria)
        });
        const data = await response.json();
        setPreview(data);
      } catch (error) {
        console.error('Failed to preview segment:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal create-segment-modal">
        <div className="modal-header">
          <h2>Create New Segment</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-group">
              <label>Segment Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Segment Type</h3>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="manual"
                  checked={formData.type === 'manual'}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                />
                Manual (Add subscribers manually)
              </label>
              <label>
                <input
                  type="radio"
                  value="dynamic"
                  checked={formData.type === 'dynamic'}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                />
                Dynamic (Auto-update based on criteria)
              </label>
            </div>
          </div>

          {formData.type === 'dynamic' && (
            <div className="form-section">
              <h3>Criteria</h3>
              <div className="criteria-builder">
                <div className="form-group">
                  <label>Base Segment</label>
                  <select
                    value={formData.criteria.baseSegment || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      criteria: {...formData.criteria, baseSegment: e.target.value}
                    })}
                  >
                    <option value="">Select base segment...</option>
                    {/* Populate with available segments */}
                  </select>
                </div>

                <div className="form-group">
                  <label>Portfolio Value Range</label>
                  <div className="range-inputs">
                    <input
                      type="number"
                      placeholder="Min"
                      value={formData.criteria.portfolioValue.min || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        criteria: {
                          ...formData.criteria,
                          portfolioValue: {
                            ...formData.criteria.portfolioValue,
                            min: e.target.value
                          }
                        }
                      })}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={formData.criteria.portfolioValue.max || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        criteria: {
                          ...formData.criteria,
                          portfolioValue: {
                            ...formData.criteria.portfolioValue,
                            max: e.target.value
                          }
                        }
                      })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Minimum Engagement Score</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.criteria.engagementScore || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      criteria: {...formData.criteria, engagementScore: e.target.value}
                    })}
                  />
                </div>

                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={handlePreview}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Preview Matches'}
                </button>
              </div>

              {preview && (
                <div className="preview-section">
                  <h4>Preview Results</h4>
                  <div className="preview-stats">
                    <span className="preview-count">
                      🎯 {preview.count} subscribers will be included
                    </span>
                  </div>
                  <div className="preview-samples">
                    <h5>Sample Members:</h5>
                    {preview.samples.map((subscriber, index) => (
                      <div key={index} className="sample-subscriber">
                        • {subscriber.email} ({subscriber.attributes?.portfolio_value ? 
                          `Portfolio: $${subscriber.attributes.portfolio_value.toLocaleString()}` : 
                          'No portfolio data'}, 
                          Engagement: {subscriber.engagement_score || 0}%)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Segment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

## 🔄 **API Endpoints**

### **Backend API Routes**
```javascript
// routes/segments.js
const express = require('express');
const router = express.Router();
const SegmentService = require('../services/SegmentService');
const SubscriberSearchService = require('../services/SubscriberSearchService');

// Get all segments with counts
router.get('/', async (req, res) => {
  try {
    const segmentService = new SegmentService(req.customerIO);
    const segments = await segmentService.getAllSegments();
    
    const stats = {
      totalSubscribers: segments.reduce((sum, s) => sum + s.subscriber_count, 0),
      activeSegments: segments.length,
      recentGrowth: await calculateRecentGrowth(segments)
    };

    res.json({ segments, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific segment details
router.get('/:id', async (req, res) => {
  try {
    const segmentService = new SegmentService(req.customerIO);
    const segment = await segmentService.getSegmentDetails(req.params.id);
    res.json(segment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new segment
router.post('/', async (req, res) => {
  try {
    const segmentService = new SegmentService(req.customerIO);
    const newSegment = await segmentService.createSegment(req.body);
    res.json(newSegment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preview segment criteria
router.post('/preview', async (req, res) => {
  try {
    const searchService = new SubscriberSearchService(req.customerIO);
    const results = await searchService.searchSubscribers({
      criteria: req.body,
      limit: 10
    });
    
    res.json({
      count: results.total,
      samples: results.subscribers.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search subscribers
router.post('/search', async (req, res) => {
  try {
    const searchService = new SubscriberSearchService(req.customerIO);
    const results = await searchService.searchSubscribers(req.body);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

## 📊 **Database Schema**

### **Local Segment Cache**
```sql
-- Segments cache table
CREATE TABLE segments_cache (
  id INTEGER PRIMARY KEY,
  customerio_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'manual',
  subscriber_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'pending'
);

-- Segment criteria for dynamic segments
CREATE TABLE segment_criteria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  segment_id INTEGER REFERENCES segments_cache(id),
  criteria_type VARCHAR(100) NOT NULL,
  criteria_value TEXT NOT NULL,
  operator VARCHAR(20) DEFAULT 'eq',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriber cache for quick lookups
CREATE TABLE subscribers_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customerio_id VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  attributes TEXT, -- JSON
  engagement_score INTEGER DEFAULT 0,
  last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customerio_id)
);

-- Segment membership cache
CREATE TABLE segment_memberships (
  segment_id INTEGER REFERENCES segments_cache(id),
  subscriber_id INTEGER REFERENCES subscribers_cache(id),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (segment_id, subscriber_id)
);
```

## 🚀 **Implementation Phases**

### **Phase 1: Basic Segment Display (Week 1-2)**
- ✅ Implement segment listing with counts
- ✅ Create segment detail views
- ✅ Add basic subscriber display
- ✅ Implement sync functionality

### **Phase 2: Advanced Search (Week 3-4)**
- ✅ Build subscriber search interface
- ✅ Implement filtering capabilities
- ✅ Add pagination and export
- ✅ Create subscriber detail views

### **Phase 3: Segment Creation (Week 5-6)**
- ✅ Manual segment creation
- ✅ Dynamic segment criteria builder
- ✅ Preview functionality
- ✅ Segment management tools

### **Phase 4: Integration & Automation (Week 7-8)**
- ✅ Assignment targeting integration
- ✅ Automated segment updates
- ✅ Performance analytics
- ✅ Advanced automation rules

## 🎯 **Success Metrics**

### **Technical Metrics**
- **API Response Time**: < 2 seconds for segment operations
- **Sync Accuracy**: 99.9% data consistency with Customer.io
- **Cache Hit Rate**: > 80% for frequently accessed data
- **Error Rate**: < 1% for all segment operations

### **User Experience Metrics**
- **Segment Creation Time**: < 5 minutes average
- **Search Response Time**: < 1 second for subscriber search
- **User Adoption**: 80% of users utilize segment features
- **Feature Usage**: 60% of assignments use Customer.io targeting

## 💡 **Advanced Features (Future)**

### **AI-Powered Segmentation**
- **Smart Segment Suggestions**: AI recommends segments based on content
- **Predictive Targeting**: Predict best segments for assignment performance
- **Automated Optimization**: Auto-adjust segments based on engagement

### **Advanced Analytics**
- **Segment Performance Tracking**: ROI and engagement by segment
- **Subscriber Journey Mapping**: Track movement between segments
- **Predictive Churn Analysis**: Identify at-risk subscribers

### **Integration Enhancements**
- **Multi-Platform Sync**: Support for additional email platforms
- **Real-time Webhooks**: Instant updates from Customer.io
- **Advanced Automation**: Complex workflow triggers and actions

This implementation plan provides SharpSend with comprehensive subscriber intelligence and segment management capabilities, transforming it into a powerful Customer.io management interface while maintaining the clean, intuitive user experience.

