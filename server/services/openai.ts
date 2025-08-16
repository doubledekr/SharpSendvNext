import OpenAI from "openai";
import { tenantStorage } from "../storage-multitenant";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ContentGenerationRequest {
  publisherId: string;
  campaignId?: string;
  contentType: "subject_line" | "body" | "personalization" | "summary";
  prompt: string;
  context?: {
    subscriberData?: any;
    campaignData?: any;
    brandVoice?: string;
    targetAudience?: string;
  };
  model?: string;
}

export interface ContentGenerationResponse {
  content: string;
  tokensUsed: number;
  model: string;
  confidence?: number;
}

class OpenAIService {
  /**
   * Generate content using OpenAI GPT models
   */
  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    try {
      const model = request.model || "gpt-4";
      
      // Build the system prompt based on content type
      const systemPrompt = this.buildSystemPrompt(request.contentType, request.context);
      
      // Generate content
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: request.prompt }
        ],
        max_tokens: this.getMaxTokens(request.contentType),
        temperature: this.getTemperature(request.contentType),
      });

      const generatedContent = completion.choices[0]?.message?.content || "";
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Save to AI content history
      await tenantStorage.createAiContentHistory({
        publisherId: request.publisherId,
        campaignId: request.campaignId,
        prompt: request.prompt,
        generatedContent,
        contentType: request.contentType,
        model,
        tokensUsed,
      });

      return {
        content: generatedContent,
        tokensUsed,
        model,
        confidence: this.calculateConfidence(completion),
      };
    } catch (error) {
      console.error("OpenAI content generation error:", error);
      throw new Error("Failed to generate content with AI");
    }
  }

  /**
   * Generate multiple subject line variations for A/B testing
   */
  async generateSubjectLineVariations(
    publisherId: string,
    campaignData: any,
    count: number = 3
  ): Promise<string[]> {
    const prompt = `
      Generate ${count} different subject line variations for this newsletter campaign:
      
      Campaign: ${campaignData.name}
      Content Summary: ${campaignData.content?.substring(0, 200)}...
      Target Audience: ${campaignData.targetAudience || "general newsletter subscribers"}
      
      Requirements:
      - Each subject line should be under 50 characters
      - Use different approaches (curiosity, benefit-driven, urgency, etc.)
      - Make them engaging and click-worthy
      - Avoid spam trigger words
      
      Return only the subject lines, one per line.
    `;

    const response = await this.generateContent({
      publisherId,
      campaignId: campaignData.id,
      contentType: "subject_line",
      prompt,
      context: { campaignData },
    });

    return response.content
      .split("\n")
      .filter(line => line.trim())
      .slice(0, count);
  }

  /**
   * Personalize content for a specific subscriber
   */
  async personalizeContent(
    publisherId: string,
    subscriberData: any,
    baseContent: string,
    campaignId?: string
  ): Promise<string> {
    const prompt = `
      Personalize this newsletter content for the specific subscriber:
      
      Subscriber Info:
      - Name: ${subscriberData.name}
      - Segment: ${subscriberData.segment}
      - Engagement Score: ${subscriberData.engagementScore}
      - Preferences: ${JSON.stringify(subscriberData.preferences || {})}
      - Tags: ${subscriberData.tags?.join(", ") || "none"}
      
      Base Content:
      ${baseContent}
      
      Instructions:
      - Personalize the greeting and relevant sections
      - Adjust tone based on engagement level
      - Include relevant content based on preferences/tags
      - Keep the same overall structure and key information
      - Make it feel personally written for this subscriber
    `;

    const response = await this.generateContent({
      publisherId,
      campaignId,
      contentType: "personalization",
      prompt,
      context: { subscriberData },
    });

    return response.content;
  }

  /**
   * Generate newsletter content from a brief
   */
  async generateNewsletterContent(
    publisherId: string,
    brief: string,
    brandVoice?: string,
    targetAudience?: string
  ): Promise<string> {
    const prompt = `
      Create engaging newsletter content based on this brief:
      
      Brief: ${brief}
      Brand Voice: ${brandVoice || "professional and friendly"}
      Target Audience: ${targetAudience || "general subscribers"}
      
      Requirements:
      - Create a compelling introduction
      - Organize content into clear sections
      - Include engaging headlines and subheadings
      - Add call-to-action elements where appropriate
      - Use the specified brand voice consistently
      - Make it scannable with bullet points and short paragraphs
      - Include placeholder for images where relevant
      
      Format as HTML that can be used in an email template.
    `;

    const response = await this.generateContent({
      publisherId,
      contentType: "body",
      prompt,
      context: { brandVoice, targetAudience },
    });

    return response.content;
  }

  /**
   * Analyze and optimize existing content
   */
  async optimizeContent(
    publisherId: string,
    content: string,
    optimizationGoal: "engagement" | "conversions" | "readability" = "engagement"
  ): Promise<{ optimizedContent: string; suggestions: string[] }> {
    const prompt = `
      Analyze and optimize this newsletter content for ${optimizationGoal}:
      
      Current Content:
      ${content}
      
      Please:
      1. Provide an optimized version of the content
      2. List specific suggestions for improvement
      3. Focus on ${optimizationGoal} optimization
      
      Format your response as:
      OPTIMIZED CONTENT:
      [optimized content here]
      
      SUGGESTIONS:
      - [suggestion 1]
      - [suggestion 2]
      - [etc.]
    `;

    const response = await this.generateContent({
      publisherId,
      contentType: "body",
      prompt,
    });

    // Parse the response
    const parts = response.content.split("SUGGESTIONS:");
    const optimizedContent = parts[0]?.replace("OPTIMIZED CONTENT:", "").trim() || content;
    const suggestionsText = parts[1]?.trim() || "";
    const suggestions = suggestionsText
      .split("\n")
      .filter(line => line.trim().startsWith("-"))
      .map(line => line.replace(/^-\s*/, "").trim());

    return {
      optimizedContent,
      suggestions,
    };
  }

  /**
   * Generate content summary for analytics
   */
  async generateContentSummary(publisherId: string, content: string): Promise<string> {
    const prompt = `
      Create a brief summary of this newsletter content for analytics purposes:
      
      Content:
      ${content}
      
      Provide a 1-2 sentence summary that captures the main topics and purpose.
    `;

    const response = await this.generateContent({
      publisherId,
      contentType: "summary",
      prompt,
    });

    return response.content;
  }

  /**
   * Build system prompt based on content type
   */
  private buildSystemPrompt(contentType: string, context?: any): string {
    const basePrompt = "You are an expert newsletter content creator and email marketing specialist.";
    
    switch (contentType) {
      case "subject_line":
        return `${basePrompt} You specialize in creating compelling, click-worthy subject lines that drive high open rates while avoiding spam filters. Focus on clarity, curiosity, and value proposition.`;
      
      case "body":
        return `${basePrompt} You create engaging, well-structured newsletter content that keeps readers interested and drives action. Use clear formatting, compelling headlines, and strategic calls-to-action.`;
      
      case "personalization":
        return `${basePrompt} You excel at personalizing content to make each subscriber feel like the newsletter was written specifically for them. Use subscriber data thoughtfully to create relevant, engaging experiences.`;
      
      case "summary":
        return `${basePrompt} You create concise, accurate summaries that capture the essence of newsletter content for analytics and reporting purposes.`;
      
      default:
        return basePrompt;
    }
  }

  /**
   * Get max tokens based on content type
   */
  private getMaxTokens(contentType: string): number {
    switch (contentType) {
      case "subject_line":
        return 100;
      case "summary":
        return 150;
      case "personalization":
      case "body":
        return 2000;
      default:
        return 1000;
    }
  }

  /**
   * Get temperature based on content type
   */
  private getTemperature(contentType: string): number {
    switch (contentType) {
      case "subject_line":
        return 0.8; // More creative for subject lines
      case "personalization":
        return 0.7; // Somewhat creative for personalization
      case "summary":
        return 0.3; // More factual for summaries
      case "body":
        return 0.6; // Balanced creativity for body content
      default:
        return 0.7;
    }
  }

  /**
   * Calculate confidence score based on OpenAI response
   */
  private calculateConfidence(completion: any): number {
    // Simple confidence calculation based on response characteristics
    const choice = completion.choices[0];
    if (!choice) return 0.5;

    let confidence = 0.8; // Base confidence

    // Adjust based on finish reason
    if (choice.finish_reason === "stop") {
      confidence += 0.1;
    } else if (choice.finish_reason === "length") {
      confidence -= 0.1;
    }

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }
}

export const openaiService = new OpenAIService();

