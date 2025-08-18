import crypto from 'crypto';
import { db } from '../db';
import { 
  campaignProjects, 
  emailAssignments,
  assignmentLinks,
  campaignCollaborators,
  type CampaignProject,
  type EmailAssignment,
  type AssignmentLink,
  type CampaignCollaborator
} from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface CampaignProjectInput {
  publisherId: string;
  name: string;
  description?: string;
  targetAudience: {
    cohorts: string[];
    estimatedReach: number;
    segmentCriteria: Record<string, any>;
  };
  timeline: {
    dueDate: string;
    publishDate: string;
    milestones: Array<{ name: string; date: string; completed: boolean }>;
  };
  createdBy: string;
}

export interface EmailAssignmentInput {
  campaignProjectId: string;
  assigneeEmail: string;
  assigneeName?: string;
  assignmentType: 'email_content' | 'subject_line' | 'email_design' | 'content_review' | 'fact_check';
  briefing: {
    instructions: string;
    targetCohort: string;
    keyPoints: string[];
    tone: string;
    requirements: Record<string, any>;
  };
  expiresAt?: Date;
}

export interface AssignmentSubmission {
  subject: string;
  content: string;
  metadata: Record<string, any>;
}

export class CampaignManagementService {
  
  /**
   * Create a new campaign project
   */
  async createCampaignProject(input: CampaignProjectInput): Promise<CampaignProject> {
    const [project] = await db
      .insert(campaignProjects)
      .values({
        publisherId: input.publisherId,
        name: input.name,
        description: input.description,
        status: 'draft',
        targetAudience: input.targetAudience,
        timeline: input.timeline,
        createdBy: input.createdBy,
        updatedAt: new Date(),
      })
      .returning();

    return project;
  }

  /**
   * Get campaign projects for a publisher
   */
  async getCampaignProjects(publisherId: string): Promise<CampaignProject[]> {
    return await db
      .select()
      .from(campaignProjects)
      .where(eq(campaignProjects.publisherId, publisherId))
      .orderBy(desc(campaignProjects.createdAt));
  }

  /**
   * Get campaign project with assignments
   */
  async getCampaignProjectWithDetails(projectId: string): Promise<{
    project: CampaignProject;
    assignments: EmailAssignment[];
  } | null> {
    const project = await db
      .select()
      .from(campaignProjects)
      .where(eq(campaignProjects.id, projectId))
      .limit(1);

    if (!project[0]) return null;

    const assignments = await db
      .select()
      .from(emailAssignments)
      .where(eq(emailAssignments.campaignProjectId, projectId))
      .orderBy(desc(emailAssignments.createdAt));

    return {
      project: project[0],
      assignments
    };
  }

  /**
   * Create email assignment with unique token
   */
  async createEmailAssignment(input: EmailAssignmentInput): Promise<{
    assignment: EmailAssignment;
    uniqueLink: string;
  }> {
    // Generate unique token
    const uniqueToken = crypto.randomBytes(32).toString('hex');
    
    // Set expiration (default 7 days from now)
    const expiresAt = input.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [assignment] = await db
      .insert(emailAssignments)
      .values({
        campaignProjectId: input.campaignProjectId,
        uniqueToken,
        assigneeEmail: input.assigneeEmail,
        assigneeName: input.assigneeName,
        assignmentType: input.assignmentType,
        status: 'pending',
        briefing: input.briefing,
        expiresAt,
        updatedAt: new Date(),
      })
      .returning();

    // Create assignment link for tracking
    const linkToken = crypto.randomBytes(16).toString('hex');
    await db
      .insert(assignmentLinks)
      .values({
        assignmentId: assignment.id,
        token: linkToken,
        accessCount: 0,
        isActive: true,
      });

    // Generate unique link URL
    const uniqueLink = `/assignment/${uniqueToken}`;

    return { assignment, uniqueLink };
  }

  /**
   * Get assignment by token (for external access)
   */
  async getAssignmentByToken(token: string, ipAddress?: string): Promise<{
    assignment: EmailAssignment;
    project: CampaignProject;
  } | null> {
    const assignment = await db
      .select()
      .from(emailAssignments)
      .where(eq(emailAssignments.uniqueToken, token))
      .limit(1);

    if (!assignment[0]) return null;

    // Check if assignment is still active and not expired
    if (assignment[0].expiresAt && new Date() > assignment[0].expiresAt) {
      return null;
    }

    // Get project details
    const project = await db
      .select()
      .from(campaignProjects)
      .where(eq(campaignProjects.id, assignment[0].campaignProjectId))
      .limit(1);

    if (!project[0]) return null;

    // Update access tracking
    if (ipAddress) {
      await this.trackAssignmentAccess(assignment[0].id, ipAddress);
    }

    return {
      assignment: assignment[0],
      project: project[0]
    };
  }

  /**
   * Submit assignment content
   */
  async submitAssignmentContent(
    token: string, 
    submission: AssignmentSubmission
  ): Promise<EmailAssignment | null> {
    const assignment = await db
      .select()
      .from(emailAssignments)
      .where(eq(emailAssignments.uniqueToken, token))
      .limit(1);

    if (!assignment[0]) return null;

    // Check if assignment is still active
    if (assignment[0].expiresAt && new Date() > assignment[0].expiresAt) {
      return null;
    }

    const [updatedAssignment] = await db
      .update(emailAssignments)
      .set({
        submittedContent: {
          subject: submission.subject,
          content: submission.content,
          metadata: submission.metadata,
          submittedAt: new Date().toISOString(),
        },
        status: 'submitted',
        updatedAt: new Date(),
      })
      .where(eq(emailAssignments.uniqueToken, token))
      .returning();

    return updatedAssignment;
  }

  /**
   * Review and approve/reject assignment
   */
  async reviewAssignment(
    assignmentId: string,
    feedback: {
      comments: string;
      approved: boolean;
      revisionRequests: string[];
      reviewedBy: string;
    }
  ): Promise<EmailAssignment | null> {
    const newStatus = feedback.approved ? 'approved' : 'revision_requested';

    const [updatedAssignment] = await db
      .update(emailAssignments)
      .set({
        feedback: {
          comments: feedback.comments,
          approved: feedback.approved,
          revisionRequests: feedback.revisionRequests,
          reviewedBy: feedback.reviewedBy,
          reviewedAt: new Date().toISOString(),
        },
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(emailAssignments.id, assignmentId))
      .returning();

    return updatedAssignment[0] || null;
  }

  /**
   * Add collaborator to campaign project
   */
  async addCollaborator(input: {
    campaignProjectId: string;
    collaboratorEmail: string;
    collaboratorName?: string;
    role: 'copywriter' | 'editor' | 'designer' | 'reviewer' | 'project_manager';
    permissions: {
      canEdit: boolean;
      canReview: boolean;
      canApprove: boolean;
      canAssign: boolean;
    };
  }): Promise<CampaignCollaborator> {
    const [collaborator] = await db
      .insert(campaignCollaborators)
      .values({
        campaignProjectId: input.campaignProjectId,
        collaboratorEmail: input.collaboratorEmail,
        collaboratorName: input.collaboratorName,
        role: input.role,
        permissions: input.permissions,
        status: 'invited',
      })
      .returning();

    return collaborator;
  }

  /**
   * Update campaign project status
   */
  async updateCampaignStatus(
    projectId: string, 
    status: 'draft' | 'in_progress' | 'review' | 'approved' | 'scheduled' | 'sent' | 'cancelled'
  ): Promise<CampaignProject | null> {
    const [updatedProject] = await db
      .update(campaignProjects)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(campaignProjects.id, projectId))
      .returning();

    return updatedProject || null;
  }

  /**
   * Get campaign analytics and status
   */
  async getCampaignAnalytics(projectId: string): Promise<{
    totalAssignments: number;
    completedAssignments: number;
    pendingAssignments: number;
    submittedAssignments: number;
    approvedAssignments: number;
    revisionRequests: number;
    averageCompletionTime: number;
    collaboratorActivity: Array<{
      email: string;
      name: string;
      role: string;
      assignmentsCompleted: number;
      lastActivity: Date;
    }>;
  }> {
    const assignments = await db
      .select()
      .from(emailAssignments)
      .where(eq(emailAssignments.campaignProjectId, projectId));

    const collaborators = await db
      .select()
      .from(campaignCollaborators)
      .where(eq(campaignCollaborators.campaignProjectId, projectId));

    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.status === 'completed').length;
    const pendingAssignments = assignments.filter(a => a.status === 'pending').length;
    const submittedAssignments = assignments.filter(a => a.status === 'submitted').length;
    const approvedAssignments = assignments.filter(a => a.status === 'approved').length;
    const revisionRequests = assignments.filter(a => a.status === 'revision_requested').length;

    // Calculate average completion time
    const completedWithTime = assignments.filter(a => 
      a.status === 'completed' && a.submittedContent?.submittedAt
    );
    const averageCompletionTime = completedWithTime.length > 0
      ? completedWithTime.reduce((sum, assignment) => {
          const created = assignment.createdAt.getTime();
          const submitted = new Date(assignment.submittedContent!.submittedAt).getTime();
          return sum + (submitted - created);
        }, 0) / completedWithTime.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Build collaborator activity
    const collaboratorActivity = collaborators.map(collab => {
      const collaboratorAssignments = assignments.filter(a => a.assigneeEmail === collab.collaboratorEmail);
      const completedCount = collaboratorAssignments.filter(a => a.status === 'completed').length;
      const lastAssignment = collaboratorAssignments
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

      return {
        email: collab.collaboratorEmail,
        name: collab.collaboratorName || 'Unknown',
        role: collab.role,
        assignmentsCompleted: completedCount,
        lastActivity: lastAssignment?.updatedAt || collab.invitedAt
      };
    });

    return {
      totalAssignments,
      completedAssignments,
      pendingAssignments,
      submittedAssignments,
      approvedAssignments,
      revisionRequests,
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      collaboratorActivity
    };
  }

  /**
   * Send assignment notification email (placeholder for email service)
   */
  async sendAssignmentNotification(assignment: EmailAssignment, uniqueLink: string): Promise<void> {
    // This would integrate with an email service like SendGrid, Mailgun, etc.
    // For now, we'll log the notification details
    console.log(`Assignment notification for ${assignment.assigneeEmail}:`);
    console.log(`- Assignment: ${assignment.assignmentType}`);
    console.log(`- Link: ${uniqueLink}`);
    console.log(`- Expires: ${assignment.expiresAt}`);
  }

  /**
   * Track assignment link access
   */
  private async trackAssignmentAccess(assignmentId: string, ipAddress: string): Promise<void> {
    const links = await db
      .select()
      .from(assignmentLinks)
      .where(eq(assignmentLinks.assignmentId, assignmentId));

    if (links.length > 0) {
      const link = links[0];
      const updatedIps = [...(link.ipAddresses || []), ipAddress]
        .filter((ip, index, array) => array.indexOf(ip) === index); // Remove duplicates

      await db
        .update(assignmentLinks)
        .set({
          accessCount: (link.accessCount || 0) + 1,
          lastAccessedAt: new Date(),
          ipAddresses: updatedIps,
        })
        .where(eq(assignmentLinks.id, link.id));
    }
  }
}