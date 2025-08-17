import OpenAI from 'openai';

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export class OpenAIService {
  // Generate personalized email content based on subscriber data and market context
  async generateEmailContent({
    subscriberSegment,
    marketContext,
    contentType,
    tone = 'professional',
    length = 'medium'
  }: {
    subscriberSegment: string;
    marketContext: any;
    contentType: string;
    tone?: string;
    length?: 'short' | 'medium' | 'long';
  }): Promise<{
    subject: string;
    content: string;
    previewText: string;
  }> {
    const wordCount = length === 'short' ? 150 : length === 'long' ? 500 : 300;
    
    const prompt = `Generate a personalized financial newsletter email for ${subscriberSegment} investors.

Market Context:
- Sentiment: ${marketContext.sentiment}
- VIX Level: ${marketContext.vixLevel}
- Top Sectors: ${marketContext.topSectors?.map((s: any) => `${s.sector}: ${s.performance}%`).join(', ')}

Requirements:
- Content Type: ${contentType}
- Tone: ${tone}
- Word Count: Approximately ${wordCount} words
- Include specific market data and actionable insights
- Personalize for the ${subscriberSegment} segment

Format the response as JSON with:
{
  "subject": "compelling subject line with emoji",
  "previewText": "email preview text (50-100 chars)",
  "content": "full HTML email content with proper formatting"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert financial newsletter writer creating personalized content for investors. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        subject: result.subject || 'Market Update',
        previewText: result.previewText || 'Your personalized market insights',
        content: result.content || '<p>Content generation failed</p>'
      };
    } catch (error) {
      console.error('OpenAI generation error:', error);
      throw new Error('Failed to generate email content');
    }
  }

  // Generate A/B test variations
  async generateABTestVariations({
    baseContent,
    testType,
    audience
  }: {
    baseContent: string;
    testType: 'subject' | 'content' | 'cta';
    audience: string;
  }): Promise<{
    variantA: any;
    variantB: any;
  }> {
    const prompt = `Create two variations for A/B testing a financial newsletter.

Base Content: ${baseContent.substring(0, 500)}...
Test Type: ${testType}
Target Audience: ${audience}

Generate two distinct variations optimized for different engagement strategies.

Format as JSON:
{
  "variantA": {
    "strategy": "description of approach",
    "subject": "subject line if testing subjects",
    "content": "content if testing content",
    "cta": "CTA if testing CTAs"
  },
  "variantB": {
    "strategy": "description of approach", 
    "subject": "subject line if testing subjects",
    "content": "content if testing content",
    "cta": "CTA if testing CTAs"
  }
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an A/B testing expert for financial newsletters. Create distinct variations that test different engagement strategies."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 800
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('OpenAI A/B test generation error:', error);
      throw new Error('Failed to generate A/B test variations');
    }
  }

  // Analyze email performance and suggest improvements
  async analyzeEmailPerformance({
    emailContent,
    metrics,
    subscriberFeedback
  }: {
    emailContent: string;
    metrics: {
      openRate: number;
      clickRate: number;
      unsubscribeRate: number;
    };
    subscriberFeedback?: string[];
  }): Promise<{
    analysis: string;
    improvements: string[];
    suggestedChanges: any;
  }> {
    const prompt = `Analyze this financial newsletter's performance and suggest improvements.

Email Content: ${emailContent.substring(0, 1000)}...

Performance Metrics:
- Open Rate: ${metrics.openRate}%
- Click Rate: ${metrics.clickRate}%
- Unsubscribe Rate: ${metrics.unsubscribeRate}%

${subscriberFeedback ? `Subscriber Feedback: ${subscriberFeedback.join(', ')}` : ''}

Provide actionable insights to improve engagement.

Format as JSON:
{
  "analysis": "detailed performance analysis",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "suggestedChanges": {
    "subject": "improved subject line",
    "openingParagraph": "improved opening",
    "cta": "improved call-to-action"
  }
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an email marketing analyst specializing in financial newsletters. Provide data-driven insights and specific improvements."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
        max_tokens: 800
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      throw new Error('Failed to analyze email performance');
    }
  }

  // Generate cohort-specific content
  async generateCohortContent({
    cohortProfile,
    marketEvents,
    personalizations
  }: {
    cohortProfile: {
      name: string;
      characteristics: string[];
      investmentStyle: string;
      riskTolerance: string;
    };
    marketEvents: any[];
    personalizations: Record<string, any>;
  }): Promise<{
    content: string;
    recommendations: string[];
  }> {
    const prompt = `Create personalized financial content for a specific investor cohort.

Cohort Profile:
- Name: ${cohortProfile.name}
- Characteristics: ${cohortProfile.characteristics.join(', ')}
- Investment Style: ${cohortProfile.investmentStyle}
- Risk Tolerance: ${cohortProfile.riskTolerance}

Current Market Events:
${marketEvents.map(e => `- ${e.title}: ${e.description}`).join('\n')}

Personalizations:
${Object.entries(personalizations).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Generate highly targeted content with specific recommendations.

Format as JSON:
{
  "content": "personalized HTML content with market insights",
  "recommendations": ["specific action 1", "specific action 2", "specific action 3"]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a financial advisor creating highly personalized content for specific investor cohorts. Be specific and actionable."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('OpenAI cohort content generation error:', error);
      throw new Error('Failed to generate cohort content');
    }
  }
}

export const openAIService = new OpenAIService();