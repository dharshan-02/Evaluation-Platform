const Project = require('../models/Project');
const Notification = require('../models/Notification');
const DocumentPlagiarismReport = require('../models/DocumentPlagiarismReport');
const { getIO } = require('../socket');
const { scanDocument } = require('../services/webPlagiarismService');
const path = require('path');

exports.createProject = async (req, res) => {
  try {
    const { title, description, guideId, githubUrl, source } = req.body;
    
    // Inverted flow: Student creates the project, reviews are empty initially
    const project = new Project({
      title,
      description,
      githubUrl,
      source,
      student: req.user._id,
      guide: guideId,
      reviews: []
    });
    await project.save();
    res.status(201).json({ message: 'Project created successfully', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addReviewToProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dueDate, maxMarks } = req.body;
    
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    // Check if the current user is the guide or admin
    if (req.user.role !== 'admin' && project.guide.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not the guide for this project' });
    }
    
    project.reviews.push({
      name,
      dueDate,
      maxMarks: Number(maxMarks) || 100
    });
    
    await project.save();
    res.status(200).json({ message: 'Review added successfully', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const { role, _id } = req.user;
    let query = {};
    if (role === 'student') {
      query.student = _id;
    } else if (role === 'faculty') {
      query.guide = _id;
    }
    // Admin sees all
    
    const projects = await Project.find(query)
      .populate('student', 'name email role')
      .populate('guide', 'name email role')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ projects });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getProjectDetails = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('student', 'name email role')
      .populate('guide', 'name email role')
      .populate('reviews.grading.gradedBy', 'name');
      
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Fix for old projects: Mongoose dynamically generates a default collabPin in memory if it's missing in the DB.
    // We need to persist it to the DB so it doesn't change every time we fetch it.
    const rawProject = await Project.findById(req.params.id).lean();
    if (!rawProject.collabPin) {
      await project.save();
    }

    res.status(200).json({ project });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.submitReviewDocuments = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const { githubUrl } = req.body;
    
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    const review = project.reviews.id(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    if (new Date() > new Date(review.dueDate)) {
      return res.status(400).json({ message: 'Deadline has passed for this review' });
    }
    
    // Process files (multer should handle array or multiple fields)
    let reportFile = review.submission?.reportFile;
    let presentationFile = review.submission?.presentationFile;
    
    if (req.files) {
      if (req.files['reportFile']) {
        reportFile = '/uploads/' + req.files['reportFile'][0].filename;
      }
      if (req.files['presentationFile']) {
        presentationFile = '/uploads/' + req.files['presentationFile'][0].filename;
      }
    }
    
    review.submission = {
      githubUrl: githubUrl || review.submission?.githubUrl,
      reportFile,
      presentationFile,
      submittedAt: new Date()
    };
    review.status = 'submitted';
    
    await project.save();
    res.status(200).json({ message: 'Documents submitted successfully', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.gradeReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const { marks, feedback } = req.body;
    
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    const review = project.reviews.id(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    review.grading = {
      marks: Number(marks),
      feedback,
      gradedBy: req.user._id,
      gradedAt: new Date()
    };
    review.status = 'graded';
    
    await project.save();

    // Create Notification for the student
    const notification = await Notification.create({
      user: project.student,
      title: 'Review Graded',
      message: `Your project review "${review.name}" for "${project.title}" has been graded. Marks: ${review.grading.marks}/${review.maxMarks}`,
      type: 'result',
      link: `/projects/${project._id}`
    });

    const io = getIO();
    if (io) {
      io.to(project.student.toString()).emit('notification', notification);
    }

    res.status(200).json({ message: 'Grade submitted successfully', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.scanDocumentPlagiarism = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const { documentType } = req.body; // 'reportFile' or 'presentationFile'

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const review = project.reviews.id(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const fileUrl = review.submission?.[documentType];
    if (!fileUrl) {
      return res.status(400).json({ message: `No ${documentType} found for this review.` });
    }

    // Convert relative URL (/uploads/filename.pdf) to absolute path
    const filePath = path.join(__dirname, '..', fileUrl);

    // Call service to extract and scan
    const reportData = await scanDocument(filePath);

    // Remove old report if exists
    await DocumentPlagiarismReport.findOneAndDelete({ project: id, reviewId, documentName: documentType });

    // Save new report
    const report = await DocumentPlagiarismReport.create({
      project: id,
      reviewId,
      documentName: documentType,
      overallSimilarity: reportData.overallSimilarity,
      matches: reportData.matches
    });

    res.status(200).json({ success: true, message: 'Plagiarism scan completed', report });
  } catch (error) {
    console.error('Document scan error:', error);
    res.status(500).json({ success: false, message: 'Failed to scan document', error: error.message });
  }
};

exports.getDocumentPlagiarismReport = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    
    // We can fetch reports for both reportFile and presentationFile
    const reports = await DocumentPlagiarismReport.find({ project: id, reviewId }).sort({ scannedAt: -1 });
    
    res.status(200).json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, githubUrl, source } = req.body;
    
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    // Authorization check
    const isOwner = project.student.toString() === req.user._id.toString();
    const isGuide = project.guide.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isGuide && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to edit this project' });
    }
    
    // Logic check: if owner, ensure no reviews are assigned
    if (isOwner && !isGuide && !isAdmin && project.reviews.length > 0) {
      return res.status(403).json({ message: 'Cannot edit project after reviews have been assigned' });
    }
    
    project.title = title || project.title;
    project.description = description || project.description;
    project.githubUrl = githubUrl || project.githubUrl;
    project.source = source || project.source;
    
    await project.save();
    res.status(200).json({ message: 'Project updated successfully', project });
  } catch (error) {
    if (error.name === 'CastError') return res.status(404).json({ message: 'Project not found' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    const isOwner = project.student.toString() === req.user._id.toString();
    const isGuide = project.guide.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isGuide && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }
    
    if (isOwner && !isGuide && !isAdmin && project.reviews.length > 0) {
      return res.status(403).json({ message: 'Cannot delete project after reviews have been assigned' });
    }
    
    await Project.findByIdAndDelete(id);
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') return res.status(404).json({ message: 'Project not found' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const { name, dueDate, maxMarks } = req.body;
    
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    const isGuide = project.guide.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isGuide && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to edit this review' });
    }
    
    const review = project.reviews.id(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    if (name) review.name = name;
    if (dueDate) review.dueDate = dueDate;
    if (maxMarks) review.maxMarks = Number(maxMarks);
    
    await project.save();
    res.status(200).json({ message: 'Review updated successfully', project });
  } catch (error) {
    if (error.name === 'CastError') return res.status(404).json({ message: 'Not found' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    const isGuide = project.guide.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isGuide && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }
    
    project.reviews = project.reviews.filter(r => r._id.toString() !== reviewId);
    
    await project.save();
    res.status(200).json({ message: 'Review deleted successfully', project });
  } catch (error) {
    if (error.name === 'CastError') return res.status(404).json({ message: 'Not found' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
