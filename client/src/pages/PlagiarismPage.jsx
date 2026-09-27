import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api, { getBaseUrl } from '../lib/api';
import toast from 'react-hot-toast';
import { 
  HiOutlineDocumentDuplicate,
  HiOutlinePlay,
  HiOutlineEye,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineDownload
} from 'react-icons/hi';

const PlagiarismPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  // New states for Tabs and Project Reports
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' or 'projects'
  const [projectReports, setProjectReports] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  useEffect(() => {
    fetchAssignments();
    fetchProjectReports();
  }, []);

  const fetchProjectReports = async () => {
    try {
      setLoadingProjects(true);
      const res = await api.get('/projects/plagiarism/all-reports');
      setProjectReports(res.data.reports || []);
    } catch (err) {
      console.error('Failed to load project reports', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const downloadPlagiarismReport = async (reportId) => {
    try {
      const toastId = toast ? toast.loading('Generating PDF...') : null;
      const response = await api.get(`/projects/plagiarism/download/${reportId}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `project_plagiarism_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      if (toastId) toast.success('Download complete', { id: toastId });
    } catch (err) {
      console.error('Failed to download PDF', err);
      if (toast) toast.error('Failed to download PDF');
      else alert('Failed to download PDF');
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments');
      setAssignments(res.data.assignments);
    } catch (err) {
      console.error(err);
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async (assignmentId) => {
    try {
      setLoading(true);
      setSelectedAssignment(assignmentId);
      const res = await api.get(`/plagiarism/assignment/${assignmentId}`);
      setReportsData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const runPlagiarismCheck = async (assignmentId) => {
    try {
      setChecking(true);
      setError(null);
      await api.post(`/plagiarism/check/${assignmentId}`);
      // Reload reports after check
      await loadReports(assignmentId);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to run plagiarism check');
    } finally {
      setChecking(false);
    }
  };

  if (['student'].includes(user?.role)) {
    return (
      <div className="glass-panel p-8 text-center text-rose-500 max-w-2xl mx-auto mt-10 animate-fade-in">
        <HiOutlineExclamationCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold tracking-tight">Access Denied</h2>
        <p className="mt-2 text-rose-500/80 font-medium">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-black text-[var(--color-text-primary)] flex items-center gap-3 tracking-tight">
          <HiOutlineDocumentDuplicate className="w-8 h-8 text-indigo-500" />
          Plagiarism Detection
        </h1>
        <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-2">
          Review plagiarism reports for Assignment Submissions and Project Documents.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 p-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'assignments'
              ? 'bg-[var(--color-bg-primary)] text-indigo-500 shadow-xs'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          }`}
        >
          Assignment Submissions
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'projects'
              ? 'bg-[var(--color-bg-primary)] text-indigo-500 shadow-xs'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          }`}
        >
          Project Documents
        </button>
      </div>

      {activeTab === 'assignments' ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assignment Selection */}
        <div className="glass-panel p-6 h-[fit-content] shadow-xs">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 border-b border-[var(--color-border)] pb-3">
            Select Assignment
          </h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {loading && !selectedAssignment ? (
              <div className="text-center py-10">
                <div className="w-6 h-6 border-2 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              assignments.map(a => (
                <button
                  key={a._id}
                  onClick={() => loadReports(a._id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedAssignment === a._id 
                      ? 'border-indigo-500 bg-indigo-500/10' 
                      : 'border-[var(--color-border)] hover:border-indigo-500/50 hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  <div className="font-bold text-sm text-[var(--color-text-primary)] line-clamp-1">{a.title}</div>
                  <div className="text-xs font-medium text-[var(--color-text-secondary)] mt-1">{a.course} • {a.submissionCount || 0} Submissions</div>
                </button>
              ))
            )}
            {!loading && assignments.length === 0 && (
              <div className="text-center py-6 text-[var(--color-text-secondary)] text-sm font-medium">No assignments found.</div>
            )}
          </div>
        </div>

        {/* Right Column: Reports */}
        <div className="lg:col-span-2 glass-panel p-6 min-h-[400px] shadow-xs">
          {!selectedAssignment ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-secondary)] py-20 font-medium">
              <HiOutlineDocumentDuplicate className="w-16 h-16 mb-4 opacity-50 text-indigo-500" />
              <p>Select an assignment to view or run plagiarism checks.</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--color-border)] pb-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    {reportsData?.assignment?.title || 'Assignment Reports'}
                  </h2>
                  <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-1">
                    {reportsData?.totalReports} pairs compared • <span className="text-rose-500 font-bold">{reportsData?.flaggedCount} flagged</span>
                  </p>
                </div>
                <button
                  onClick={() => runPlagiarismCheck(selectedAssignment)}
                  disabled={checking}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all cursor-pointer shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ background: 'var(--gradient-brand)' }}
                >
                  {checking ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
                    </svg>
                  ) : (
                    <HiOutlinePlay className="w-4 h-4" />
                  )}
                  {checking ? 'Running Check...' : 'Run Plagiarism Check'}
                </button>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 text-rose-500 text-sm font-medium rounded-xl border border-rose-500/20">
                  {error}
                </div>
              )}

              {reportsData?.reports?.length === 0 ? (
                <div className="text-center py-10 text-[var(--color-text-secondary)] font-medium">
                  <HiOutlineCheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
                  <p>No plagiarism reports generated yet.</p>
                  <p className="text-xs mt-1">Click "Run Plagiarism Check" to compare submissions.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reportsData?.reports?.map(report => (
                    <div key={report._id} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-colors hover:border-indigo-500/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Student 1</div>
                            <div className="text-sm font-bold text-[var(--color-text-primary)]">{report.student1?.name}</div>
                          </div>
                          <div className="text-[var(--color-text-muted)] font-black px-2 text-xs">VS</div>
                          <div className="flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Student 2</div>
                            <div className="text-sm font-bold text-[var(--color-text-primary)]">{report.student2?.name}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 sm:pl-6 sm:border-l border-[var(--color-border)]">
                        <div className="text-center">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Similarity</div>
                          <div className={`text-xl font-bold ${
                            report.similarityScore >= (reportsData.assignment?.threshold || 70) 
                              ? 'text-rose-500' 
                              : report.similarityScore >= 40 
                                ? 'text-amber-500' 
                                : 'text-emerald-500'
                          }`}>
                            {report.similarityScore}%
                          </div>
                        </div>
                        {/* Detail view would go here if implemented, for now just an icon */}
                        <button className="p-2 rounded-lg bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-indigo-500 transition-colors">
                          <HiOutlineEye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      ) : (
      /* Project Documents Tab */
      <div className="glass-panel p-6 min-h-[400px] shadow-xs">
        <div className="border-b border-[var(--color-border)] pb-4 mb-6">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Project Document Scans</h2>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-1">
            Recent plagiarism checks performed on student project reports and presentations.
          </p>
        </div>

        {loadingProjects ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : projectReports.length === 0 ? (
          <div className="text-center py-10 text-[var(--color-text-secondary)] font-medium">
            <HiOutlineCheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
            <p>No project document plagiarism reports found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectReports.map(report => (
              <div key={report._id} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col gap-4">
                
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-[var(--color-text-primary)]">{report.project?.title || 'Unknown Project'}</h3>
                    <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-1">
                      Student: <span className="font-bold text-[var(--color-text-primary)]">{report.project?.student?.name || 'Unknown'}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Similarity</div>
                    <div className="flex items-center justify-end gap-3">
                      <div className={`text-2xl font-bold ${
                        report.overallSimilarity >= 30 ? 'text-rose-500' : 'text-emerald-500'
                      }`}>
                        {report.overallSimilarity}%
                      </div>
                      <button 
                        onClick={() => downloadPlagiarismReport(report._id)} 
                        className="p-2 rounded-lg bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-indigo-500 transition-colors"
                        title="Download PDF Report"
                      >
                        <HiOutlineDownload className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-[var(--color-border)]">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-indigo-500/10 text-indigo-500 rounded border border-indigo-500/20">
                    {report.documentName === 'reportFile' ? 'Project Report' : 'Presentation'}
                  </span>
                  
                  {report.matches && report.matches.length > 0 && (
                    <div className="text-[10px] font-bold uppercase tracking-widest text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20">
                      {report.matches.length} matches found
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default PlagiarismPage;
