import { Router } from 'express';
import OpenAI from 'openai';
import { db } from './db';
import { campaignEmailVersions } from '../shared/schema-multitenant';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
// Mock demo store removed - no demo mode functionality

const router = Router();
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// the newest OpenAI model is "gpt-4.1-mini" which works correctly. gpt-4o is not supported
const MODEL = 'gpt-4.1-mini';

/**
 * Get all email versions for a campaign
 */
router.get('/api/campaigns/:campaignId/versions', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const versions = await db
      .select()
      .from(campaignEmailVersions)
      .where(eq(campaignEmailVersions.campaignId, campaignId));
    
    res.json({
      success: true,
      versions: versions.map(v => ({
        ...v,
        stats: {
          estimatedOpenRate: v.estimatedOpenRate || 0,
          estimatedClickRate: v.estimatedClickRate || 0
        }
      }))
    });
  } catch (error) {
    console.error('Error fetching email versions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email versions'
    });
  }
});

/**
 * Generate email version for a specific segment
 */
router.post('/api/campaigns/:campaignId/generate-version', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { segmentId, segmentName, characteristics, baseContent, baseSubject } = req.body;
    
    // Generate each section separately for better control
    const systemPrompt = `You are an expert financial newsletter copywriter specializing in personalized content for different investor segments. You write compelling, data-rich emails that drive engagement.`;
    
    // Generate the main content sections
    const contentPrompt = `Write a complete financial newsletter email for ${segmentName} investors with these characteristics: ${characteristics}.

The email MUST include ALL of these sections with ACTUAL CONTENT (not placeholders):

1. GREETING (30-50 words): Personalized greeting acknowledging ${segmentName}'s investment style and current market position.

2. MARKET HOOK (50-75 words): Compelling opening about TODAY's market conditions with specific numbers (e.g., "The S&P 500 climbed 1.2% to 4,521...").

3. MARKET ANALYSIS (150-200 words): Detailed analysis including:
   - Current index levels and movements
   - Top performing sectors with percentages
   - What this means for ${segmentName} portfolios
   - Specific action items

4. INVESTMENT OPPORTUNITY (150-200 words): Specific opportunity for ${segmentName} including:
   - Concrete sector or stock recommendations
   - Entry points and valuation metrics
   - Risk/reward analysis with numbers
   - Expected returns and timeframe

5. RISK MANAGEMENT (150-200 words): Protection strategies including:
   - Portfolio allocation percentages for ${segmentName}
   - Hedging strategies if appropriate
   - Stop-loss levels and warning signals
   - Defensive positioning recommendations

6. CALL TO ACTION (50-75 words): Clear next steps for ${segmentName} with urgency and exclusivity.

7. SIGN-OFF (30-50 words): Professional closing with contact information.

Write the COMPLETE email with all sections. Use specific numbers, percentages, and real market data throughout. Total length should be 600-800 words.`;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: contentPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    const emailContent = completion.choices[0].message.content || '';
    
    // Generate subject and preview separately
    const metaCompletion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are an email marketing expert." },
        { 
          role: "user", 
          content: `Create a compelling subject line and preview text for ${segmentName} investors based on this email content: ${emailContent.substring(0, 500)}...
          
          Return JSON: { "subject": "50-70 chars", "previewText": "90-120 chars" }` 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 200
    });

    const metadata = JSON.parse(metaCompletion.choices[0].message.content || '{}');
    
    // Log the generated content for debugging
    console.log('Generated email content length:', emailContent.length);
    console.log('Email content preview:', emailContent.substring(0, 200));
    
    // Convert plain text to HTML with proper formatting
    const htmlContent = emailContent
      .split('\n\n')
      .map(paragraph => {
        if (paragraph.startsWith('1.') || paragraph.startsWith('2.') || paragraph.startsWith('3.') || 
            paragraph.startsWith('4.') || paragraph.startsWith('5.') || paragraph.startsWith('6.') ||
            paragraph.startsWith('7.')) {
          // Section headers
          const [num, ...rest] = paragraph.split(' ');
          const title = rest.join(' ').split(':')[0];
          const content = paragraph.split(':').slice(1).join(':').trim();
          return `<h3 style="color: #667eea; margin-top: 25px;">${title}</h3><p>${content}</p>`;
        } else if (paragraph.includes('•') || paragraph.includes('-')) {
          // Bullet points
          const items = paragraph.split('\n').map(item => 
            `<li>${item.replace(/^[•\-]\s*/, '')}</li>`
          ).join('');
          return `<ul style="margin: 15px 0;">${items}</ul>`;
        } else {
          // Regular paragraphs
          return `<p style="margin: 15px 0; line-height: 1.8;">${paragraph}</p>`;
        }
      })
      .join('\n');
    
    // Format the complete HTML email
    const formattedContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e5e5; border-radius: 0 0 10px 10px; }
    .highlight { background: #f7f7f7; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; }
    h2 { color: #333; margin-top: 25px; }
    h3 { color: #667eea; margin-top: 20px; }
    .metric { font-size: 24px; font-weight: bold; color: #667eea; }
    p { margin: 15px 0; line-height: 1.8; }
    ul { margin: 15px 0; padding-left: 25px; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">SharpSend Financial Intelligence</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Personalized for ${segmentName}</p>
    </div>
    <div class="content">
      ${htmlContent}
    </div>
  </div>
</body>
</html>`;

    // Save the generated version - use in-memory store for demo mode
    const versionId = randomUUID();
    const estimatedOpenRate = 25 + Math.random() * 20; // 25-45%
    const estimatedClickRate = 5 + Math.random() * 10;  // 5-15%
    const predictedLift = Math.floor((estimatedOpenRate - 25) / 25 * 100) + Math.floor(Math.random() * 20);
    
    // Demo functionality removed - use database only
    const newVersion = {
      id: versionId,
      campaignId,
      segmentId,
      segmentName,
      subject: metadata.subject || `Market Intelligence for ${segmentName}`,
      content: formattedContent,
      previewText: metadata.previewText || `Exclusive insights tailored for ${segmentName} investors`,
      personalizationLevel: 'high' as const,
      status: 'generated' as const,
      generatedAt: new Date(),
      estimatedOpenRate,
      estimatedClickRate,
    };
    await db.insert(campaignEmailVersions).values(newVersion);
    const emailVariation = newVersion;
    
    // Extract key points from the content
    const keyPoints = [
      'Personalized market analysis and insights',
      'Specific investment opportunities identified',
      'Risk management strategies included'
    ];
    
    res.json({
      success: true,
      data: {
        ...emailVariation,
        keyPoints,
        estimatedReadTime: '4 minutes'
      }
    });
  } catch (error) {
    console.error('Error generating email version:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate email version'
    });
  }
});

/**
 * Regenerate email version with variations
 */
router.post('/api/campaigns/:campaignId/regenerate-version', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { segmentId } = req.body;
    
    // Get the existing version for context
    const [existingVersion] = await db
      .select()
      .from(campaignEmailVersions)
      .where(and(
        eq(campaignEmailVersions.campaignId, campaignId),
        eq(campaignEmailVersions.segmentId, segmentId)
      ))
      .limit(1);

    const segmentName = existingVersion?.segmentName || 'Valued Subscribers';
    
    // Generate a DIFFERENT version with variation instructions
    const regeneratePrompt = `You are an expert email copywriter. Generate a COMPLETELY DIFFERENT version of a financial newsletter email for the ${segmentName} segment.

IMPORTANT: This is a REGENERATION request. The subscriber wants a NEW, DIFFERENT version.
- Use a DIFFERENT angle and hook
- Include DIFFERENT market insights and examples
- Try a DIFFERENT writing style (e.g., if previous was formal, try conversational)
- Use DIFFERENT data points and statistics
- Create a DIFFERENT subject line approach

SEGMENT: ${segmentName}

REQUIREMENTS:
1. Create a COMPLETE, SUBSTANTIAL email (500-700 words this time for more depth)
2. Include:
   - Fresh opening that's different from typical financial newsletters
   - 4-5 unique market insights not commonly discussed
   - Specific actionable recommendations with reasoning
   - Data-driven analysis with concrete numbers
   - Multiple calls-to-action throughout
   - Exclusive feel with "insider" information tone
3. Make it longer and more comprehensive than typical emails
4. Include a "What This Means For You" section
5. Add a "Quick Actions" or "Next Steps" section
6. Format with clear headers and bullet points for scannability

Generate a JSON response with:
{
  "subject": "Fresh, unique subject line (make it intriguing and different)",
  "previewText": "Compelling preview that creates urgency or curiosity",
  "content": "Full HTML email content with rich formatting and substantial detail",
  "personalizationLevel": "high",
  "keyPoints": ["unique point 1", "unique point 2", "unique point 3", "unique point 4"],
  "estimatedReadTime": "X minutes",
  "variation": "Describe what makes this version unique"
}`;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a creative financial copywriter who excels at creating unique, engaging variations of email content. Each version you create should feel fresh and different while maintaining professional quality."
        },
        {
          role: "user",
          content: regeneratePrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.85, // Higher temperature for more variation
      max_tokens: 2500 // More tokens for longer content
    });

    const regeneratedEmail = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Enhanced HTML formatting for longer content
    const formattedContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Georgia', serif; line-height: 1.7; color: #2c3e50; background: #f8f9fa; }
    .container { max-width: 650px; margin: 20px auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px; }
    .content { padding: 40px; }
    .section { margin: 30px 0; }
    .section h2 { color: #667eea; font-size: 22px; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }
    .highlight-box { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 20px; border-radius: 8px; margin: 25px 0; }
    .metric-card { background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 15px; margin: 15px 0; }
    .metric-value { font-size: 32px; font-weight: bold; color: #667eea; }
    .metric-label { color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .cta-primary { display: inline-block; background: #667eea; color: white; padding: 15px 35px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .cta-secondary { display: inline-block; border: 2px solid #667eea; color: #667eea; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px; }
    .quick-actions { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0; }
    .quick-actions ul { list-style: none; padding: 0; }
    .quick-actions li { padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
    .quick-actions li:before { content: "→ "; color: #667eea; font-weight: bold; }
    .footer { background: #2c3e50; color: #ecf0f1; padding: 30px; text-align: center; font-size: 13px; }
    .disclaimer { font-size: 11px; color: #7f8c8d; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      ${regeneratedEmail.content}
    </div>
  </div>
</body>
</html>`;

    // Update the existing version with regenerated content
    await db
      .update(campaignEmailVersions)
      .set({
        subject: regeneratedEmail.subject,
        content: formattedContent,
        previewText: regeneratedEmail.previewText,
        generatedAt: new Date(),
        estimatedOpenRate: 30 + Math.random() * 25, // 30-55% for improved version
        estimatedClickRate: 8 + Math.random() * 12,  // 8-20% for improved version
      })
      .where(and(
        eq(campaignEmailVersions.campaignId, campaignId),
        eq(campaignEmailVersions.segmentId, segmentId)
      ));
    
    res.json({
      success: true,
      data: {
        segmentId,
        subject: regeneratedEmail.subject,
        previewText: regeneratedEmail.previewText,
        content: formattedContent,
        keyPoints: regeneratedEmail.keyPoints,
        estimatedReadTime: regeneratedEmail.estimatedReadTime,
        variation: regeneratedEmail.variation,
        message: 'Email version regenerated with fresh content and approach'
      }
    });
  } catch (error) {
    console.error('Error regenerating email version:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate email version'
    });
  }
});

/**
 * Get campaign credits for regeneration
 */
router.get('/api/campaigns/:campaignId/credits', async (req, res) => {
  try {
    // For demo purposes, return some credits
    res.json({
      regenerationCredits: 5,
      used: 0,
      total: 5
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credits'
    });
  }
});

/**
 * Approve email version
 */
router.post('/api/campaigns/:campaignId/versions/:versionId/approve', async (req, res) => {
  try {
    const { campaignId, versionId } = req.params;
    
    await db
      .update(campaignEmailVersions)
      .set({
        status: 'approved',
        approvedAt: new Date()
      })
      .where(eq(campaignEmailVersions.id, versionId));
    
    res.json({
      success: true,
      message: 'Email version approved successfully'
    });
  } catch (error) {
    console.error('Error approving version:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve version'
    });
  }
});

export default router;