import { createCohortEngine } from './services/cohort-engine';

// Demo script to test cohort personalization and individual targeting
async function demoCohortWorkflow() {
  console.log('🎯 Starting Cohort Personalization Demo...\n');

  const publisherId = 'demo';
  const cohortEngine = createCohortEngine(publisherId);

  try {
    // 1. Analyze Individual Subscriber Behavior
    console.log('👤 Analyzing individual subscriber behavior...');
    const subscriberId = 'demo_subscriber_1';
    const profile = await cohortEngine.analyzeSubscriberBehavior(subscriberId);
    
    console.log('Subscriber Profile:', {
      id: profile.id,
      riskTolerance: profile.riskTolerance,
      experienceLevel: profile.experienceLevel,
      engagementScore: profile.engagementScore.toFixed(1),
      sectors: profile.sectors,
      communicationStyle: profile.communicationStyle
    });
    console.log('');

    // 2. Generate Dynamic Cohorts
    console.log('🎯 Generating dynamic cohorts...');
    const cohorts = await cohortEngine.generateDynamicCohorts();
    
    console.log(`Generated ${cohorts.length} cohorts:`);
    cohorts.forEach((cohort, index) => {
      console.log(`${index + 1}. ${cohort.name} (${cohort.size} subscribers)`);
      console.log(`   Description: ${cohort.description}`);
      console.log(`   Avg Engagement: ${(cohort.engagementMetrics.averageEngagement).toFixed(1)}%`);
      console.log(`   Preferred Topics: ${cohort.contentPreferences.preferredTopics.join(', ')}`);
      console.log('');
    });

    // 3. Individual Personalization
    console.log('✨ Creating individual personalization...');
    const baseContent = `
Dear Investor,

This week's market analysis reveals significant opportunities in the technology sector. 
Our research team has identified several key trends that could impact your portfolio:

• AI infrastructure spending continues to accelerate
• Semiconductor demand remains strong despite supply chain challenges  
• Cloud computing adoption shows no signs of slowing

We recommend reviewing your tech allocation and considering these developments 
in your investment strategy.

Best regards,
The Investment Team
`;

    const baseSubject = 'Weekly Tech Sector Analysis: Key Opportunities Ahead';
    
    const personalization = await cohortEngine.personalizeForIndividual(
      subscriberId,
      baseContent,
      baseSubject
    );

    console.log('Individual Personalization Results:');
    console.log(`Original Subject: ${baseSubject}`);
    console.log(`Personalized Subject: ${personalization.personalizedSubject}`);
    console.log(`Personalized CTA: ${personalization.personalizedCTA}`);
    console.log(`Send Time: ${new Date(personalization.sendTime).toLocaleString()}`);
    console.log(`Reasoning: ${personalization.reasoning}`);
    console.log(`Confidence Score: ${(personalization.confidenceScore * 100).toFixed(1)}%`);
    console.log('');

    // 4. Behavior Prediction
    console.log('🔮 Predicting subscriber behavior...');
    const predictions = await cohortEngine.predictSubscriberBehavior(subscriberId);
    
    console.log('Behavior Predictions:');
    console.log(`Churn Probability: ${(predictions.churnProbability * 100).toFixed(1)}%`);
    console.log(`Engagement Prediction: ${(predictions.engagementPrediction * 100).toFixed(1)}%`);
    console.log(`Lifetime Value: $${predictions.lifetimeValuePrediction.toFixed(2)}`);
    console.log(`Optimal Frequency: ${predictions.optimalFrequency}`);
    console.log(`Content Recommendations: ${predictions.contentRecommendations.join(', ')}`);
    console.log('');

    // 5. Cohort-Specific Personalization Rules
    console.log('📋 Creating personalization rules for cohorts...');
    const sampleCohort = cohorts.find(c => c.id === 'conservative_investors');
    if (sampleCohort) {
      const rules = await cohortEngine.createPersonalizationRules(sampleCohort.id);
      
      console.log(`Personalization Rules for "${sampleCohort.name}":`);
      rules.forEach((rule, index) => {
        console.log(`${index + 1}. ${rule.type}: ${rule.action}`);
        console.log(`   Condition: ${rule.condition}`);
        console.log(`   Priority: ${rule.priority}`);
      });
      console.log('');
    }

    // 6. Cohort Performance Analysis
    console.log('📊 Analyzing cohort performance...');
    const topCohorts = cohorts
      .sort((a, b) => b.engagementMetrics.averageEngagement - a.engagementMetrics.averageEngagement)
      .slice(0, 3);

    console.log('Top Performing Cohorts:');
    topCohorts.forEach((cohort, index) => {
      console.log(`${index + 1}. ${cohort.name}`);
      console.log(`   Size: ${cohort.size} subscribers`);
      console.log(`   Avg Engagement: ${cohort.engagementMetrics.averageEngagement.toFixed(1)}%`);
      console.log(`   Open Rate: ${(cohort.engagementMetrics.averageOpenRate * 100).toFixed(1)}%`);
      console.log(`   Click Rate: ${(cohort.engagementMetrics.averageClickRate * 100).toFixed(1)}%`);
      console.log(`   Churn Rate: ${(cohort.engagementMetrics.churnRate * 100).toFixed(1)}%`);
      console.log('');
    });

    // 7. Segmentation Insights
    console.log('🎯 Segmentation Insights:');
    const totalSubscribers = cohorts.reduce((sum, cohort) => sum + cohort.size, 0);
    
    const riskDistribution = {
      conservative: cohorts.filter(c => c.id.includes('conservative')).reduce((sum, c) => sum + c.size, 0),
      moderate: cohorts.filter(c => c.id.includes('moderate')).reduce((sum, c) => sum + c.size, 0),
      aggressive: cohorts.filter(c => c.id.includes('aggressive')).reduce((sum, c) => sum + c.size, 0)
    };

    console.log('Risk Tolerance Distribution:');
    Object.entries(riskDistribution).forEach(([risk, count]) => {
      const percentage = ((count / totalSubscribers) * 100).toFixed(1);
      console.log(`- ${risk.charAt(0).toUpperCase() + risk.slice(1)}: ${count} (${percentage}%)`);
    });
    console.log('');

    // 8. Personalization Impact Simulation
    console.log('💰 Personalization Impact Simulation:');
    const baseEngagement = 0.45; // 45% baseline engagement
    const personalizedEngagement = cohorts.reduce((sum, cohort) => 
      sum + (cohort.engagementMetrics.averageEngagement * cohort.size), 0
    ) / totalSubscribers;

    const improvementPercentage = ((personalizedEngagement - baseEngagement) / baseEngagement * 100);
    const revenueImpact = totalSubscribers * 50 * (improvementPercentage / 100); // $50 per subscriber improvement

    console.log(`Baseline Engagement: ${(baseEngagement * 100).toFixed(1)}%`);
    console.log(`Personalized Engagement: ${(personalizedEngagement * 100).toFixed(1)}%`);
    console.log(`Improvement: +${improvementPercentage.toFixed(1)}%`);
    console.log(`Estimated Monthly Revenue Impact: $${revenueImpact.toFixed(2)}`);
    console.log(`Estimated Annual Revenue Impact: $${(revenueImpact * 12).toFixed(2)}`);
    console.log('');

    console.log('✅ Cohort Personalization Demo Complete!');
    console.log('\n🎯 Summary:');
    console.log(`- Analyzed ${totalSubscribers} subscribers across ${cohorts.length} dynamic cohorts`);
    console.log(`- Generated individual personalization with ${(personalization.confidenceScore * 100).toFixed(1)}% confidence`);
    console.log(`- Predicted ${(predictions.churnProbability * 100).toFixed(1)}% churn probability for sample subscriber`);
    console.log(`- Created ${rules?.length || 0} personalization rules for cohort optimization`);
    console.log(`- Projected ${improvementPercentage.toFixed(1)}% engagement improvement through personalization`);

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demoCohortWorkflow().catch(console.error);
}

export { demoCohortWorkflow };

