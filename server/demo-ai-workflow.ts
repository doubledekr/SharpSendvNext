import { createAIContentProcessor } from './services/ai-content-processor';
import { MarketIntelligenceService } from './services/market-intelligence';

// Demo script to test AI content processing workflow
async function demoAIWorkflow() {
  console.log('🚀 Starting AI Content Processing Demo...\n');

  const publisherId = 'demo';
  const aiProcessor = createAIContentProcessor(publisherId);
  const marketService = MarketIntelligenceService(publisherId);

  // Sample content for testing
  const sampleContent = `
Dear Investors,

This week's market analysis reveals significant opportunities in the technology sector following NVIDIA's exceptional earnings report. The AI revolution continues to drive unprecedented growth, with several key indicators pointing to sustained momentum.

Key Highlights:
- NVIDIA reported 122% year-over-year revenue growth
- AI infrastructure spending increased 45% across major cloud providers
- Semiconductor demand remains robust with 6-month backlogs

Investment Recommendations:
1. Consider increasing exposure to AI infrastructure plays
2. Monitor semiconductor supply chain improvements
3. Evaluate cloud computing leaders for long-term positions

Market volatility remains elevated, but fundamentals support continued growth in the AI ecosystem. We recommend a balanced approach with emphasis on quality names with strong competitive moats.

Best regards,
The Investment Team
`;

  const sampleSubject = 'Weekly Tech Outlook: AI Revolution Drives Growth Opportunities';
  const targetAudience = 'Tech-focused growth investors';

  try {
    // 1. Content Analysis
    console.log('📊 Analyzing content...');
    const analysis = await aiProcessor.analyzeContent(sampleContent, sampleSubject);
    console.log('Analysis Results:', {
      sentimentScore: analysis.sentimentScore,
      readabilityScore: analysis.readabilityScore,
      engagementPrediction: analysis.engagementPrediction,
      keyTopics: analysis.keyTopics,
      emotionalTone: analysis.emotionalTone
    });
    console.log('');

    // 2. Subject Line Variations
    console.log('✨ Generating subject line variations...');
    const variations = await aiProcessor.generateSubjectLineVariations(
      sampleSubject, 
      sampleContent, 
      targetAudience
    );
    console.log('Subject Line Variations:');
    variations.forEach((variation, index) => {
      console.log(`${index + 1}. [${variation.style}] ${variation.text}`);
      console.log(`   Predicted Open Rate: ${(variation.predictedOpenRate * 100).toFixed(1)}%`);
      console.log(`   Reasoning: ${variation.reasoning}\n`);
    });

    // 3. Content Suggestions
    console.log('💡 Generating content suggestions...');
    const suggestions = await aiProcessor.generateContentSuggestions(
      sampleContent, 
      targetAudience
    );
    console.log('Content Improvement Suggestions:');
    suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
    console.log('');

    // 4. Market Intelligence
    console.log('📈 Fetching market intelligence...');
    const marketContext = await marketService.getMarketContext(['technology'], 'medium');
    console.log('Market Context:');
    console.log(`- News Articles: ${marketContext.relevantNews.length}`);
    console.log(`- Market Data Points: ${marketContext.marketData.length}`);
    console.log(`- Sector Performance: ${marketContext.sectorPerformance.length} sectors`);
    console.log(`- Market Sentiment: ${marketContext.sentiment.overall}`);
    console.log(`- Volatility Index: ${marketContext.volatilityIndex}`);
    console.log('Key Insights:', marketContext.keyInsights);
    console.log('');

    // 5. Cohort Personalization
    console.log('🎯 Personalizing for different cohorts...');
    const sampleCohorts = [
      {
        id: 'conservative_investors',
        name: 'Conservative Investors',
        size: 8420,
        characteristics: ['Low risk tolerance', 'Income focused', 'Age 45+'],
        riskTolerance: 'low',
        investmentFocus: 'income'
      },
      {
        id: 'growth_seekers',
        name: 'Growth Seekers',
        size: 12300,
        characteristics: ['High risk tolerance', 'Growth focused', 'Age 25-40'],
        riskTolerance: 'high',
        investmentFocus: 'growth'
      }
    ];

    const personalizations = await aiProcessor.personalizeForCohorts(
      sampleContent, 
      sampleSubject, 
      sampleCohorts
    );

    personalizations.forEach((personalization, index) => {
      console.log(`Cohort ${index + 1}: ${personalization.cohortName}`);
      console.log(`Subject: ${personalization.personalizedSubject}`);
      console.log(`Engagement Prediction: ${(personalization.engagementPrediction * 100).toFixed(1)}%`);
      console.log(`Reasoning: ${personalization.reasoning}`);
      console.log('---');
    });

    // 6. Send Time Optimization
    console.log('⏰ Optimizing send timing...');
    const timing = await aiProcessor.optimizeSendTiming(
      sampleContent, 
      targetAudience, 
      analysis.urgencyLevel
    );
    console.log('Optimal Send Time:', timing.recommendedTime);
    console.log('Reasoning:', timing.reasoning);
    console.log('Alternative Times:', timing.alternativeTimes);
    console.log('');

    // 7. Market Context Enhancement
    console.log('🔄 Enhancing content with market context...');
    const enhancement = await aiProcessor.enhanceWithMarketContext(sampleContent, {
      relevantNews: marketContext.relevantNews.map(n => n.title),
      marketTrends: marketContext.keyInsights,
      sectorPerformance: Object.fromEntries(
        marketContext.sectorPerformance.map(s => [s.sector, s.performance])
      ),
      volatilityIndex: marketContext.volatilityIndex,
      sentimentIndicators: [marketContext.sentiment.overall]
    });

    console.log('Market Relevance Score:', enhancement.marketRelevanceScore);
    console.log('Added Insights:', enhancement.addedInsights);
    console.log('');

    console.log('✅ AI Content Processing Demo Complete!');
    console.log('\n🎯 Summary:');
    console.log(`- Content analyzed with ${(analysis.sentimentScore * 100).toFixed(1)}% positive sentiment`);
    console.log(`- ${variations.length} subject line variations generated`);
    console.log(`- ${suggestions.length} improvement suggestions provided`);
    console.log(`- ${personalizations.length} cohort personalizations created`);
    console.log(`- Market context integrated with ${enhancement.marketRelevanceScore * 100}% relevance`);
    console.log(`- Optimal send time: ${timing.recommendedTime}`);

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demoAIWorkflow().catch(console.error);
}

export { demoAIWorkflow };

