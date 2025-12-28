const InternalNote = require('../models/InternalNote');

/**
 * Internal Note Service
 * Manages hidden comments and internal flags for officer coordination
 */

/**
 * Create an internal note
 */
async function createNote(noteData, officerData) {
  try {
    const note = new InternalNote({
      targetType: noteData.targetType,
      targetId: noteData.targetId,
      farmerUsername: noteData.farmerUsername || null,
      gnDivision: noteData.gnDivision || null,
      district: noteData.district || officerData.district,
      noteType: noteData.noteType || 'general',
      content: noteData.content,
      flags: noteData.flags || [],
      visibility: noteData.visibility || 'all_officers',
      createdBy: officerData.userId,
      createdByUsername: officerData.username,
      createdByDistrict: officerData.district,
      expiresAt: noteData.expiresAt || null
    });

    await note.save();
    return note;
  } catch (error) {
    console.error('Error creating internal note:', error);
    throw error;
  }
}

/**
 * Get notes for a specific target
 */
async function getNotesForTarget(targetType, targetId, officerData) {
  try {
    const query = {
      targetType,
      targetId,
      isActive: true,
      $or: [
        { visibility: 'all_officers' },
        { visibility: 'district_only', createdByDistrict: officerData.district },
        { visibility: 'admin_only', createdBy: officerData.userId }
      ]
    };

    // Filter out expired notes
    query.$or.push({ expiresAt: null });
    query.$or.push({ expiresAt: { $gt: new Date() } });

    const notes = await InternalNote.find(query)
      .sort({ createdAt: -1 });

    return notes;
  } catch (error) {
    console.error('Error getting notes for target:', error);
    throw error;
  }
}

/**
 * Get notes for a farmer (by username)
 */
async function getNotesForFarmer(farmerUsername, officerData) {
  try {
    const query = {
      farmerUsername,
      isActive: true
    };

    const notes = await InternalNote.find(query)
      .sort({ createdAt: -1 });

    return notes;
  } catch (error) {
    console.error('Error getting notes for farmer:', error);
    throw error;
  }
}

/**
 * Get notes for a location
 */
async function getNotesForLocation(gnDivision, district, officerData) {
  try {
    const query = {
      gnDivision,
      district,
      isActive: true
    };

    const notes = await InternalNote.find(query)
      .sort({ createdAt: -1 });

    return notes;
  } catch (error) {
    console.error('Error getting notes for location:', error);
    throw error;
  }
}

/**
 * Get flagged entities (farmers, locations with warning flags)
 */
async function getFlaggedEntities(options = {}) {
  try {
    const { district, flagType, limit = 50 } = options;

    const query = {
      isActive: true,
      flags: { $exists: true, $ne: [] }
    };

    if (district) query.district = district;
    if (flagType) query.flags = flagType;

    const notes = await InternalNote.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    // Group by target
    const grouped = {};
    notes.forEach(note => {
      const key = `${note.targetType}-${note.targetId}`;
      if (!grouped[key]) {
        grouped[key] = {
          targetType: note.targetType,
          targetId: note.targetId,
          farmerUsername: note.farmerUsername,
          gnDivision: note.gnDivision,
          district: note.district,
          flags: new Set(),
          noteCount: 0,
          latestNote: note.createdAt
        };
      }
      note.flags.forEach(f => grouped[key].flags.add(f));
      grouped[key].noteCount++;
    });

    return Object.values(grouped).map(g => ({
      ...g,
      flags: Array.from(g.flags)
    }));
  } catch (error) {
    console.error('Error getting flagged entities:', error);
    throw error;
  }
}

/**
 * Add flag to an existing note or create new flagged note
 */
async function addFlag(targetType, targetId, flag, officerData, additionalData = {}) {
  try {
    // Check if there's an existing active note with flags for this target
    let note = await InternalNote.findOne({
      targetType,
      targetId,
      isActive: true,
      noteType: 'flag'
    });

    if (note) {
      // Add flag if not already present
      if (!note.flags.includes(flag)) {
        note.flags.push(flag);
        await note.save();
      }
    } else {
      // Create new flagged note
      note = await createNote({
        targetType,
        targetId,
        noteType: 'flag',
        content: additionalData.reason || `Flagged as: ${flag}`,
        flags: [flag],
        farmerUsername: additionalData.farmerUsername,
        gnDivision: additionalData.gnDivision,
        district: additionalData.district
      }, officerData);
    }

    return note;
  } catch (error) {
    console.error('Error adding flag:', error);
    throw error;
  }
}

/**
 * Remove flag from a note
 */
async function removeFlag(noteId, flag, officerData) {
  try {
    const note = await InternalNote.findById(noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    note.flags = note.flags.filter(f => f !== flag);
    
    // If no flags left and it was a flag-type note, mark as resolved
    if (note.flags.length === 0 && note.noteType === 'flag') {
      note.isActive = false;
      note.resolvedAt = new Date();
      note.resolvedBy = officerData.username;
    }

    await note.save();
    return note;
  } catch (error) {
    console.error('Error removing flag:', error);
    throw error;
  }
}

/**
 * Resolve/deactivate a note
 */
async function resolveNote(noteId, officerData) {
  try {
    const note = await InternalNote.findById(noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    note.isActive = false;
    note.resolvedAt = new Date();
    note.resolvedBy = officerData.username;

    await note.save();
    return note;
  } catch (error) {
    console.error('Error resolving note:', error);
    throw error;
  }
}

/**
 * Get note statistics
 */
async function getNoteStats(district = null) {
  try {
    const matchQuery = { isActive: true };
    if (district) matchQuery.district = district;

    const [typeStats, flagStats] = await Promise.all([
      InternalNote.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$noteType', count: { $sum: 1 } } }
      ]),
      InternalNote.aggregate([
        { $match: matchQuery },
        { $unwind: '$flags' },
        { $group: { _id: '$flags', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    return {
      byType: typeStats.reduce((acc, t) => ({ ...acc, [t._id]: t.count }), {}),
      byFlag: flagStats.reduce((acc, f) => ({ ...acc, [f._id]: f.count }), {}),
      total: typeStats.reduce((sum, t) => sum + t.count, 0)
    };
  } catch (error) {
    console.error('Error getting note stats:', error);
    throw error;
  }
}

module.exports = {
  createNote,
  getNotesForTarget,
  getNotesForFarmer,
  getNotesForLocation,
  getFlaggedEntities,
  addFlag,
  removeFlag,
  resolveNote,
  getNoteStats
};
