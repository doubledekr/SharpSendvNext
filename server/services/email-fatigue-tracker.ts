/**
 * Email Fatigue Tracking Service
 * Monitors email frequency to prevent subscriber burnout
 */

interface EmailFrequency {
  subscriberId: string;
  email: string;
  dailyCount: number;
  weeklyCount: number;
  lastEmailSent: Date;
  fatigueScore: number; // 0-100, higher = more fatigued
  segment?: string;
  cohort?: string;
}

interface FatigueThresholds {
  dailyLimit: number;
  weeklyLimit: number;
  warningThreshold: number; // Percentage of limit (e.g., 80%)
}

interface FatigueAlert {
  type: 'individual' | 'segment' | 'cohort';
  entityId: string;
  entityName: string;
  currentCount: number;
  limit: number;
  timeframe: 'daily' | 'weekly';
  severity: 'warning' | 'critical' | 'blocked';
  affectedSubscribers: number;
  recommendation: string;
}

export class EmailFatigueTracker {
  private static instance: EmailFatigueTracker;
  
  // Default thresholds - can be customized per publisher
  private defaultThresholds: FatigueThresholds = {
    dailyLimit: 3,
    weeklyLimit: 10,
    warningThreshold: 80
  };
  
  // Guardrails enabled/disabled state
  private guardrailsEnabled: boolean = true;
  
  // In-memory storage for demo (would use database in production)
  private emailHistory: Map<string, EmailFrequency> = new Map();
  private segmentStats: Map<string, { daily: number; weekly: number; subscribers: Set<string> }> = new Map();
  private cohortStats: Map<string, { daily: number; weekly: number; subscribers: Set<string> }> = new Map();
  
  private constructor() {
    this.initializeDemoData();
  }
  
  public static getInstance(): EmailFatigueTracker {
    if (!EmailFatigueTracker.instance) {
      EmailFatigueTracker.instance = new EmailFatigueTracker();
    }
    return EmailFatigueTracker.instance;
  }
  
  /**
   * Initialize with demo data
   */
  private initializeDemoData() {
    const demoSubscribers = [
      { id: 'sub-1', email: 'john@example.com', segment: 'Active Traders', cohort: 'High Engagement', daily: 2, weekly: 7 },
      { id: 'sub-2', email: 'jane@example.com', segment: 'Conservative', cohort: 'Medium Engagement', daily: 1, weekly: 4 },
      { id: 'sub-3', email: 'bob@example.com', segment: 'Active Traders', cohort: 'High Engagement', daily: 3, weekly: 11 },
      { id: 'sub-4', email: 'alice@example.com', segment: 'Growth Investors', cohort: 'Low Engagement', daily: 0, weekly: 2 },
      { id: 'sub-5', email: 'charlie@example.com', segment: 'Conservative', cohort: 'Medium Engagement', daily: 2, weekly: 9 },
    ];
    
    demoSubscribers.forEach(sub => {
      const frequency: EmailFrequency = {
        subscriberId: sub.id,
        email: sub.email,
        dailyCount: sub.daily,
        weeklyCount: sub.weekly,
        lastEmailSent: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        fatigueScore: this.calculateFatigueScore(sub.daily, sub.weekly),
        segment: sub.segment,
        cohort: sub.cohort
      };
      
      this.emailHistory.set(sub.id, frequency);
      
      // Update segment stats
      if (sub.segment) {
        if (!this.segmentStats.has(sub.segment)) {
          this.segmentStats.set(sub.segment, { daily: 0, weekly: 0, subscribers: new Set() });
        }
        const segStats = this.segmentStats.get(sub.segment)!;
        segStats.daily += sub.daily;
        segStats.weekly += sub.weekly;
        segStats.subscribers.add(sub.id);
      }
      
      // Update cohort stats
      if (sub.cohort) {
        if (!this.cohortStats.has(sub.cohort)) {
          this.cohortStats.set(sub.cohort, { daily: 0, weekly: 0, subscribers: new Set() });
        }
        const cohStats = this.cohortStats.get(sub.cohort)!;
        cohStats.daily += sub.daily;
        cohStats.weekly += sub.weekly;
        cohStats.subscribers.add(sub.id);
      }
    });
  }
  
  /**
   * Calculate fatigue score (0-100)
   */
  private calculateFatigueScore(dailyCount: number, weeklyCount: number): number {
    const dailyScore = (dailyCount / this.defaultThresholds.dailyLimit) * 50;
    const weeklyScore = (weeklyCount / this.defaultThresholds.weeklyLimit) * 50;
    return Math.min(100, Math.round(dailyScore + weeklyScore));
  }
  
  /**
   * Check fatigue status for a subscriber
   */
  public checkSubscriberFatigue(subscriberId: string): EmailFrequency | null {
    return this.emailHistory.get(subscriberId) || null;
  }
  
  /**
   * Get tired list - subscribers approaching or exceeding limits
   */
  public getTiredList(): Array<EmailFrequency & { status: 'warning' | 'critical' | 'blocked' }> {
    const tiredList: Array<EmailFrequency & { status: 'warning' | 'critical' | 'blocked' }> = [];
    
    this.emailHistory.forEach(frequency => {
      let status: 'warning' | 'critical' | 'blocked' | null = null;
      
      if (frequency.dailyCount >= this.defaultThresholds.dailyLimit) {
        status = 'blocked';
      } else if (frequency.weeklyCount >= this.defaultThresholds.weeklyLimit) {
        status = 'blocked';
      } else if (frequency.fatigueScore >= 80) {
        status = 'critical';
      } else if (frequency.fatigueScore >= 60) {
        status = 'warning';
      }
      
      if (status) {
        tiredList.push({ ...frequency, status });
      }
    });
    
    return tiredList.sort((a, b) => b.fatigueScore - a.fatigueScore);
  }
  
  /**
   * Get fatigue alerts for segments and cohorts
   */
  public getFatigueAlerts(): FatigueAlert[] {
    const alerts: FatigueAlert[] = [];
    
    // Check individual subscribers
    this.emailHistory.forEach((frequency, subscriberId) => {
      if (frequency.dailyCount >= this.defaultThresholds.dailyLimit) {
        alerts.push({
          type: 'individual',
          entityId: subscriberId,
          entityName: frequency.email,
          currentCount: frequency.dailyCount,
          limit: this.defaultThresholds.dailyLimit,
          timeframe: 'daily',
          severity: 'blocked',
          affectedSubscribers: 1,
          recommendation: 'This subscriber has reached daily limit. Skip them in today\'s campaigns.'
        });
      } else if (frequency.weeklyCount >= this.defaultThresholds.weeklyLimit * 0.9) {
        alerts.push({
          type: 'individual',
          entityId: subscriberId,
          entityName: frequency.email,
          currentCount: frequency.weeklyCount,
          limit: this.defaultThresholds.weeklyLimit,
          timeframe: 'weekly',
          severity: 'critical',
          affectedSubscribers: 1,
          recommendation: 'Approaching weekly limit. Consider excluding from non-essential emails.'
        });
      }
    });
    
    // Check segments
    this.segmentStats.forEach((stats, segmentName) => {
      const avgDaily = stats.daily / stats.subscribers.size;
      const avgWeekly = stats.weekly / stats.subscribers.size;
      
      if (avgDaily >= this.defaultThresholds.dailyLimit * 0.8) {
        alerts.push({
          type: 'segment',
          entityId: segmentName,
          entityName: segmentName,
          currentCount: Math.round(avgDaily * 10) / 10,
          limit: this.defaultThresholds.dailyLimit,
          timeframe: 'daily',
          severity: avgDaily >= this.defaultThresholds.dailyLimit ? 'critical' : 'warning',
          affectedSubscribers: stats.subscribers.size,
          recommendation: `${segmentName} segment averaging ${this.formatFrequencyRange(avgDaily)} emails/day. Consider spreading sends.`
        });
      }
    });
    
    // Check cohorts
    this.cohortStats.forEach((stats, cohortName) => {
      const avgWeekly = stats.weekly / stats.subscribers.size;
      
      if (avgWeekly >= this.defaultThresholds.weeklyLimit * 0.8) {
        alerts.push({
          type: 'cohort',
          entityId: cohortName,
          entityName: cohortName,
          currentCount: Math.round(avgWeekly * 10) / 10,
          limit: this.defaultThresholds.weeklyLimit,
          timeframe: 'weekly',
          severity: avgWeekly >= this.defaultThresholds.weeklyLimit ? 'critical' : 'warning',
          affectedSubscribers: stats.subscribers.size,
          recommendation: `${cohortName} cohort at ${this.formatFrequencyRange(avgWeekly)} emails/week. Reduce frequency.`
        });
      }
    });
    
    return alerts.sort((a, b) => {
      const severityOrder = { blocked: 0, critical: 1, warning: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
  
  /**
   * Get dashboard statistics
   */
  public getDashboardStats() {
    const tiredList = this.getTiredList();
    const alerts = this.getFatigueAlerts();
    
    return {
      guardrailsEnabled: this.guardrailsEnabled,
      totalSubscribers: this.emailHistory.size,
      tiredSubscribers: tiredList.length,
      blockedToday: this.guardrailsEnabled ? tiredList.filter(s => s.status === 'blocked').length : 0,
      warningCount: alerts.filter(a => a.severity === 'warning').length,
      criticalCount: alerts.filter(a => a.severity === 'critical').length,
      averageFatigueScore: Math.round(
        Array.from(this.emailHistory.values()).reduce((sum, f) => sum + f.fatigueScore, 0) / 
        this.emailHistory.size
      ),
      topTiredSegments: Array.from(this.segmentStats.entries())
        .map(([name, stats]) => ({
          name,
          avgDaily: stats.daily / stats.subscribers.size,
          avgWeekly: stats.weekly / stats.subscribers.size,
          subscribers: stats.subscribers.size
        }))
        .sort((a, b) => b.avgWeekly - a.avgWeekly)
        .slice(0, 3),
      recommendations: this.generateRecommendations(tiredList, alerts)
    };
  }
  
  /**
   * Generate smart recommendations
   */
  private generateRecommendations(tiredList: any[], alerts: FatigueAlert[]): string[] {
    const recommendations: string[] = [];
    
    if (!this.guardrailsEnabled) {
      if (tiredList.filter(s => s.status === 'blocked').length > 0) {
        recommendations.push(`⚠️ Guardrails disabled: ${tiredList.filter(s => s.status === 'blocked').length} subscribers would be blocked but are still receiving emails.`);
      }
    } else if (tiredList.filter(s => s.status === 'blocked').length > 0) {
      recommendations.push(`${tiredList.filter(s => s.status === 'blocked').length} subscribers have hit daily limits. They'll be auto-excluded from today's sends.`);
    }
    
    const criticalSegments = alerts.filter(a => a.type === 'segment' && a.severity === 'critical');
    if (criticalSegments.length > 0) {
      recommendations.push(`Consider segmenting "${criticalSegments[0].entityName}" more granularly to reduce email frequency.`);
    }
    
    const avgFatigue = Array.from(this.emailHistory.values()).reduce((sum, f) => sum + f.fatigueScore, 0) / this.emailHistory.size;
    if (avgFatigue > 60) {
      recommendations.push('Overall fatigue levels are high. Consider implementing a weekly digest instead of daily emails.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Email frequency is healthy. Continue monitoring for optimal engagement.');
    }
    
    return recommendations;
  }
  
  /**
   * Record an email send
   */
  public recordEmailSend(subscriberId: string, email: string, segment?: string, cohort?: string) {
    const existing = this.emailHistory.get(subscriberId);
    
    if (existing) {
      existing.dailyCount++;
      existing.weeklyCount++;
      existing.lastEmailSent = new Date();
      existing.fatigueScore = this.calculateFatigueScore(existing.dailyCount, existing.weeklyCount);
    } else {
      this.emailHistory.set(subscriberId, {
        subscriberId,
        email,
        dailyCount: 1,
        weeklyCount: 1,
        lastEmailSent: new Date(),
        fatigueScore: this.calculateFatigueScore(1, 1),
        segment,
        cohort
      });
    }
    
    // Update segment/cohort stats
    if (segment) {
      const segStats = this.segmentStats.get(segment);
      if (segStats) {
        segStats.daily++;
        segStats.weekly++;
      }
    }
    
    if (cohort) {
      const cohStats = this.cohortStats.get(cohort);
      if (cohStats) {
        cohStats.daily++;
        cohStats.weekly++;
      }
    }
  }
  
  /**
   * Format frequency as a range
   */
  private formatFrequencyRange(avg: number): string {
    if (avg === 0) return "0";
    if (avg < 1) return "<1";
    
    const floor = Math.floor(avg);
    const ceil = Math.ceil(avg);
    
    // If it's a whole number, just show that
    if (floor === ceil) {
      return floor.toString();
    }
    
    // Otherwise show as a range
    return `${floor}-${ceil}`;
  }
  
  /**
   * Check if send should be blocked
   */
  public shouldBlockSend(subscriberId: string): { blocked: boolean; reason?: string; guardrailsDisabled?: boolean } {
    const frequency = this.emailHistory.get(subscriberId);
    
    if (!frequency) {
      return { blocked: false };
    }
    
    // If guardrails are disabled, never block but still provide the reason
    if (!this.guardrailsEnabled) {
      if (frequency.dailyCount >= this.defaultThresholds.dailyLimit) {
        return { 
          blocked: false, 
          guardrailsDisabled: true,
          reason: `Would block: Daily limit reached (${frequency.dailyCount}/${this.defaultThresholds.dailyLimit}) - Guardrails disabled` 
        };
      }
      
      if (frequency.weeklyCount >= this.defaultThresholds.weeklyLimit) {
        return { 
          blocked: false, 
          guardrailsDisabled: true,
          reason: `Would block: Weekly limit reached (${frequency.weeklyCount}/${this.defaultThresholds.weeklyLimit}) - Guardrails disabled` 
        };
      }
      
      return { blocked: false };
    }
    
    // Guardrails enabled - normal blocking behavior
    if (frequency.dailyCount >= this.defaultThresholds.dailyLimit) {
      return { 
        blocked: true, 
        reason: `Daily limit reached (${frequency.dailyCount}/${this.defaultThresholds.dailyLimit})` 
      };
    }
    
    if (frequency.weeklyCount >= this.defaultThresholds.weeklyLimit) {
      return { 
        blocked: true, 
        reason: `Weekly limit reached (${frequency.weeklyCount}/${this.defaultThresholds.weeklyLimit})` 
      };
    }
    
    return { blocked: false };
  }
  
  /**
   * Enable or disable guardrails
   */
  public setGuardrailsEnabled(enabled: boolean): void {
    this.guardrailsEnabled = enabled;
  }
  
  /**
   * Get current guardrails status
   */
  public getGuardrailsStatus(): boolean {
    return this.guardrailsEnabled;
  }
}