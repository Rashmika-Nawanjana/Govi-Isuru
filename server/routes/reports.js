const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Alert = require('../models/Alert');
const CommunityAlert = require('../models/CommunityAlert');
const Notification = require('../models/Notification');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const alertService = require('../services/alertService');

/**
 * POST /api/reports/submit
 * Farmer submits a disease/pest report from AI Doctor
 */
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { title, description, image_url, ai_prediction, confidence_score, report_type } = req.body;
    const currentUser = req.user;

    // Validate farmer role
    if (currentUser.role !== 'farmer') {
      return res.status(403).json({ success: false, msg: 'Only farmers can submit reports' });
    }

    // Get phone from user object or fetch from database if not available
    let farmerPhone = currentUser.phone;
    if (!farmerPhone && (currentUser.id || currentUser._id)) {
      const userFromDB = await User.findById(currentUser.id || currentUser._id);
      if (userFromDB) {
        farmerPhone = userFromDB.phone;
      }
    }

    if (!farmerPhone) {
      return res.status(400).json({
        success: false,
        msg: 'Phone number is required to submit a report. Please update your profile.'
      });
    }

    if (!currentUser.district || !currentUser.dsDivision || !currentUser.gnDivision) {
      return res.status(400).json({
        success: false,
        msg: 'Location details are required to submit a report. Please update your profile.'
      });
    }

    // Create report
    const report = new Report({
      report_type: report_type || 'disease',
      farmerId: currentUser.id || currentUser._id,
      farmerName: currentUser.fullName || currentUser.username || 'Farmer',
      farmerPhone: farmerPhone,
      district: currentUser.district,
      dsDivision: currentUser.dsDivision,
      gnDivision: currentUser.gnDivision,
      title,
      description,
      image_url,
      ai_prediction,
      confidence_score,
      status: 'pending'
    });

    await report.save();

    // Also create a DiseaseReport entry so the officer dashboard picks it up
    try {
      await alertService.saveDiseaseReport({
        farmerId: currentUser.id || currentUser._id,
        farmerUsername: currentUser.fullName || currentUser.username || 'Farmer',
        crop: (title || '').split(' - ')[0]?.toLowerCase() || 'rice',
        disease: ai_prediction || title || 'Unknown',
        confidence: confidence_score || 0,
        district: currentUser.district,
        dsDivision: currentUser.dsDivision,
        gnDivision: currentUser.gnDivision,
        treatment: ''
      });
    } catch (diseaseReportErr) {
      // Log but don't fail the main report submission
      console.error('Error creating DiseaseReport entry:', diseaseReportErr);
    }

    // Find all government officers in this GN Division
    const officers = await User.find({
      role: 'officer',
      gnDivision: currentUser.gnDivision
    }).select('_id email fullName');

    // TODO: Send email notifications to officers
    // const notificationService = require('../services/notificationService');
    // notificationService.notifyOfficersOfReport(report, officers);

    res.status(201).json({
      success: true,
      msg: 'Report submitted successfully. Government officers will review it shortly.',
      reportId: report._id
    });

  } catch (err) {
    console.error('Report submission error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/reports/pending
 * Officer gets pending reports for their GN Division
 */
router.get('/pending', authMiddleware, async (req, res) => {
  try {
    const currentUser = req.user;

    // Validate officer role
    if (currentUser.role !== 'officer') {
      return res.status(403).json({ success: false, msg: 'Only officers can view pending reports' });
    }

    // Get reports pending verification in officer's GN Division
    const reports = await Report.find({
      gnDivision: currentUser.gnDivision,
      status: 'pending'
    })
      .populate('farmerId', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reports,
      count: reports.length
    });

  } catch (err) {
    console.error('Error fetching pending reports:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/reports/my-reports
 * Farmer gets their own submitted reports
 */
router.get('/my-reports', authMiddleware, async (req, res) => {
  try {
    const currentUser = req.user;

    // Validate farmer role
    if (currentUser.role !== 'farmer') {
      return res.status(403).json({ success: false, msg: 'Only farmers can view their own reports' });
    }

    // Get all reports submitted by this farmer
    const reports = await Report.find({
      farmerId: currentUser.id
    })
      .select('title description image_url ai_prediction confidence_score status verifiedBy verificationDate verificationNotes gnDivision createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reports,
      count: reports.length
    });

  } catch (err) {
    console.error('Error fetching farmer reports:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/reports/:id
 * Get full report details
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('farmerId', 'fullName email phone')
      .populate('verifiedBy', 'fullName designation department');

    if (!report) {
      return res.status(404).json({ success: false, msg: 'Report not found' });
    }

    // Check authorization - farmer can view own, officers can view from their division
    const userId = req.user.id || req.user._id;
    const reportOwnerId = report.farmerId?._id || report.farmerId;
    if (userId.toString() !== reportOwnerId.toString() && req.user.role !== 'officer') {
      return res.status(403).json({ success: false, msg: 'Unauthorized' });
    }

    res.json({ success: true, report });

  } catch (err) {
    console.error('Error fetching report:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/reports/:id/verify
 * Officer verifies a report
 */
router.put('/:id/verify', authMiddleware, async (req, res) => {
  try {
    const { status, verificationNotes, severity } = req.body;
    const currentUser = req.user;

    // Validate officer role
    if (currentUser.role !== 'officer') {
      return res.status(403).json({ success: false, msg: 'Only officers can verify reports' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, msg: 'Report not found' });
    }

    // Check if officer is from same GN Division
    if (currentUser.gnDivision !== report.gnDivision) {
      return res.status(403).json({ success: false, msg: 'Can only verify reports from your GN Division' });
    }

    // Update report
    report.status = status; // 'verified', 'rejected', or 'resolved'
    report.verifiedBy = currentUser.id;
    report.verifiedByName = currentUser.fullName;
    report.verificationDate = new Date();
    report.verificationNotes = verificationNotes;
    if (severity) report.severity = severity;

    await report.save();

    // If verified, create alert for other farmers in the area
    if (status === 'verified') {
      await createFarmerAlert(report);
      await createCommunityAlertFromReport(report);
    }

    res.json({
      success: true,
      msg: `Report ${status} successfully`,
      report
    });

  } catch (err) {
    console.error('Error verifying report:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Helper function: Create alert for farmers when report is verified
 */
async function createFarmerAlert(report) {
  try {
    // Find all farmers in same GN Division
    const farmers = await User.find({
      role: 'farmer',
      gnDivision: report.gnDivision,
      _id: { $ne: report.farmerId } // Exclude the farmer who reported it
    }).select('_id');

    const farmerIds = farmers.map(f => f._id);

    // Create alert
    const alert = new Alert({
      alert_type: report.report_type || 'disease',
      title: `Alert: ${report.title} detected in your area`,
      description: report.description,
      reportId: report._id,
      originalProblem: report.ai_prediction,
      district: report.district,
      dsDivision: report.dsDivision,
      gnDivision: report.gnDivision,
      severity: report.severity,
      recommendations: [
        'Monitor your crops closely for similar symptoms',
        `Contact farmer ${report.farmerName} at ${report.farmerPhone} for more details`,
        'Consult with local agricultural extension officer if symptoms detected'
      ],
      targetFarmers: farmerIds,
      publishedBy: report.verifiedBy,
      publishedDate: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isActive: true
    });

    await alert.save();

    // Mark as alert sent
    report.alertSentToFarmers = true;
    report.alertSentDate = new Date();
    report.affectedFarmersCount = farmerIds.length;
    await report.save();

    console.log(`Alert created for ${farmerIds.length} farmers in ${report.gnDivision}`);

  } catch (err) {
    console.error('Error creating farmer alert:', err);
  }
}

/**
 * GET /api/reports/alerts/my-area
 * Farmer gets alerts for their area
 */
router.get('/alerts/my-area', authMiddleware, async (req, res) => {
  try {
    const currentUser = req.user;

    if (currentUser.role !== 'farmer') {
      return res.status(403).json({ success: false, msg: 'Only farmers can view alerts' });
    }

    // Get active alerts for farmer's GN Division
    const alerts = await Alert.find({
      gnDivision: currentUser.gnDivision,
      isActive: true,
      expiresAt: { $gt: Date.now() }
    })
      .populate('reportId', 'title description ai_prediction')
      .populate('publishedBy', 'fullName designation')
      .sort({ publishedDate: -1 });

    // Mark alerts as viewed by this farmer
    for (const alert of alerts) {
      if (!alert.viewedBy.includes(currentUser.id)) {
        alert.viewedBy.push(currentUser.id);
        await alert.save();
      }
    }

    res.json({
      success: true,
      alerts,
      count: alerts.length
    });

  } catch (err) {
    console.error('Error fetching alerts:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Helper function: Create a CommunityAlert when a report is verified
 * This bridges the Report system with the CommunityAlert system used by AlertsDashboard
 */
async function createCommunityAlertFromReport(report) {
  try {
    // Extract disease name from ai_prediction or title
    const disease = report.ai_prediction || report.title || 'Unknown Disease';

    // Skip alerts for healthy diagnoses
    if (disease.toLowerCase().includes('healthy')) {
      return null;
    }

    // Extract crop type from title (format: "Paddy - Disease Name") or default
    let crop = 'Unknown';
    if (report.title) {
      const parts = report.title.split(' - ');
      if (parts.length > 1) {
        crop = parts[0].trim();
      }
    }

    // Default recommendation
    const recommendation = {
      en: `Officer-verified: ${disease} detected in ${crop} in ${report.gnDivision}. Monitor your crops closely. Consult your local agricultural officer immediately.`,
      si: `නිලධාරි සත්‍යාපිත: ${report.gnDivision} හි ${crop} බෝග වල ${disease} හඳුනාගෙන ඇත. ඔබේ බෝග සමීපව නිරීක්ෂණය කරන්න. වහාම ප්‍රදේශීය කෘෂිකර්ම නිලධාරියා හමුවන්න.`
    };

    // Check if there's already an active CommunityAlert for this disease+gnDivision
    let existingAlert = await CommunityAlert.findOne({
      disease: disease,
      gnDivision: report.gnDivision,
      status: { $in: ['active', 'monitoring'] }
    });

    if (existingAlert) {
      // Update existing alert: bump report count and severity
      existingAlert.reportCount += 1;
      existingAlert.lastUpdatedAt = new Date();
      if (existingAlert.reportCount >= 21) existingAlert.severity = 'critical';
      else if (existingAlert.reportCount >= 11) existingAlert.severity = 'high';
      else if (existingAlert.reportCount >= 6) existingAlert.severity = 'medium';
      else existingAlert.severity = report.severity || 'low';
      await existingAlert.save();
    } else {
      // Create new CommunityAlert
      await CommunityAlert.create({
        crop: crop,
        disease: disease,
        district: report.district,
        dsDivision: report.dsDivision,
        gnDivision: report.gnDivision,
        reportCount: 1,
        severity: report.severity || 'medium',
        status: 'active',
        firstReportedAt: report.createdAt || new Date(),
        lastUpdatedAt: new Date(),
        recommendation
      });
    }

    // Also create a Notification for farmers in this GN division
    const sevLabel = { en: (report.severity || 'medium').charAt(0).toUpperCase() + (report.severity || 'medium').slice(1), si: report.severity === 'critical' ? 'බරපතල' : report.severity === 'high' ? 'ඉහළ' : report.severity === 'low' ? 'අඩු' : 'මධ්‍යම' };
    const notifSeverity = (report.severity === 'critical' || report.severity === 'high') ? 'danger' : report.severity === 'low' ? 'info' : 'warning';

    await Notification.create({
      targetDistrict: report.district,
      targetDsDivision: report.dsDivision,
      targetGnDivision: report.gnDivision,
      type: 'disease_alert',
      title: {
        en: `⚠️ ${disease} Alert - ${sevLabel.en} Severity`,
        si: `⚠️ ${disease} අනතුරු ඇඟවීම - ${sevLabel.si} බරපතලකම`
      },
      message: {
        en: `Officer-verified: ${disease} detected in ${crop} in ${report.gnDivision}. ${recommendation.en}`,
        si: `නිලධාරි සත්‍යාපිත: ${report.gnDivision} හි ${crop} බෝග වල ${disease} හඳුනාගෙන ඇත. ${recommendation.si}`
      },
      severity: notifSeverity,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    console.log(`CommunityAlert + Notification created for verified report in ${report.gnDivision}`);

  } catch (err) {
    console.error('Error creating community alert from report:', err);
  }
}

module.exports = router;
