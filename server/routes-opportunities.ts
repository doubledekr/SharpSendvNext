import { Router } from "express";
import { db } from "./db";
import { opportunities } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import demoDataService from "./services/demo-data-service";

const router = Router();

// Helper function to extract publisher ID from JWT token
function getPublisherIdFromToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  
  try {
    const token = authHeader.substring(7);
    // JWT format - decode the payload
    if (token.includes('.')) {
      const [, payload] = token.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      return decoded.publisherId;
    }
  } catch (e) {
    return null;
  }
  return null;
}

// Get all opportunities for a publisher
router.get("/api/opportunities", async (req, res) => {
  try {
    // Get publisher ID from JWT token
    const publisherId = getPublisherIdFromToken(req.headers.authorization as string);
    
    // If demo account, return demo opportunities
    if (publisherId === demoDataService.getDemoPublisherId()) {
      const demoOpportunities = demoDataService.getOpportunities(publisherId);
      return res.json(demoOpportunities);
    }
    
    // For real users, return empty array or fetch from database
    if (!publisherId) {
      return res.json([]);
    }
    
    const result = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.publisherId, publisherId))
      .orderBy(desc(opportunities.createdAt));
    
    // Convert decimal potentialValue strings to numbers for frontend
    const formattedResult = result.map(opp => ({
      ...opp,
      potentialValue: opp.potentialValue ? parseFloat(opp.potentialValue as string) : 0
    }));
    
    res.json(formattedResult);
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    res.status(500).json({ error: "Failed to fetch opportunities" });
  }
});

// Get single opportunity
router.get("/api/opportunities/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const publisherId = "demo-publisher";
    
    const [opportunity] = await db
      .select()
      .from(opportunities)
      .where(and(
        eq(opportunities.id, id),
        eq(opportunities.publisherId, publisherId)
      ))
      .limit(1);
    
    if (!opportunity) {
      return res.status(404).json({ error: "Opportunity not found" });
    }
    
    // Convert decimal potentialValue string to number for frontend
    const formattedOpportunity = {
      ...opportunity,
      potentialValue: opportunity.potentialValue ? parseFloat(opportunity.potentialValue as string) : 0
    };
    
    res.json(formattedOpportunity);
  } catch (error) {
    console.error("Error fetching opportunity:", error);
    res.status(500).json({ error: "Failed to fetch opportunity" });
  }
});

// Create new opportunity
router.post("/api/opportunities", async (req, res) => {
  try {
    const publisherId = "demo-publisher";
    const {
      title,
      description,
      type,
      potentialValue,
      probability,
      contactName,
      contactEmail,
      contactCompany,
      nextAction,
      nextActionDate,
      notes,
      relatedAssignmentId,
    } = req.body;
    
    const [newOpportunity] = await db
      .insert(opportunities)
      .values({
        publisherId,
        title,
        description,
        type,
        status: "identified",
        potentialValue: potentialValue ? String(potentialValue) : undefined,
        probability,
        contactName,
        contactEmail,
        contactCompany,
        nextAction,
        nextActionDate: nextActionDate ? new Date(nextActionDate) : undefined,
        notes,
        relatedAssignmentId,
        source: "manual",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    // Convert decimal potentialValue string to number for frontend
    const formattedOpportunity = {
      ...newOpportunity,
      potentialValue: newOpportunity.potentialValue ? parseFloat(newOpportunity.potentialValue as string) : 0
    };
    
    res.json(formattedOpportunity);
  } catch (error) {
    console.error("Error creating opportunity:", error);
    res.status(500).json({ error: "Failed to create opportunity" });
  }
});

// Update opportunity
router.patch("/api/opportunities/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const publisherId = "demo-publisher";
    const updates = req.body;
    
    // Add updatedAt timestamp
    updates.updatedAt = new Date();
    
    // Handle status change to won/lost
    if (updates.status === "won" || updates.status === "lost") {
      updates.closedAt = new Date();
    }
    
    const [updatedOpportunity] = await db
      .update(opportunities)
      .set(updates)
      .where(and(
        eq(opportunities.id, id),
        eq(opportunities.publisherId, publisherId)
      ))
      .returning();
    
    if (!updatedOpportunity) {
      return res.status(404).json({ error: "Opportunity not found" });
    }
    
    // Convert decimal potentialValue string to number for frontend
    const formattedOpportunity = {
      ...updatedOpportunity,
      potentialValue: updatedOpportunity.potentialValue ? parseFloat(updatedOpportunity.potentialValue as string) : 0
    };
    
    res.json(formattedOpportunity);
  } catch (error) {
    console.error("Error updating opportunity:", error);
    res.status(500).json({ error: "Failed to update opportunity" });
  }
});

// Delete opportunity
router.delete("/api/opportunities/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const publisherId = "demo-publisher";
    
    const result = await db
      .delete(opportunities)
      .where(and(
        eq(opportunities.id, id),
        eq(opportunities.publisherId, publisherId)
      ));
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting opportunity:", error);
    res.status(500).json({ error: "Failed to delete opportunity" });
  }
});

export default router;