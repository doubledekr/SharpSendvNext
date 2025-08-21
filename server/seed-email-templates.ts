import { db } from './database';
import { emailTemplates } from '../shared/schema';
import { publishers } from '../shared/schema-multitenant';
import { eq } from 'drizzle-orm';

export async function seedEmailTemplates() {
  try {
    console.log('Seeding email templates...');
    
    // Get demo publisher
    const [demoPublisher] = await db
      .select()
      .from(publishers)
      .where(eq(publishers.subdomain, 'demo'));
    
    if (!demoPublisher) {
      console.log('Demo publisher not found, skipping template seeding');
      return;
    }

    const templates = [
      {
        publisherId: demoPublisher.id,
        name: "Market Alert Template",
        description: "Real-time market volatility alerts",
        category: "alert",
        createdBy: "system",
        htmlTemplate: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;"><h1 style="color: white; margin: 0;">Market Alert</h1></div><div style="padding: 30px; background: #f7f7f7;"><h2 style="color: #333;">{{symbol}} is experiencing significant movement</h2><div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;"><p style="font-size: 18px; color: #666;"><strong>Current Price:</strong> ${{price}}<br><strong>Change:</strong> {{change}}%<br><strong>Volume:</strong> {{volume}}</p></div><div style="text-align: center; margin-top: 30px;"><a href="{{link}}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Full Analysis</a></div></div></div>',
        textTemplate: "Market Alert: {{symbol}} is moving {{change}}%. Current price: ${{price}}. View full analysis: {{link}}",
        styles: {
          primaryColor: "#667eea",
          secondaryColor: "#764ba2",
          fontFamily: "Arial, sans-serif",
          fontSize: "16px"
        },
        variables: [
          { name: "symbol", type: "text", required: true, defaultValue: "SPY" },
          { name: "price", type: "text", required: true, defaultValue: "450.25" },
          { name: "change", type: "text", required: true, defaultValue: "+2.5" },
          { name: "volume", type: "text", required: true, defaultValue: "125M" },
          { name: "link", type: "link", required: true, defaultValue: "https://sharpsend.io/analysis" }
        ],
        isActive: true
      },
      {
        publisherId: demoPublisher.id,
        name: "Weekly Market Digest",
        description: "Comprehensive weekly market summary",
        category: "newsletter",
        createdBy: "system",
        htmlTemplate: '<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;"><div style="background: #1a1a2e; padding: 40px 30px; text-align: center;"><h1 style="color: #eee; font-size: 32px; margin: 0;">Weekly Market Digest</h1><p style="color: #aaa; margin-top: 10px;">Week of {{weekDate}}</p></div><div style="padding: 40px 30px; background: white;"><h2 style="color: #1a1a2e; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">Market Performance</h2><table style="width: 100%; margin: 20px 0; border-collapse: collapse;"><tr style="background: #f8f9fa;"><th style="padding: 12px; text-align: left;">Index</th><th style="padding: 12px; text-align: right;">Weekly Change</th></tr><tr><td style="padding: 12px; border-bottom: 1px solid #dee2e6;">S&P 500</td><td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">{{sp500Change}}%</td></tr><tr><td style="padding: 12px; border-bottom: 1px solid #dee2e6;">NASDAQ</td><td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">{{nasdaqChange}}%</td></tr></table><h2 style="color: #1a1a2e; margin-top: 40px;">Top Story</h2><p style="color: #666; line-height: 1.6;">{{topStory}}</p><div style="text-align: center; margin-top: 30px;"><a href="{{reportLink}}" style="background: #e74c3c; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px;">Access Full Report</a></div></div></div>',
        textTemplate: "Weekly Market Digest - {{weekDate}}. S&P 500: {{sp500Change}}%, NASDAQ: {{nasdaqChange}}%. Top Story: {{topStory}}. Read more: {{reportLink}}",
        styles: {
          primaryColor: "#1a1a2e",
          secondaryColor: "#e74c3c",
          fontFamily: "Georgia, serif",
          fontSize: "16px"
        },
        variables: [
          { name: "weekDate", type: "date", required: true, defaultValue: "January 15-19, 2024" },
          { name: "sp500Change", type: "text", required: true, defaultValue: "+1.85" },
          { name: "nasdaqChange", type: "text", required: true, defaultValue: "+2.35" },
          { name: "topStory", type: "text", required: true, defaultValue: "Fed signals pause on rate hikes" },
          { name: "reportLink", type: "link", required: true, defaultValue: "https://sharpsend.io/report" }
        ],
        isActive: true
      },
      {
        publisherId: demoPublisher.id,
        name: "Portfolio Update",
        description: "Personalized portfolio performance summary",
        category: "digest",
        createdBy: "system",
        htmlTemplate: '<div style="font-family: Segoe UI, Tahoma, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%); padding: 40px 30px;"><h1 style="color: white; margin: 0;">Hi {{firstName}},</h1><p style="color: #ccc; margin-top: 10px;">Your {{month}} Portfolio Performance</p></div><div style="padding: 30px; background: #f5f5f5;"><div style="background: white; padding: 25px; border-radius: 10px;"><h2 style="color: #0f2027; margin: 0 0 20px 0;">Portfolio Summary</h2><p style="font-size: 24px; font-weight: bold; color: #0f2027;">Total Value: ${{portfolioValue}}</p><p style="font-size: 18px; color: #666;">Monthly Return: {{monthlyReturn}}%</p></div><div style="text-align: center; margin-top: 30px;"><a href="{{dashboardLink}}" style="background: #0f2027; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px;">View Full Dashboard</a></div></div></div>',
        textTemplate: "Hi {{firstName}}, your {{month}} portfolio value is ${{portfolioValue}} with a monthly return of {{monthlyReturn}}%. View dashboard: {{dashboardLink}}",
        styles: {
          primaryColor: "#0f2027",
          secondaryColor: "#2c5364",
          fontFamily: "'Segoe UI', Tahoma, sans-serif",
          fontSize: "16px"
        },
        variables: [
          { name: "firstName", type: "text", required: true, defaultValue: "John" },
          { name: "month", type: "text", required: true, defaultValue: "January" },
          { name: "portfolioValue", type: "text", required: true, defaultValue: "125,450" },
          { name: "monthlyReturn", type: "text", required: true, defaultValue: "+3.2" },
          { name: "dashboardLink", type: "link", required: true, defaultValue: "https://sharpsend.io/dashboard" }
        ],
        isActive: true
      },
      {
        publisherId: demoPublisher.id,
        name: "Breaking News Alert",
        description: "Urgent market news notification",
        category: "alert",
        createdBy: "system",
        htmlTemplate: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: #dc3545; padding: 20px; text-align: center;"><h2 style="color: white; margin: 0;">BREAKING NEWS</h2></div><div style="padding: 30px; background: white; border: 2px solid #dc3545;"><h1 style="color: #333; margin: 0 0 20px 0;">{{headline}}</h1><p style="color: #666; line-height: 1.6;">{{summary}}</p><div style="background: #fff3cd; padding: 15px; margin: 20px 0;"><p style="color: #856404; margin: 0;"><strong>Market Impact:</strong> {{marketImpact}}</p></div><div style="text-align: center; margin-top: 30px;"><a href="{{storyLink}}" style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Read Full Story</a></div></div></div>',
        textTemplate: "BREAKING: {{headline}}. {{summary}}. Market Impact: {{marketImpact}}. Read more: {{storyLink}}",
        styles: {
          primaryColor: "#dc3545",
          secondaryColor: "#856404",
          fontFamily: "Arial, sans-serif",
          fontSize: "16px"
        },
        variables: [
          { name: "headline", type: "text", required: true, defaultValue: "Fed Announces Emergency Rate Cut" },
          { name: "summary", type: "text", required: true, defaultValue: "Federal Reserve cuts rates by 50 basis points" },
          { name: "marketImpact", type: "text", required: true, defaultValue: "S&P 500 up 2.3%" },
          { name: "storyLink", type: "link", required: true, defaultValue: "https://sharpsend.io/breaking" }
        ],
        isActive: true
      },
      {
        publisherId: demoPublisher.id,
        name: "Educational Series",
        description: "Investment education content",
        category: "newsletter",
        createdBy: "system",
        htmlTemplate: '<div style="font-family: Helvetica Neue, Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #6B73FF 0%, #000DFF 100%); padding: 40px 30px; text-align: center;"><p style="color: white; margin: 0; text-transform: uppercase; letter-spacing: 2px; font-size: 12px;">Lesson {{lessonNumber}}</p><h1 style="color: white; margin: 10px 0 0 0; font-size: 32px;">{{lessonTitle}}</h1></div><div style="padding: 40px 30px; background: white;"><div style="background: #f0f4ff; padding: 20px; border-radius: 10px; margin-bottom: 30px;"><h3 style="color: #6B73FF; margin: 0 0 10px 0;">Today\'s Topic:</h3><p style="color: #333; line-height: 1.6; margin: 0;">{{lessonContent}}</p></div><h2 style="color: #333; margin: 30px 0 20px 0;">Key Takeaway</h2><p style="color: #666; line-height: 1.6;">{{keyTakeaway}}</p><div style="text-align: center; margin-top: 40px;"><a href="{{lessonLink}}" style="background: #6B73FF; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px;">Access Full Lesson</a></div></div></div>',
        textTemplate: "Lesson {{lessonNumber}}: {{lessonTitle}}. {{lessonContent}}. Key Takeaway: {{keyTakeaway}}. Full lesson: {{lessonLink}}",
        styles: {
          primaryColor: "#6B73FF",
          secondaryColor: "#000DFF",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          fontSize: "16px"
        },
        variables: [
          { name: "lessonNumber", type: "text", required: true, defaultValue: "5" },
          { name: "lessonTitle", type: "text", required: true, defaultValue: "Understanding P/E Ratios" },
          { name: "lessonContent", type: "text", required: true, defaultValue: "Learn how to evaluate stocks using price-to-earnings ratios" },
          { name: "keyTakeaway", type: "text", required: true, defaultValue: "P/E ratios help determine if a stock is overvalued or undervalued" },
          { name: "lessonLink", type: "link", required: true, defaultValue: "https://sharpsend.io/lesson" }
        ],
        isActive: true
      }
    ];
    
    // Insert templates
    for (const template of templates) {
      await db.insert(emailTemplates)
        .values(template)
        .onConflictDoNothing();
    }
    
    console.log(`✅ Seeded ${templates.length} email templates for demo publisher`);
  } catch (error) {
    console.error('Error seeding email templates:', error);
  }
}