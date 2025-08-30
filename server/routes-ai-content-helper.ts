import type { Express } from "express";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function registerAIContentHelperRoutes(app: Express) {
  // AI Content Helper - Generate subject lines and content based on assignment brief
  app.post('/api/ai/content-helper', async (req, res) => {
    try {
      const { assignmentId, brief, marketContext, existingSubject, existingContent } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
          error: "OpenAI API key not configured",
          subjects: [],
          contents: []
        });
      }

      // Build context for AI from assignment brief and market data
      const contextParts = [];
      
      if (brief?.objective) {
        contextParts.push(`Objective: ${brief.objective}`);
      }
      
      if (brief?.angle) {
        contextParts.push(`Angle: ${brief.angle}`);
      }
      
      if (brief?.keyPoints && brief.keyPoints.length > 0) {
        contextParts.push(`Key Points: ${brief.keyPoints.join(', ')}`);
      }
      
      if (brief?.offer?.label && brief.offer?.url) {
        contextParts.push(`Call-to-Action: ${brief.offer.label} (${brief.offer.url})`);
      }
      
      if (marketContext) {
        contextParts.push(`Market Context: ${JSON.stringify(marketContext)}`);
      }

      const context = contextParts.join('\n');
      
      // Generate subject line suggestions
      const subjectPrompt = `Based on this newsletter assignment context:

${context}

Generate 3 compelling email subject lines for financial newsletter subscribers. The subject lines should be:
- Attention-grabbing and specific to the content
- Professional but engaging
- Under 60 characters
- Focused on the value proposition for investors

${existingSubject ? `Current subject: "${existingSubject}" - provide alternatives that improve on this.` : ''}

Return only the subject lines, one per line, without numbers or bullet points.`;

      const subjectResponse = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released recently. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: subjectPrompt }],
        max_tokens: 200,
        temperature: 0.7,
      });

      const subjects = subjectResponse.choices[0].message.content
        ?.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0) || [];

      // Generate content suggestions  
      const contentPrompt = `Based on this newsletter assignment context:

${context}

Write 2 email newsletter content variations for financial newsletter subscribers. Each should be:
- Professional, informative, and engaging
- 150-300 words
- Include the key points naturally
- End with a clear call-to-action
- Use plain text without markdown formatting (no ##, **, etc.)
- Tailored for investors interested in this topic

${existingContent ? `Current content exists - provide fresh alternatives that cover the same topics differently.` : ''}

Return each content variation separated by "---CONTENT---"`;

      const contentResponse = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released recently. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: contentPrompt }],
        max_tokens: 800,
        temperature: 0.7,
      });

      const contents = contentResponse.choices[0].message.content
        ?.split('---CONTENT---')
        .map(content => content.trim())
        .filter(content => content.length > 0) || [];

      console.log(`AI Content Helper generated ${subjects.length} subjects and ${contents.length} contents for assignment ${assignmentId}`);

      res.json({
        subjects: subjects.slice(0, 3), // Limit to 3 subjects
        contents: contents.slice(0, 2), // Limit to 2 content variations
        assignmentId,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('AI Content Helper error:', error);
      res.status(500).json({ 
        error: 'Failed to generate AI content suggestions',
        subjects: [],
        contents: []
      });
    }
  });
}