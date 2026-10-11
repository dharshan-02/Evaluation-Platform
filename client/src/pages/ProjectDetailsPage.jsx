import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api, { getBaseUrl } from '../lib/api';
import { 
  HiOutlineArrowLeft, 
  HiOutlineCheckCircle, 
  HiOutlineXCircle, 
  HiOutlineClock, 
  HiOutlineDocumentText, 
  HiOutlineLink, 
  HiOutlinePresentationChartBar, 
  HiOutlineShieldCheck, 
  HiOutlineVideoCamera, 
  HiOutlinePencil, 
  HiOutlineTrash, 
  HiOutlineDownload,
  HiOutlineUpload,
  HiOutlineAcademicCap,
  HiOutlineUser,
  HiOutlineExternalLink,
  HiOutlineExclamationCircle
} from 'react-icons/hi';
import { FaGithub } from 'react-icons/fa';
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
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20 px-2 sm:px-4">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm dark:shadow-xl">
        <div className="flex items-start gap-4">
          <button 
            onClick={() => navigate('/projects')} 
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-all flex-shrink-0 shadow-xs"
            title="Back to Projects"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 tracking-wide uppercase">
                <HiOutlineAcademicCap className="w-3.5 h-3.5" />
                Capstone Project
              </span>
              
              {canEditProject && (
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={handleEditProjectClick} 
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-transparent transition-colors" 
                    title="Edit Project"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleDeleteProject} 
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg border border-transparent transition-colors" 
                    title="Delete Project"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {project.title}
            </h1>

            <p className="text-slate-600 dark:text-slate-400 mt-2.5 max-w-3xl text-sm sm:text-base leading-relaxed">
              {project.description}
            </p>

            {(project.githubUrl || project.source) && (
              <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
                {project.githubUrl && (
                  <a 
                    href={project.githubUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 rounded-lg transition-all shadow-xs"
                  >
                    <FaGithub className="w-4 h-4 text-slate-900 dark:text-white" />
                    <span>View Repository</span>
                    <HiOutlineExternalLink className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  </a>
                )}
                {project.source && project.source !== 'NIL' && (
                  <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <HiOutlineDocumentText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>Source: {project.source}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Participants Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Student Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm dark:shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-500 dark:text-indigo-400 font-bold text-base flex-shrink-0">
              <HiOutlineUser className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{project.student?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{project.student?.email}</p>
            </div>
          </div>
        </div>

        {/* Guide Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm dark:shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-base flex-shrink-0">
              <HiOutlineAcademicCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Allotted Guide</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{project.guide?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{project.guide?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Timeline */}
      <div className="space-y-5">
        <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Review Schedule</h2>
          {isFaculty && project.reviews.length < 4 && (
            <button
              onClick={() => setShowAddReview(!showAddReview)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors shadow-xs"
            >
              {showAddReview ? 'Cancel' : '+ Add Review Phase'}
            </button>
          )}
        </div>

        {showAddReview && (
          <form onSubmit={handleAddReview} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm dark:shadow-xl animate-slide-up space-y-5">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Schedule New Review</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-slate-300">Review Name</label>
                <input type="text" required value={newReviewName} onChange={e => setNewReviewName(e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-slate-400 dark:focus:border-slate-600" placeholder="e.g. Midterm Review" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-slate-300">Due Date</label>
                <input type="datetime-local" required value={newReviewDate} onChange={e => setNewReviewDate(e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-slate-300">Max Marks</label>
                <input type="number" required min="1" value={newReviewMarks} onChange={e => setNewReviewMarks(e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-600" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={addingReview} className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-xs">
                {addingReview ? 'Saving...' : 'Save Review Schedule'}
              </button>
            </div>
          </form>
        )}
        
        {project.reviews.length === 0 && !showAddReview && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
              {isFaculty ? "You haven't scheduled any reviews for this project yet." : "No reviews have been scheduled yet by your guide."}
            </p>
          </div>
        )}

        {project.reviews.map((review, idx) => {
          const isOverdue = new Date() > new Date(review.dueDate) && review.status === 'pending';
          const canSubmit = isStudent && new Date() <= new Date(review.dueDate) && (review.status === 'pending' || review.status === 'submitted' || (review.status === 'graded' && review.grading?.requireResubmission));
          const canGrade = isFaculty && review.status === 'submitted';
          
          return (
            <div key={review._id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm dark:shadow-xl space-y-6">
              {/* Review Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{review.name}</span>
                    {review.status === 'graded' && <HiOutlineCheckCircle className="text-emerald-500 dark:text-emerald-400 w-5 h-5 flex-shrink-0" />}
                    {isOverdue && <HiOutlineXCircle className="text-rose-500 dark:text-rose-400 w-5 h-5 flex-shrink-0" />}
                    {isFaculty && (
                      <div className="flex items-center gap-1 ml-2">
                        <button onClick={() => handleEditReviewClick(review)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="Edit Review">
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteReview(review._id)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors" title="Delete Review">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-[#888] flex items-center gap-1.5 mt-1.5">
                    <HiOutlineClock className="w-4 h-4 text-slate-400 dark:text-[#666]" /> 
                    <span>Due: {format(new Date(review.dueDate), 'MMM dd, yyyy h:mm a')}</span>
                  </p>
                </div>
                
                <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    review.status === 'graded' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' :
                    review.status === 'submitted' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25' :
                    isOverdue ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25' :
                    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                  }`}>
                    {isOverdue ? 'Overdue' : review.status}
                  </span>
                  {review.status === 'graded' && (
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      {review.grading?.marks} <span className="text-xs font-normal text-slate-500 dark:text-[#888]">/ {review.maxMarks}</span>
                    </div>
                  )}
                  {review.status === 'graded' && review.grading?.isVerified && (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-emerald-500/25">
                      <HiOutlineShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Uploaded Documents Grid */}
              {review.submission && (review.submission.reportFile || review.submission.presentationFile || review.submission.githubUrl) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* GitHub Repo Card */}
                  {review.submission.githubUrl && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4 flex flex-col justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white flex-shrink-0 shadow-xs">
                          <FaGithub className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Repository</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate tracking-tight leading-snug">
                            {review.submission.githubUrl.replace('https://github.com/', '')}
                          </p>
                        </div>
                      </div>
                      <a 
                        href={review.submission.githubUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-xs"
                      >
                        <span className="truncate">Open Repo</span>
                        <HiOutlineExternalLink className="w-3.5 h-3.5 flex-shrink-0 ml-1" />
                      </a>
                    </div>
                  )}

                  {/* Project Report Card */}
                  {review.submission.reportFile && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4 flex flex-col justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0 shadow-xs">
                            <HiOutlineDocumentText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Report</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate tracking-tight leading-snug">Project Report</p>
                          </div>
                        </div>
                        <a 
                          href={`${getBaseUrl()}${review.submission.reportFile}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="View Document"
                        >
                          <HiOutlineExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      {/* Similarity & Plagiarism Section */}
                      {plagiarismReports[`${review._id}-reportFile`] && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Similarity:</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-bold ${plagiarismReports[`${review._id}-reportFile`].overallSimilarity > 35 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {plagiarismReports[`${review._id}-reportFile`].overallSimilarity}%
                              </span>
                              <button 
                                onClick={() => downloadPlagiarismReport(plagiarismReports[`${review._id}-reportFile`]._id)} 
                                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
                              >
                                <HiOutlineDownload className="w-3.5 h-3.5" /> PDF
                              </button>
                            </div>
                          </div>
                          {plagiarismReports[`${review._id}-reportFile`].overallSimilarity > 35 && review.status !== 'graded' && (
                            <div className="p-2.5 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-600 dark:text-rose-400 text-[11px] flex items-start gap-1.5 leading-snug">
                              <HiOutlineExclamationCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>High similarity detected! Please revise and resubmit.</span>
                            </div>
                          )}
                        </div>
                      )}

                      {isFaculty && !plagiarismReports[`${review._id}-reportFile`] && (
                        <button 
                          onClick={() => handleCheckPlagiarism(review._id, 'reportFile')}
                          disabled={checkingPlagiarism[`${review._id}-reportFile`]}
                          className="w-full py-1.5 text-center text-xs font-semibold text-slate-800 dark:text-white bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors disabled:opacity-50"
                        >
                          {checkingPlagiarism[`${review._id}-reportFile`] ? 'Scanning...' : 'Scan Plagiarism'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Presentation Card */}
                  {review.submission.presentationFile && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4 flex flex-col justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0 shadow-xs">
                            <HiOutlinePresentationChartBar className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Slides</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate tracking-tight leading-snug">Presentation</p>
                          </div>
                        </div>
                        <a 
                          href={`${getBaseUrl()}${review.submission.presentationFile}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="View Document"
                        >
                          <HiOutlineExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      {/* Similarity & Plagiarism Section */}
                      {plagiarismReports[`${review._id}-presentationFile`] && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Similarity:</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-bold ${plagiarismReports[`${review._id}-presentationFile`].overallSimilarity > 35 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {plagiarismReports[`${review._id}-presentationFile`].overallSimilarity}%
                              </span>
                              <button 
                                onClick={() => downloadPlagiarismReport(plagiarismReports[`${review._id}-presentationFile`]._id)} 
                                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
                              >
                                <HiOutlineDownload className="w-3.5 h-3.5" /> PDF
                              </button>
                            </div>
                          </div>
                          {plagiarismReports[`${review._id}-presentationFile`].overallSimilarity > 35 && review.status !== 'graded' && (
                            <div className="p-2.5 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-600 dark:text-rose-400 text-[11px] flex items-start gap-1.5 leading-snug">
                              <HiOutlineExclamationCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>High similarity detected! Please revise presentation.</span>
                            </div>
                          )}
                        </div>
                      )}

                      {isFaculty && !plagiarismReports[`${review._id}-presentationFile`] && (
                        <button 
                          onClick={() => handleCheckPlagiarism(review._id, 'presentationFile')}
                          disabled={checkingPlagiarism[`${review._id}-presentationFile`]}
                          className="w-full py-1.5 text-center text-xs font-semibold text-slate-800 dark:text-white bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors disabled:opacity-50"
                        >
                          {checkingPlagiarism[`${review._id}-presentationFile`] ? 'Scanning...' : 'Scan Plagiarism'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Grading Feedback display */}
              {review.status === 'graded' && review.grading?.feedback && (
                <div className={`p-5 rounded-xl border mb-6 shadow-xs ${review.grading?.requireResubmission ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${review.grading?.requireResubmission ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                    Feedback from {review.grading.gradedBy?.name} {review.grading?.requireResubmission && '— Resubmission Required'}
                  </p>
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{review.grading.feedback}</p>
                </div>
              )}

              {/* Student Submission Form Toggle */}
              {canSubmit && activeReviewId !== review._id && (
                <div className="pt-2">
                  <button 
                    onClick={() => setActiveReviewId(review._id)} 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all shadow-md shadow-emerald-950/20"
                  >
                    <HiOutlineUpload className="w-4 h-4" />
                    <span>{review.submission ? 'Update Submission' : 'Upload Review Documents'}</span>
                  </button>
                </div>
              )}

              {/* Student Submission Form */}
              {canSubmit && activeReviewId === review._id && (
                <form onSubmit={(e) => handleStudentSubmit(e, review._id)} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-5 space-y-4 animate-slide-up shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <HiOutlineUpload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span>Submit Documents for {review.name}</span>
                    </h4>
                    <button 
                      type="button" 
                      onClick={() => setActiveReviewId(null)}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">GitHub Repository URL (Optional)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                        <FaGithub className="w-4 h-4" />
                      </div>
                      <input 
                        type="url" 
                        value={githubUrl} 
                        onChange={e => setGithubUrl(e.target.value)} 
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-slate-500 dark:focus:border-slate-600 transition-colors" 
                        placeholder="https://github.com/username/project" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Project Report (PDF/Docx)</label>
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx" 
                        onChange={e => setReportFile(e.target.files[0])} 
                        className="w-full text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-300 dark:file:border-slate-700 file:text-xs file:font-semibold file:bg-white dark:file:bg-slate-800 file:text-slate-800 dark:file:text-white hover:file:bg-slate-100 dark:hover:file:bg-slate-700 file:cursor-pointer transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Presentation (PPT/PPTX)</label>
                      <input 
                        type="file" 
                        accept=".ppt,.pptx" 
                        onChange={e => setPresentationFile(e.target.files[0])} 
                        className="w-full text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-300 dark:file:border-slate-700 file:text-xs file:font-semibold file:bg-white dark:file:bg-slate-800 file:text-slate-800 dark:file:text-white hover:file:bg-slate-100 dark:hover:file:bg-slate-700 file:cursor-pointer transition-all" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button 
                      type="button" 
                      onClick={() => setActiveReviewId(null)} 
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={submitting} 
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                    >
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
                <form onSubmit={(e) => handleFacultyGrade(e, review._id)} className="mt-6 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-5 animate-slide-up shadow-sm">
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white">Evaluate {review.name}</h4>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Marks (out of {review.maxMarks}) <span className="text-rose-500">*</span></label>
                    <input type="number" required min="0" max={review.maxMarks} value={marks} onChange={e => setMarks(e.target.value)} className="w-full md:w-1/3 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-slate-500 dark:focus:border-slate-600" />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isVerified}
                        onChange={(e) => setIsVerified(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-600"
                      />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">Mark Documents as Verified</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={requireResubmission}
                        onChange={(e) => setRequireResubmission(e.target.checked)}
                        className="w-4 h-4 text-amber-500 rounded border-slate-300 dark:border-slate-600"
                      />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">Require Resubmission <span className="text-slate-500 dark:text-slate-400 font-normal">(e.g. if plagiarized)</span></span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Feedback</label>
                    <textarea rows="4" value={feedback} onChange={e => setFeedback(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-slate-500 dark:focus:border-slate-600 resize-y" placeholder="Provide constructive feedback..."></textarea>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-pop-in">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Project</h3>
            </div>
            <form onSubmit={handleUpdateProject} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Project Title</label>
                <input type="text" required value={editProjectTitle} onChange={e => setEditProjectTitle(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-600" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Description</label>
                <textarea required rows={4} value={editProjectDesc} onChange={e => setEditProjectDesc(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-600 resize-y"></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">GitHub URL (Optional)</label>
                <input type="url" value={editProjectGithub} onChange={e => setEditProjectGithub(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-600" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Source (Optional)</label>
                <input type="text" value={editProjectSource} onChange={e => setEditProjectSource(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-600" placeholder="e.g. self-proposed" />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowEditProjectModal(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="btn-primary text-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-pop-in">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Review Schedule</h3>
            </div>
            <form onSubmit={handleUpdateReview} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Review Name</label>
                <input type="text" required value={editReviewName} onChange={e => setNewReviewName(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-600" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Due Date</label>
                <input type="datetime-local" required value={editReviewDate} onChange={e => setEditReviewDate(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-600" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Max Marks</label>
                <input type="number" required min="1" value={editReviewMarks} onChange={e => setEditReviewMarks(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-600" />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setEditingReview(null)} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="btn-primary text-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectDetailsPage;
