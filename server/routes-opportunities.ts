import { Router } from "express";
import { db } from "./db";
import { opportunities } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// Get all opportunities for a publisher
router.get("/api/opportunities", async (req, res) => {
  try {
    // Check if the user is authenticated
    const user = (req as any).session?.user;
    
    // For demo users, return demo opportunities
    if (user?.id === 'demo-user' || user?.id === 'demo-user-id') {
      return res.json([
        {
          id: "demo-opp-1",
          title: "Partner with FinTech Weekly",
          description: "Potential newsletter sponsorship opportunity",
          type: "sponsorship",
          status: "qualified",
          potentialValue: 50000,
          probability: 75,
          contactCompany: "FinTech Weekly",
          nextActionDate: new Date("2025-02-01"),
          createdAt: new Date("2025-01-10")
        },
        {
          id: "demo-opp-2",
          title: "Enterprise License Deal - Hedge Fund",
          description: "Large hedge fund interested in platform license",
          type: "enterprise",
          status: "negotiation",
          potentialValue: 250000,
          probability: 60,
          contactCompany: "Alpha Capital Partners",
          nextActionDate: new Date("2025-01-28"),
          createdAt: new Date("2025-01-05")
        }
      ]);
    }
    
    // For real users, use their actual publisher ID or return empty
    const publisherId = user?.publisherId || user?.publisher?.id;
    
    if (!publisherId || publisherId === "demo-publisher") {
      // Return empty array for non-demo accounts without proper publisher
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