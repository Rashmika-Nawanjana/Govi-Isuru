const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const officerPerformanceService = require('../services/officerPerformanceService');
const fieldVisitService = require('../services/fieldVisitService');
const internalNoteService = require('../services/internalNoteService');

// Auth middleware - requires officer role
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

// ==================== PERFORMANCE ROUTES ====================

/**
 * GET /api/officer-workflow/performance
 * Get current officer's performance metrics
 */
router.get('/performance', officerAuthMiddleware, async (req, res) => {
  try {
    const { days } = req.query;
    
    const performance = await officerPerformanceService.getOfficerPerformance(
      req.user.id,
      { days: parseInt(days) || 30 }
    );
    
    res.json({
      success: true,
      performance
    });
  } catch (error) {
    console.error('Error fetching performance:', error);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

/**
 * GET /api/officer-workflow/performance/monthly
 * Get monthly comparison for current officer
 */
router.get('/performance/monthly', officerAuthMiddleware, async (req, res) => {
  try {
    const comparison = await officerPerformanceService.getMonthlyComparison(req.user.id);
    
    res.json({
      success: true,
      comparison
    });
  } catch (error) {
    console.error('Error fetching monthly comparison:', error);
    res.status(500).json({ error: 'Failed to fetch monthly comparison' });
  }
});

/**
 * GET /api/officer-workflow/leaderboard
 * Get officer leaderboard
 */
router.get('/leaderboard', officerAuthMiddleware, async (req, res) => {
  try {
    const { days, limit } = req.query;
    
    const leaderboard = await officerPerformanceService.getOfficerLeaderboard({
      days: parseInt(days) || 30,
      limit: parseInt(limit) || 10
    });
    
    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ==================== FIELD VISIT ROUTES ====================

/**
 * POST /api/officer-workflow/field-visits
 * Create a new field visit request
 */
router.post('/field-visits', officerAuthMiddleware, async (req, res) => {
  try {
    const { reportId, purpose, instructions, priority, scheduledDate, scheduledTime } = req.body;
    
    if (!reportId) {
      return res.status(400).json({ error: 'Report ID is required' });
    }
    
    const visit = await fieldVisitService.createFieldVisit(
      reportId,
      {
        userId: req.user.id,
        username: req.user.username
      },
      { purpose, instructions, priority, scheduledDate, scheduledTime }
    );
    
    res.status(201).json({
      success: true,
      message: 'Field visit scheduled',
      visit
    });
  } catch (error) {
    console.error('Error creating field visit:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({ 
      error: error.message || 'Failed to create field visit' 
    });
  }
});

/**
 * GET /api/officer-workflow/field-visits
 * Get field visits with filtering
 */
router.get('/field-visits', officerAuthMiddleware, async (req, res) => {
  try {
    const { status, priority, limit, offset } = req.query;
    
    const result = await fieldVisitService.getFieldVisits({
      district: req.user.district,
      status,
      priority,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching field visits:', error);
    res.status(500).json({ error: 'Failed to fetch field visits' });
  }
});

/**
 * GET /api/officer-workflow/field-visits/:id
 * Get field visit by ID
 */
router.get('/field-visits/:id', officerAuthMiddleware, async (req, res) => {
  try {
    const visit = await fieldVisitService.getFieldVisitById(req.params.id);
    
    if (!visit) {
      return res.status(404).json({ error: 'Field visit not found' });
    }
    
    res.json({
      success: true,
      visit
    });
  } catch (error) {
    console.error('Error fetching field visit:', error);
    res.status(500).json({ error: 'Failed to fetch field visit' });
  }
});

/**
 * PUT /api/officer-workflow/field-visits/:id/status
 * Update field visit status
 */
router.put('/field-visits/:id/status', officerAuthMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const visit = await fieldVisitService.updateFieldVisitStatus(
      req.params.id,
      status,
      { username: req.user.username }
    );
    
    res.json({
      success: true,
      message: `Field visit status updated to ${status}`,
      visit
    });
  } catch (error) {
    console.error('Error updating field visit status:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({ 
      error: error.message || 'Failed to update status' 
    });
  }
});

/**
 * POST /api/officer-workflow/field-visits/:id/notes
 * Add note to field visit
 */
router.post('/field-visits/:id/notes', officerAuthMiddleware, async (req, res) => {
  try {
    const { note } = req.body;
    
    if (!note) {
      return res.status(400).json({ error: 'Note content is required' });
    }
    
    const visit = await fieldVisitService.addVisitNote(
      req.params.id,
      note,
      req.user.username
    );
    
    res.json({
      success: true,
      message: 'Note added',
      visit
    });
  } catch (error) {
    console.error('Error adding visit note:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({ 
      error: error.message || 'Failed to add note' 
    });
  }
});

/**
 * POST /api/officer-workflow/field-visits/:id/photos
 * Add photo to field visit
 */
router.post('/field-visits/:id/photos', officerAuthMiddleware, async (req, res) => {
  try {
    const { url, caption } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'Photo URL is required' });
    }
    
    const visit = await fieldVisitService.addVisitPhoto(
      req.params.id,
      { url, caption },
      req.user.username
    );
    
    res.json({
      success: true,
      message: 'Photo added',
      visit
    });
  } catch (error) {
    console.error('Error adding visit photo:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({ 
      error: error.message || 'Failed to add photo' 
    });
  }
});

/**
 * PUT /api/officer-workflow/field-visits/:id/findings
 * Update field visit findings
 */
router.put('/field-visits/:id/findings', officerAuthMiddleware, async (req, res) => {
  try {
    const { diseaseConfirmed, severity, affectedArea, farmerContacted, recommendedActions } = req.body;
    
    const visit = await fieldVisitService.updateVisitFindings(
      req.params.id,
      { diseaseConfirmed, severity, affectedArea, farmerContacted, recommendedActions },
      { userId: req.user.id, username: req.user.username }
    );
    
    res.json({
      success: true,
      message: 'Findings updated',
      visit
    });
  } catch (error) {
    console.error('Error updating findings:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({ 
      error: error.message || 'Failed to update findings' 
    });
  }
});

/**
 * GET /api/officer-workflow/field-visits/stats
 * Get field visit statistics
 */
router.get('/field-visit-stats', officerAuthMiddleware, async (req, res) => {
  try {
    const stats = await fieldVisitService.getFieldVisitStats(req.user.district);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching field visit stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ==================== INTERNAL NOTES ROUTES ====================

/**
 * POST /api/officer-workflow/internal-notes
 * Create an internal note
 */
router.post('/internal-notes', officerAuthMiddleware, async (req, res) => {
  try {
    const { targetType, targetId, noteType, content, flags, visibility, farmerUsername, gnDivision, district } = req.body;
    
    if (!targetType || !targetId || !content) {
      return res.status(400).json({ error: 'Target type, target ID, and content are required' });
    }
    
    const note = await internalNoteService.createNote(
      { targetType, targetId, noteType, content, flags, visibility, farmerUsername, gnDivision, district },
      {
        userId: req.user.id,
        username: req.user.username,
        district: req.user.district
      }
    );
    
    res.status(201).json({
      success: true,
      message: 'Internal note created',
      note
    });
  } catch (error) {
    console.error('Error creating internal note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

/**
 * GET /api/officer-workflow/internal-notes/target/:type/:id
 * Get notes for a specific target
 */
router.get('/internal-notes/target/:type/:id', officerAuthMiddleware, async (req, res) => {
  try {
    const notes = await internalNoteService.getNotesForTarget(
      req.params.type,
      req.params.id,
      {
        userId: req.user.id,
        district: req.user.district
      }
    );
    
    res.json({
      success: true,
      notes
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

/**
 * GET /api/officer-workflow/internal-notes/farmer/:username
 * Get notes for a farmer
 */
router.get('/internal-notes/farmer/:username', officerAuthMiddleware, async (req, res) => {
  try {
    const notes = await internalNoteService.getNotesForFarmer(
      req.params.username,
      { userId: req.user.id, district: req.user.district }
    );
    
    res.json({
      success: true,
      notes
    });
  } catch (error) {
    console.error('Error fetching farmer notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

/**
 * GET /api/officer-workflow/flagged-entities
 * Get all flagged entities
 */
router.get('/flagged-entities', officerAuthMiddleware, async (req, res) => {
  try {
    const { flagType, limit } = req.query;
    
    const entities = await internalNoteService.getFlaggedEntities({
      district: req.user.district,
      flagType,
      limit: parseInt(limit) || 50
    });
    
    res.json({
      success: true,
      entities
    });
  } catch (error) {
    console.error('Error fetching flagged entities:', error);
    res.status(500).json({ error: 'Failed to fetch flagged entities' });
  }
});

/**
 * POST /api/officer-workflow/internal-notes/flag
 * Add a flag to an entity
 */
router.post('/internal-notes/flag', officerAuthMiddleware, async (req, res) => {
  try {
    const { targetType, targetId, flag, reason, farmerUsername, gnDivision, district } = req.body;
    
    if (!targetType || !targetId || !flag) {
      return res.status(400).json({ error: 'Target type, target ID, and flag are required' });
    }
    
    const note = await internalNoteService.addFlag(
      targetType,
      targetId,
      flag,
      { userId: req.user.id, username: req.user.username, district: req.user.district },
      { reason, farmerUsername, gnDivision, district }
    );
    
    res.json({
      success: true,
      message: 'Flag added',
      note
    });
  } catch (error) {
    console.error('Error adding flag:', error);
    res.status(500).json({ error: 'Failed to add flag' });
  }
});

/**
 * DELETE /api/officer-workflow/internal-notes/:id/flag/:flag
 * Remove a flag from a note
 */
router.delete('/internal-notes/:id/flag/:flag', officerAuthMiddleware, async (req, res) => {
  try {
    const note = await internalNoteService.removeFlag(
      req.params.id,
      req.params.flag,
      { username: req.user.username }
    );
    
    res.json({
      success: true,
      message: 'Flag removed',
      note
    });
  } catch (error) {
    console.error('Error removing flag:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({ 
      error: error.message || 'Failed to remove flag' 
    });
  }
});

/**
 * PUT /api/officer-workflow/internal-notes/:id/resolve
 * Resolve/deactivate a note
 */
router.put('/internal-notes/:id/resolve', officerAuthMiddleware, async (req, res) => {
  try {
    const note = await internalNoteService.resolveNote(
      req.params.id,
      { username: req.user.username }
    );
    
    res.json({
      success: true,
      message: 'Note resolved',
      note
    });
  } catch (error) {
    console.error('Error resolving note:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({ 
      error: error.message || 'Failed to resolve note' 
    });
  }
});

/**
 * GET /api/officer-workflow/internal-notes/stats
 * Get internal note statistics
 */
router.get('/internal-notes/stats', officerAuthMiddleware, async (req, res) => {
  try {
    const stats = await internalNoteService.getNoteStats(req.user.district);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching note stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
