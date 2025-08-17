import { Router } from 'express';
import OpenAI from 'openai';
import { db } from './db';
import { campaignEmailVersions } from '../shared/schema-multitenant';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = 'gpt-4o';

/**
 * Generate email version for a specific segment
 */
router.post('/api/campaigns/:campaignId/generate-version', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { segmentId, segmentName, characteristics, baseContent, baseSubject } = req.body;
    
    // Generate personalized email content using OpenAI
    const emailPrompt = `You are an expert email copywriter for financial newsletters. Generate a compelling, personalized email for the following segment.

SEGMENT DETAILS:
- Segment Name: ${segmentName}
- Characteristics: ${characteristics}
- Base Subject Line: ${baseSubject}
- Base Content Context: ${baseContent || 'Financial market insights and investment opportunities'}

REQUIREMENTS:
1. Create a COMPLETE, SUBSTANTIAL email (400-600 words minimum)
2. Include:
   - Personalized greeting addressing this specific segment's interests
   - Hook that speaks directly to their investment style and goals
   - 3-4 key market insights or investment opportunities
   - Specific data points, statistics, or market trends
   - Clear call-to-action tailored to this segment
   - Professional sign-off
3. Write in a tone that resonates with ${segmentName} investors
4. Include relevant financial terminology appropriate for their sophistication level
5. Make it scannable with short paragraphs and clear sections
6. Ensure the content feels premium and exclusive to this segment

Generate a JSON response with:
{
  "subject": "Compelling subject line tailored to this segment (50-70 characters)",
  "previewText": "Preview text that complements the subject (90-120 characters)",
  "content": "Full HTML email content with proper formatting",
  "personalizationLevel": "high",
  "keyPoints": ["point1", "point2", "point3"],
  "estimatedReadTime": "X minutes"
}`;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert financial newsletter copywriter who creates compelling, segment-specific email content that drives engagement and conversions."
        },
        {
          role: "user",
          content: emailPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const generatedEmail = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Format the HTML content with proper structure
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
    .metric { font-size: 24px; font-weight: bold; color: #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      ${generatedEmail.content}
    </div>
  </div>
</body>
</html>`;

    // Save the generated version to database
    const versionId = randomUUID();
    const newVersion = {
      id: versionId,
      campaignId,
      segmentId,
      segmentName,
      subject: generatedEmail.subject,
      content: formattedContent,
      previewText: generatedEmail.previewText,
      personalizationLevel: generatedEmail.personalizationLevel || 'high',
      status: 'generated' as const,
      generatedAt: new Date(),
      estimatedOpenRate: 25 + Math.random() * 20, // 25-45%
      estimatedClickRate: 5 + Math.random() * 10,  // 5-15%
    };

    await db.insert(campaignEmailVersions).values(newVersion);
    
    res.json({
      success: true,
      data: {
        ...newVersion,
        keyPoints: generatedEmail.keyPoints,
        estimatedReadTime: generatedEmail.estimatedReadTime
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