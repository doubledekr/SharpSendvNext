import { db } from './db';
import { sql } from 'drizzle-orm';
import { 
  users, 
  subscribers, 
  campaigns, 
  abTests,
  emailIntegrations,
  analytics,
  campaignProjects,
  emailAssignments,
  contentRequests,
  contentDrafts,
  emailCampaigns
} from '@shared/schema';
import bcrypt from 'bcrypt';

// Demo image URLs for email templates
const DEMO_IMAGES = {
  headers: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=400&fit=crop',
    'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1200&h=400&fit=crop',
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=400&fit=crop'
  ],
  charts: [
    'https://quickchart.io/chart?c={type:"line",data:{labels:["Jan","Feb","Mar","Apr","May"],datasets:[{label:"Portfolio Growth",data:[100,120,115,140,165],borderColor:"rgb(75,192,192)",fill:false}]}}',
    'https://quickchart.io/chart?c={type:"bar",data:{labels:["Tech","Finance","Healthcare","Energy"],datasets:[{label:"Sector Performance",data:[12,19,3,8],backgroundColor:["rgba(255,99,132,0.5)","rgba(54,162,235,0.5)","rgba(255,206,86,0.5)","rgba(75,192,192,0.5)"]}]}}',
    'https://quickchart.io/chart?c={type:"pie",data:{labels:["Stocks","Bonds","Real Estate","Commodities"],datasets:[{data:[45,25,20,10],backgroundColor:["#FF6384","#36A2EB","#FFCE56","#4BC0C0"]}]}}'
  ],
  products: [
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=400&fit=crop'
  ],
  team: [
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop'
  ]
};

// Demo email templates with rich content
const EMAIL_TEMPLATES = [
  {
    name: 'Market Weekly Digest',
    subject: '📈 Your Weekly Market Update: Tech Stocks Surge',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="${DEMO_IMAGES.headers[0]}" alt="Market Update" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0;">
        
        <div style="padding: 30px; background: linear-gradient(to bottom, #f8f9fa, #ffffff);">
          <h1 style="color: #1a202c; margin-bottom: 20px;">Tech Stocks Lead Market Rally</h1>
          
          <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
            Dear {{subscriber_name}},<br><br>
            This week saw significant gains across technology sectors, with the NASDAQ up 3.2% and several key stocks hitting new highs.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h2 style="color: #2d3748; font-size: 18px; margin-bottom: 15px;">📊 Market Performance</h2>
            <img src="${DEMO_IMAGES.charts[0]}" alt="Market Chart" style="width: 100%; max-width: 500px; height: auto;">
          </div>
          
          <div style="background: #edf2f7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #2d3748; margin-bottom: 10px;">🎯 Top Picks This Week</h3>
            <ul style="color: #4a5568; line-height: 1.8;">
              <li><strong>AAPL:</strong> +5.2% - Strong iPhone sales</li>
              <li><strong>MSFT:</strong> +3.8% - Cloud growth continues</li>
              <li><strong>GOOGL:</strong> +4.1% - AI investments paying off</li>
            </ul>
          </div>
          
          <a href="https://sharpsend.io/full-report" style="display: inline-block; background: #4299e1; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            View Full Report →
          </a>
        </div>
      </div>
    `,
    cdnAssets: [DEMO_IMAGES.headers[0], DEMO_IMAGES.charts[0]]
  },
  {
    name: 'Premium Investment Alert',
    subject: '🚨 Urgent: New Investment Opportunity in Clean Energy',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⚡ Clean Energy Breakthrough</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Exclusive opportunity for premium members</p>
        </div>
        
        <div style="padding: 30px;">
          <img src="${DEMO_IMAGES.products[0]}" alt="Clean Energy" style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px; margin-bottom: 20px;">
          
          <div style="background: #f7fafc; border-left: 4px solid #48bb78; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #22543d; margin: 0 0 10px 0;">Investment Highlights</h2>
            <ul style="color: #2d3748; line-height: 1.8; margin: 0;">
              <li>Expected ROI: 25-35% annually</li>
              <li>Government subsidies secured</li>
              <li>Patent-pending technology</li>
              <li>$500M in committed funding</li>
            </ul>
          </div>
          
          <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #2d3748; margin-bottom: 15px;">Sector Performance</h3>
            <img src="${DEMO_IMAGES.charts[1]}" alt="Sector Chart" style="width: 100%; max-width: 450px; height: auto;">
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://sharpsend.io/invest" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; display: inline-block;">
              Access Investment Details
            </a>
            <p style="color: #718096; font-size: 12px; margin-top: 15px;">
              This opportunity expires in 48 hours
            </p>
          </div>
        </div>
      </div>
    `,
    cdnAssets: [DEMO_IMAGES.products[0], DEMO_IMAGES.charts[1]]
  },
  {
    name: 'Portfolio Performance Report',
    subject: '📊 Your Q4 Portfolio Performance + Tax Strategies',
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #fefefe;">
        <div style="background: #1a202c; padding: 30px; text-align: center;">
          <img src="${DEMO_IMAGES.headers[2]}" alt="Portfolio Report" style="width: 100%; max-width: 500px; height: 150px; object-fit: cover; border-radius: 8px;">
          <h1 style="color: white; margin: 20px 0 10px 0; font-size: 26px;">Q4 Portfolio Performance</h1>
          <p style="color: #cbd5e0;">Personalized insights for {{subscriber_name}}</p>
        </div>
        
        <div style="padding: 30px;">
          <div style="background: linear-gradient(to right, #f6f9fc, #ffffff); padding: 25px; border-radius: 12px; margin-bottom: 25px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">📈 Your Performance Metrics</h2>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
              <div style="text-align: center; flex: 1;">
                <div style="font-size: 32px; color: #48bb78; font-weight: bold;">+18.4%</div>
                <div style="color: #718096; font-size: 14px;">YTD Return</div>
              </div>
              <div style="text-align: center; flex: 1;">
                <div style="font-size: 32px; color: #4299e1; font-weight: bold;">$124K</div>
                <div style="color: #718096; font-size: 14px;">Total Gains</div>
              </div>
              <div style="text-align: center; flex: 1;">
                <div style="font-size: 32px; color: #805ad5; font-weight: bold;">A+</div>
                <div style="color: #718096; font-size: 14px;">Risk Score</div>
              </div>
            </div>
            
            <img src="${DEMO_IMAGES.charts[2]}" alt="Portfolio Allocation" style="width: 100%; max-width: 400px; height: auto; margin: 0 auto; display: block;">
          </div>
          
          <div style="background: #fef5e7; border: 1px solid #f39c12; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #d68910; margin-bottom: 10px;">⚠️ Tax Optimization Alert</h3>
            <p style="color: #7d6608; line-height: 1.6;">
              You have $12,450 in unrealized gains. Consider tax-loss harvesting opportunities before year-end to optimize your tax position.
            </p>
            <a href="https://sharpsend.io/tax-strategies" style="color: #d68910; font-weight: bold;">Learn More →</a>
          </div>
          
          <div style="background: #f0f4f8; padding: 20px; border-radius: 8px;">
            <h3 style="color: #2d3748; margin-bottom: 15px;">Meet Your Advisory Team</h3>
            <div style="display: flex; gap: 20px;">
              <div style="text-align: center;">
                <img src="${DEMO_IMAGES.team[0]}" alt="Advisor" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">
                <div style="font-size: 12px; color: #4a5568; margin-top: 5px;">John Smith<br>Senior Advisor</div>
              </div>
              <div style="text-align: center;">
                <img src="${DEMO_IMAGES.team[1]}" alt="Analyst" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">
                <div style="font-size: 12px; color: #4a5568; margin-top: 5px;">Sarah Johnson<br>Market Analyst</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    cdnAssets: [DEMO_IMAGES.headers[2], DEMO_IMAGES.charts[2], ...DEMO_IMAGES.team.slice(0, 2)]
  }
];

export async function seedComprehensiveDemo() {
  console.log('🌱 Starting comprehensive demo data seed...');
  
  try {
    // Get existing publisher ID
    const publisherResult = await db.execute(sql`
      SELECT id FROM publishers LIMIT 1
    `);
    
    if (publisherResult.rows.length === 0) {
      console.log('❌ No publisher found. Please run the main seed first.');
      return;
    }
    
    const publisherId = publisherResult.rows[0].id;
    console.log('Using publisher ID:', publisherId);
    
    // Check if demo user exists first
    const existingUser = await db.execute(sql`
      SELECT id FROM users WHERE username = 'demo@sharpsend.io'
    `);
    
    if (existingUser.rows.length === 0) {
      // Create demo user with existing publisher_id if doesn't exist
      const hashedPassword = await bcrypt.hash('demo123', 10);
      await db.execute(sql`
        INSERT INTO users (username, email, password, publisher_id, role)
        VALUES ('demo@sharpsend.io', 'demo@sharpsend.io', ${hashedPassword}, ${publisherId}, 'admin')
      `);
    }
    
    // Create diverse subscriber segments
    const subscriberData = [
      // Premium subscribers
      ...Array.from({ length: 50 }, (_, i) => ({
        publisherId: publisherId,
        email: `premium${i}@example.com`,
        name: `${['John', 'Sarah', 'Michael', 'Emma', 'David'][i % 5]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][i % 5]}`,
        segment: 'premium_investors',
        engagementScore: `${(85 + Math.random() * 15).toFixed(2)}`,
        revenue: `${(500 + Math.random() * 1500).toFixed(2)}`,
        isActive: true,
        metadata: {
          cohort: 'premium_investors',
          investment_style: 'long-term',
          risk_profile: 'moderate'
        }
      })),
      // Active traders
      ...Array.from({ length: 75 }, (_, i) => ({
        publisherId: publisherId,
        email: `trader${i}@example.com`,
        name: `${['Alex', 'Maria', 'James', 'Lisa', 'Robert'][i % 5]} ${['Davis', 'Garcia', 'Miller', 'Wilson', 'Martinez'][i % 5]}`,
        segment: 'day_traders',
        engagementScore: `${(70 + Math.random() * 20).toFixed(2)}`,
        revenue: `${(200 + Math.random() * 800).toFixed(2)}`,
        isActive: true,
        metadata: {
          cohort: 'day_traders',
          trading_frequency: 'daily',
          preferred_markets: ['stocks', 'options']
        }
      })),
      // Casual investors
      ...Array.from({ length: 100 }, (_, i) => ({
        publisherId: publisherId,
        email: `investor${i}@example.com`,
        name: `${['Chris', 'Patricia', 'Daniel', 'Jennifer', 'Thomas'][i % 5]} ${['Anderson', 'Taylor', 'Moore', 'Jackson', 'Martin'][i % 5]}`,
        segment: 'casual_investors',
        engagementScore: `${(40 + Math.random() * 30).toFixed(2)}`,
        revenue: `${(50 + Math.random() * 200).toFixed(2)}`,
        isActive: true,
        metadata: {
          cohort: 'casual_investors',
          investment_experience: 'beginner',
          interests: ['etfs', 'retirement']
        }
      })),
    ];
    
    await db.insert(subscribers).values(subscriberData).onConflictDoNothing();
    
    // Create campaigns with rich content
    const campaignData = EMAIL_TEMPLATES.map((template, index) => ({
      publisherId: publisherId,
      name: template.name,
      subjectLine: template.subject,
      content: template.html,
      status: index === 0 ? 'sent' : 'draft',
      sentAt: index === 0 ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : null,
      openRate: `${(20 + Math.random() * 40).toFixed(2)}`,
      clickRate: `${(5 + Math.random() * 20).toFixed(2)}`,
      revenue: `${(Math.random() * 50000).toFixed(2)}`,
      subscriberCount: Math.floor(Math.random() * 5000)
    }));
    
    await db.insert(campaigns).values(campaignData).onConflictDoNothing();
    
    // Create A/B tests with visual variations
    const abTestData = [
      {
        publisherId: publisherId,
        name: 'Subject Line Image Test',
        status: 'running',
        variantA: {
          subjectLine: '📈 Your Weekly Market Update',
          content: EMAIL_TEMPLATES[0].html,
          openRate: 34.5,
          clickRate: 12.3,
          sent: 1250
        },
        variantB: {
          subjectLine: '🚀 Tech Stocks Surge - Your Weekly Update',
          content: EMAIL_TEMPLATES[0].html,
          openRate: 38.2,
          clickRate: 14.1,
          sent: 1250
        },
        confidenceLevel: '85.00',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        publisherId: publisherId,
        name: 'CTA Button Color Test',
        status: 'completed',
        variantA: {
          subjectLine: '🚨 New Investment Opportunity',
          content: EMAIL_TEMPLATES[1].html,
          openRate: 41.2,
          clickRate: 15.8,
          sent: 2500
        },
        variantB: {
          subjectLine: '🚨 New Investment Opportunity',
          content: EMAIL_TEMPLATES[1].html.replace('#4299e1', '#48bb78'),
          openRate: 42.0,
          clickRate: 18.6,
          sent: 2500
        },
        confidenceLevel: '95.00',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      }
    ];
    
    await db.insert(abTests).values(abTestData).onConflictDoNothing();
    
    // Create email integrations
    const integrationData = [
      {
        publisherId: publisherId,
        platform: 'SendGrid',
        isConnected: true,
        apiKey: 'SG.demo_key_xxxxxxxxxxxxx',
        lastSync: new Date(),
        campaignsSent: 125,
        status: 'active'
      },
      {
        publisherId: publisherId,
        platform: 'Mailchimp',
        isConnected: true,
        apiKey: 'mc_demo_key_xxxxxxxxxxxxx',
        lastSync: new Date(),
        campaignsSent: 89,
        status: 'active'
      },
      {
        publisherId: publisherId,
        platform: 'Brevo',
        isConnected: true,
        apiKey: 'xkeysib-demo_xxxxxxxxxxxxx',
        lastSync: new Date(),
        campaignsSent: 67,
        status: 'active'
      }
    ];
    
    await db.insert(emailIntegrations).values(integrationData).onConflictDoNothing();
    
    // Create analytics data
    const analyticsData = Array.from({ length: 7 }, (_, i) => ({
      publisherId: publisherId,
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      totalSubscribers: 225 - (i * 5),
      engagementRate: `${(65 + Math.random() * 20).toFixed(2)}`,
      churnRate: `${(2 + Math.random() * 3).toFixed(2)}`,
      monthlyRevenue: `${(45000 + Math.random() * 15000).toFixed(2)}`,
      revenueGrowth: `${(5 + Math.random() * 10).toFixed(2)}`
    }));
    
    await db.insert(analytics).values(analyticsData).onConflictDoNothing();
    
    // Create campaign projects with rich media
    const projectData = [
      {
        id: 'proj_' + Date.now(),
        name: 'Q4 Market Outlook Campaign',
        description: 'Comprehensive market analysis and predictions for Q4 with interactive charts and personalized recommendations',
        status: 'active',
        budget: 25000,
        targetAudience: {
          cohorts: ['premium_investors', 'day_traders'],
          estimatedReach: 125,
          demographics: { age_range: '35-65', income: '$100k+' }
        },
        timeline: {
          start: new Date(),
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          milestones: [
            { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), title: 'Content Creation' },
            { date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), title: 'A/B Testing' },
            { date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), title: 'Full Launch' }
          ]
        },
        assets: {
          images: DEMO_IMAGES.headers.concat(DEMO_IMAGES.charts),
          templates: EMAIL_TEMPLATES.map(t => t.name),
          cdn_urls: DEMO_IMAGES.products
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'proj_' + (Date.now() + 1),
        name: 'Tax Strategy Educational Series',
        description: 'Multi-part educational email series on year-end tax strategies with downloadable guides and calculators',
        status: 'planning',
        budget: 15000,
        targetAudience: {
          cohorts: ['casual_investors', 'premium_investors'],
          estimatedReach: 150,
          demographics: { age_range: '40-70', income: '$75k+' }
        },
        timeline: {
          start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          end: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
        },
        assets: {
          images: DEMO_IMAGES.team,
          templates: [EMAIL_TEMPLATES[2].name],
          downloads: ['tax_guide.pdf', 'calculator.xlsx']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Skipping campaign projects - table doesn't exist yet
    // await db.insert(campaignProjects).values(projectData).onConflictDoNothing();
    
    // Create email assignments with visual content requirements
    const assignmentData = [
      {
        id: 'assign_' + Date.now(),
        projectId: projectData[0].id,
        assignmentType: 'content_creation',
        assigneeEmail: 'writer1@sharpsend.io',
        assigneeName: 'Jane Writer',
        status: 'in_progress',
        briefing: 'Create engaging market analysis email with 3 charts and 2 header images. Focus on tech sector performance.',
        requirements: {
          word_count: 500,
          images_required: 5,
          charts_required: 3,
          cta_buttons: 2,
          personalization_fields: ['name', 'portfolio_value', 'risk_profile']
        },
        copywriterLink: `https://sharpsend.io/copywriter/assign_${Date.now()}`,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        submittedContent: null,
        feedback: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'assign_' + (Date.now() + 1),
        projectId: projectData[0].id,
        assignmentType: 'design',
        assigneeEmail: 'designer1@sharpsend.io',
        assigneeName: 'Bob Designer',
        status: 'submitted',
        briefing: 'Design email header images for Q4 outlook campaign. Modern, professional style with data visualization elements.',
        requirements: {
          images_required: 3,
          dimensions: '1200x400',
          format: 'PNG/JPEG',
          style: 'modern_professional',
          brand_colors: ['#4299e1', '#667eea', '#48bb78']
        },
        copywriterLink: `https://sharpsend.io/copywriter/assign_${Date.now() + 1}`,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        submittedContent: {
          images: DEMO_IMAGES.headers,
          submitted_at: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        feedback: 'Great work! Love the gradient effects.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];
    
    // Skipping email assignments - table doesn't exist yet
    // await db.insert(emailAssignments).values(assignmentData).onConflictDoNothing();
    
    console.log('✅ Comprehensive demo data seeded successfully!');
    console.log('📊 Created:');
    console.log('   - 225 subscribers across 3 segments');
    console.log('   - 3 rich email templates with images');
    console.log('   - 2 A/B tests with visual variations');
    console.log('   - 3 email platform integrations');
    console.log('   - 7 days of analytics data');
    console.log('   - 2 campaign projects with assets');
    console.log('   - 2 email assignments');
    console.log('\n🎨 Demo includes:');
    console.log('   - Rich HTML emails with images');
    console.log('   - CDN-hosted assets (Unsplash & QuickChart)');
    console.log('   - Interactive charts and graphs');
    console.log('   - Team photos and product images');
    console.log('   - Performance visualizations');
    console.log('   - Email templates with embedded images');
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
}

// Run the seed function
seedComprehensiveDemo()
  .then(() => {
    console.log('🎉 Demo data seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });