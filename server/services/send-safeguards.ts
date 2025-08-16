import { createHash } from 'crypto';

interface SendRecord {
  campaignId: string;
  recipientIds: string[];
  contentHash: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
}

interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason?: string;
  lastSentAt?: Date;
  similarCampaigns?: string[];
}

export class SendSafeguardService {
  private sendHistory: Map<string, SendRecord> = new Map();
  private recipientCooldowns: Map<string, Date> = new Map();
  private pendingSends: Map<string, SendRecord> = new Map();
  
  // Configuration
  private readonly MIN_SEND_INTERVAL_HOURS = 4; // Minimum hours between sends to same recipient
  private readonly DUPLICATE_CONTENT_THRESHOLD = 0.9; // 90% similarity threshold
  private readonly SEND_CONFIRMATION_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor() {
    // Initialize with some historical data for demo
    this.initializeDemoData();
    
    // Start monitoring pending sends
    this.startPendingSendMonitor();
  }

  private initializeDemoData() {
    // Add some sample historical sends
    const demoSend: SendRecord = {
      campaignId: 'camp-001',
      recipientIds: ['user-001', 'user-002', 'user-003'],
      contentHash: this.hashContent('Market Alert: Fed Decision'),
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'sent',
      retryCount: 0
    };
    
    this.sendHistory.set(demoSend.campaignId, demoSend);
  }

  async checkForDuplicates(
    campaignId: string,
    recipientIds: string[],
    content: string
  ): Promise<DuplicateCheckResult> {
    const contentHash = this.hashContent(content);
    const now = new Date();

    // Check 1: Exact duplicate campaign
    if (this.sendHistory.has(campaignId)) {
      const previousSend = this.sendHistory.get(campaignId)!;
      if (previousSend.status === 'sent') {
        return {
          isDuplicate: true,
          reason: 'Campaign already sent',
          lastSentAt: previousSend.timestamp
        };
      }
    }

    // Check 2: Recent sends to same recipients
    const recentRecipients: string[] = [];
    for (const recipientId of recipientIds) {
      const lastSent = this.recipientCooldowns.get(recipientId);
      if (lastSent) {
        const hoursSinceLastSend = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastSend < this.MIN_SEND_INTERVAL_HOURS) {
          recentRecipients.push(recipientId);
        }
      }
    }

    if (recentRecipients.length > recipientIds.length * 0.5) {
      return {
        isDuplicate: true,
        reason: `Over 50% of recipients received an email within ${this.MIN_SEND_INTERVAL_HOURS} hours`,
        lastSentAt: this.recipientCooldowns.get(recentRecipients[0])
      };
    }

    // Check 3: Similar content recently sent
    const similarCampaigns = this.findSimilarCampaigns(contentHash);
    if (similarCampaigns.length > 0) {
      const recentSimilar = similarCampaigns.filter(id => {
        const send = this.sendHistory.get(id)!;
        const hoursSinceSent = (now.getTime() - send.timestamp.getTime()) / (1000 * 60 * 60);
        return hoursSinceSent < 24; // Within last 24 hours
      });

      if (recentSimilar.length > 0) {
        return {
          isDuplicate: true,
          reason: 'Very similar content was sent recently',
          similarCampaigns: recentSimilar,
          lastSentAt: this.sendHistory.get(recentSimilar[0])?.timestamp
        };
      }
    }

    // Check 4: Pending send with same campaign
    if (this.pendingSends.has(campaignId)) {
      return {
        isDuplicate: true,
        reason: 'Campaign is already queued for sending',
        lastSentAt: this.pendingSends.get(campaignId)?.timestamp
      };
    }

    return { isDuplicate: false };
  }

  async initiateSend(
    campaignId: string,
    recipientIds: string[],
    content: string,
    forceOverride: boolean = false
  ): Promise<{ success: boolean; message: string; requiresConfirmation?: boolean }> {
    // Check for duplicates unless force override
    if (!forceOverride) {
      const duplicateCheck = await this.checkForDuplicates(campaignId, recipientIds, content);
      
      if (duplicateCheck.isDuplicate) {
        return {
          success: false,
          message: duplicateCheck.reason!,
          requiresConfirmation: true
        };
      }
    }

    // Create send record
    const sendRecord: SendRecord = {
      campaignId,
      recipientIds,
      contentHash: this.hashContent(content),
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0
    };

    // Add to pending sends
    this.pendingSends.set(campaignId, sendRecord);

    // Simulate send process
    setTimeout(() => {
      this.completeSend(campaignId);
    }, 2000);

    return {
      success: true,
      message: `Campaign ${campaignId} queued for sending to ${recipientIds.length} recipients`
    };
  }

  private completeSend(campaignId: string) {
    const sendRecord = this.pendingSends.get(campaignId);
    if (!sendRecord) return;

    // Update status
    sendRecord.status = 'sent';
    
    // Move from pending to history
    this.pendingSends.delete(campaignId);
    this.sendHistory.set(campaignId, sendRecord);
    
    // Update recipient cooldowns
    const now = new Date();
    for (const recipientId of sendRecord.recipientIds) {
      this.recipientCooldowns.set(recipientId, now);
    }

    console.log(`Campaign ${campaignId} sent successfully`);
  }

  async retrySend(campaignId: string): Promise<{ success: boolean; message: string }> {
    const sendRecord = this.sendHistory.get(campaignId) || this.pendingSends.get(campaignId);
    
    if (!sendRecord) {
      return {
        success: false,
        message: 'Campaign not found'
      };
    }

    if (sendRecord.status === 'sent') {
      return {
        success: false,
        message: 'Campaign already sent successfully'
      };
    }

    if (sendRecord.retryCount >= this.MAX_RETRY_ATTEMPTS) {
      return {
        success: false,
        message: `Maximum retry attempts (${this.MAX_RETRY_ATTEMPTS}) reached`
      };
    }

    // Increment retry count and attempt send
    sendRecord.retryCount++;
    sendRecord.status = 'pending';
    this.pendingSends.set(campaignId, sendRecord);

    setTimeout(() => {
      this.completeSend(campaignId);
    }, 2000);

    return {
      success: true,
      message: `Retry attempt ${sendRecord.retryCount} initiated`
    };
  }

  getSendStatus(campaignId: string): SendRecord | undefined {
    return this.sendHistory.get(campaignId) || this.pendingSends.get(campaignId);
  }

  getPendingSends(): SendRecord[] {
    return Array.from(this.pendingSends.values());
  }

  getRecentSends(hours: number = 24): SendRecord[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.sendHistory.values())
      .filter(send => send.timestamp > cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private hashContent(content: string): string {
    return createHash('md5').update(content).digest('hex');
  }

  private findSimilarCampaigns(contentHash: string): string[] {
    const similar: string[] = [];
    
    for (const [campaignId, record] of this.sendHistory) {
      // Simple hash comparison for demo
      // In production, would use more sophisticated similarity algorithms
      if (record.contentHash === contentHash) {
        similar.push(campaignId);
      }
    }
    
    return similar;
  }

  private startPendingSendMonitor() {
    setInterval(() => {
      // Check for stuck pending sends
      const now = Date.now();
      for (const [campaignId, record] of this.pendingSends) {
        const timePending = now - record.timestamp.getTime();
        
        if (timePending > this.SEND_CONFIRMATION_TIMEOUT) {
          console.warn(`Campaign ${campaignId} stuck in pending state - attempting retry`);
          this.retrySend(campaignId);
        }
      }
    }, 10000); // Check every 10 seconds
  }

  // Analytics methods
  getDuplicatePreventionStats(): {
    duplicatesPrevented: number;
    cooldownViolations: number;
    successfulSends: number;
    failedSends: number;
  } {
    const stats = {
      duplicatesPrevented: 0,
      cooldownViolations: 0,
      successfulSends: 0,
      failedSends: 0
    };

    for (const record of this.sendHistory.values()) {
      if (record.status === 'sent') {
        stats.successfulSends++;
      } else if (record.status === 'failed') {
        stats.failedSends++;
      }
      
      if (record.retryCount > 0) {
        stats.duplicatesPrevented++;
      }
    }

    return stats;
  }

  // Clear old records to prevent memory buildup
  cleanupOldRecords(daysToKeep: number = 30) {
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    for (const [campaignId, record] of this.sendHistory) {
      if (record.timestamp < cutoff) {
        this.sendHistory.delete(campaignId);
      }
    }

    for (const [recipientId, lastSent] of this.recipientCooldowns) {
      if (lastSent < cutoff) {
        this.recipientCooldowns.delete(recipientId);
      }
    }
  }
}

// Export singleton instance
export const sendSafeguards = new SendSafeguardService();