const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Alert = require('../models/Alert');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

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

    if (!currentUser.phone) {
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
      farmerId: currentUser._id,
      farmerName: currentUser.fullName || currentUser.username || 'Farmer',
      farmerPhone: currentUser.phone,
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
      farmerId: currentUser._id
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
    if (req.user._id.toString() !== report.farmerId._id.toString() && req.user.role !== 'officer') {
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
    report.verifiedBy = currentUser._id;
    report.verifiedByName = currentUser.fullName;
    report.verificationDate = new Date();
    report.verificationNotes = verificationNotes;
    if (severity) report.severity = severity;

    await report.save();

    // If verified, create alert for other farmers in the area
    if (status === 'verified') {
      await createFarmerAlert(report);
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
      if (!alert.viewedBy.includes(currentUser._id)) {
        alert.viewedBy.push(currentUser._id);
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

module.exports = router;
