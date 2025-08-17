import { db } from '../database';
import { 
  campaignProjects, 
  emailAssignments,
  type CampaignProject,
  type EmailAssignment
} from '../../shared/schema-multitenant';
import { eq, desc } from 'drizzle-orm';

export class CampaignManagementService {
  
  /**
   * Get campaign projects for a publisher
   */
  async getCampaignProjects(publisherId: string): Promise<CampaignProject[]> {
    try {
      const projects = await db
        .select()
        .from(campaignProjects)
        .where(eq(campaignProjects.publisherId, publisherId))
        .orderBy(desc(campaignProjects.createdAt));
      
      return projects;
    } catch (error) {
      console.error('Error fetching campaign projects:', error);
      return [];
    }
  }

  /**
   * Get all campaign projects (for demo)
   */
  async getAllCampaignProjects(): Promise<CampaignProject[]> {
    try {
      const projects = await db
        .select()
        .from(campaignProjects)
        .orderBy(desc(campaignProjects.createdAt));
      
      return projects;
    } catch (error) {
      console.error('Error fetching all campaign projects:', error);
      return [];
    }
  }

  /**
   * Get campaign project with assignments
   */
  async getCampaignProjectWithDetails(projectId: string): Promise<{
    project: CampaignProject;
    assignments: EmailAssignment[];
  } | null> {
    try {
      const project = await db
        .select()
        .from(campaignProjects)
        .where(eq(campaignProjects.id, projectId))
        .limit(1);

      if (!project[0]) return null;

      const assignments = await db
        .select()
        .from(emailAssignments)
        .where(eq(emailAssignments.projectId, projectId))
        .orderBy(desc(emailAssignments.createdAt));

      return {
        project: project[0],
        assignments
      };
    } catch (error) {
      console.error('Error fetching campaign project details:', error);
      return null;
    }
  }

  /**
   * Get assignments for a campaign project
   */
  async getProjectAssignments(projectId: string): Promise<EmailAssignment[]> {
    try {
      const assignments = await db
        .select()
        .from(emailAssignments)
        .where(eq(emailAssignments.projectId, projectId))
        .orderBy(desc(emailAssignments.createdAt));
      
      return assignments;
    } catch (error) {
      console.error('Error fetching project assignments:', error);
      return [];
    }
  }

  /**
   * Update campaign project status
   */
  async updateProjectStatus(projectId: string, status: string): Promise<CampaignProject | null> {
    try {
      const [updated] = await db
        .update(campaignProjects)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(campaignProjects.id, projectId))
        .returning();
      
      return updated;
    } catch (error) {
      console.error('Error updating project status:', error);
      return null;
    }
  }

  /**
   * Update assignment status
   */
  async updateAssignmentStatus(assignmentId: string, status: string): Promise<EmailAssignment | null> {
    try {
      const [updated] = await db
        .update(emailAssignments)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(emailAssignments.id, assignmentId))
        .returning();
      
      return updated;
    } catch (error) {
      console.error('Error updating assignment status:', error);
      return null;
    }
  }
}