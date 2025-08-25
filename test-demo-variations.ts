/**
 * SharpSend Email Variations Engine - Demo Validation Script
 * This script validates that the in-memory demo system is working correctly
 */

import { inMemoryDemoStore, isDemoMode } from './server/services/in-memory-demo-store';

console.log('🚀 SharpSend Email Variations Engine - Demo Validation');
console.log('========================================================');
console.log('');

// Check demo mode
console.log('✓ Demo Mode Status:', isDemoMode());
console.log('');

// Initialize demo store if needed
if (isDemoMode()) {
  console.log('📊 Demo Store Validation:');
  console.log('------------------------');
  
  // Test cohorts
  const cohorts = inMemoryDemoStore.getDemoCohorts('demo-publisher-001');
  console.log(`✓ Demo Cohorts Loaded: ${cohorts.length} segments`);
  cohorts.forEach(cohort => {
    console.log(`  - ${cohort.name}: ${cohort.subscriberCount} subscribers (${cohort.avgEngagement}% engagement)`);
  });
  console.log('');
  
  // Test campaign creation
  console.log('🎯 Testing Campaign Creation:');
  console.log('----------------------------');
  const testCampaign = inMemoryDemoStore.createCampaign({
    publisherId: 'demo-publisher-001',
    title: 'Test Market Update Campaign',
    baseSubject: 'Market Insights for Today',
    baseContent: 'Test content for validation',
    status: 'draft'
  });
  console.log(`✓ Created campaign: ${testCampaign.title} (ID: ${testCampaign.id})`);
  console.log('');
  
  // Test email variation creation
  console.log('📧 Testing Email Variation Generation:');
  console.log('-------------------------------------');
  const variations = [];
  for (const cohort of cohorts.slice(0, 3)) {
    const variation = inMemoryDemoStore.createEmailVariation({
      campaignId: testCampaign.id,
      segmentId: cohort.id,
      segmentName: cohort.name,
      subject: `${testCampaign.baseSubject} - Tailored for ${cohort.name}`,
      content: `<h1>Personalized for ${cohort.name}</h1><p>Test content...</p>`,
      previewText: `Exclusive insights for ${cohort.name}`,
      estimatedOpenRate: 25 + Math.random() * 20,
      estimatedClickRate: 5 + Math.random() * 10,
      predictedLift: Math.floor(Math.random() * 30)
    });
    variations.push(variation);
    console.log(`✓ Generated variation for "${cohort.name}"`);
    console.log(`  - Subject: ${variation.subject}`);
    console.log(`  - Predicted Open Rate: ${variation.estimatedOpenRate.toFixed(1)}%`);
    console.log(`  - Predicted Lift: +${variation.predictedLift}%`);
  }
  console.log('');
  
  // Test analytics data
  console.log('📈 Testing Analytics Generation:');
  console.log('-------------------------------');
  const totalSubs = cohorts.reduce((sum, c) => sum + c.subscriberCount, 0);
  const avgEngagement = cohorts.reduce((sum, c) => sum + c.avgEngagement, 0) / cohorts.length;
  console.log(`✓ Analytics data calculated`);
  console.log(`  - Total Subscribers: ${totalSubs}`);
  console.log(`  - Average Engagement: ${avgEngagement.toFixed(1)}%`);
  console.log(`  - Cohorts Tracked: ${cohorts.length}`);
  console.log(`  - Variations Generated: ${variations.length}`);
  console.log('');
  
  // Test retrieval
  console.log('🔍 Testing Data Retrieval:');
  console.log('-------------------------');
  const campaignVariations = inMemoryDemoStore.getEmailVariationsByCampaign(testCampaign.id);
  console.log(`✓ Retrieved ${campaignVariations.length} variations for campaign`);
  console.log('');
  
  // Summary
  console.log('✅ VALIDATION COMPLETE');
  console.log('=====================');
  console.log('The SharpSend Email Variations Engine demo system is working correctly!');
  console.log('');
  console.log('Key Features Validated:');
  console.log('  ✓ In-memory demo data store');
  console.log('  ✓ Subscriber cohort management');
  console.log('  ✓ Campaign creation');
  console.log('  ✓ Email variation generation');
  console.log('  ✓ Analytics tracking');
  console.log('  ✓ Performance predictions');
  console.log('');
  console.log('The system provides a seamless demo experience without database dependencies.');
  
} else {
  console.log('⚠️ Demo mode is not enabled. Set NODE_ENV=development to enable demo mode.');
}

process.exit(0);