import { Router } from "express";

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
    description: "Professional email campaigns with elegant design tools",
    category: "Email Marketing",
    logo: "https://www.campaignmonitor.com/assets/images/brand-assets/campaign-monitor-logo.svg",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true }
    ],
    status: "available",
    features: ["Professional designs", "Automation", "Analytics", "Personalization"]
  },
  {
    id: "activecampaign",
    name: "ActiveCampaign",
    description: "Customer experience automation with advanced segmentation",
    category: "Marketing Automation",
    logo: "https://www.activecampaign.com/site/assets/activecampaign-logo.svg",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true },
      { name: "account_url", label: "Account URL", type: "text", required: true }
    ],
    status: "available",
    features: ["CX Automation", "Segmentation", "Machine learning", "Attribution"]
  },
  {
    id: "constant_contact",
    name: "Constant Contact",
    description: "Easy-to-use email marketing with social media integration",
    category: "Email Marketing",
    logo: "https://www.constantcontact.com/images/header/ctct-logo.svg",
    authType: "oauth",
    fields: [
      { name: "client_id", label: "Client ID", type: "text", required: true },
      { name: "client_secret", label: "Client Secret", type: "password", required: true }
    ],
    status: "available",
    features: ["Social integration", "Event marketing", "E-commerce", "Surveys"]
  },
  {
    id: "mailerlite",
    name: "MailerLite",
    description: "Simple email marketing with powerful automation",
    category: "Email Marketing",
    logo: "https://www.mailerlite.com/images/mailerlite-logo.svg",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true }
    ],
    status: "available",
    features: ["Drag & drop editor", "Automation", "Landing pages", "Pop-ups"]
  },
  {
    id: "brevo",
    name: "Brevo (Sendinblue)",
    description: "Complete digital marketing platform with SMS",
    category: "Multi-channel",
    logo: "https://www.brevo.com/images/brevo-logo.svg",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true }
    ],
    status: "available",
    features: ["Email & SMS", "Chat", "CRM", "Marketing automation"]
  },
  {
    id: "sailthru",
    name: "Sailthru",
    description: "Personalization-focused email marketing with predictive analytics",
    category: "Personalization",
    logo: "https://www.sailthru.com/wp-content/uploads/2020/06/sailthru-logo.svg",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true },
      { name: "api_secret", label: "API Secret", type: "password", required: true }
    ],
    status: "available",
    features: ["Predictive analytics", "Personalization", "Behavioral targeting", "Lifecycle optimization"]
  },
  {
    id: "braze",
    name: "Braze",
    description: "Comprehensive customer engagement platform",
    category: "Customer Engagement",
    logo: "https://www.braze.com/images/braze-logo.svg",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true },
      { name: "endpoint", label: "REST Endpoint", type: "text", required: true }
    ],
    status: "available",
    features: ["Multi-channel", "Real-time", "Canvas journey", "Advanced analytics"]
  },
  {
    id: "substack",
    name: "Substack",
    description: "Newsletter publishing platform with built-in payments",
    category: "Newsletter Platform",
    logo: "https://substackapi.com/images/substack-logo.svg",
    authType: "oauth",
    fields: [
      { name: "publication_url", label: "Publication URL", type: "text", required: true }
    ],
    status: "beta",
    features: ["Publishing", "Subscriptions", "Payments", "Analytics"]
  },
  {
    id: "beehiiv",
    name: "beehiiv",
    description: "Newsletter platform with monetization and growth tools",
    category: "Newsletter Platform",
    logo: "https://www.beehiiv.com/images/beehiiv-logo.svg",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true }
    ],
    status: "beta",
    features: ["Newsletter creation", "Monetization", "Growth tools", "Analytics"]
  },
  {
    id: "convertkit",
    name: "ConvertKit",
    description: "Creator-focused email marketing with powerful automation",
    category: "Creator Tools",
    logo: "https://convertkit.com/images/convertkit-logo.svg",
    authType: "api_key",
    fields: [
      { name: "api_key", label: "API Key", type: "password", required: true },
      { name: "api_secret", label: "API Secret", type: "password", required: true }
    ],
    status: "available",
    features: ["Creator tools", "Visual automation", "Tagging", "Commerce integration"]
  },
  {
    id: "ghost_email",
    name: "Ghost Email",
    description: "Newsletter feature of Ghost publishing platform",
    category: "Publishing Platform",
    logo: "https://ghost.org/images/logos/ghost-logo.svg",
    authType: "api_key",
    fields: [
      { name: "admin_api_key", label: "Admin API Key", type: "password", required: true },
      { name: "api_url", label: "API URL", type: "text", required: true }
    ],
    status: "beta",
    features: ["Publishing", "Membership", "Newsletters", "SEO optimization"]
  }
];

// Mock connected integrations storage
let connectedIntegrations: any[] = [];

// Get all available platforms
router.get("/api/integrations/platforms", (req, res) => {
  try {
    res.json({
      success: true,
      platforms: EMAIL_PLATFORMS,
      categories: Array.from(new Set(EMAIL_PLATFORMS.map(p => p.category)))
    });
  } catch (error) {
    console.error("Error fetching platforms:", error);
    res.status(500).json({ success: false, error: "Failed to fetch platforms" });
  }
});

// Get connected integrations
router.get("/api/integrations/connected", (req, res) => {
  try {
    res.json({
      success: true,
      integrations: connectedIntegrations
    });
  } catch (error) {
    console.error("Error fetching connected integrations:", error);
    res.status(500).json({ success: false, error: "Failed to fetch connected integrations" });
  }
});

// Connect to a platform
router.post("/api/integrations/connect", (req, res) => {
  try {
    const { platformId, credentials, config } = req.body;
    
    if (!platformId || !credentials) {
      return res.status(400).json({
        success: false,
        error: "Platform ID and credentials are required"
      });
    }

    const platform = EMAIL_PLATFORMS.find(p => p.id === platformId);
    if (!platform) {
      return res.status(404).json({
        success: false,
        error: "Platform not found"
      });
    }

    // Simulate connection
    const newIntegration = {
      id: `integration-${Date.now()}`,
      platformId,
      platformName: platform.name,
      isConnected: true,
      status: "active",
      connectedAt: new Date().toISOString(),
      lastSync: new Date().toISOString(),
      config: config || {}
    };

    connectedIntegrations.push(newIntegration);

    res.json({
      success: true,
      integration: newIntegration,
      message: `Successfully connected to ${platform.name}`
    });
  } catch (error) {
    console.error("Error connecting platform:", error);
    res.status(500).json({
      success: false,
      error: "Failed to connect platform"
    });
  }
});

// Test connection
router.post("/api/integrations/test", (req, res) => {
  try {
    const { platformId, credentials } = req.body;
    
    if (!platformId || !credentials) {
      return res.status(400).json({
        success: false,
        error: "Platform ID and credentials are required"
      });
    }

    const platform = EMAIL_PLATFORMS.find(p => p.id === platformId);
    if (!platform) {
      return res.status(404).json({
        success: false,
        error: "Platform not found"
      });
    }

    // Simulate test
    res.json({
      success: true,
      message: `Connection test successful for ${platform.name}`,
      capabilities: platform.features
    });
  } catch (error) {
    console.error("Error testing connection:", error);
    res.status(500).json({
      success: false,
      error: "Failed to test connection"
    });
  }
});

// Disconnect from a platform
router.delete("/api/integrations/:id", (req, res) => {
  try {
    const { id } = req.params;
    
    const integrationIndex = connectedIntegrations.findIndex(i => i.id === id);
    if (integrationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Integration not found"
      });
    }

    const integration = connectedIntegrations[integrationIndex];
    connectedIntegrations.splice(integrationIndex, 1);

    res.json({
      success: true,
      message: `Successfully disconnected from ${integration.platformName}`
    });
  } catch (error) {
    console.error("Error disconnecting platform:", error);
    res.status(500).json({
      success: false,
      error: "Failed to disconnect platform"
    });
  }
});

// Sync data from a platform
router.post("/api/integrations/:id/sync", (req, res) => {
  try {
    const { id } = req.params;
    
    const integration = connectedIntegrations.find(i => i.id === id);
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: "Integration not found"
      });
    }

    // Update last sync time
    integration.lastSync = new Date().toISOString();

    res.json({
      success: true,
      message: `Successfully synced data from ${integration.platformName}`,
      lastSync: integration.lastSync
    });
  } catch (error) {
    console.error("Error syncing platform data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync platform data"
    });
  }
});

// Request custom integration
router.post("/api/integrations/request-custom", (req, res) => {
  try {
    const { platformName, contactEmail, requirements } = req.body;
    
    if (!platformName || !contactEmail) {
      return res.status(400).json({
        success: false,
        error: "Platform name and contact email are required"
      });
    }

    // In a real app, this would create a support ticket or send an email
    console.log("Custom integration request:", { platformName, contactEmail, requirements });

    res.json({
      success: true,
      message: "Custom integration request submitted successfully. Our team will contact you within 2 business days."
    });
  } catch (error) {
    console.error("Error requesting custom integration:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit custom integration request"
    });
  }
});

export default router;