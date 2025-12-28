const DiseaseReport = require('../models/DiseaseReport');
const OfficerActionLog = require('../models/OfficerActionLog');
const CommunityAlert = require('../models/CommunityAlert');

/**
 * Officer Service - Handles all officer-specific operations
 * Including verification workflow, audit logging, and priority management
 */

// Valid status transitions for verification workflow
const VALID_TRANSITIONS = {
  pending: ['under_review', 'verified', 'rejected', 'flagged', 'needs_field_visit'],
  under_review: ['verified', 'rejected', 'flagged', 'needs_field_visit'],
  flagged: ['under_review', 'verified', 'rejected', 'needs_field_visit'],
  needs_field_visit: ['under_review', 'verified', 'rejected'],
  verified: [], // Terminal state
  rejected: ['under_review'] // Can be reopened for review
};

// Priority configuration
const PRIORITY_CONFIG = {
  emergency: { 
    color: 'red', 
    label: 'Emergency',
    labelSi: 'හදිසි',
    autoEscalateHours: 2 
  },
  high: { 
    color: 'orange', 
    label: 'High Priority',
    labelSi: 'ඉහළ ප්‍රමුඛතාව',
    autoEscalateHours: 12 
  },
  medium: { 
    color: 'yellow', 
    label: 'Medium',
    labelSi: 'මධ්‍යම',
    autoEscalateHours: 48 
  },
  low: { 
    color: 'blue', 
    label: 'Low',
    labelSi: 'අඩු',
    autoEscalateHours: null 
  },
  info: { 
    color: 'gray', 
    label: 'Info',
    labelSi: 'තොරතුරු',
    autoEscalateHours: null 
  }
};

/**
 * Log an officer action for audit trail
 */
async function logAction(actionData) {
  try {
    const log = new OfficerActionLog({
      officerId: actionData.officerId,
      officerUsername: actionData.officerUsername || 'Unknown',
      officerDistrict: actionData.officerDistrict || 'Unknown',
      actionType: actionData.actionType,
      targetType: actionData.targetType,
      targetId: actionData.targetId,
      previousStatus: actionData.previousStatus || null,
      newStatus: actionData.newStatus || null,
      reason: actionData.reason || null,
      notes: actionData.notes || null,
      ipAddress: actionData.ipAddress || null,
      userAgent: actionData.userAgent || null
    });
    
    await log.save();
    return log;
  } catch (error) {
    console.error('Error logging officer action:', error);
    // Don't throw - logging should not break main operations
    return null;
  }
}

/**
 * Update report verification status with full workflow support
 */
async function updateReportStatus(reportId, newStatus, officerData, options = {}) {
  const report = await DiseaseReport.findById(reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }
  
  const currentStatus = report.verificationStatus;
  
  // Validate status transition
  const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowedTransitions.includes(newStatus) && currentStatus !== newStatus) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }
  
  // Update report
  report.verificationStatus = newStatus;
  report.adminReviewed = true;
  report.reviewedBy = officerData.username;
  report.reviewedAt = new Date();
  
  if (options.reason) {
    report.flaggedReason = options.reason;
  }
  
  if (options.priority) {
    report.priority = options.priority;
  }
  
  await report.save();
  
  // Log the action
  const actionTypeMap = {
    verified: 'verify_report',
    rejected: 'reject_report',
    flagged: 'flag_report',
    needs_field_visit: 'request_field_visit',
    under_review: 'start_review'
  };
  
  await logAction({
    officerId: officerData.userId,
    officerUsername: officerData.username,
    officerDistrict: officerData.district,
    actionType: actionTypeMap[newStatus] || 'verify_report',
    targetType: 'disease_report',
    targetId: reportId,
    previousStatus: currentStatus,
    newStatus: newStatus,
    reason: options.reason,
    notes: options.notes,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent
  });
  
  return report;
}

/**
 * Update report priority
 */
async function updateReportPriority(reportId, newPriority, officerData, options = {}) {
  const report = await DiseaseReport.findById(reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }
  
  const previousPriority = report.priority;
  report.priority = newPriority;
  
  // If escalating to emergency, track escalation
  if (newPriority === 'emergency' && previousPriority !== 'emergency') {
    report.escalatedAt = new Date();
    report.escalatedBy = officerData.username;
  }
  
  await report.save();
  
  // Log the action
  await logAction({
    officerId: officerData.userId,
    officerUsername: officerData.username,
    officerDistrict: officerData.district,
    actionType: 'update_priority',
    targetType: 'disease_report',
    targetId: reportId,
    previousStatus: previousPriority,
    newStatus: newPriority,
    reason: options.reason,
    notes: options.notes
  });
  
  return report;
}

/**
 * Get reports for officer review with filtering
 */
async function getReportsForReview(filters = {}) {
  const query = {};
  
  if (filters.district) {
    query.district = filters.district;
  }
  
  if (filters.status && filters.status !== 'all') {
    query.verificationStatus = filters.status;
  }
  
  if (filters.priority && filters.priority !== 'all') {
    query.priority = filters.priority;
  }
  
  // Default: show pending and flagged reports first
  if (!filters.status) {
    query.verificationStatus = { $in: ['pending', 'flagged', 'under_review', 'needs_field_visit'] };
  }
  
  const reports = await DiseaseReport.find(query)
    .sort({ 
      priority: -1, // Emergency first
      createdAt: -1 
    })
    .limit(filters.limit || 100)
    .lean();
  
  // Sort by priority order
  const priorityOrder = { emergency: 0, high: 1, medium: 2, low: 3, info: 4 };
  reports.sort((a, b) => {
    const aPriority = priorityOrder[a.priority] ?? 2;
    const bPriority = priorityOrder[b.priority] ?? 2;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  return reports;
}

/**
 * Get officer action logs (audit trail)
 */
async function getActionLogs(filters = {}) {
  const query = {};
  
  if (filters.officerId) {
    query.officerId = filters.officerId;
  }
  
  if (filters.district) {
    query.officerDistrict = filters.district;
  }
  
  if (filters.targetId) {
    query.targetId = filters.targetId;
  }
  
  if (filters.actionType) {
    query.actionType = filters.actionType;
  }
  
  if (filters.startDate && filters.endDate) {
    query.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  } else if (filters.days) {
    query.createdAt = {
      $gte: new Date(Date.now() - filters.days * 24 * 60 * 60 * 1000)
    };
  }
  
  const logs = await OfficerActionLog.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit || 100)
    .lean();
  
  return logs;
}

/**
 * Get verification statistics for dashboard
 */
async function getVerificationStats(district = null) {
  const matchQuery = {};
  if (district) {
    matchQuery.district = district;
  }
  
  // Get status breakdown
  const statusStats = await DiseaseReport.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$verificationStatus',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get priority breakdown
  const priorityStats = await DiseaseReport.aggregate([
    { $match: { ...matchQuery, verificationStatus: { $nin: ['verified', 'rejected'] } } },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get pending count (needs attention)
  const pendingCount = await DiseaseReport.countDocuments({
    ...matchQuery,
    verificationStatus: { $in: ['pending', 'flagged', 'needs_field_visit'] }
  });
  
  // Get today's reviewed count
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const reviewedToday = await DiseaseReport.countDocuments({
    ...matchQuery,
    reviewedAt: { $gte: todayStart },
    adminReviewed: true
  });
  
  return {
    statusBreakdown: statusStats.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {}),
    priorityBreakdown: priorityStats.reduce((acc, p) => {
      acc[p._id] = p.count;
      return acc;
    }, {}),
    pendingCount,
    reviewedToday,
    priorityConfig: PRIORITY_CONFIG
  };
}

/**
 * Get reports needing escalation (past SLA)
 */
async function getEscalationCandidates(district = null) {
  const now = new Date();
  const candidates = [];
  
  for (const [priority, config] of Object.entries(PRIORITY_CONFIG)) {
    if (!config.autoEscalateHours) continue;
    
    const threshold = new Date(now - config.autoEscalateHours * 60 * 60 * 1000);
    
    const query = {
      priority,
      verificationStatus: { $in: ['pending', 'under_review'] },
      createdAt: { $lte: threshold }
    };
    
    if (district) {
      query.district = district;
    }
    
    const reports = await DiseaseReport.find(query)
      .select('_id disease district gnDivision priority createdAt')
      .lean();
    
    candidates.push(...reports.map(r => ({
      ...r,
      hoursOverdue: Math.round((now - new Date(r.createdAt)) / (1000 * 60 * 60) - config.autoEscalateHours)
    })));
  }
  
  return candidates.sort((a, b) => b.hoursOverdue - a.hoursOverdue);
}

module.exports = {
  logAction,
  updateReportStatus,
  updateReportPriority,
  getReportsForReview,
  getActionLogs,
  getVerificationStats,
  getEscalationCandidates,
  PRIORITY_CONFIG,
  VALID_TRANSITIONS
};
