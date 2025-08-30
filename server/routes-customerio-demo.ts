import { Router } from 'express';

const router = Router();

// Demo route to add mock tags to real Customer.io data for testing
router.post('/demo/enrich-real-data', async (req, res) => {
  try {
    // Simulate adding behavioral data to our real Customer.io subscribers
    const enrichedSubscribers = [
      {
        id: "john.smith@email.com",
        email: "john.smith@email.com",
        name: "John Smith",
        attributes: {
          sharpsend_total_opens: 15,
          sharpsend_total_clicks: 6,
          sharpsend_device_preference: "desktop",
          sharpsend_avg_response_time: 8,
          sharpsend_engagement_score: 0.75,
          sharpsend_lifetime_value: 650,
          sharpsend_content_tech: true,
          sharpsend_content_finance: true,
          newsletter_a_subscriber: true,
          newsletter_c_subscriber: true,
          sharpsend_tag_high_engagement: true,
          sharpsend_tag_tech_enthusiast: true,
          sharpsend_tag_finance_reader: true,
          sharpsend_tag_newsletter_subscriber: true,
          sharpsend_tags: ["high_engagement", "tech_enthusiast", "finance_reader", "newsletter_subscriber"]
        },
        insights: {
          engagementPattern: "Highly engaged - opens most emails and clicks frequently",
          devicePreference: "Desktop user - prefers computer/laptop reading",
          contentPreferences: ["Technology and innovation content", "Financial news and market analysis"],
          responseTimings: "Same-day responder - typically engages within 8 hours",
          newsletterSubscriptions: ["Newsletter A", "Newsletter C"],
          behaviorSummary: "This subscriber is a frequent email opener, tech enthusiast, finance reader"
        }
      },
      {
        id: "sarah.johnson@gmail.com",
        email: "sarah.johnson@gmail.com",
        name: "Sarah Johnson",
        attributes: {
          sharpsend_total_opens: 8,
          sharpsend_total_clicks: 2,
          sharpsend_device_preference: "mobile",
          sharpsend_avg_response_time: 1.5,
          sharpsend_engagement_score: 0.45,
          sharpsend_lifetime_value: 280,
          sharpsend_content_tech: true,
          sharpsend_content_news: true,
          newsletter_a_subscriber: true,
          sharpsend_tag_mobile_user: true,
          sharpsend_tag_tech_enthusiast: true,
          sharpsend_tag_early_responder: true,
          sharpsend_tag_selective_reader: true,
          sharpsend_tags: ["mobile_user", "tech_enthusiast", "early_responder", "selective_reader"]
        },
        insights: {
          engagementPattern: "Selective reader - opens some emails but rarely clicks",
          devicePreference: "Primarily mobile user - reads on phone/tablet",
          contentPreferences: ["Technology and innovation content", "Breaking news and current events"],
          responseTimings: "Immediate responder - engages within hours of email delivery",
          newsletterSubscriptions: ["Newsletter A"],
          behaviorSummary: "This subscriber is a mobile-first user, tech enthusiast, quick responder"
        }
      },
      {
        id: "demo@test.com",
        email: "demo@test.com",
        name: "Demo User",
        attributes: {
          sharpsend_total_opens: 18,
          sharpsend_total_clicks: 8,
          sharpsend_device_preference: "mobile",
          sharpsend_avg_response_time: 2,
          sharpsend_engagement_score: 0.9,
          sharpsend_lifetime_value: 1200,
          sharpsend_content_crypto: true,
          sharpsend_content_finance: true,
          sharpsend_subscription_tier: "premium",
          sharpsend_tag_high_engagement: true,
          sharpsend_tag_mobile_user: true,
          sharpsend_tag_crypto_enthusiast: true,
          sharpsend_tag_high_value: true,
          sharpsend_tag_premium_subscriber: true,
          sharpsend_tags: ["high_engagement", "mobile_user", "crypto_enthusiast", "high_value", "premium_subscriber"]
        },
        insights: {
          engagementPattern: "Highly engaged - opens most emails and clicks frequently",
          devicePreference: "Primarily mobile user - reads on phone/tablet",
          contentPreferences: ["Cryptocurrency analysis", "Financial news and market analysis"],
          responseTimings: "Immediate responder - engages within hours of email delivery",
          newsletterSubscriptions: [],
          behaviorSummary: "This subscriber is a high-value subscriber, crypto enthusiast, mobile-first user"
        }
      },
      {
        id: "lisa.williams@outlook.com",
        email: "lisa.williams@outlook.com",
        name: "Lisa Williams",
        attributes: {
          sharpsend_total_opens: 22,
          sharpsend_total_clicks: 12,
          sharpsend_device_preference: "mobile",
          sharpsend_avg_response_time: 0.5,
          sharpsend_engagement_score: 0.95,
          sharpsend_lifetime_value: 850,
          sharpsend_content_crypto: true,
          sharpsend_weekend_engagement: true,
          newsletter_c_subscriber: true,
          sharpsend_tag_high_engagement: true,
          sharpsend_tag_mobile_user: true,
          sharpsend_tag_crypto_enthusiast: true,
          sharpsend_tag_weekend_warrior: true,
          sharpsend_tag_premium_subscriber: true,
          sharpsend_tags: ["high_engagement", "mobile_user", "crypto_enthusiast", "weekend_warrior", "premium_subscriber"]
        },
        insights: {
          engagementPattern: "Highly engaged - opens most emails and clicks frequently",
          devicePreference: "Primarily mobile user - reads on phone/tablet",
          contentPreferences: ["Cryptocurrency analysis"],
          responseTimings: "Immediate responder - engages within hours of email delivery",
          newsletterSubscriptions: ["Newsletter C"],
          behaviorSummary: "This subscriber is a frequent email opener, active link clicker, mobile-first user, weekend warrior"
        }
      },
      {
        id: "robert.davis@email.com",
        email: "robert.davis@email.com",
        name: "Robert Davis",
        attributes: {
          sharpsend_total_opens: 18,
          sharpsend_total_clicks: 1,
          sharpsend_device_preference: "desktop",
          sharpsend_avg_response_time: 36,
          sharpsend_engagement_score: 0.35,
          sharpsend_lifetime_value: 120,
          sharpsend_content_finance: true,
          sharpsend_content_news: true,
          sharpsend_tag_engaged_lurker: true,
          sharpsend_tag_finance_reader: true,
          sharpsend_tag_delayed_responder: true,
          sharpsend_tags: ["engaged_lurker", "finance_reader", "delayed_responder"]
        },
        insights: {
          engagementPattern: "Selective reader - opens some emails but rarely clicks",
          devicePreference: "Desktop user - prefers computer/laptop reading",
          contentPreferences: ["Financial news and market analysis", "Breaking news and current events"],
          responseTimings: "Delayed responder - takes more than a day to engage",
          newsletterSubscriptions: [],
          behaviorSummary: "This subscriber is an engaged lurker, finance reader, delayed responder"
        }
      }
    ];

    // Generate AI segments based on this enriched real data
    const aiSegments = [
      {
        name: "High Engagement Champions",
        description: "Subscribers who consistently open and click emails",
        matchingUsers: enrichedSubscribers.filter(u => 
          u.attributes.sharpsend_total_opens >= 12 && u.attributes.sharpsend_total_clicks >= 3
        ),
        criteria: [
          { attribute: "sharpsend_total_opens", operator: "gte", value: 12 },
          { attribute: "sharpsend_total_clicks", operator: "gte", value: 3 }
        ],
        insights: [
          "Opens emails within hours of delivery",
          "Clicks through to read full content", 
          "Most likely to convert on offers"
        ]
      },
      {
        name: "Mobile-First Readers",
        description: "Subscribers who primarily read on mobile devices",
        matchingUsers: enrichedSubscribers.filter(u => 
          u.attributes.sharpsend_device_preference === "mobile"
        ),
        criteria: [
          { attribute: "sharpsend_device_preference", operator: "eq", value: "mobile" }
        ],
        insights: [
          "Reads emails on phone or tablet",
          "Prefers concise, scannable content",
          "Often engages during commute hours"
        ]
      },
      {
        name: "Tech Enthusiasts",
        description: "Subscribers interested in technology and innovation content",
        matchingUsers: enrichedSubscribers.filter(u => 
          u.attributes.sharpsend_content_tech || u.attributes.sharpsend_content_crypto
        ),
        criteria: [
          { attribute: "sharpsend_content_tech", operator: "eq", value: true }
        ],
        insights: [
          "Actively engages with technology content",
          "Likely early adopters of new tools",
          "Responds well to innovation-focused messaging"
        ]
      },
      {
        name: "High-Value Subscribers", 
        description: "Premium subscribers with high lifetime value",
        matchingUsers: enrichedSubscribers.filter(u => 
          u.attributes.sharpsend_lifetime_value >= 500
        ),
        criteria: [
          { attribute: "sharpsend_lifetime_value", operator: "gte", value: 500 }
        ],
        insights: [
          "High lifetime customer value",
          "Likely premium subscription holders",
          "Worth investing in retention efforts"
        ]
      },
      {
        name: "Early Bird Responders",
        description: "Subscribers who engage immediately after email delivery",
        matchingUsers: enrichedSubscribers.filter(u => 
          u.attributes.sharpsend_avg_response_time <= 2
        ),
        criteria: [
          { attribute: "sharpsend_avg_response_time", operator: "lte", value: 2 }
        ],
        insights: [
          "Checks email frequently throughout the day",
          "Responds to emails within 2 hours",
          "Perfect audience for urgent announcements"
        ]
      },
      {
        name: "Weekend Warriors",
        description: "Subscribers who primarily engage on weekends",
        matchingUsers: enrichedSubscribers.filter(u => 
          u.attributes.sharpsend_weekend_engagement === true
        ),
        criteria: [
          { attribute: "sharpsend_weekend_engagement", operator: "eq", value: true }
        ],
        insights: [
          "Peak engagement on Saturday and Sunday",
          "Has more time for longer content",
          "Good audience for leisure-related offers"
        ]
      }
    ];

    res.json({
      success: true,
      message: "Demo: Enriched real Customer.io subscribers with behavioral data",
      enrichedSubscribers: {
        count: enrichedSubscribers.length,
        subscribers: enrichedSubscribers
      },
      aiSegments: {
        count: aiSegments.length,
        segments: aiSegments.map(segment => ({
          ...segment,
          expectedSize: segment.matchingUsers.length,
          matchingEmails: segment.matchingUsers.map(u => u.email)
        }))
      },
      summary: {
        totalSubscribers: enrichedSubscribers.length,
        mobileUsers: enrichedSubscribers.filter(u => u.attributes.sharpsend_device_preference === "mobile").length,
        desktopUsers: enrichedSubscribers.filter(u => u.attributes.sharpsend_device_preference === "desktop").length,
        highEngagement: enrichedSubscribers.filter(u => u.attributes.sharpsend_engagement_score >= 0.7).length,
        avgLifetimeValue: Math.round(enrichedSubscribers.reduce((sum, u) => sum + u.attributes.sharpsend_lifetime_value, 0) / enrichedSubscribers.length),
        totalSegmentOpportunities: aiSegments.length
      }
    });
    
  } catch (error: any) {
    console.error('Error generating demo enriched data:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;