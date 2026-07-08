const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

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
    res.status(200).json({ project });
  } catch (error) {
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
