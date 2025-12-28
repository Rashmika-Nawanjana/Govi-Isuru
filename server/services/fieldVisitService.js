const FieldVisit = require('../models/FieldVisit');
const DiseaseReport = require('../models/DiseaseReport');
const OfficerActionLog = require('../models/OfficerActionLog');

/**
 * Field Visit Service
 * Manages field visit scheduling, tracking, and completion
 */

/**
 * Create a new field visit request
 */
async function createFieldVisit(reportId, officerData, visitData) {
  try {
    // Get the report details
    const report = await DiseaseReport.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const fieldVisit = new FieldVisit({
      reportId,
      requestedBy: officerData.userId,
      requestedByUsername: officerData.username,
      district: report.district,
      dsDivision: report.dsDivision,
      gnDivision: report.gnDivision,
      purpose: visitData.purpose || `Verify disease report: ${report.disease}`,
      instructions: visitData.instructions || null,
      priority: visitData.priority || 'medium',
      scheduledDate: visitData.scheduledDate || null,
      scheduledTime: visitData.scheduledTime || null,
      assignedTo: visitData.assignedTo || null,
      assignedToUsername: visitData.assignedToUsername || null
    });

    await fieldVisit.save();

    // Update report status
    report.verificationStatus = 'needs_field_visit';
    await report.save();

    return fieldVisit;
  } catch (error) {
    console.error('Error creating field visit:', error);
    throw error;
  }
}

/**
 * Get field visits with filtering
 */
async function getFieldVisits(options = {}) {
  try {
    const { 
      district, 
      status, 
      assignedTo, 
      priority,
      limit = 50,
      offset = 0 
    } = options;

    const query = {};
    if (district) query.district = district;
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;

    const visits = await FieldVisit.find(query)
      .populate('reportId', 'disease crop severity farmerUsername')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await FieldVisit.countDocuments(query);

    return { visits, total };
  } catch (error) {
    console.error('Error getting field visits:', error);
    throw error;
  }
}

/**
 * Get field visit by ID
 */
async function getFieldVisitById(visitId) {
  try {
    const visit = await FieldVisit.findById(visitId)
      .populate('reportId');
    return visit;
  } catch (error) {
    console.error('Error getting field visit:', error);
    throw error;
  }
}

/**
 * Update field visit status
 */
async function updateFieldVisitStatus(visitId, status, officerData) {
  try {
    const visit = await FieldVisit.findById(visitId);
    if (!visit) {
      throw new Error('Field visit not found');
    }

    visit.status = status;
    
    if (status === 'completed') {
      visit.completedAt = new Date();
      visit.completedBy = officerData.username;
    }

    await visit.save();
    return visit;
  } catch (error) {
    console.error('Error updating field visit status:', error);
    throw error;
  }
}

/**
 * Add visit note
 */
async function addVisitNote(visitId, note, officerUsername) {
  try {
    const visit = await FieldVisit.findById(visitId);
    if (!visit) {
      throw new Error('Field visit not found');
    }

    visit.visitNotes.push({
      note,
      addedBy: officerUsername,
      addedAt: new Date()
    });

    await visit.save();
    return visit;
  } catch (error) {
    console.error('Error adding visit note:', error);
    throw error;
  }
}

/**
 * Add visit photo (URL-based for now)
 */
async function addVisitPhoto(visitId, photoData, officerUsername) {
  try {
    const visit = await FieldVisit.findById(visitId);
    if (!visit) {
      throw new Error('Field visit not found');
    }

    visit.photos.push({
      url: photoData.url,
      caption: photoData.caption || null,
      uploadedBy: officerUsername,
      uploadedAt: new Date()
    });

    await visit.save();
    return visit;
  } catch (error) {
    console.error('Error adding visit photo:', error);
    throw error;
  }
}

/**
 * Update visit findings
 */
async function updateVisitFindings(visitId, findings, officerData) {
  try {
    const visit = await FieldVisit.findById(visitId);
    if (!visit) {
      throw new Error('Field visit not found');
    }

    visit.findings = {
      ...visit.findings,
      ...findings
    };

    // If findings are complete, mark as completed
    if (findings.diseaseConfirmed !== null && findings.severity) {
      visit.status = 'completed';
      visit.completedAt = new Date();
      visit.completedBy = officerData.username;

      // Update the original report based on findings
      const report = await DiseaseReport.findById(visit.reportId);
      if (report) {
        if (findings.diseaseConfirmed) {
          report.verificationStatus = 'verified';
          report.severity = findings.severity;
        } else {
          report.verificationStatus = 'rejected';
          report.flaggedReason = 'Field visit did not confirm disease presence';
        }
        report.adminReviewed = true;
        report.reviewedBy = officerData.username;
        report.reviewedAt = new Date();
        await report.save();
      }
    }

    await visit.save();
    return visit;
  } catch (error) {
    console.error('Error updating visit findings:', error);
    throw error;
  }
}

/**
 * Assign field visit to officer
 */
async function assignFieldVisit(visitId, assigneeData) {
  try {
    const visit = await FieldVisit.findById(visitId);
    if (!visit) {
      throw new Error('Field visit not found');
    }

    visit.assignedTo = assigneeData.userId;
    visit.assignedToUsername = assigneeData.username;
    visit.status = 'scheduled';

    await visit.save();
    return visit;
  } catch (error) {
    console.error('Error assigning field visit:', error);
    throw error;
  }
}

/**
 * Get field visit statistics
 */
async function getFieldVisitStats(district = null) {
  try {
    const matchQuery = district ? { district } : {};

    const stats = await FieldVisit.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      postponed: 0
    };

    stats.forEach(s => {
      statusCounts[s._id] = s.count;
    });

    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const pending = statusCounts.scheduled + statusCounts.in_progress;

    return {
      total,
      pending,
      ...statusCounts
    };
  } catch (error) {
    console.error('Error getting field visit stats:', error);
    throw error;
  }
}

module.exports = {
  createFieldVisit,
  getFieldVisits,
  getFieldVisitById,
  updateFieldVisitStatus,
  addVisitNote,
  addVisitPhoto,
  updateVisitFindings,
  assignFieldVisit,
  getFieldVisitStats
};
