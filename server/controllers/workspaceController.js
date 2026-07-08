const SavedWorkspace = require('../models/SavedWorkspace');

// Save a collaborative workspace
exports.saveWorkspace = async (req, res) => {
  try {
    const { projectName, reason, teamMembers, files } = req.body;
    const userId = req.user.id;

    if (!projectName || !reason || !files) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const savedWorkspace = new SavedWorkspace({
      projectName,
      reason,
      teamMembers: teamMembers || [],
      files,
      owner: userId
    });

    await savedWorkspace.save();

    res.status(201).json({
      success: true,
      message: 'Workspace saved successfully',
      workspace: savedWorkspace
    });
  } catch (err) {
    console.error('Error saving workspace:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get all saved workspaces for a user
exports.getSavedWorkspaces = async (req, res) => {
  try {
    const userId = req.user.id;
    const workspaces = await SavedWorkspace.find({ owner: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      workspaces
    });
  } catch (err) {
    console.error('Error fetching saved workspaces:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
