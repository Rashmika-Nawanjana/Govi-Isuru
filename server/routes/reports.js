const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Alert = require('../models/Alert');
const CommunityAlert = require('../models/CommunityAlert');
const Notification = require('../models/Notification');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const alertService = require('../services/alertService');

const AUTO_VERIFY_THRESHOLD = 0.95;
const ADVICE_FEE_CREDITS = Number(process.env.ADVICE_FEE_CREDITS || 40);

async function createInstructorCaseNotifications(report) {
  const instructors = await User.find({ role: 'officer', isApproved: true }).select('_id');
  if (!instructors.length) return 0;

  const docs = instructors.map((officer) => ({
    recipientUserId: officer._id,
    recipientRole: 'officer',
    type: 'instructor_case',
    reportId: report._id,
    title: {
      en: 'New Case Available for Analysis',
      si: 'විශ්ලේෂණය සඳහා නව නඩුවක් ඇත'
    },
    message: {
      en: `${report.ai_prediction || report.title} (${Math.round((report.confidence_score || 0) * 100)}% confidence) needs instructor analysis.`,
      si: `${report.ai_prediction || report.title} (${Math.round((report.confidence_score || 0) * 100)}% විශ්වාසය) සඳහා නිලධාරී විශ්ලේෂණය අවශ්‍යයි.`
    },
    severity: 'warning'
  }));

  await Notification.insertMany(docs);
  return docs.length;
}

async function syncDiseaseReportVerification(report, reviewerName, notes) {
  if (!report.diseaseReportId) return;

  await alertService.reviewReport(report.diseaseReportId, {
    status: 'verified',
    reviewedBy: reviewerName,
    flaggedReason: notes || undefined
  });
}

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

    const confidence = Number(confidence_score || 0);
    const isAutoVerified = confidence >= AUTO_VERIFY_THRESHOLD;

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
      confidence_score: confidence,
      autoVerifiedByAI: isAutoVerified,
      status: isAutoVerified ? 'verified' : 'instructor_pending',
      verificationDate: isAutoVerified ? new Date() : undefined,
      verificationNotes: isAutoVerified
        ? `Auto-verified by AI (>= ${Math.round(AUTO_VERIFY_THRESHOLD * 100)}% confidence).`
        : undefined,
      assignmentStatus: isAutoVerified ? 'closed' : 'unassigned',
      adviceFeeCredits: ADVICE_FEE_CREDITS,
      paymentStatus: isAutoVerified ? 'not_required' : 'pending'
    });

    await report.save();

    // Also create a DiseaseReport entry so the officer dashboard picks it up
    try {
      const diseaseSaveResult = await alertService.saveDiseaseReport({
        farmerId: currentUser.id || currentUser._id,
        farmerUsername: currentUser.fullName || currentUser.username || 'Farmer',
        crop: (title || '').split(' - ')[0]?.toLowerCase() || 'rice',
        disease: ai_prediction || title || 'Unknown',
        confidence,
        district: currentUser.district,
        dsDivision: currentUser.dsDivision,
        gnDivision: currentUser.gnDivision,
        treatment: '',
        verificationStatus: isAutoVerified ? 'verified' : 'pending'
      });

      if (diseaseSaveResult?.report?._id) {
        report.diseaseReportId = diseaseSaveResult.report._id;
      }
    } catch (diseaseReportErr) {
      // Log but don't fail the main report submission
      console.error('Error creating DiseaseReport entry:', diseaseReportErr);
    }

    if (isAutoVerified) {
      await createFarmerAlert(report);
      await createCommunityAlertFromReport(report, { source: 'ai_auto' });
      report.alertSentToFarmers = true;
      report.alertSentDate = new Date();
      await report.save();

      return res.status(201).json({
        success: true,
        workflow: 'auto_verified',
        msg: 'Report auto-verified and disease alert sent to farmers in your GN division.',
        reportId: report._id,
        confidence
      });
    }

    const notifiedCount = await createInstructorCaseNotifications(report);
    await report.save();

    res.status(201).json({
      success: true,
      workflow: 'instructor_required',
      msg: 'Report submitted. All registered agricultural instructors have been notified for paid analysis.',
      reportId: report._id,
      confidence,
      notifiedInstructors: notifiedCount
    });

  } catch (err) {
    console.error('Report submission error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/reports/pending
 * Instructor gets unassigned low-confidence cases (countrywide)
 */
router.get('/pending', authMiddleware, async (req, res) => {
  try {
    const currentUser = req.user;

    // Validate officer role
    if (currentUser.role !== 'officer') {
      return res.status(403).json({ success: false, msg: 'Only officers can view pending reports' });
    }

    // Countrywide instructor queue for low-confidence cases
    const reports = await Report.find({
      status: 'instructor_pending',
      assignmentStatus: 'unassigned',
      confidence_score: { $lt: AUTO_VERIFY_THRESHOLD }
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
      .select('title description image_url ai_prediction confidence_score status verificationDate verificationNotes gnDivision createdAt autoVerifiedByAI assignedInstructorName assignmentStatus adviceText adviceFeeCredits paymentStatus adviceSubmittedAt')
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

    // Update report
    report.status = status; // 'verified', 'rejected', or 'resolved'
    report.verifiedBy = currentUser.id;
    report.verifiedByName = currentUser.fullName;
    report.verificationDate = new Date();
    report.verificationNotes = verificationNotes;
    if (severity) report.severity = severity;

    await report.save();

    // For manual flow, verification should update heatmap eligibility only.
    // GN alerts are only auto-sent for AI auto-verified high-confidence cases.
    if (status === 'verified') {
      await syncDiseaseReportVerification(
        report,
        currentUser.fullName || currentUser.username || 'Agricultural Instructor',
        verificationNotes
      );
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
 * GET /api/reports/instructor/my-cases
 * Instructor gets cases claimed by themselves
 */
router.get('/instructor/my-cases', authMiddleware, async (req, res) => {
  try {
    const currentUser = req.user;
    if (currentUser.role !== 'officer') {
      return res.status(403).json({ success: false, msg: 'Only agricultural instructors can view cases' });
    }

    const reports = await Report.find({
      assignedInstructorId: currentUser.id,
      assignmentStatus: { $in: ['claimed', 'analysing', 'advice_submitted'] }
    }).sort({ claimedAt: -1, createdAt: -1 });

    res.json({ success: true, reports, count: reports.length });
  } catch (err) {
    console.error('Error fetching instructor cases:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/reports/:id/claim
 * Instructor claims an unassigned low-confidence case (exclusive)
 */
router.post('/:id/claim', authMiddleware, async (req, res) => {
  try {
    const currentUser = req.user;
    if (currentUser.role !== 'officer') {
      return res.status(403).json({ success: false, msg: 'Only agricultural instructors can claim cases' });
    }

    const report = await Report.findOneAndUpdate(
      {
        _id: req.params.id,
        status: 'instructor_pending',
        assignmentStatus: 'unassigned',
        confidence_score: { $lt: AUTO_VERIFY_THRESHOLD }
      },
      {
        $set: {
          assignedInstructorId: currentUser.id,
          assignedInstructorName: currentUser.fullName || currentUser.username,
          assignmentStatus: 'claimed',
          claimedAt: new Date(),
          status: 'claimed'
        }
      },
      { new: true }
    );

    if (!report) {
      return res.status(409).json({ success: false, msg: 'Case already claimed by another instructor or unavailable.' });
    }

    await Notification.create({
      recipientUserId: report.farmerId,
      recipientRole: 'farmer',
      type: 'advice_update',
      reportId: report._id,
      title: {
        en: 'Your Case Was Claimed',
        si: 'ඔබේ නඩුව භාරගෙන ඇත'
      },
      message: {
        en: `${report.assignedInstructorName} accepted your case and will start analysis soon.`,
        si: `${report.assignedInstructorName} ඔබගේ නඩුව භාරගෙන ඇත.`
      },
      severity: 'info'
    });

    res.json({ success: true, msg: 'Case claimed successfully', report });
  } catch (err) {
    console.error('Error claiming case:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/reports/:id/start-analysis
 * Instructor marks a claimed case as analysing
 */
router.post('/:id/start-analysis', authMiddleware, async (req, res) => {
  try {
    const currentUser = req.user;
    if (currentUser.role !== 'officer') {
      return res.status(403).json({ success: false, msg: 'Only agricultural instructors can start analysis' });
    }

    const report = await Report.findOneAndUpdate(
      {
        _id: req.params.id,
        assignedInstructorId: currentUser.id,
        assignmentStatus: { $in: ['claimed', 'analysing'] }
      },
      {
        $set: {
          assignmentStatus: 'analysing',
          status: 'under_review',
          analysisStartedAt: new Date()
        }
      },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ success: false, msg: 'Case not found or not assigned to you' });
    }

    res.json({ success: true, msg: 'Analysis started', report });
  } catch (err) {
    console.error('Error starting analysis:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/reports/:id/submit-advice
 * Instructor submits paid advice and transfers farmer credits to instructor
 */
router.post('/:id/submit-advice', authMiddleware, async (req, res) => {
  try {
    const currentUser = req.user;
    if (currentUser.role !== 'officer') {
      return res.status(403).json({ success: false, msg: 'Only agricultural instructors can submit paid advice' });
    }

    const { adviceText, verificationNotes } = req.body;
    if (!adviceText || !adviceText.trim()) {
      return res.status(400).json({ success: false, msg: 'Advice text is required' });
    }

    const report = await Report.findOne({
      _id: req.params.id,
      assignedInstructorId: currentUser.id,
      assignmentStatus: { $in: ['claimed', 'analysing'] }
    });

    if (!report) {
      return res.status(404).json({ success: false, msg: 'Case not found or not assigned to you' });
    }

    const fee = Number(report.adviceFeeCredits || ADVICE_FEE_CREDITS);
    const farmer = await User.findById(report.farmerId);
    const instructor = await User.findById(currentUser.id);

    if (!farmer || !instructor) {
      return res.status(404).json({ success: false, msg: 'Farmer or instructor not found' });
    }

    if ((farmer.credits || 0) < fee) {
      return res.status(403).json({
        success: false,
        msg: `Farmer has insufficient credits for paid advice (${fee} required).`,
        requiredCredits: fee,
        farmerCredits: farmer.credits || 0
      });
    }

    farmer.credits = (farmer.credits || 0) - fee;
    instructor.credits = (instructor.credits || 0) + fee;
    await farmer.save();
    await instructor.save();

    report.adviceText = adviceText.trim();
    report.adviceSubmittedAt = new Date();
    report.assignmentStatus = 'advice_submitted';
    report.status = 'advice_submitted';
    report.paymentStatus = 'completed';
    report.paymentCompletedAt = new Date();
    report.verifiedBy = currentUser.id;
    report.verifiedByName = currentUser.fullName || currentUser.username;
    report.verificationDate = new Date();
    report.verificationNotes = verificationNotes || 'Verified through instructor paid analysis.';
    await report.save();

    await syncDiseaseReportVerification(
      report,
      report.verifiedByName,
      report.verificationNotes
    );

    await Notification.create({
      recipientUserId: report.farmerId,
      recipientRole: 'farmer',
      type: 'advice_update',
      reportId: report._id,
      title: {
        en: 'Paid Advice Delivered',
        si: 'ගෙවන උපදෙස් ලබාදී ඇත'
      },
      message: {
        en: `Your case was completed by ${report.verifiedByName}. ${fee} credits were deducted and advice is ready.`,
        si: `${report.verifiedByName} විසින් ඔබගේ නඩුව සම්පූර්ණ කර ඇත. ${fee} credits අඩු කර ඇත.`
      },
      severity: 'info'
    });

    res.json({ success: true, msg: 'Advice submitted and credits transferred successfully', report });
  } catch (err) {
    console.error('Error submitting advice:', err);
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
async function createCommunityAlertFromReport(report, options = {}) {
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

    const source = options.source === 'ai_auto' ? 'AI auto-verified' : 'Instructor-verified';

    // Default recommendation
    const recommendation = {
      en: `Monitor your crops closely. Consult your local agricultural officer immediately.`,
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
        en: `${source}: ${disease} detected in ${crop} in ${report.gnDivision}. ${recommendation.en}`,
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
