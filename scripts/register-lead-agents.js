#!/usr/bin/env node

/**
 * Register Lead Agent System for profounder
 * Creates Jordan, Casey, Alex with proper revenue-focused hierarchy
 */

const { convex } = require('convex/server');
const { v } = require('convex/values');

// Connect to Convex
const client = convex({
  address: process.env.CONVEX_URL || 'http://localhost:5173',
  token: process.env.CONVEX_DEPLOYMENT_URL,
});

async function registerLeadAgents() {
  console.log('🚀 Registering Lead Agent System...');

  const agentConfigs = [
    {
      name: 'Jordan',
      emoji: '💰',
      role: 'REVENUE_CONTROLLER',
      leadAgentType: 'REVENUE_CONTROLLER',
      workspacePath: '/Users/jaywest/.openclaw/workspace',
      revenueFocus: 'Overall revenue strategy, budget allocation, performance optimization',
      revenueKpis: ['total_revenue', 'roi', 'efficiency_score', 'revenue_variance'],
      allowedTaskTypes: ['ENGINEERING', 'STRATEGY', 'ANALYTICS', 'OPS'],
      budgetDaily: 20.0,
      budgetPerRun: 3.0,
      canSpawn: true,
      maxSubAgents: 10,
      revenueTargets: {
        monthlyRevenue: 100000,
        customerAcquisition: 50,
        customerRetention: 200,
        customerLifetimeValue: 2500
      }
    },
    {
      name: 'Casey',
      emoji: '❤️',
      role: 'RETENTION_SPECIALIST',
      leadAgentType: 'RETENTION_SPECIALIST',
      workspacePath: '/Users/jaywest/.openclaw/workspace',
      revenueFocus: 'Customer retention, upselling, churn reduction',
      revenueKpis: ['retention_rate', 'upsell_revenue', 'customer_lifetime_value', 'churn_reduction'],
      allowedTaskTypes: ['CONTENT', 'EMAIL_MARKETING', 'CUSTOMER_RESEARCH', 'OPS'],
      budgetDaily: 15.0,
      budgetPerRun: 2.0,
      canSpawn: true,
      maxSubAgents: 8,
      revenueTargets: {
        monthlyRevenue: 30000,
        customerRetention: 150,
        customerLifetimeValue: 1500
      },
      reportsTo: 'Jordan'
    },
    {
      name: 'Alex',
      emoji: '🎯',
      role: 'ACQUISITION_SPECIALIST',
      leadAgentType: 'ACQUISITION_SPECIALIST',
      workspacePath: '/Users/jaywest/.openclaw/workspace',
      revenueFocus: 'Lead generation, customer acquisition, market expansion',
      revenueKpis: ['acquisition_rate', 'lead_quality', 'customer_acquisition_cost', 'new_customer_revenue'],
      allowedTaskTypes: ['SOCIAL', 'CONTENT', 'EMAIL_MARKETING', 'SEO_RESEARCH', 'OPS'],
      budgetDaily: 15.0,
      budgetPerRun: 2.0,
      canSpawn: true,
      maxSubAgents: 8,
      revenueTargets: {
        monthlyRevenue: 40000,
        customerAcquisition: 100
      },
      reportsTo: 'Jordan'
    }
  ];

  try {
    // Register agents
    const agentResults = [];
    for (const config of agentConfigs) {
      const result = await client.runMutation('api.agents.register', {
        name: config.name,
        emoji: config.emoji,
        role: config.role,
        workspacePath: config.workspacePath,
        allowedTaskTypes: config.allowedTaskTypes,
        budgetDaily: config.budgetDaily,
        budgetPerRun: config.budgetPerRun,
        canSpawn: config.canSpawn,
        maxSubAgents: config.maxSubAgents,
        metadata: {
          revenueFocus: config.revenueFocus,
          revenueKpis: config.revenueKpis,
          revenueTargets: config.revenueTargets
        }
      });
      agentResults.push(result);
    }

    // Set up lead agent hierarchy
    const agents = await client.runQuery('api.agents.list');
    
    // Get agent IDs
    const jordan = agents.find(a => a.name === 'Jordan');
    const casey = agents.find(a => a.name === 'Casey');
    const alex = agents.find(a => a.name === 'Alex');

    if (jordan && casey && alex) {
      await client.runMutation('api.leadAgentHierarchy.setup', {
        hierarchy: [
          {
            agentId: jordan._id,
            leadAgentType: 'REVENUE_CONTROLLER',
            hierarchyLevel: 0,
            revenueTargets: agentConfigs[0].revenueTargets
          },
          {
            agentId: casey._id,
            leadAgentType: 'RETENTION_SPECIALIST',
            reportsToAgentId: jordan._id,
            hierarchyLevel: 1,
            revenueTargets: agentConfigs[1].revenueTargets
          },
          {
            agentId: alex._id,
            leadAgentType: 'ACQUISITION_SPECIALIST',
            reportsToAgentId: jordan._id,
            hierarchyLevel: 1,
            revenueTargets: agentConfigs[2].revenueTargets
          }
        ]
      });

      console.log('✅ Lead agent system successfully registered!');
      console.log(`- Jordan (${jordan._id}): Revenue Controller`);
      console.log(`- Casey (${casey._id}): Retention Specialist → reports to Jordan`);
      console.log(`- Alex (${alex._id}): Acquisition Specialist → reports to Jordan`);
      console.log(`\n🔗 Next steps:`);
      console.log(`- Run pnpm run dev:orchestration`);
      console.log(`- Visit http://localhost:5173 for revenue dashboard`);
      console.log(`- Check agent heartbeats with: npx convex run api.agents.heartbeat:0 --agent-id ${jordan._id}`);
    }

  } catch (error) {
    console.error('❌ Failed to register lead agents:', error);
    process.exit(1);
  }
}

async function createLeadAgentMutations() {
  console.log('📊 Creating lead agent mutations...');

  // Create lead agent hierarchy mutations
  const leadAgentHierarchy = {
    setup: {
      args: { hierarchy: v.array(v.object({
        agentId: v.id('agents'),
        leadAgentType: leadAgentType,
        reportsToAgentId: v.optional(v.id('agents')),
        hierarchyLevel: v.number(),
        revenueTargets: v.object({
          monthlyRevenue: v.number(),
          customerAcquisition: v.optional(v.number()),
          customerRetention: v.optional(v.number()),
          customerLifetimeValue: v.optional(v.number()),
        })
      }))},
      handler: async (ctx, args) => {
        const results = [];
        for (const entry of args.hierarchy) {
          const hierarchyId = await ctx.db.insert('leadAgentHierarchies', {
            ...entry,
            responsibilityArea: entry.revenueTargets ? 
              `${entry.leadAgentType} revenue operations` : 
              'Revenue generation',
            currentRevenue: 0,
            revenueVariance: 0
          });
          results.push(hierarchyId);
        }
        return results;
      }
    },

    updateRevenue: {
      args: {
        agentId: v.id('agents'),
        periodType: v.union(v.literal('DAILY'), v.literal('WEEKLY'), v.literal('MONTHLY')),
        revenueAmount: v.number(),
        revenueType: v.union(v.literal('ACQUISITION'), v.literal('RETENTION'), v.literal('EXPANSION'))
      },
      handler: async (ctx, args) => {
        // Update revenue impact records
        const impactedTask = await ctx.db.insert('revenueImpactRecords', {
          agentId: args.agentId,
          attributedRevenue: args.revenueAmount,
          revenueConfidence: 0.8, // Conservative attribution
          impactLevel: 'MEDIUM',
          revenueType: args.revenueType,
          attributionPeriodDays: 30,
          costToRevenueRatio: 0.1, // Will be calculated from actual costs
          roi: 10.0 // Default placeholder
        });

        // Update analytics
        return impactedTask;
      }
    }
  };

  console.log('✅ Lead agent mutations created');
  return leadAgentHierarchy;
}

if (require.main === module) {
  registerLeadAgents().catch(console.error);
}

module.exports = {
  registerLeadAgents,
  createLeadAgentMutations
};