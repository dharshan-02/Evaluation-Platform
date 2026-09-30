import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api, { getBaseUrl } from '../lib/api';
import { HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock, HiOutlineDocumentText, HiOutlineLink, HiOutlinePresentationChartBar, HiOutlineShieldCheck, HiOutlineVideoCamera, HiOutlinePencil, HiOutlineTrash, HiOutlineDownload } from 'react-icons/hi';
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

  // Plagiarism state
  const [plagiarismReports, setPlagiarismReports] = useState({});
  const [checkingPlagiarism, setCheckingPlagiarism] = useState({});

  const isStudent = user?.role === 'student';
  const isFaculty = user && ['faculty', 'admin'].includes(user.role);

  // Poll for missing reports every 5 seconds for faculty
  useEffect(() => {
    if (!project || !isFaculty) return;
    
    let hasMissing = false;
    for (const review of project.reviews) {
      if (review.submission?.reportFile && !plagiarismReports[`${review._id}-reportFile`]) hasMissing = true;
      if (review.submission?.presentationFile && !plagiarismReports[`${review._id}-presentationFile`]) hasMissing = true;
    }
    
    if (!hasMissing) return;

    const interval = setInterval(async () => {
      let updated = false;
      const newReports = { ...plagiarismReports };
      
      for (const review of project.reviews) {
        if (!newReports[`${review._id}-reportFile`] || !newReports[`${review._id}-presentationFile`]) {
          try {
            const res = await api.get(`/projects/${id}/reviews/${review._id}/plagiarism-report`);
            if (res.data.success && res.data.reports) {
              res.data.reports.forEach(report => {
                const key = `${review._id}-${report.documentName}`;
                if (!newReports[key]) {
                  newReports[key] = report;
                  updated = true;
                }
              });
            }
          } catch (e) { /* ignore */ }
        }
      }
      
      if (updated) {
        setPlagiarismReports(newReports);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [project, isFaculty, plagiarismReports, id]);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.project);
      
      if (res.data.project && res.data.project.reviews) {
        const reportsMap = {};
        for (const review of res.data.project.reviews) {
          try {
            const reportRes = await api.get(`/projects/${id}/reviews/${review._id}/plagiarism-report`);
            if (reportRes.data.success && reportRes.data.reports) {
              reportRes.data.reports.forEach(report => {
                reportsMap[`${review._id}-${report.documentName}`] = report;
              });
            }
          } catch (e) {
            console.error('Failed to load reports for review', review._id, e);
          }
        }
        setPlagiarismReports(reportsMap);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch project details');
    } finally {
      setLoading(false);
    }
  };

  const downloadPlagiarismReport = async (reportId) => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-download' });
      const response = await api.get(`/projects/plagiarism/download/${reportId}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `project_plagiarism_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download complete', { id: 'pdf-download' });
    } catch (err) {
      console.error('Failed to download PDF', err);
      toast.error('Failed to download PDF', { id: 'pdf-download' });
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
      const res = await api.post(`/projects/${id}/reviews/${reviewId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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

  const [isVerified, setIsVerified] = useState(false);
  const [requireResubmission, setRequireResubmission] = useState(false);

  const handleFacultyGrade = async (e, reviewId) => {
    e.preventDefault();
    setGrading(true);
    
    try {
      const res = await api.post(`/projects/${id}/reviews/${reviewId}/grade`, {
        marks,
        feedback,
        isVerified,
        requireResubmission
      });
      setProject(res.data.project);
      setGradingReviewId(null);
      
      // Reset fields
      setMarks('');
      setFeedback('');
      setIsVerified(false);
      setRequireResubmission(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit grade');
    } finally {
      setGrading(false);
    }
  };

  const handleCheckPlagiarism = async (reviewId, documentType) => {
    setCheckingPlagiarism(prev => ({ ...prev, [`${reviewId}-${documentType}`]: true }));
    try {
      const res = await api.post(`/projects/${id}/reviews/${reviewId}/plagiarism-scan`, {
        documentType
      });
      if (res.data.success) {
        toast.success('Plagiarism check completed');
        setPlagiarismReports(prev => ({
          ...prev,
          [`${reviewId}-${documentType}`]: res.data.report
        }));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to check plagiarism');
    } finally {
      setCheckingPlagiarism(prev => ({ ...prev, [`${reviewId}-${documentType}`]: false }));
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
        <div className="animate-pulse-subtle flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[var(--color-border)] border-t-[var(--color-text-primary)] rounded-full animate-spin"></div>
          <p className="mt-4 text-[var(--color-text-secondary)] font-medium tracking-wide">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto mt-10 text-center animate-fade-in">
        <h2 className="text-2xl font-bold text-rose-500 mb-2">Error Loading Project</h2>
        <p className="text-[var(--color-text-secondary)]">{error || 'Project not found.'}</p>
        <button onClick={() => navigate('/projects')} className="mt-6 btn-secondary">Go Back</button>
      </div>
    );
  }

  const canEditProject = isFaculty || (isStudent && project.reviews?.length === 0);

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/projects')} className="mt-1 p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors">
          <HiOutlineArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">
              Capstone Project
            </div>
            {canEditProject && (
              <div className="flex items-center gap-2">
                <button onClick={handleEditProjectClick} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors" title="Edit Project">
                  <HiOutlinePencil className="w-5 h-5" />
                </button>
                <button onClick={handleDeleteProject} className="p-2 text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors" title="Delete Project">
                  <HiOutlineTrash className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          <h1 className="text-4xl font-black text-[var(--color-text-primary)] leading-tight tracking-tight">
            {project.title}
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-3 max-w-3xl text-lg leading-relaxed">
            {project.description}
          </p>
          {(project.githubUrl || project.source) && (
            <div className="flex flex-wrap gap-4 mt-6">
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)] px-4 py-2 rounded-lg transition-all shadow-xs">
                  <HiOutlineLink className="w-4 h-4" /> View Repository
                </a>
              )}
              {project.source && (
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] px-4 py-2 rounded-lg border border-[var(--color-border)] shadow-xs">
                  <HiOutlineDocumentText className="w-4 h-4" /> Source: {project.source}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Participants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5">Student</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">{project.student?.name}</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{project.student?.email}</p>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5">Allotted Guide</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">{project.guide?.name}</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{project.guide?.email}</p>
          </div>
        </div>
      </div>


      {/* Reviews Timeline */}
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b border-[var(--color-border)] pb-4">
          <h2 className="text-2xl font-black text-[var(--color-text-primary)] tracking-tight">Review Schedule</h2>
          {isFaculty && project.reviews.length < 4 && (
            <button
              onClick={() => setShowAddReview(!showAddReview)}
              className="btn-secondary text-sm"
            >
              {showAddReview ? 'Cancel' : '+ Add Review Phase'}
            </button>
          )}
        </div>

        {showAddReview && (
          <form onSubmit={handleAddReview} className="glass-panel p-6 animate-slide-up space-y-5">
            <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Schedule New Review</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">Review Name</label>
                <input type="text" required value={newReviewName} onChange={e => setNewReviewName(e.target.value)} className="input-field w-full px-4 py-2" placeholder="e.g. Midterm Review" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">Due Date</label>
                <input type="datetime-local" required value={newReviewDate} onChange={e => setNewReviewDate(e.target.value)} className="input-field w-full px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">Max Marks</label>
                <input type="number" required min="1" value={newReviewMarks} onChange={e => setNewReviewMarks(e.target.value)} className="input-field w-full px-4 py-2" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={addingReview} className="btn-primary disabled:opacity-50">
                {addingReview ? 'Saving...' : 'Save Review Schedule'}
              </button>
            </div>
          </form>
        )}
        
        {project.reviews.length === 0 && !showAddReview && (
          <div className="text-center py-16 bg-[var(--color-bg-secondary)] rounded-2xl border border-dashed border-[var(--color-border)]">
            <p className="text-[var(--color-text-secondary)] font-medium text-lg">
              {isFaculty ? "You haven't scheduled any reviews for this project yet." : "No reviews have been scheduled yet by your guide."}
            </p>
          </div>
        )}

        {project.reviews.map((review, idx) => {
          const isOverdue = new Date() > new Date(review.dueDate) && review.status === 'pending';
          const canSubmit = isStudent && new Date() <= new Date(review.dueDate) && (review.status === 'pending' || review.status === 'submitted' || (review.status === 'graded' && review.grading?.requireResubmission));
          const canGrade = isFaculty && review.status === 'submitted';
          
          return (
            <div key={review._id} className="glass-panel p-6 animate-slide-up">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    {review.name}
                    {review.status === 'graded' && <HiOutlineCheckCircle className="text-emerald-500 w-5 h-5" />}
                    {isOverdue && <HiOutlineXCircle className="text-rose-500 w-5 h-5" />}
                    {isFaculty && (
                      <div className="flex items-center gap-1 ml-2">
                        <button onClick={() => handleEditReviewClick(review)} className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded transition-colors" title="Edit Review">
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteReview(review._id)} className="p-1.5 text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors" title="Delete Review">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </h3>
                  <p className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5 mt-2">
                    <HiOutlineClock className="w-4 h-4" /> 
                    Due: {format(new Date(review.dueDate), 'MMM dd, yyyy h:mm a')}
                  </p>
                </div>
                
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${
                    review.status === 'graded' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    review.status === 'submitted' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    isOverdue ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    {isOverdue ? 'Overdue' : review.status}
                  </span>
                  {review.status === 'graded' && (
                    <div className="text-2xl font-black text-[var(--color-text-primary)] mt-3">
                      {review.grading?.marks} <span className="text-sm font-medium text-[var(--color-text-muted)]">/ {review.maxMarks}</span>
                    </div>
                  )}
                  {review.status === 'graded' && review.grading?.isVerified && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                      <HiOutlineShieldCheck className="w-3 h-3" /> Verified
                    </div>
                  )}
                </div>
              </div>

              {/* Uploaded Documents display */}
              {review.submission && (review.submission.reportFile || review.submission.presentationFile || review.submission.githubUrl) && (
                <div className="bg-[var(--color-bg-secondary)] p-5 rounded-xl border border-[var(--color-border)] mb-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xs">
                  {review.submission.githubUrl && (
                    <a href={review.submission.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[var(--color-text-primary)] hover:underline text-sm font-semibold">
                      <HiOutlineLink className="w-5 h-5 text-indigo-500" /> GitHub Repository
                    </a>
                  )}
                  {review.submission.reportFile && (
                    <div className="flex flex-col gap-3">
                      <a href={`${getBaseUrl()}${review.submission.reportFile}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[var(--color-text-primary)] hover:underline text-sm font-semibold">
                        <HiOutlineDocumentText className="w-5 h-5 text-indigo-500" /> Project Report
                      </a>
                      {isFaculty && (
                        <div className="flex flex-col gap-2">
                          {!plagiarismReports[`${review._id}-reportFile`] && (
                            <button 
                              onClick={() => handleCheckPlagiarism(review._id, 'reportFile')}
                              disabled={checkingPlagiarism[`${review._id}-reportFile`]}
                              className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-[var(--color-bg-elevated)] border border-[var(--color-border)] hover:border-[var(--color-text-muted)] text-[var(--color-text-primary)] py-1.5 px-3 rounded-md w-fit transition-all shadow-xs disabled:opacity-50"
                            >
                              <HiOutlineShieldCheck className="w-3.5 h-3.5" /> 
                              {checkingPlagiarism[`${review._id}-reportFile`] ? 'Checking...' : 'Check Plagiarism (Auto-scan pending)'}
                            </button>
                          )}
                          {plagiarismReports[`${review._id}-reportFile`] && (
                            <div className="text-xs p-3 bg-[var(--color-bg-elevated)] rounded-md border border-[var(--color-border)] flex justify-between items-center shadow-xs">
                              <div>
                                <span className="font-semibold text-[var(--color-text-secondary)]">Similarity: </span>
                              <span className={plagiarismReports[`${review._id}-reportFile`].overallSimilarity > 20 ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                                {plagiarismReports[`${review._id}-reportFile`].overallSimilarity}%
                              </span>
                            </div>
                            <button onClick={() => downloadPlagiarismReport(plagiarismReports[`${review._id}-reportFile`]._id)} className="p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] rounded-md transition-colors" title="Download Report PDF">
                              <HiOutlineDownload className="w-4 h-4" />
                            </button>
                          </div>
                          )}
                        </div>
                      )}
                      {/* For Students, only show the score and download button if available */}
                      {!isFaculty && plagiarismReports[`${review._id}-reportFile`] && (
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="text-xs p-3 bg-[var(--color-bg-elevated)] rounded-md border border-[var(--color-border)] flex justify-between items-center shadow-xs">
                            <div>
                              <span className="font-semibold text-[var(--color-text-secondary)]">Similarity: </span>
                              <span className={plagiarismReports[`${review._id}-reportFile`].overallSimilarity > 35 ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                                {plagiarismReports[`${review._id}-reportFile`].overallSimilarity}%
                              </span>
                            </div>
                            <button onClick={() => downloadPlagiarismReport(plagiarismReports[`${review._id}-reportFile`]._id)} className="flex items-center gap-1 font-semibold text-[var(--color-text-primary)] hover:underline">
                              <HiOutlineDownload className="w-3.5 h-3.5" /> Download
                            </button>
                          </div>
                          {plagiarismReports[`${review._id}-reportFile`].overallSimilarity > 35 && review.status !== 'graded' && (
                            <div className="text-xs p-3 bg-rose-500/10 text-rose-500 font-medium rounded-md border border-rose-500/20 flex items-start gap-2 shadow-xs">
                              <HiOutlineXCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>High similarity detected! Please revise your report and resubmit.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {review.submission.presentationFile && (
                    <div className="flex flex-col gap-3">
                      <a href={`${getBaseUrl()}${review.submission.presentationFile}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[var(--color-text-primary)] hover:underline text-sm font-semibold">
                        <HiOutlinePresentationChartBar className="w-5 h-5 text-indigo-500" /> Presentation
                      </a>
                      {isFaculty && (
                        <div className="flex flex-col gap-2">
                          {!plagiarismReports[`${review._id}-presentationFile`] && (
                            <button 
                              onClick={() => handleCheckPlagiarism(review._id, 'presentationFile')}
                              disabled={checkingPlagiarism[`${review._id}-presentationFile`]}
                              className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-[var(--color-bg-elevated)] border border-[var(--color-border)] hover:border-[var(--color-text-muted)] text-[var(--color-text-primary)] py-1.5 px-3 rounded-md w-fit transition-all shadow-xs disabled:opacity-50"
                            >
                              <HiOutlineShieldCheck className="w-3.5 h-3.5" /> 
                              {checkingPlagiarism[`${review._id}-presentationFile`] ? 'Checking...' : 'Check Plagiarism (Auto-scan pending)'}
                            </button>
                          )}
                          {plagiarismReports[`${review._id}-presentationFile`] && (
                            <div className="text-xs p-3 bg-[var(--color-bg-elevated)] rounded-md border border-[var(--color-border)] flex justify-between items-center shadow-xs">
                              <div>
                                <span className="font-semibold text-[var(--color-text-secondary)]">Similarity: </span>
                              <span className={plagiarismReports[`${review._id}-presentationFile`].overallSimilarity > 35 ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                                {plagiarismReports[`${review._id}-presentationFile`].overallSimilarity}%
                              </span>
                            </div>
                            <button onClick={() => downloadPlagiarismReport(plagiarismReports[`${review._id}-presentationFile`]._id)} className="p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] rounded-md transition-colors" title="Download Report PDF">
                              <HiOutlineDownload className="w-4 h-4" />
                            </button>
                          </div>
                          )}
                        </div>
                      )}
                      {/* For Students, only show the score and download button if available */}
                      {!isFaculty && plagiarismReports[`${review._id}-presentationFile`] && (
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="text-xs p-3 bg-[var(--color-bg-elevated)] rounded-md border border-[var(--color-border)] flex justify-between items-center shadow-xs">
                            <div>
                              <span className="font-semibold text-[var(--color-text-secondary)]">Similarity: </span>
                              <span className={plagiarismReports[`${review._id}-presentationFile`].overallSimilarity > 35 ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                                {plagiarismReports[`${review._id}-presentationFile`].overallSimilarity}%
                              </span>
                            </div>
                            <button onClick={() => downloadPlagiarismReport(plagiarismReports[`${review._id}-presentationFile`]._id)} className="flex items-center gap-1 font-semibold text-[var(--color-text-primary)] hover:underline">
                              <HiOutlineDownload className="w-3.5 h-3.5" /> Download
                            </button>
                          </div>
                          {plagiarismReports[`${review._id}-presentationFile`].overallSimilarity > 35 && review.status !== 'graded' && (
                            <div className="text-xs p-3 bg-rose-500/10 text-rose-500 font-medium rounded-md border border-rose-500/20 flex items-start gap-2 shadow-xs">
                              <HiOutlineXCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>High similarity detected! Please revise your presentation and resubmit.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Grading Feedback display */}
              {review.status === 'graded' && review.grading?.feedback && (
                <div className={`p-5 rounded-xl border mb-6 shadow-xs ${review.grading?.requireResubmission ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${review.grading?.requireResubmission ? 'text-amber-500' : 'text-emerald-500'}`}>
                    Feedback from {review.grading.gradedBy?.name} {review.grading?.requireResubmission && '— Resubmission Required'}
                  </p>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{review.grading.feedback}</p>
                </div>
              )}

              {/* Student Submission Form Toggle */}
              {canSubmit && activeReviewId !== review._id && (
                <button onClick={() => setActiveReviewId(review._id)} className="btn-primary text-sm mt-2">
                  Upload Documents
                </button>
              )}

              {/* Student Submission Form */}
              {canSubmit && activeReviewId === review._id && (
                <form onSubmit={(e) => handleStudentSubmit(e, review._id)} className="mt-6 p-6 glass border border-[var(--color-border)] rounded-xl space-y-5 animate-slide-up">
                  <h4 className="font-bold text-lg text-[var(--color-text-primary)]">Submit for {review.name}</h4>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">GitHub URL (Optional)</label>
                    <input type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} className="input-field w-full px-4 py-2" placeholder="https://github.com/..." />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">Project Report (PDF/Docx)</label>
                      <input type="file" accept=".pdf,.doc,.docx" onChange={e => setReportFile(e.target.files[0])} className="w-full text-sm text-[var(--color-text-muted)] file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-bg-secondary)] file:text-[var(--color-text-primary)] hover:file:bg-[var(--color-border)] file:cursor-pointer transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">Presentation (PPT/PPTX)</label>
                      <input type="file" accept=".ppt,.pptx" onChange={e => setPresentationFile(e.target.files[0])} className="w-full text-sm text-[var(--color-text-muted)] file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-bg-secondary)] file:text-[var(--color-text-primary)] hover:file:bg-[var(--color-border)] file:cursor-pointer transition-all" />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                    <button type="button" onClick={() => setActiveReviewId(null)} className="btn-secondary text-sm">Cancel</button>
                    <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-50">
                      {submitting ? 'Submitting...' : 'Confirm Submission'}
                    </button>
                  </div>
                </form>
              )}

              {/* Faculty Grading Form Toggle */}
              {canGrade && gradingReviewId !== review._id && (
                <button onClick={() => setGradingReviewId(review._id)} className="btn-primary mt-2" style={{background: 'var(--color-emerald)'}}>
                  Grade Submission
                </button>
              )}

              {/* Faculty Grading Form */}
              {canGrade && gradingReviewId === review._id && (
                <form onSubmit={(e) => handleFacultyGrade(e, review._id)} className="mt-6 p-6 glass border border-[var(--color-border)] rounded-xl space-y-5 animate-slide-up">
                  <h4 className="font-bold text-lg text-[var(--color-text-primary)]">Evaluate {review.name}</h4>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">Marks (out of {review.maxMarks}) <span className="text-rose-500">*</span></label>
                    <input type="number" required min="0" max={review.maxMarks} value={marks} onChange={e => setMarks(e.target.value)} className="input-field w-full md:w-1/3 px-4 py-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isVerified}
                        onChange={(e) => setIsVerified(e.target.checked)}
                        className="w-4 h-4 text-[var(--color-text-primary)] bg-[var(--color-bg-elevated)] border-[var(--color-border)] rounded focus:ring-1 focus:ring-[var(--color-text-primary)]"
                      />
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">Mark Documents as Verified</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={requireResubmission}
                        onChange={(e) => setRequireResubmission(e.target.checked)}
                        className="w-4 h-4 text-amber-500 bg-[var(--color-bg-elevated)] border-[var(--color-border)] rounded focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">Require Resubmission <span className="text-[var(--color-text-muted)] font-normal">(e.g. if plagiarized)</span></span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">Feedback</label>
                    <textarea rows="4" value={feedback} onChange={e => setFeedback(e.target.value)} className="input-field w-full px-4 py-3 resize-y" placeholder="Provide constructive feedback..."></textarea>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                    <button type="button" onClick={() => setGradingReviewId(null)} className="btn-secondary text-sm">Cancel</button>
                    <button type="submit" disabled={grading} className="btn-primary text-sm disabled:opacity-50" style={{background: 'var(--color-emerald)'}}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-lg overflow-hidden animate-pop-in">
            <div className="p-6 border-b border-[var(--color-border)]">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Edit Project</h3>
            </div>
            <form onSubmit={handleUpdateProject} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">Project Title</label>
                <input type="text" required value={editProjectTitle} onChange={e => setEditProjectTitle(e.target.value)} className="input-field w-full px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">Description</label>
                <textarea required rows={4} value={editProjectDesc} onChange={e => setEditProjectDesc(e.target.value)} className="input-field w-full px-4 py-2 resize-y"></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">GitHub URL (Optional)</label>
                <input type="url" value={editProjectGithub} onChange={e => setEditProjectGithub(e.target.value)} className="input-field w-full px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">Source (Optional)</label>
                <input type="text" value={editProjectSource} onChange={e => setEditProjectSource(e.target.value)} className="input-field w-full px-4 py-2" placeholder="e.g. self-proposed" />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-[var(--color-border)]">
                <button type="button" onClick={() => setShowEditProjectModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-md overflow-hidden animate-pop-in">
            <div className="p-6 border-b border-[var(--color-border)]">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Edit Review Schedule</h3>
            </div>
            <form onSubmit={handleUpdateReview} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">Review Name</label>
                <input type="text" required value={editReviewName} onChange={e => setEditReviewName(e.target.value)} className="input-field w-full px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">Due Date</label>
                <input type="datetime-local" required value={editReviewDate} onChange={e => setEditReviewDate(e.target.value)} className="input-field w-full px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">Max Marks</label>
                <input type="number" required min="1" value={editReviewMarks} onChange={e => setEditReviewMarks(e.target.value)} className="input-field w-full px-4 py-2" />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-[var(--color-border)]">
                <button type="button" onClick={() => setEditingReview(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectDetailsPage;
