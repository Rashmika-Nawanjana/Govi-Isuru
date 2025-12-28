const DiseaseReport = require('../models/DiseaseReport');
const CommunityAlert = require('../models/CommunityAlert');

/**
 * Analytics Service - Situational Awareness & Analytics
 * Provides outbreak growth rates, spread risk mapping, and reporting coverage analysis
 */

// Sri Lanka GN Division neighbor mapping (simplified for key areas)
const GN_NEIGHBORS = {
  // Anuradhapura District
  'Nuwaragam Palatha Central': ['Nuwaragam Palatha East', 'Mihintale', 'Thirappane'],
  'Nuwaragam Palatha East': ['Nuwaragam Palatha Central', 'Kekirawa', 'Kahatagasdigiliya'],
  'Mihintale': ['Nuwaragam Palatha Central', 'Thirappane', 'Horowpothana'],
  // Kurunegala District
  'Kurunegala': ['Mawathagama', 'Pannala', 'Polgahawela'],
  'Mawathagama': ['Kurunegala', 'Ibbagamuwa', 'Wariyapola'],
  // Kandy District
  'Kandy Four Gravets': ['Gangawata Korale', 'Yatinuwara', 'Udunuwara'],
  'Gangawata Korale': ['Kandy Four Gravets', 'Harispattuwa', 'Pathadumbara'],
  // Colombo District
  'Colombo': ['Thimbirigasyaya', 'Dehiwala', 'Kolonnawa'],
  'Thimbirigasyaya': ['Colombo', 'Maharagama', 'Sri Jayawardenepura Kotte'],
  // Add more as needed
};

// District neighbor mapping for spread prediction
const DISTRICT_NEIGHBORS = {
  'Anuradhapura': ['Polonnaruwa', 'Kurunegala', 'Puttalam', 'Trincomalee', 'Vavuniya'],
  'Polonnaruwa': ['Anuradhapura', 'Matale', 'Badulla', 'Ampara', 'Batticaloa'],
  'Kurunegala': ['Anuradhapura', 'Puttalam', 'Gampaha', 'Kegalle', 'Matale'],
  'Kandy': ['Matale', 'Nuwara Eliya', 'Badulla', 'Kegalle'],
  'Colombo': ['Gampaha', 'Kalutara'],
  'Gampaha': ['Colombo', 'Kurunegala', 'Kegalle', 'Puttalam'],
  'Matale': ['Kandy', 'Kurunegala', 'Anuradhapura', 'Polonnaruwa'],
  'Jaffna': ['Kilinochchi'],
  'Batticaloa': ['Ampara', 'Polonnaruwa', 'Trincomalee'],
  'Ratnapura': ['Kegalle', 'Kalutara', 'Galle', 'Matara', 'Badulla'],
  // Add more districts
};

/**
 * Calculate outbreak growth rate indicators
 * Returns % change, trend direction, and district summary
 */
async function getOutbreakGrowthIndicators(district = null, days = 7) {
  try {
    const now = new Date();
    const currentPeriodStart = new Date(now - days * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(now - (days * 2) * 24 * 60 * 60 * 1000);

    const matchQuery = district ? { district } : {};

    // Get current period reports
    const currentPeriodReports = await DiseaseReport.aggregate([
      {
        $match: {
          ...matchQuery,
          createdAt: { $gte: currentPeriodStart }
        }
      },
      {
        $group: {
          _id: '$disease',
          count: { $sum: 1 },
          districts: { $addToSet: '$district' },
          gnDivisions: { $addToSet: '$gnDivision' }
        }
      }
    ]);

    // Get previous period reports
    const previousPeriodReports = await DiseaseReport.aggregate([
      {
        $match: {
          ...matchQuery,
          createdAt: { $gte: previousPeriodStart, $lt: currentPeriodStart }
        }
      },
      {
        $group: {
          _id: '$disease',
          count: { $sum: 1 }
        }
      }
    ]);

    // Create lookup for previous period
    const previousLookup = {};
    previousPeriodReports.forEach(r => {
      previousLookup[r._id] = r.count;
    });

    // Calculate growth rates
    const growthIndicators = currentPeriodReports.map(current => {
      const previousCount = previousLookup[current._id] || 0;
      const currentCount = current.count;
      
      let percentChange = 0;
      let trend = 'stable';
      
      if (previousCount === 0 && currentCount > 0) {
        percentChange = 100;
        trend = 'new';
      } else if (previousCount > 0) {
        percentChange = ((currentCount - previousCount) / previousCount) * 100;
        if (percentChange > 10) trend = 'increasing';
        else if (percentChange < -10) trend = 'decreasing';
        else trend = 'stable';
      }

      return {
        disease: current._id,
        currentCount,
        previousCount,
        percentChange: Math.round(percentChange * 10) / 10,
        trend,
        affectedDistricts: current.districts.length,
        affectedGnDivisions: current.gnDivisions.length,
        riskLevel: calculateRiskLevel(percentChange, currentCount)
      };
    });

    // Sort by risk (increasing diseases first)
    growthIndicators.sort((a, b) => {
      if (a.trend === 'increasing' && b.trend !== 'increasing') return -1;
      if (b.trend === 'increasing' && a.trend !== 'increasing') return 1;
      return b.percentChange - a.percentChange;
    });

    // District-level summary
    const districtSummary = await DiseaseReport.aggregate([
      {
        $match: {
          createdAt: { $gte: currentPeriodStart }
        }
      },
      {
        $group: {
          _id: '$district',
          totalReports: { $sum: 1 },
          diseases: { $addToSet: '$disease' },
          gnDivisions: { $addToSet: '$gnDivision' }
        }
      },
      { $sort: { totalReports: -1 } }
    ]);

    // Calculate district growth rates
    const districtGrowth = await Promise.all(
      districtSummary.map(async (d) => {
        const prevCount = await DiseaseReport.countDocuments({
          district: d._id,
          createdAt: { $gte: previousPeriodStart, $lt: currentPeriodStart }
        });
        
        const percentChange = prevCount > 0 
          ? ((d.totalReports - prevCount) / prevCount) * 100 
          : (d.totalReports > 0 ? 100 : 0);

        return {
          district: d._id,
          currentReports: d.totalReports,
          previousReports: prevCount,
          percentChange: Math.round(percentChange * 10) / 10,
          trend: percentChange > 10 ? 'increasing' : percentChange < -10 ? 'decreasing' : 'stable',
          uniqueDiseases: d.diseases.length,
          affectedAreas: d.gnDivisions.length
        };
      })
    );

    return {
      period: `Last ${days} days`,
      comparedTo: `Previous ${days} days`,
      diseaseGrowth: growthIndicators,
      districtSummary: districtGrowth,
      overallStats: {
        totalCurrentReports: growthIndicators.reduce((sum, g) => sum + g.currentCount, 0),
        totalPreviousReports: growthIndicators.reduce((sum, g) => sum + g.previousCount, 0),
        increasingDiseases: growthIndicators.filter(g => g.trend === 'increasing').length,
        decreasingDiseases: growthIndicators.filter(g => g.trend === 'decreasing').length,
        newOutbreaks: growthIndicators.filter(g => g.trend === 'new').length
      }
    };
  } catch (error) {
    console.error('Error calculating growth indicators:', error);
    throw error;
  }
}

/**
 * Calculate risk level based on growth rate and count
 */
function calculateRiskLevel(percentChange, count) {
  if (percentChange > 50 && count > 5) return 'critical';
  if (percentChange > 25 || count > 10) return 'high';
  if (percentChange > 0 || count > 3) return 'medium';
  return 'low';
}

/**
 * Get spread risk mapping data
 * Returns heatmap data, neighbor risk zones, and predicted spread areas
 */
async function getSpreadRiskMapping(district = null, days = 14) {
  try {
    const timeWindow = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const matchQuery = { createdAt: { $gte: timeWindow } };
    if (district) matchQuery.district = district;

    // Get reports grouped by GN Division for heatmap
    const gnHeatmap = await DiseaseReport.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            gnDivision: '$gnDivision',
            dsDivision: '$dsDivision',
            district: '$district'
          },
          reportCount: { $sum: 1 },
          diseases: { $addToSet: '$disease' },
          avgConfidence: { $avg: '$confidence' },
          latestReport: { $max: '$createdAt' },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] }
          }
        }
      },
      { $sort: { reportCount: -1 } }
    ]);

    // Calculate intensity scores for heatmap
    const heatmapData = gnHeatmap.map(gn => {
      const recencyDays = (Date.now() - new Date(gn.latestReport)) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 1 - (recencyDays / days));
      const intensityScore = Math.min(100, (gn.reportCount * 10 + gn.diseases.length * 5) * recencyScore);
      
      return {
        gnDivision: gn._id.gnDivision,
        dsDivision: gn._id.dsDivision,
        district: gn._id.district,
        reportCount: gn.reportCount,
        diseases: gn.diseases,
        verifiedCount: gn.verifiedCount,
        intensityScore: Math.round(intensityScore),
        riskLevel: intensityScore > 70 ? 'critical' : intensityScore > 40 ? 'high' : intensityScore > 20 ? 'medium' : 'low',
        lastReportDaysAgo: Math.round(recencyDays * 10) / 10
      };
    });

    // Identify high-risk areas and their neighbors
    const highRiskAreas = heatmapData.filter(h => h.riskLevel === 'critical' || h.riskLevel === 'high');
    
    // Get neighbor risk zones
    const neighborRiskZones = [];
    const processedNeighbors = new Set();

    highRiskAreas.forEach(area => {
      const neighbors = GN_NEIGHBORS[area.gnDivision] || [];
      neighbors.forEach(neighbor => {
        if (!processedNeighbors.has(neighbor)) {
          processedNeighbors.add(neighbor);
          const existingData = heatmapData.find(h => h.gnDivision === neighbor);
          neighborRiskZones.push({
            gnDivision: neighbor,
            adjacentTo: area.gnDivision,
            adjacentRiskLevel: area.riskLevel,
            currentReports: existingData?.reportCount || 0,
            predictedRisk: existingData ? 'elevated' : 'watch',
            recommendation: existingData 
              ? 'Monitor closely - adjacent to outbreak area'
              : 'Increase surveillance - no recent reports but adjacent to outbreak'
          });
        }
      });
    });

    // Predict next likely spread areas (rule-based)
    const predictedSpreadAreas = await predictSpreadAreas(highRiskAreas, days);

    // District-level risk summary
    const districtRisk = await DiseaseReport.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$district',
          reportCount: { $sum: 1 },
          gnDivisions: { $addToSet: '$gnDivision' },
          diseases: { $addToSet: '$disease' }
        }
      },
      { $sort: { reportCount: -1 } }
    ]);

    const districtRiskMap = districtRisk.map(d => {
      const neighbors = DISTRICT_NEIGHBORS[d._id] || [];
      return {
        district: d._id,
        reportCount: d.reportCount,
        affectedAreas: d.gnDivisions.length,
        diseases: d.diseases,
        riskLevel: d.reportCount > 20 ? 'critical' : d.reportCount > 10 ? 'high' : d.reportCount > 5 ? 'medium' : 'low',
        neighborDistricts: neighbors,
        spreadRisk: d.reportCount > 10 ? 'high' : d.reportCount > 5 ? 'medium' : 'low'
      };
    });

    return {
      heatmapData,
      neighborRiskZones,
      predictedSpreadAreas,
      districtRiskMap,
      summary: {
        totalAffectedGnDivisions: heatmapData.length,
        criticalZones: heatmapData.filter(h => h.riskLevel === 'critical').length,
        highRiskZones: heatmapData.filter(h => h.riskLevel === 'high').length,
        watchZones: neighborRiskZones.length
      }
    };
  } catch (error) {
    console.error('Error generating spread risk mapping:', error);
    throw error;
  }
}

/**
 * Predict next likely spread areas based on current outbreak patterns
 */
async function predictSpreadAreas(highRiskAreas, days) {
  const predictions = [];
  const seenDistricts = new Set();

  for (const area of highRiskAreas) {
    const districtNeighbors = DISTRICT_NEIGHBORS[area.district] || [];
    
    for (const neighborDistrict of districtNeighbors) {
      if (seenDistricts.has(neighborDistrict)) continue;
      seenDistricts.add(neighborDistrict);

      // Check if neighbor already has reports
      const neighborReports = await DiseaseReport.countDocuments({
        district: neighborDistrict,
        createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
      });

      predictions.push({
        district: neighborDistrict,
        adjacentTo: area.district,
        sourceRiskLevel: area.riskLevel,
        currentReports: neighborReports,
        spreadProbability: neighborReports > 0 ? 'confirmed_spread' : 
                          area.riskLevel === 'critical' ? 'high' : 'medium',
        recommendation: neighborReports > 0 
          ? 'Active monitoring required - spread confirmed'
          : 'Preventive surveillance recommended'
      });
    }
  }

  return predictions.sort((a, b) => {
    const order = { confirmed_spread: 0, high: 1, medium: 2 };
    return order[a.spreadProbability] - order[b.spreadProbability];
  });
}

/**
 * Get reporting coverage heat index
 * Identifies blind spots and under-reporting areas
 */
async function getReportingCoverageIndex(district = null, days = 30) {
  try {
    const timeWindow = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get all GN divisions that have reported
    const reportingGnDivisions = await DiseaseReport.aggregate([
      {
        $match: {
          createdAt: { $gte: timeWindow },
          ...(district ? { district } : {})
        }
      },
      {
        $group: {
          _id: {
            gnDivision: '$gnDivision',
            dsDivision: '$dsDivision',
            district: '$district'
          },
          reportCount: { $sum: 1 },
          lastReport: { $max: '$createdAt' },
          reporters: { $addToSet: '$farmerId' }
        }
      }
    ]);

    // Calculate reporting frequency and identify under-reporting
    const coverageData = reportingGnDivisions.map(gn => {
      const daysSinceLastReport = (Date.now() - new Date(gn.lastReport)) / (1000 * 60 * 60 * 24);
      const reportingFrequency = gn.reportCount / days; // reports per day
      const uniqueReporters = gn.reporters.filter(r => r != null).length;

      let coverageStatus = 'adequate';
      let alertLevel = 'none';

      if (daysSinceLastReport > 14) {
        coverageStatus = 'stale';
        alertLevel = 'warning';
      } else if (reportingFrequency < 0.1 && uniqueReporters < 2) {
        coverageStatus = 'under_reporting';
        alertLevel = 'attention';
      }

      return {
        gnDivision: gn._id.gnDivision,
        dsDivision: gn._id.dsDivision,
        district: gn._id.district,
        reportCount: gn.reportCount,
        daysSinceLastReport: Math.round(daysSinceLastReport),
        reportingFrequency: Math.round(reportingFrequency * 100) / 100,
        uniqueReporters,
        coverageStatus,
        alertLevel
      };
    });

    // Identify districts with potential blind spots
    const districtCoverage = await DiseaseReport.aggregate([
      {
        $match: {
          createdAt: { $gte: timeWindow }
        }
      },
      {
        $group: {
          _id: '$district',
          gnDivisions: { $addToSet: '$gnDivision' },
          totalReports: { $sum: 1 },
          uniqueReporters: { $addToSet: '$farmerId' }
        }
      }
    ]);

    // Expected GN divisions per district (simplified estimate)
    const EXPECTED_GN_PER_DISTRICT = 50; // Average estimate

    const districtCoverageIndex = districtCoverage.map(d => {
      const coveragePercent = (d.gnDivisions.length / EXPECTED_GN_PER_DISTRICT) * 100;
      const reportDensity = d.totalReports / d.gnDivisions.length;

      return {
        district: d._id,
        reportingGnDivisions: d.gnDivisions.length,
        estimatedTotalGnDivisions: EXPECTED_GN_PER_DISTRICT,
        coveragePercent: Math.min(100, Math.round(coveragePercent)),
        totalReports: d.totalReports,
        uniqueReporters: d.uniqueReporters.filter(r => r != null).length,
        reportDensity: Math.round(reportDensity * 10) / 10,
        blindSpotRisk: coveragePercent < 20 ? 'high' : coveragePercent < 40 ? 'medium' : 'low',
        recommendation: coveragePercent < 20 
          ? 'Critical: Increase farmer outreach and awareness campaigns'
          : coveragePercent < 40 
            ? 'Moderate: Consider targeted awareness in unreported areas'
            : 'Good coverage - maintain current engagement'
      };
    });

    // Generate under-reporting alerts
    const underReportingAlerts = [];

    // Areas with stale data
    const staleAreas = coverageData.filter(c => c.coverageStatus === 'stale');
    if (staleAreas.length > 0) {
      underReportingAlerts.push({
        type: 'stale_data',
        severity: 'warning',
        message: `${staleAreas.length} GN divisions have no reports in the last 14 days`,
        areas: staleAreas.slice(0, 10).map(a => ({
          gnDivision: a.gnDivision,
          district: a.district,
          daysSinceLastReport: a.daysSinceLastReport
        }))
      });
    }

    // Areas with low reporter diversity
    const lowDiversity = coverageData.filter(c => c.uniqueReporters < 2 && c.reportCount > 0);
    if (lowDiversity.length > 0) {
      underReportingAlerts.push({
        type: 'low_reporter_diversity',
        severity: 'attention',
        message: `${lowDiversity.length} areas have reports from only 1 farmer - may indicate limited awareness`,
        areas: lowDiversity.slice(0, 10).map(a => ({
          gnDivision: a.gnDivision,
          district: a.district,
          uniqueReporters: a.uniqueReporters
        }))
      });
    }

    // Districts with very low coverage
    const lowCoverageDistricts = districtCoverageIndex.filter(d => d.blindSpotRisk === 'high');
    if (lowCoverageDistricts.length > 0) {
      underReportingAlerts.push({
        type: 'low_district_coverage',
        severity: 'critical',
        message: `${lowCoverageDistricts.length} districts have less than 20% GN division coverage`,
        districts: lowCoverageDistricts.map(d => ({
          district: d.district,
          coveragePercent: d.coveragePercent
        }))
      });
    }

    return {
      gnDivisionCoverage: coverageData,
      districtCoverageIndex,
      underReportingAlerts,
      summary: {
        totalReportingAreas: coverageData.length,
        adequateCoverage: coverageData.filter(c => c.coverageStatus === 'adequate').length,
        staleAreas: staleAreas.length,
        underReportingAreas: coverageData.filter(c => c.coverageStatus === 'under_reporting').length,
        alertCount: underReportingAlerts.length
      }
    };
  } catch (error) {
    console.error('Error calculating reporting coverage:', error);
    throw error;
  }
}

module.exports = {
  getOutbreakGrowthIndicators,
  getSpreadRiskMapping,
  getReportingCoverageIndex
};
