const DiseaseReport = require('../models/DiseaseReport');
const OfficerActionLog = require('../models/OfficerActionLog');
const FieldVisit = require('../models/FieldVisit');

/**
 * Officer Performance Service
 * Tracks officer productivity metrics, response times, and performance stats
 */

/**
 * Get officer performance metrics
 */
async function getOfficerPerformance(officerId, options = {}) {
  try {
    const { days = 30, startDate, endDate } = options;
    
    let dateFilter;
    if (startDate && endDate) {
      dateFilter = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else {
      dateFilter = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }

    // Get all actions by this officer in the period
    const actions = await OfficerActionLog.find({
      officerId,
      createdAt: dateFilter
    }).sort({ createdAt: -1 });

    // Calculate metrics
    const totalActions = actions.length;
    const verifications = actions.filter(a => a.actionType === 'verify_report').length;
    const rejections = actions.filter(a => a.actionType === 'reject_report').length;
    const flags = actions.filter(a => a.actionType === 'flag_report').length;
    const fieldVisitRequests = actions.filter(a => a.actionType === 'request_field_visit').length;
    const notesAdded = actions.filter(a => a.actionType === 'add_note').length;

    // Get reports reviewed by this officer
    const reportsReviewed = await DiseaseReport.countDocuments({
      reviewedBy: { $exists: true },
      reviewedAt: dateFilter
    });

    // Calculate average response time (time from report creation to first review)
    const reviewedReports = await DiseaseReport.find({
      adminReviewed: true,
      reviewedAt: dateFilter
    }).select('createdAt reviewedAt');

    let avgResponseTimeHours = 0;
    if (reviewedReports.length > 0) {
      const totalResponseTime = reviewedReports.reduce((sum, report) => {
        if (report.reviewedAt && report.createdAt) {
          return sum + (new Date(report.reviewedAt) - new Date(report.createdAt));
        }
        return sum;
      }, 0);
      avgResponseTimeHours = Math.round((totalResponseTime / reviewedReports.length) / (1000 * 60 * 60) * 10) / 10;
    }

    // Daily activity breakdown
    const dailyActivity = await OfficerActionLog.aggregate([
      {
        $match: {
          officerId: officerId,
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          verifications: {
            $sum: { $cond: [{ $eq: ['$actionType', 'verify_report'] }, 1, 0] }
          },
          rejections: {
            $sum: { $cond: [{ $eq: ['$actionType', 'reject_report'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);

    // Action type breakdown
    const actionBreakdown = await OfficerActionLog.aggregate([
      {
        $match: {
          officerId: officerId,
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: '$actionType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Calculate productivity score (0-100)
    const productivityScore = calculateProductivityScore({
      totalActions,
      verifications,
      avgResponseTimeHours,
      days
    });

    return {
      officerId,
      period: {
        days,
        startDate: dateFilter.$gte,
        endDate: dateFilter.$lte || new Date()
      },
      summary: {
        totalActions,
        reportsReviewed,
        verifications,
        rejections,
        flags,
        fieldVisitRequests,
        notesAdded,
        avgResponseTimeHours,
        productivityScore
      },
      dailyActivity: dailyActivity.reverse(),
      actionBreakdown: actionBreakdown.map(a => ({
        actionType: a._id,
        count: a.count,
        label: getActionLabel(a._id)
      })),
      recentActions: actions.slice(0, 10).map(a => ({
        actionType: a.actionType,
        targetType: a.targetType,
        createdAt: a.createdAt,
        previousStatus: a.previousStatus,
        newStatus: a.newStatus
      }))
    };
  } catch (error) {
    console.error('Error getting officer performance:', error);
    throw error;
  }
}

/**
 * Calculate productivity score based on various metrics
 */
function calculateProductivityScore({ totalActions, verifications, avgResponseTimeHours, days }) {
  let score = 0;
  
  // Actions per day (max 40 points)
  const actionsPerDay = totalActions / days;
  score += Math.min(40, actionsPerDay * 10);
  
  // Verification rate (max 30 points)
  const verificationRate = totalActions > 0 ? (verifications / totalActions) : 0;
  score += verificationRate * 30;
  
  // Response time (max 30 points) - faster is better
  if (avgResponseTimeHours <= 2) score += 30;
  else if (avgResponseTimeHours <= 6) score += 25;
  else if (avgResponseTimeHours <= 12) score += 20;
  else if (avgResponseTimeHours <= 24) score += 15;
  else if (avgResponseTimeHours <= 48) score += 10;
  else score += 5;
  
  return Math.round(score);
}

/**
 * Get action label for display
 */
function getActionLabel(actionType) {
  const labels = {
    verify_report: 'Verified Reports',
    reject_report: 'Rejected Reports',
    flag_report: 'Flagged Reports',
    request_field_visit: 'Field Visit Requests',
    start_review: 'Reviews Started',
    add_note: 'Notes Added',
    update_priority: 'Priority Updates',
    resolve_alert: 'Alerts Resolved',
    escalate_alert: 'Alerts Escalated'
  };
  return labels[actionType] || actionType;
}

/**
 * Get monthly performance comparison
 */
async function getMonthlyComparison(officerId) {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [currentMonth, lastMonth] = await Promise.all([
      OfficerActionLog.countDocuments({
        officerId,
        createdAt: { $gte: currentMonthStart }
      }),
      OfficerActionLog.countDocuments({
        officerId,
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
      })
    ]);

    const percentChange = lastMonth > 0 
      ? Math.round(((currentMonth - lastMonth) / lastMonth) * 100)
      : (currentMonth > 0 ? 100 : 0);

    return {
      currentMonth: {
        name: now.toLocaleString('default', { month: 'long' }),
        actions: currentMonth
      },
      lastMonth: {
        name: new Date(lastMonthStart).toLocaleString('default', { month: 'long' }),
        actions: lastMonth
      },
      percentChange,
      trend: percentChange > 0 ? 'increasing' : percentChange < 0 ? 'decreasing' : 'stable'
    };
  } catch (error) {
    console.error('Error getting monthly comparison:', error);
    throw error;
  }
}

/**
 * Get leaderboard of top performing officers
 */
async function getOfficerLeaderboard(options = {}) {
  try {
    const { days = 30, limit = 10 } = options;
    const dateFilter = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };

    const leaderboard = await OfficerActionLog.aggregate([
      {
        $match: {
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: {
            officerId: '$officerId',
            username: '$officerUsername',
            district: '$officerDistrict'
          },
          totalActions: { $sum: 1 },
          verifications: {
            $sum: { $cond: [{ $eq: ['$actionType', 'verify_report'] }, 1, 0] }
          },
          rejections: {
            $sum: { $cond: [{ $eq: ['$actionType', 'reject_report'] }, 1, 0] }
          }
        }
      },
      { $sort: { totalActions: -1 } },
      { $limit: limit }
    ]);

    return leaderboard.map((entry, idx) => ({
      rank: idx + 1,
      officerId: entry._id.officerId,
      username: entry._id.username,
      district: entry._id.district,
      totalActions: entry.totalActions,
      verifications: entry.verifications,
      rejections: entry.rejections
    }));
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
}

module.exports = {
  getOfficerPerformance,
  getMonthlyComparison,
  getOfficerLeaderboard
};
