const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const officerService = require('../services/officerService');
const DiseaseReport = require('../models/DiseaseReport');
const OfficerActionLog = require('../models/OfficerActionLog');

// Auth middleware - requires officer role
const officerAuthMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user is an officer
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
 * GET /api/officer/reports
 * Get reports for officer review with filtering
 */
router.get('/reports', officerAuthMiddleware, async (req, res) => {
  try {
    const { status, priority, limit } = req.query;
    
    const reports = await officerService.getReportsForReview({
      district: req.user.district,
      status,
      priority,
      limit: parseInt(limit) || 100
    });
    
    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('Error fetching reports for review:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * PUT /api/officer/reports/:id/status
 * Update report verification status
 */
router.put('/reports/:id/status', officerAuthMiddleware, async (req, res) => {
  try {
    const { status, reason, notes, priority } = req.body;
    
    const validStatuses = ['pending', 'under_review', 'verified', 'rejected', 'flagged', 'needs_field_visit'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    const report = await officerService.updateReportStatus(
      req.params.id,
      status,
      {
        userId: req.user.id,
        username: req.user.username,
        district: req.user.district
      },
      {
        reason,
        notes,
        priority,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
    
    res.json({
      success: true,
      message: `Report status updated to ${status}`,
      report
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(error.message.includes('not found') ? 404 : 400).json({ 
      error: error.message || 'Failed to update report status' 
    });
  }
});

/**
 * PUT /api/officer/reports/:id/priority
 * Update report priority level
 */
router.put('/reports/:id/priority', officerAuthMiddleware, async (req, res) => {
  try {
    const { priority, reason } = req.body;
    
    const validPriorities = ['info', 'low', 'medium', 'high', 'emergency'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ 
        error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` 
      });
    }
    
    const report = await officerService.updateReportPriority(
      req.params.id,
      priority,
      {
        userId: req.user.id,
        username: req.user.username,
        district: req.user.district
      },
      { reason }
    );
    
    res.json({
      success: true,
      message: `Report priority updated to ${priority}`,
      report
    });
  } catch (error) {
    console.error('Error updating report priority:', error);
    res.status(error.message.includes('not found') ? 404 : 400).json({ 
      error: error.message || 'Failed to update report priority' 
    });
  }
});

/**
 * GET /api/officer/action-logs
 * Get officer action logs (audit trail)
 */
router.get('/action-logs', officerAuthMiddleware, async (req, res) => {
  try {
    const { targetId, actionType, days, limit } = req.query;
    
    const logs = await officerService.getActionLogs({
      district: req.user.district,
      targetId,
      actionType,
      days: parseInt(days) || 30,
      limit: parseInt(limit) || 100
    });
    
    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Error fetching action logs:', error);
    res.status(500).json({ error: 'Failed to fetch action logs' });
  }
});

/**
 * GET /api/officer/stats
 * Get verification statistics for officer dashboard
 */
router.get('/stats', officerAuthMiddleware, async (req, res) => {
  try {
    const stats = await officerService.getVerificationStats(req.user.district);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching officer stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/officer/escalations
 * Get reports that need escalation (past SLA)
 */
router.get('/escalations', officerAuthMiddleware, async (req, res) => {
  try {
    const candidates = await officerService.getEscalationCandidates(req.user.district);
    
    res.json({
      success: true,
      count: candidates.length,
      escalations: candidates
    });
  } catch (error) {
    console.error('Error fetching escalation candidates:', error);
    res.status(500).json({ error: 'Failed to fetch escalations' });
  }
});

/**
 * GET /api/officer/report/:id/history
 * Get action history for a specific report
 */
router.get('/report/:id/history', officerAuthMiddleware, async (req, res) => {
  try {
    const logs = await OfficerActionLog.find({
      targetId: req.params.id,
      targetType: 'disease_report'
    })
    .sort({ createdAt: -1 })
    .lean();
    
    res.json({
      success: true,
      count: logs.length,
      history: logs
    });
  } catch (error) {
    console.error('Error fetching report history:', error);
    res.status(500).json({ error: 'Failed to fetch report history' });
  }
});

/**
 * POST /api/officer/reports/:id/note
 * Add a note to a report
 */
router.post('/reports/:id/note', officerAuthMiddleware, async (req, res) => {
  try {
    const { note } = req.body;
    
    if (!note || note.trim().length === 0) {
      return res.status(400).json({ error: 'Note content is required' });
    }
    
    // Log the note as an action
    await officerService.logAction({
      officerId: req.user.userId,
      officerUsername: req.user.username,
      officerDistrict: req.user.district,
      actionType: 'add_note',
      targetType: 'disease_report',
      targetId: req.params.id,
      notes: note
    });
    
    res.json({
      success: true,
      message: 'Note added successfully'
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

/**
 * GET /api/officer/priority-config
 * Get priority configuration for UI
 */
router.get('/priority-config', officerAuthMiddleware, async (req, res) => {
  res.json({
    success: true,
    config: officerService.PRIORITY_CONFIG
  });
});

module.exports = router;
