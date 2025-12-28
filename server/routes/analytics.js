const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const analyticsService = require('../services/analyticsService');

// Auth middleware - optional for some routes
const optionalAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'govi_secret');
      req.user = decoded;
    }
    next();
  } catch (error) {
    next();
  }
};

// Auth middleware - required for officer routes
const officerAuthMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'govi_secret');
    
    if (decoded.role !== 'officer' && decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Officer access required' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * GET /api/analytics/growth-indicators
 * Get outbreak growth rate indicators
 */
router.get('/growth-indicators', optionalAuth, async (req, res) => {
  try {
    const { district, days } = req.query;
    const daysNum = parseInt(days) || 7;
    
    // Use user's district if not specified and user is logged in
    const targetDistrict = district || req.user?.district || null;
    
    const indicators = await analyticsService.getOutbreakGrowthIndicators(targetDistrict, daysNum);
    
    res.json({
      success: true,
      ...indicators
    });
  } catch (error) {
    console.error('Error fetching growth indicators:', error);
    res.status(500).json({ error: 'Failed to fetch growth indicators' });
  }
});

/**
 * GET /api/analytics/spread-risk
 * Get spread risk mapping data
 */
router.get('/spread-risk', optionalAuth, async (req, res) => {
  try {
    const { district, days } = req.query;
    const daysNum = parseInt(days) || 14;
    
    const targetDistrict = district || req.user?.district || null;
    
    const riskData = await analyticsService.getSpreadRiskMapping(targetDistrict, daysNum);
    
    res.json({
      success: true,
      ...riskData
    });
  } catch (error) {
    console.error('Error fetching spread risk data:', error);
    res.status(500).json({ error: 'Failed to fetch spread risk data' });
  }
});

/**
 * GET /api/analytics/coverage-index
 * Get reporting coverage heat index
 */
router.get('/coverage-index', officerAuthMiddleware, async (req, res) => {
  try {
    const { district, days } = req.query;
    const daysNum = parseInt(days) || 30;
    
    const targetDistrict = district || req.user?.district || null;
    
    const coverageData = await analyticsService.getReportingCoverageIndex(targetDistrict, daysNum);
    
    res.json({
      success: true,
      ...coverageData
    });
  } catch (error) {
    console.error('Error fetching coverage index:', error);
    res.status(500).json({ error: 'Failed to fetch coverage index' });
  }
});

/**
 * GET /api/analytics/dashboard-summary
 * Get combined analytics summary for officer dashboard
 */
router.get('/dashboard-summary', officerAuthMiddleware, async (req, res) => {
  try {
    const { days } = req.query;
    const daysNum = parseInt(days) || 7;
    const district = req.user?.district || null;

    // Fetch all analytics in parallel
    const [growthIndicators, spreadRisk, coverageIndex] = await Promise.all([
      analyticsService.getOutbreakGrowthIndicators(district, daysNum),
      analyticsService.getSpreadRiskMapping(district, 14),
      analyticsService.getReportingCoverageIndex(district, 30)
    ]);

    // Create summary
    const summary = {
      // Growth highlights
      growthHighlights: {
        increasingDiseases: growthIndicators.overallStats.increasingDiseases,
        newOutbreaks: growthIndicators.overallStats.newOutbreaks,
        topGrowingDisease: growthIndicators.diseaseGrowth[0] || null,
        totalReportsChange: {
          current: growthIndicators.overallStats.totalCurrentReports,
          previous: growthIndicators.overallStats.totalPreviousReports,
          percentChange: growthIndicators.overallStats.totalPreviousReports > 0
            ? Math.round(((growthIndicators.overallStats.totalCurrentReports - growthIndicators.overallStats.totalPreviousReports) / growthIndicators.overallStats.totalPreviousReports) * 100)
            : 0
        }
      },
      
      // Spread risk highlights
      spreadRiskHighlights: {
        criticalZones: spreadRisk.summary.criticalZones,
        highRiskZones: spreadRisk.summary.highRiskZones,
        watchZones: spreadRisk.summary.watchZones,
        topRiskArea: spreadRisk.heatmapData[0] || null,
        predictedSpreadCount: spreadRisk.predictedSpreadAreas.filter(p => p.spreadProbability === 'high').length
      },
      
      // Coverage highlights
      coverageHighlights: {
        totalReportingAreas: coverageIndex.summary.totalReportingAreas,
        staleAreas: coverageIndex.summary.staleAreas,
        underReportingAreas: coverageIndex.summary.underReportingAreas,
        alertCount: coverageIndex.summary.alertCount,
        criticalAlerts: coverageIndex.underReportingAlerts.filter(a => a.severity === 'critical').length
      },

      // Quick action items
      actionItems: generateActionItems(growthIndicators, spreadRisk, coverageIndex)
    };

    res.json({
      success: true,
      district: district || 'All Districts',
      period: `Last ${daysNum} days`,
      summary,
      detailed: {
        growthIndicators,
        spreadRisk,
        coverageIndex
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

/**
 * Generate prioritized action items based on analytics
 */
function generateActionItems(growth, spread, coverage) {
  const items = [];

  // Critical growth alerts
  const criticalGrowth = growth.diseaseGrowth.filter(d => d.riskLevel === 'critical');
  if (criticalGrowth.length > 0) {
    items.push({
      priority: 'critical',
      type: 'outbreak_growth',
      title: 'Critical Outbreak Growth Detected',
      titleSi: 'විවේචනාත්මක පිපිරීම් වර්ධනය හඳුනාගෙන ඇත',
      description: `${criticalGrowth.length} disease(s) showing >50% growth rate`,
      diseases: criticalGrowth.map(d => d.disease),
      action: 'Immediate investigation and containment measures required'
    });
  }

  // High spread risk
  if (spread.summary.criticalZones > 0) {
    items.push({
      priority: 'high',
      type: 'spread_risk',
      title: 'High Spread Risk Zones',
      titleSi: 'ඉහළ පැතිරීමේ අවදානම් කලාප',
      description: `${spread.summary.criticalZones} critical zones identified`,
      zones: spread.heatmapData.filter(h => h.riskLevel === 'critical').slice(0, 5),
      action: 'Deploy field officers to critical zones'
    });
  }

  // Predicted spread
  const highProbSpread = spread.predictedSpreadAreas.filter(p => p.spreadProbability === 'high');
  if (highProbSpread.length > 0) {
    items.push({
      priority: 'high',
      type: 'predicted_spread',
      title: 'Predicted Spread Areas',
      titleSi: 'පුරෝකථනය කළ පැතිරීමේ ප්‍රදේශ',
      description: `${highProbSpread.length} districts at high risk of spread`,
      districts: highProbSpread.map(p => p.district),
      action: 'Increase surveillance in predicted areas'
    });
  }

  // Coverage blind spots
  const criticalCoverage = coverage.underReportingAlerts.filter(a => a.severity === 'critical');
  if (criticalCoverage.length > 0) {
    items.push({
      priority: 'medium',
      type: 'coverage_gap',
      title: 'Reporting Coverage Gaps',
      titleSi: 'වාර්තා කිරීමේ ආවරණ හිඩැස්',
      description: 'Low reporting coverage detected in some districts',
      alerts: criticalCoverage,
      action: 'Launch farmer awareness campaign in affected areas'
    });
  }

  // Stale data warning
  if (coverage.summary.staleAreas > 5) {
    items.push({
      priority: 'low',
      type: 'stale_data',
      title: 'Stale Reporting Data',
      titleSi: 'පැරණි වාර්තා දත්ත',
      description: `${coverage.summary.staleAreas} areas have no recent reports`,
      action: 'Follow up with local agricultural officers'
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return items;
}

module.exports = router;
