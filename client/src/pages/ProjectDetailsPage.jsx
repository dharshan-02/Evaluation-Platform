import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock, HiOutlineDocumentText, HiOutlineLink, HiOutlinePresentationChartBar, HiOutlineShieldCheck, HiOutlineVideoCamera, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states for submission (Student)
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [reportFile, setReportFile] = useState(null);
  const [presentationFile, setPresentationFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states for grading (Faculty)
  const [gradingReviewId, setGradingReviewId] = useState(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);

  // Form states for adding review (Faculty)
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewDate, setNewReviewDate] = useState('');
  const [newReviewMarks, setNewReviewMarks] = useState(100);
  const [addingReview, setAddingReview] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);

  // Edit/Delete states
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editProjectTitle, setEditProjectTitle] = useState('');
  const [editProjectDesc, setEditProjectDesc] = useState('');
  const [editProjectGithub, setEditProjectGithub] = useState('');
  const [editProjectSource, setEditProjectSource] = useState('');

  const [editingReview, setEditingReview] = useState(null);
  const [editReviewName, setEditReviewName] = useState('');
  const [editReviewDate, setEditReviewDate] = useState('');
  const [editReviewMarks, setEditReviewMarks] = useState('');

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.project);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch project details');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e, reviewId) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const formData = new FormData();
      if (githubUrl) formData.append('githubUrl', githubUrl);
      if (reportFile) formData.append('reportFile', reportFile);
      if (presentationFile) formData.append('presentationFile', presentationFile);
      
      const res = await api.post(`/projects/${id}/reviews/${reviewId}/submit`, formData);
      setProject(res.data.project);
      setActiveReviewId(null);
      
      // Reset fields
      setGithubUrl('');
      setReportFile(null);
      setPresentationFile(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit documents');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFacultyGrade = async (e, reviewId) => {
    e.preventDefault();
    setGrading(true);
    
    try {
      const res = await api.post(`/projects/${id}/reviews/${reviewId}/grade`, {
        marks,
        feedback
      });
      setProject(res.data.project);
      setGradingReviewId(null);
      
      // Reset fields
      setMarks('');
      setFeedback('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit grade');
    } finally {
      setGrading(false);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    setAddingReview(true);
    try {
      const res = await api.post(`/projects/${id}/reviews`, {
        name: newReviewName,
        dueDate: newReviewDate,
        maxMarks: newReviewMarks
      });
      setProject(res.data.project);
      setShowAddReview(false);
      setNewReviewName('');
      setNewReviewDate('');
      setNewReviewMarks(100);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to add review schedule');
    } finally {
      setAddingReview(false);
    }
  };

  const handleEditProjectClick = () => {
    setEditProjectTitle(project.title);
    setEditProjectDesc(project.description);
    setEditProjectGithub(project.githubUrl || '');
    setEditProjectSource(project.source || '');
    setShowEditProjectModal(true);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/projects/${id}`, {
        title: editProjectTitle,
        description: editProjectDesc,
        githubUrl: editProjectGithub,
        source: editProjectSource
      });
      setProject(res.data.project);
      setShowEditProjectModal(false);
      toast.success('Project updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleEditReviewClick = (r) => {
    setEditReviewName(r.name);
    setEditReviewDate(r.dueDate.substring(0, 16));
    setEditReviewMarks(r.maxMarks);
    setEditingReview(r._id);
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/projects/${id}/reviews/${editingReview}`, {
        name: editReviewName,
        dueDate: editReviewDate,
        maxMarks: editReviewMarks
      });
      setProject(res.data.project);
      setEditingReview(null);
      toast.success('Review updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await api.delete(`/projects/${id}/reviews/${reviewId}`);
      setProject(res.data.project);
      toast.success('Review deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete review');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto mt-10 text-center">
        <h2 className="text-xl font-bold text-rose-500 mb-2">Error Loading Project</h2>
        <p className="text-slate-600 dark:text-slate-400">{error || 'Project not found.'}</p>
        <button onClick={() => navigate('/projects')} className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">Go Back</button>
      </div>
    );
  }

  const isStudent = user.role === 'student';
  const isFaculty = ['faculty', 'admin'].includes(user.role);
  const canEditProject = isFaculty || (isStudent && project.reviews?.length === 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/projects')} className="mt-1 p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">
              Capstone Project
            </div>
            {canEditProject && (
              <div className="flex items-center gap-2">
                <button onClick={handleEditProjectClick} className="p-1.5 text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors" title="Edit Project">
                  <HiOutlinePencil className="w-5 h-5" />
                </button>
                <button onClick={handleDeleteProject} className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors" title="Delete Project">
                  <HiOutlineTrash className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">
            {project.title}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-3xl">
            {project.description}
          </p>
          {(project.githubUrl || project.source) && (
            <div className="flex flex-wrap gap-4 mt-4">
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-500 hover:text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors">
                  <HiOutlineLink className="w-4 h-4" /> View Repository
                </a>
              )}
              {project.source && (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <HiOutlineDocumentText className="w-4 h-4" /> Source: {project.source}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Participants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase mb-1">Student</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{project.student?.name}</p>
            <p className="text-sm text-slate-500">{project.student?.email}</p>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase mb-1">Allotted Guide</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{project.guide?.name}</p>
            <p className="text-sm text-slate-500">{project.guide?.email}</p>
          </div>
        </div>
      </div>


      {/* Reviews Timeline */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Review Schedule</h2>
          {isFaculty && (
            <button
              onClick={() => setShowAddReview(!showAddReview)}
              className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
            >
              {showAddReview ? 'Cancel' : '+ Add Review Phase'}
            </button>
          )}
        </div>

        {showAddReview && (
          <form onSubmit={handleAddReview} className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white">Schedule New Review</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-400">Review Name</label>
                <input type="text" required value={newReviewName} onChange={e => setNewReviewName(e.target.value)} className="input-field w-full px-3 py-2 rounded-lg text-sm" placeholder="e.g. Midterm Review" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-400">Due Date</label>
                <input type="datetime-local" required value={newReviewDate} onChange={e => setNewReviewDate(e.target.value)} className="input-field w-full px-3 py-2 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-400">Max Marks</label>
                <input type="number" required min="1" value={newReviewMarks} onChange={e => setNewReviewMarks(e.target.value)} className="input-field w-full px-3 py-2 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={addingReview} className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg disabled:opacity-50 transition-colors">
                {addingReview ? 'Saving...' : 'Save Review Schedule'}
              </button>
            </div>
          </form>
        )}
        
        {project.reviews.length === 0 && !showAddReview && (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {isFaculty ? "You haven't scheduled any reviews for this project yet." : "No reviews have been scheduled yet by your guide."}
            </p>
          </div>
        )}

        {project.reviews.map((review, idx) => {
          const isOverdue = new Date() > new Date(review.dueDate) && review.status === 'pending';
          const canSubmit = isStudent && new Date() <= new Date(review.dueDate) && review.status === 'pending';
          const canGrade = isFaculty && review.status === 'submitted';
          
          return (
            <div key={review._id} className="glass p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {review.name}
                    {review.status === 'graded' && <HiOutlineCheckCircle className="text-emerald-500 w-5 h-5" />}
                    {isOverdue && <HiOutlineXCircle className="text-rose-500 w-5 h-5" />}
                    {isFaculty && (
                      <div className="flex items-center gap-1 ml-2">
                        <button onClick={() => handleEditReviewClick(review)} className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-colors" title="Edit Review">
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteReview(review._id)} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors" title="Delete Review">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-1">
                    <HiOutlineClock className="w-4 h-4" /> 
                    Due: {format(new Date(review.dueDate), 'MMM dd, yyyy h:mm a')}
                  </p>
                </div>
                
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    review.status === 'graded' ? 'bg-emerald-500/10 text-emerald-500' :
                    review.status === 'submitted' ? 'bg-blue-500/10 text-blue-500' :
                    isOverdue ? 'bg-rose-500/10 text-rose-500' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>
                    {isOverdue ? 'Overdue' : review.status}
                  </span>
                  {review.status === 'graded' && (
                    <div className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                      {review.grading?.marks} <span className="text-sm text-slate-500">/ {review.maxMarks}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Uploaded Documents display */}
              {review.submission && (review.submission.reportFile || review.submission.presentationFile || review.submission.githubUrl) && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {review.submission.githubUrl && (
                    <a href={review.submission.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-indigo-500 hover:underline text-sm font-medium">
                      <HiOutlineLink className="w-5 h-5" /> GitHub Repository
                    </a>
                  )}
                  {review.submission.reportFile && (
                    <div className="flex flex-col gap-2">
                      <a href={`http://localhost:5000${review.submission.reportFile}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-indigo-500 hover:underline text-sm font-medium">
                        <HiOutlineDocumentText className="w-5 h-5" /> Project Report
                      </a>
                      {isFaculty && (
                        <button 
                          onClick={() => alert('Initiating Plagiarism Check on Report...')}
                          className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 py-1 px-2 rounded w-fit transition-colors"
                        >
                          <HiOutlineShieldCheck className="w-3 h-3" /> Check Plagiarism
                        </button>
                      )}
                    </div>
                  )}
                  {review.submission.presentationFile && (
                    <a href={`http://localhost:5000${review.submission.presentationFile}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-indigo-500 hover:underline text-sm font-medium">
                      <HiOutlinePresentationChartBar className="w-5 h-5" /> Presentation
                    </a>
                  )}
                </div>
              )}
              
              {/* Grading Feedback display */}
              {review.status === 'graded' && review.grading?.feedback && (
                <div className="bg-emerald-50 dark:bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 mb-4">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Feedback from {review.grading.gradedBy?.name}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{review.grading.feedback}</p>
                </div>
              )}

              {/* Student Submission Form Toggle */}
              {canSubmit && activeReviewId !== review._id && (
                <button onClick={() => setActiveReviewId(review._id)} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-lg transition-colors">
                  Upload Documents
                </button>
              )}

              {/* Student Submission Form */}
              {canSubmit && activeReviewId === review._id && (
                <form onSubmit={(e) => handleStudentSubmit(e, review._id)} className="mt-4 p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-white">Submit for {review.name}</h4>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">GitHub URL (Optional)</label>
                    <input type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} className="input-field w-full px-3 py-2 rounded-lg text-sm outline-none" placeholder="https://github.com/..." />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Project Report (PDF/Docx)</label>
                      <input type="file" accept=".pdf,.doc,.docx" onChange={e => setReportFile(e.target.files[0])} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Presentation (PPT/PPTX)</label>
                      <input type="file" accept=".ppt,.pptx" onChange={e => setPresentationFile(e.target.files[0])} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setActiveReviewId(null)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-lg disabled:opacity-50">
                      {submitting ? 'Submitting...' : 'Confirm Submission'}
                    </button>
                  </div>
                </form>
              )}

              {/* Faculty Grading Form Toggle */}
              {canGrade && gradingReviewId !== review._id && (
                <button onClick={() => setGradingReviewId(review._id)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors">
                  Grade Submission
                </button>
              )}

              {/* Faculty Grading Form */}
              {canGrade && gradingReviewId === review._id && (
                <form onSubmit={(e) => handleFacultyGrade(e, review._id)} className="mt-4 p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-white">Evaluate {review.name}</h4>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Marks (out of {review.maxMarks}) <span className="text-rose-500">*</span></label>
                    <input type="number" required min="0" max={review.maxMarks} value={marks} onChange={e => setMarks(e.target.value)} className="input-field w-full md:w-1/3 px-3 py-2 rounded-lg text-sm outline-none" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Feedback</label>
                    <textarea rows="3" value={feedback} onChange={e => setFeedback(e.target.value)} className="input-field w-full px-3 py-2 rounded-lg text-sm outline-none resize-y" placeholder="Provide constructive feedback..."></textarea>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setGradingReviewId(null)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                    <button type="submit" disabled={grading} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg disabled:opacity-50">
                      {grading ? 'Saving...' : 'Submit Grade'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Project Modal */}
      {showEditProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Project</h3>
            </div>
            <form onSubmit={handleUpdateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Project Title</label>
                <input type="text" required value={editProjectTitle} onChange={e => setEditProjectTitle(e.target.value)} className="input-field w-full px-3 py-2 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Description</label>
                <textarea required rows={4} value={editProjectDesc} onChange={e => setEditProjectDesc(e.target.value)} className="input-field w-full px-3 py-2 rounded-xl text-sm"></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">GitHub URL (Optional)</label>
                <input type="url" value={editProjectGithub} onChange={e => setEditProjectGithub(e.target.value)} className="input-field w-full px-3 py-2 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Source (Optional)</label>
                <input type="text" value={editProjectSource} onChange={e => setEditProjectSource(e.target.value)} className="input-field w-full px-3 py-2 rounded-xl text-sm" placeholder="e.g. self-proposed" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setShowEditProjectModal(false)} className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Review Schedule</h3>
            </div>
            <form onSubmit={handleUpdateReview} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Review Name</label>
                <input type="text" required value={editReviewName} onChange={e => setEditReviewName(e.target.value)} className="input-field w-full px-3 py-2 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Due Date</label>
                <input type="datetime-local" required value={editReviewDate} onChange={e => setEditReviewDate(e.target.value)} className="input-field w-full px-3 py-2 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Max Marks</label>
                <input type="number" required min="1" value={editReviewMarks} onChange={e => setEditReviewMarks(e.target.value)} className="input-field w-full px-3 py-2 rounded-xl text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setEditingReview(null)} className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectDetailsPage;
