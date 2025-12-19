const DiseaseReport = require('../models/DiseaseReport');
const CommunityAlert = require('../models/CommunityAlert');
const Notification = require('../models/Notification');

// Alert thresholds configuration
const ALERT_CONFIG = {
  reportThreshold: 3,        // Minimum reports to trigger alert
  timeWindowDays: 7,         // Days to look back for reports
  severityLevels: {
    low: { min: 3, max: 5 },
    medium: { min: 6, max: 10 },
    high: { min: 11, max: 20 },
    critical: { min: 21, max: Infinity }
  }
};

// Disease-specific recommendations
const diseaseRecommendations = {
  'Bacterial leaf blight': {
    en: 'Use copper-based bactericides. Ensure proper field drainage. Apply balanced NPK fertilizer avoiding excess nitrogen. Remove and destroy infected plant debris.',
    si: 'තඹ පදනම් වූ බැක්ටීරිසයිඩ භාවිතා කරන්න. නිසි ජල බැහැර කිරීම සහතික කරන්න. අධික නයිට්‍රජන් වළක්වා සමබර NPK පොහොර යොදන්න. ආසාදිත ශාක අපද්‍රව්‍ය ඉවත් කර විනාශ කරන්න.'
  },
  'Brown spot': {
    en: 'Apply fungicides like Mancozeb or Carbendazim. Ensure potassium-rich fertilization. Maintain proper water management. Use resistant varieties if available.',
    si: 'Mancozeb හෝ Carbendazim වැනි දිලීර නාශක යොදන්න. පොටෑසියම් බහුල පොහොර සහතික කරන්න. නිසි ජල කළමනාකරණය පවත්වන්න. ඇත්නම් ප්‍රතිරෝධී ප්‍රභේද භාවිතා කරන්න.'
  },
  'Leaf smut': {
    en: 'Remove and burn infected plants immediately. Apply appropriate fungicides. Avoid dense planting. Ensure good air circulation in the field.',
    si: 'ආසාදිත ශාක වහාම ඉවත් කර පුළුස්සා දමන්න. සුදුසු දිලීර නාශක යොදන්න. ඝන වගාව වළක්වන්න. කෙතේ හොඳ වාතාශ්‍රය සහතික කරන්න.'
  },
  'Rice blast': {
    en: 'Apply Tricyclazole or Isoprothiolane fungicides. Avoid excess nitrogen fertilization. Use resistant varieties. Remove weeds that may harbor the pathogen.',
    si: 'Tricyclazole හෝ Isoprothiolane දිලීර නාශක යොදන්න. අධික නයිට්‍රජන් පොහොර වළක්වන්න. ප්‍රතිරෝධී ප්‍රභේද භාවිතා කරන්න. රෝග කාරකය රඳවා ගත හැකි වල් පැලෑටි ඉවත් කරන්න.'
  }
};

// Default recommendation for unknown diseases
const defaultRecommendation = {
  en: 'Consult your local agricultural officer immediately. Isolate affected plants to prevent spread. Take photos and collect samples for proper diagnosis.',
  si: 'වහාම ඔබගේ ප්‍රදේශීය කෘෂිකර්ම නිලධාරියා හමුවන්න. ව්‍යාප්තිය වැළැක්වීමට බලපෑමට ලක්වූ ශාක හුදකලා කරන්න. නිසි රෝග විනිශ්චය සඳහා ඡායාරූප ගෙන සාම්පල එකතු කරන්න.'
};

/**
 * Calculate severity level based on report count
 */
function calculateSeverity(reportCount) {
  const { severityLevels } = ALERT_CONFIG;
  
  if (reportCount >= severityLevels.critical.min) return 'critical';
  if (reportCount >= severityLevels.high.min) return 'high';
  if (reportCount >= severityLevels.medium.min) return 'medium';
  return 'low';
}

/**
 * Get recommendation for a disease
 */
function getRecommendation(disease) {
  return diseaseRecommendations[disease] || defaultRecommendation;
}

/**
 * Check for disease outbreaks and create/update alerts
 * This function aggregates disease reports and triggers alerts when threshold is reached
 */
async function checkDiseaseAlerts(gnDivision, dsDivision, district) {
  try {
    const timeWindow = new Date();
    timeWindow.setDate(timeWindow.getDate() - ALERT_CONFIG.timeWindowDays);

    // Aggregate reports by crop, disease, and location
    const aggregation = await DiseaseReport.aggregate([
      {
        $match: {
          gnDivision: gnDivision,
          createdAt: { $gte: timeWindow }
        }
      },
      {
        $group: {
          _id: {
            crop: '$crop',
            disease: '$disease',
            gnDivision: '$gnDivision',
            dsDivision: '$dsDivision',
            district: '$district'
          },
          reportCount: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          firstReport: { $min: '$createdAt' },
          lastReport: { $max: '$createdAt' },
          reporters: { $addToSet: '$farmerId' }
        }
      },
      {
        $match: {
          reportCount: { $gte: ALERT_CONFIG.reportThreshold }
        }
      }
    ]);

    const alerts = [];

    for (const outbreak of aggregation) {
      const { crop, disease, gnDivision: gn, dsDivision: ds, district: dist } = outbreak._id;
      const severity = calculateSeverity(outbreak.reportCount);
      const recommendation = getRecommendation(disease);

      // Check if alert already exists
      let existingAlert = await CommunityAlert.findOne({
        crop,
        disease,
        gnDivision: gn,
        status: { $in: ['active', 'monitoring'] }
      });

      if (existingAlert) {
        // Update existing alert
        existingAlert.reportCount = outbreak.reportCount;
        existingAlert.severity = severity;
        existingAlert.lastUpdatedAt = new Date();
        await existingAlert.save();
        alerts.push(existingAlert);
      } else {
        // Create new alert
        const newAlert = await CommunityAlert.create({
          crop,
          disease,
          district: dist,
          dsDivision: ds,
          gnDivision: gn,
          reportCount: outbreak.reportCount,
          severity,
          status: 'active',
          firstReportedAt: outbreak.firstReport,
          lastUpdatedAt: outbreak.lastReport,
          recommendation
        });

        alerts.push(newAlert);

        // Create notification for farmers in the area
        await createAlertNotification(newAlert);
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error checking disease alerts:', error);
    throw error;
  }
}

/**
 * Create notifications for a new alert
 */
async function createAlertNotification(alert) {
  try {
    const severityText = {
      low: { en: 'Low', si: 'අඩු' },
      medium: { en: 'Medium', si: 'මධ්‍යම' },
      high: { en: 'High', si: 'ඉහළ' },
      critical: { en: 'Critical', si: 'බරපතල' }
    };

    const severityMap = {
      low: 'info',
      medium: 'warning',
      high: 'danger',
      critical: 'danger'
    };

    const notification = await Notification.create({
      targetDistrict: alert.district,
      targetDsDivision: alert.dsDivision,
      targetGnDivision: alert.gnDivision,
      type: 'disease_alert',
      title: {
        en: `⚠️ ${alert.disease} Alert - ${severityText[alert.severity].en} Severity`,
        si: `⚠️ ${alert.disease} අනතුරු ඇඟවීම - ${severityText[alert.severity].si} බරපතලකම`
      },
      message: {
        en: `${alert.reportCount} cases of ${alert.disease} detected in ${alert.crop} crops in your area (${alert.gnDivision}). ${alert.recommendation.en}`,
        si: `ඔබගේ ප්‍රදේශයේ (${alert.gnDivision}) ${alert.crop} බෝගවල ${alert.disease} රෝගී අවස්ථා ${alert.reportCount}ක් හඳුනාගෙන ඇත. ${alert.recommendation.si}`
      },
      alertId: alert._id,
      severity: severityMap[alert.severity]
    });

    return notification;
  } catch (error) {
    console.error('Error creating alert notification:', error);
    throw error;
  }
}

/**
 * Save a disease report and check for alerts
 */
async function saveDiseaseReport(reportData) {
  try {
    // Create the disease report
    const report = await DiseaseReport.create(reportData);

    // Check if this triggers any alerts
    const alerts = await checkDiseaseAlerts(
      reportData.gnDivision,
      reportData.dsDivision,
      reportData.district
    );

    return { report, alerts };
  } catch (error) {
    console.error('Error saving disease report:', error);
    throw error;
  }
}

/**
 * Get active alerts for a location
 */
async function getActiveAlerts(gnDivision, dsDivision, district) {
  try {
    const alerts = await CommunityAlert.find({
      status: { $in: ['active', 'monitoring'] },
      $or: [
        { gnDivision: gnDivision },
        { dsDivision: dsDivision },
        { district: district }
      ]
    }).sort({ severity: -1, lastUpdatedAt: -1 });

    return alerts;
  } catch (error) {
    console.error('Error getting active alerts:', error);
    throw error;
  }
}

/**
 * Get notifications for a user's location
 */
async function getNotifications(gnDivision, limit = 10) {
  try {
    const notifications = await Notification.find({
      targetGnDivision: gnDivision,
      expiresAt: { $gt: new Date() }
    })
    .sort({ createdAt: -1 })
    .limit(limit);

    return notifications;
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
async function markNotificationRead(notificationId) {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Resolve an alert (mark as resolved)
 */
async function resolveAlert(alertId) {
  try {
    const alert = await CommunityAlert.findByIdAndUpdate(
      alertId,
      { status: 'resolved', lastUpdatedAt: new Date() },
      { new: true }
    );
    return alert;
  } catch (error) {
    console.error('Error resolving alert:', error);
    throw error;
  }
}

module.exports = {
  checkDiseaseAlerts,
  saveDiseaseReport,
  getActiveAlerts,
  getNotifications,
  markNotificationRead,
  resolveAlert,
  createAlertNotification,
  ALERT_CONFIG
};
