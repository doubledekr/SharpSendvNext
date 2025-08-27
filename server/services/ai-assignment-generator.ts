import OpenAI from "openai";
import { randomUUID } from "crypto";

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface AssignmentDetails {
  id: string;
  token: string;
  triggerName: string;
  triggerType: string;
  marketCondition: string;
  segments: string[];
  urgency: 'high' | 'medium' | 'low';
  dueBy: Date;
  assignedTo?: string;
  status: 'pending' | 'in-progress' | 'completed';
  emailVariations?: EmailVariation[];
  createdAt: Date;
}

export interface EmailVariation {
  id: string;
  segment: string;
  subject: string;
  preheader: string;
  content: string;
  tone: string;
  emphasis: string[];
  predictedEngagement: number;
}

export class AIAssignmentGenerator {
  // Generate assignment link and details based on market trigger
  async generateAssignment(trigger: {
    name: string;
    type: string;
    condition: string;
    segments: string[];
  }): Promise<AssignmentDetails> {
    const assignmentId = randomUUID();
    const token = Buffer.from(assignmentId).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    
    // Calculate urgency based on trigger type
    const urgency = this.calculateUrgency(trigger.type, trigger.condition);
    
    // Set due date based on urgency
    const dueBy = new Date();
    switch(urgency) {
      case 'high':
        dueBy.setHours(dueBy.getHours() + 2);
        break;
      case 'medium':
        dueBy.setHours(dueBy.getHours() + 6);
        break;
      case 'low':
        dueBy.setDate(dueBy.getDate() + 1);
        break;
    }
    
    return {
      id: assignmentId,
      token,
      triggerName: trigger.name,
      triggerType: trigger.type,
      marketCondition: trigger.condition,
      segments: trigger.segments,
      urgency,
      dueBy,
      status: 'pending',
      createdAt: new Date()
    };
  }
  
  // Generate AI-powered email variations for segments
  async generateEmailVariations(
    assignment: AssignmentDetails,
    baseContent?: string
  ): Promise<EmailVariation[]> {
    const variations: EmailVariation[] = [];
    
    for (const segment of assignment.segments) {
      const variation = await this.generateSegmentVariation(
        segment,
        assignment.marketCondition,
        assignment.triggerType,
        baseContent
      );
      variations.push(variation);
    }
    
    return variations;
  }
  
  private async generateSegmentVariation(
    segment: string,
    marketCondition: string,
    triggerType: string,
    baseContent?: string
  ): Promise<EmailVariation> {
    const prompt = `Generate a personalized email variation for the following:
      
      Segment: ${segment}
      Market Condition: ${marketCondition}
      Trigger Type: ${triggerType}
      ${baseContent ? `Base Content: ${baseContent}` : ''}
      
      Create an email that:
      1. Has a compelling subject line tailored to ${segment}
      2. Includes a preheader text that complements the subject
      3. Contains body content that addresses the market condition
      4. Uses appropriate tone and emphasis for this segment
      5. Provides actionable insights related to ${marketCondition}
      
      Format the response as JSON with:
      {
        "subject": "subject line",
        "preheader": "preheader text",
        "content": "email body content",
        "tone": "professional/urgent/conversational/analytical",
        "emphasis": ["key point 1", "key point 2"],
        "predictedEngagement": 0-100
      }`;
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini", // Updated to working model (gpt-4o is not supported)
        messages: [
          {
            role: "system",
            content: "You are an expert financial newsletter copywriter specializing in personalized content for different investor segments."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });
      
      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        id: randomUUID(),
        segment,
        subject: result.subject || `Market Alert: ${marketCondition}`,
        preheader: result.preheader || "Important market update inside",
        content: result.content || this.generateFallbackContent(segment, marketCondition),
        tone: result.tone || 'professional',
        emphasis: result.emphasis || [marketCondition],
        predictedEngagement: result.predictedEngagement || 75
      };
    } catch (error) {
      console.error('Error generating AI variation:', error);
      return this.generateFallbackVariation(segment, marketCondition);
    }
  }
  
  private calculateUrgency(triggerType: string, condition: string): 'high' | 'medium' | 'low' {
    // High urgency for market volatility or time-sensitive events
    if (triggerType === 'market' && condition.toLowerCase().includes('spike')) {
      return 'high';
    }
    if (triggerType === 'market' && condition.toLowerCase().includes('crash')) {
      return 'high';
    }
    
    // Medium urgency for behavioral or scheduled events
    if (triggerType === 'behavior' || triggerType === 'time') {
      return 'medium';
    }
    
    // Low urgency for segment-based or general updates
    return 'low';
  }
  
  private generateFallbackContent(segment: string, marketCondition: string): string {
    return `
Dear ${segment} Investor,

We've detected an important market development that requires your attention: ${marketCondition}.

Based on your investment profile, we recommend reviewing your portfolio positions and considering the following actions:

1. Assess your current exposure to affected sectors
2. Review your risk management strategy
3. Consider rebalancing opportunities

Our analysis indicates this condition may present both risks and opportunities for ${segment.toLowerCase()}s like yourself.

Stay informed and stay ahead.

Best regards,
The SharpSend Team
    `.trim();
  }
  
  private generateFallbackVariation(segment: string, marketCondition: string): EmailVariation {
    return {
      id: randomUUID(),
      segment,
      subject: `Important Market Alert: ${marketCondition}`,
      preheader: "Action required for your portfolio",
      content: this.generateFallbackContent(segment, marketCondition),
      tone: 'professional',
      emphasis: [marketCondition, 'portfolio review'],
      predictedEngagement: 70
    };
  }
  
  // Generate variations from a draft
  async generateVariationsFromDraft(
    draft: string,
    segments: string[],
    marketContext?: string
  ): Promise<EmailVariation[]> {
    const variations: EmailVariation[] = [];
    
    for (const segment of segments) {
      const prompt = `Take this email draft and create a personalized variation for ${segment} investors:
        
        Original Draft: ${draft}
        ${marketContext ? `Market Context: ${marketContext}` : ''}
        
        Adapt the content to:
        1. Match the investment style and risk tolerance of ${segment}
        2. Use appropriate language and terminology
        3. Emphasize relevant points for this segment
        4. Maintain the core message while personalizing tone
        
        Format as JSON with subject, preheader, content, tone, emphasis array, and predictedEngagement (0-100).`;
      
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4.1-mini", // Updated to working model (gpt-4o is not supported)
          messages: [
            {
              role: "system",
              content: "You are an expert at adapting financial newsletter content for different investor segments while preserving the core message."
            },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.6
        });
        
        const result = JSON.parse(response.choices[0].message.content || "{}");
        
        variations.push({
          id: randomUUID(),
          segment,
          subject: result.subject || "Market Update",
          preheader: result.preheader || "Important information inside",
          content: result.content || draft,
          tone: result.tone || 'professional',
          emphasis: result.emphasis || [],
          predictedEngagement: result.predictedEngagement || 75
        });
      } catch (error) {
        console.error('Error generating variation from draft:', error);
        variations.push({
          id: randomUUID(),
          segment,
          subject: "Market Update",
          preheader: "Important information for your portfolio",
          content: draft,
          tone: 'professional',
          emphasis: [],
          predictedEngagement: 70
        });
      }
    }
    
    return variations;
  }
}

// In-memory storage for assignments (in production, use database)
const assignmentStorage = new Map<string, AssignmentDetails>();

export function saveAssignment(assignment: AssignmentDetails): void {
  assignmentStorage.set(assignment.token, assignment);
}

export function getAssignment(token: string): AssignmentDetails | undefined {
  return assignmentStorage.get(token);
}

export function updateAssignment(token: string, updates: Partial<AssignmentDetails>): void {
  const existing = assignmentStorage.get(token);
  if (existing) {
    assignmentStorage.set(token, { ...existing, ...updates });
  }
}