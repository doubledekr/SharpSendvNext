import { Router } from "express";
import { z } from "zod";

const router = Router();

// Email platform configurations
const EMAIL_PLATFORMS = [
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Popular email marketing platform with advanced automation",
    category: "Email Marketing",
    logo: "https://cdn.worldvectorlogo.com/logos/mailchimp-1.svg",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true },
      { name: "server_prefix", label: "Server Prefix (e.g., us1)", type: "text", required: true }
    ],
    status: "available",
    features: ["Lists", "Campaigns", "Automation", "Analytics"]
  },
  {
    id: "iterable",
    name: "Iterable",
    description: "Cross-channel messaging with advanced segmentation",
    category: "Marketing Automation",
    logo: "https://iterable.com/wp-content/uploads/2020/07/iterable-logo.svg",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true }
    ],
    status: "available",
    features: ["Cross-channel", "Real-time", "Templates", "Journey Builder"]
  },
  {
    id: "customer_io",
    name: "Customer.io",
    description: "Omnichannel messaging with behavioral triggers",
    category: "Marketing Automation",
    logo: "https://customer.io/assets/images/logos/customerio-logo.svg",
    authType: "api_key",
    fields: [
      { name: "site_id", label: "Site ID", type: "text", required: true },
      { name: "api_key", label: "API Key", type: "password", required: true }
    ],
    status: "available",
    features: ["Behavioral triggers", "In-app messaging", "Journey automation"]
  },
  {
    id: "keap",
    name: "Keap",
    description: "CRM with sales pipeline and marketing automation",
    category: "CRM + Marketing",
    logo: "https://keap.com/images/keap-logo.svg",
    authType: "oauth",
    fields: [
      { name: "client_id", label: "Client ID", type: "text", required: true },
      { name: "client_secret", label: "Client Secret", type: "password", required: true }
    ],
    status: "available",
    features: ["CRM", "Sales pipeline", "E-commerce", "Marketing automation"]
  },
  {
    id: "sendgrid",
    name: "Twilio SendGrid",
    description: "Reliable email delivery with marketing tools",
    category: "Email Delivery",
    logo: "https://sendgrid.com/wp-content/themes/sgdotcom/pages/resource/brand/2016/SendGrid-Logomark.png",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true }
    ],
    status: "available",
    features: ["Transactional", "Marketing", "Analytics", "Templates"]
  },
  {
    id: "campaign_monitor",
    name: "Campaign Monitor",
    description: "Professional email campaigns with drag-drop editor",
    category: "Email Marketing",
    logo: "https://www.campaignmonitor.com/assets/images/cm-logo.svg",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true }
    ],
    status: "available",
    features: ["Drag-drop editor", "Personalization", "A/B testing", "Analytics"]
  },
  {
    id: "activecampaign",
    name: "ActiveCampaign",
    description: "Marketing automation with CRM features",
    category: "Marketing Automation",
    logo: "https://www.activecampaign.com/images/activecampaign-logo.svg",
    authType: "api_key",
    fields: [
      { name: "api_url", label: "API URL", type: "text", required: true },
      { name: "api_key", label: "API Key", type: "password", required: true }
    ],
    status: "available",
    features: ["Marketing automation", "CRM", "Sales automation", "Messaging"]
  },
  {
    id: "constant_contact",
    name: "Constant Contact",
    description: "Easy-to-use email marketing for small businesses",
    category: "Email Marketing",
    logo: "https://www.constantcontact.com/images/cc-logo.svg",
    authType: "oauth",
    fields: [
      { name: "client_id", label: "Client ID", type: "text", required: true },
      { name: "client_secret", label: "Client Secret", type: "password", required: true }
    ],
    status: "available",
    features: ["Email marketing", "Event marketing", "Social media", "Surveys"]
  },
  {
    id: "mailerlite",
    name: "MailerLite",
    description: "Simple yet powerful email marketing platform",
    category: "Email Marketing",
    logo: "https://www.mailerlite.com/images/mailerlite-logo.svg",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true }
    ],
    status: "available",
    features: ["Email campaigns", "Landing pages", "Pop-ups", "Automation"]
  },
  {
    id: "brevo",
    name: "Brevo (Sendinblue)",
    description: "All-in-one marketing platform with email, SMS, and chat",
    category: "Marketing Platform",
    logo: "https://www.brevo.com/images/brevo-logo.svg",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true }
    ],
    status: "available",
    features: ["Email", "SMS", "Chat", "Marketing automation"]
  },
  {
    id: "sailthru",
    name: "Sailthru",
    description: "Personalization engine for ecommerce",
    category: "Personalization",
    logo: "https://www.sailthru.com/images/sailthru-logo.svg",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true },
      { name: "api_secret", label: "API Secret", type: "password", required: true }
    ],
    status: "available",
    features: ["Personalization", "Predictive analytics", "Behavioral triggers"]
  },
  {
    id: "braze",
    name: "Braze",
    description: "Customer engagement platform for mobile and web",
    category: "Customer Engagement",
    logo: "https://www.braze.com/images/braze-logo.svg",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true },
      { name: "rest_endpoint", label: "REST Endpoint", type: "text", required: true }
    ],
    status: "available",
    features: ["Multi-channel", "Real-time", "Canvas journeys", "Intelligence Suite"]
  },
  {
    id: "substack",
    name: "Substack",
    description: "Newsletter platform for writers and publishers",
    category: "Publishing",
    logo: "https://substackcdn.com/images/substack-logo.svg",
    authType: "custom",
    fields: [
      { name: "publication_url", label: "Publication URL", type: "text", required: true },
      { name: "api_token", label: "API Token", type: "password", required: true }
    ],
    status: "beta",
    features: ["Newsletter publishing", "Paid subscriptions", "Comments", "Podcasts"]
  },
  {
    id: "beehiiv",
    name: "beehiiv",
    description: "Modern newsletter platform with monetization tools",
    category: "Publishing",
    logo: "https://www.beehiiv.com/images/beehiiv-logo.svg",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true }
    ],
    status: "beta",
    features: ["Newsletter tools", "Monetization", "Analytics", "Growth tools"]
  },
  {
    id: "convertkit",
    name: "ConvertKit",
    description: "Email marketing for creators and bloggers",
    category: "Creator Tools",
    logo: "https://convertkit.com/images/convertkit-logo.svg",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true },
      { name: "api_secret", label: "API Secret", type: "password", required: true }
    ],
    status: "available",
    features: ["Email sequences", "Landing pages", "Forms", "Tagging"]
  },
  {
    id: "ghost",
    name: "Ghost Email",
    description: "Built-in email for Ghost publishing platform",
    category: "Publishing",
    logo: "https://ghost.org/images/ghost-logo.svg",
    authType: "api_key",
    fields: [
      { name: "admin_api_key", label: "Admin API Key", type: "password", required: true },
      { name: "api_url", label: "API URL", type: "text", required: true }
    ],
    status: "available",
    features: ["Newsletter", "Membership", "Publishing", "Analytics"]
  }
];

// Mock connected integrations storage
let connectedIntegrations: any[] = [];

// Get all available platforms
router.get("/api/integrations/platforms", (req, res) => {
  res.json({
    platforms: EMAIL_PLATFORMS,
    categories: Array.from(new Set(EMAIL_PLATFORMS.map(p => p.category)))
  });
});

// Get connected integrations
router.get("/api/integrations/connected", (req, res) => {
  res.json({
    integrations: connectedIntegrations
  });
});

// Connect to a platform
router.post("/api/integrations/connect", async (req, res) => {
  try {
    const { platformId, credentials, name } = req.body;
    
    if (!platformId || !credentials) {
      return res.status(400).json({ error: "Platform ID and credentials are required" });
    }

    const platform = EMAIL_PLATFORMS.find(p => p.id === platformId);
    if (!platform) {
      return res.status(404).json({ error: "Platform not found" });
    }

    // Validate required fields
    const missingFields = platform.fields
      .filter(field => field.required && !credentials[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(", ")}` 
      });
    }

    // In a real app, you would validate the credentials here
    // For demo, we'll simulate a connection
    const connection = {
      id: `conn_${Date.now()}`,
      platformId,
      name: name || platform.name,
      platform: platform.name,
      status: "connected",
      connectedAt: new Date().toISOString(),
      lastSync: new Date().toISOString(),
      stats: {
        subscribers: Math.floor(Math.random() * 50000) + 1000,
        campaigns: Math.floor(Math.random() * 100) + 10,
        openRate: (Math.random() * 0.3 + 0.15).toFixed(3), // 15-45%
        clickRate: (Math.random() * 0.1 + 0.02).toFixed(3)  // 2-12%
      }
    };

    connectedIntegrations.push(connection);

    res.json({
      success: true,
      connection,
      message: `Successfully connected to ${platform.name}`
    });
  } catch (error) {
    console.error("Error connecting integration:", error);
    res.status(500).json({ error: "Failed to connect integration" });
  }
});

// Disconnect from a platform
router.delete("/api/integrations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const index = connectedIntegrations.findIndex(conn => conn.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: "Integration not found" });
    }

    const connection = connectedIntegrations[index];
    connectedIntegrations.splice(index, 1);

    res.json({
      success: true,
      message: `Disconnected from ${connection.platform}`
    });
  } catch (error) {
    console.error("Error disconnecting integration:", error);
    res.status(500).json({ error: "Failed to disconnect integration" });
  }
});

// Test connection
router.post("/api/integrations/:id/test", async (req, res) => {
  try {
    const { id } = req.params;
    const connection = connectedIntegrations.find(conn => conn.id === id);
    
    if (!connection) {
      return res.status(404).json({ error: "Integration not found" });
    }

    // Simulate connection test
    const isSuccess = Math.random() > 0.1; // 90% success rate for demo
    
    if (isSuccess) {
      connection.lastSync = new Date().toISOString();
      res.json({
        success: true,
        message: "Connection test successful",
        lastSync: connection.lastSync
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Connection test failed - please check your credentials"
      });
    }
  } catch (error) {
    console.error("Error testing connection:", error);
    res.status(500).json({ error: "Failed to test connection" });
  }
});

// Sync data from platform
router.post("/api/integrations/:id/sync", async (req, res) => {
  try {
    const { id } = req.params;
    const connection = connectedIntegrations.find(conn => conn.id === id);
    
    if (!connection) {
      return res.status(404).json({ error: "Integration not found" });
    }

    // Simulate sync with random updates
    connection.lastSync = new Date().toISOString();
    connection.stats.subscribers += Math.floor(Math.random() * 100);
    connection.stats.campaigns += Math.floor(Math.random() * 2);

    res.json({
      success: true,
      message: "Data sync completed",
      stats: connection.stats,
      lastSync: connection.lastSync
    });
  } catch (error) {
    console.error("Error syncing integration:", error);
    res.status(500).json({ error: "Failed to sync data" });
  }
});

// Request custom integration
router.post("/api/integrations/request", async (req, res) => {
  try {
    const { platform, description, email, useCase } = req.body;
    
    if (!platform || !email) {
      return res.status(400).json({ error: "Platform name and email are required" });
    }

    // In a real app, you'd store this request and notify your team
    console.log("Custom integration request:", { platform, description, email, useCase });

    res.json({
      success: true,
      message: "Integration request submitted successfully. Our team will review and contact you within 2-3 business days."
    });
  } catch (error) {
    console.error("Error submitting integration request:", error);
    res.status(500).json({ error: "Failed to submit request" });
  }
});

export default router;