import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import api, { getBaseUrl } from '../lib/api';
import toast from 'react-hot-toast';
import { 
  HiOutlineDocumentDuplicate,
  HiOutlinePlay,
  HiOutlineEye,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineDownload,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineX,
  HiOutlineShieldCheck,
  HiOutlineDocumentText
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

  // Filter & Search states
  const [minSimilarity, setMinSimilarity] = useState(0);
  const [searchStudent, setSearchStudent] = useState('');
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' or 'projects'
  const [projectReports, setProjectReports] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Modal inspection state
  const [inspectModalReport, setInspectModalReport] = useState(null);

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
      const toastId = toast.loading('Generating PDF...');
      const response = await api.get(`/projects/plagiarism/download/${reportId}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `project_plagiarism_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download complete', { id: toastId });
    } catch (err) {
      console.error('Failed to download PDF', err);
      toast.error('Failed to download PDF');
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments');
      setAssignments(res.data.assignments || []);
      if (res.data.assignments?.length > 0) {
        loadReports(res.data.assignments[0]._id);
      }
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
      toast.success('Plagiarism detection completed successfully!');
      await loadReports(assignmentId);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to run plagiarism check');
      toast.error('Plagiarism check failed');
    } finally {
      setChecking(false);
    }
  };

  if (user?.role === 'student') {
    return (
      <div className="card-pro p-8 text-center text-rose-500 max-w-2xl mx-auto mt-10 animate-fade-in">
        <HiOutlineExclamationCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold tracking-tight">Access Denied</h2>
        <p className="mt-2 text-rose-500/80 font-medium">Plagiarism analytics and raw pairwise reports are restricted to faculty members and administrators.</p>
      </div>
    );
  }

  // Filter reports
  const filteredReports = reportsData?.reports?.filter(r => {
    const matchesSimilarity = r.similarityScore >= minSimilarity;
    const name1 = r.student1?.name?.toLowerCase() || '';
    const name2 = r.student2?.name?.toLowerCase() || '';
    const query = searchStudent.toLowerCase();
    const matchesQuery = !query || name1.includes(query) || name2.includes(query);
    return matchesSimilarity && matchesQuery;
  }) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-sm">
              <HiOutlineShieldCheck className="w-6 h-6" />
            </div>
            Plagiarism Detection Engine
          </h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-2">
            Winnowing token fingerprinting algorithm with AST normalization and Jaccard similarity metrics.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-slate-800/80 border border-[var(--color-border)] rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-400 shadow-xs'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Assignment Code
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-400 shadow-xs'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Capstone Documents
          </button>
        </div>
      </div>

      {activeTab === 'assignments' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Assignment Selection */}
          <div className="card-pro p-5 shadow-xs flex flex-col h-[fit-content]">
            <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-3 pb-2 border-b border-[var(--color-border)] flex items-center justify-between">
              <span>Assignments</span>
              <span className="text-xs font-semibold text-slate-400">{assignments.length} total</span>
            </h3>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
              {loading && !selectedAssignment ? (
                <div className="text-center py-10">
                  <div className="w-6 h-6 border-2 border-slate-200 dark:border-slate-700 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                </div>
              ) : (
                assignments.map(a => (
                  <button
                    key={a._id}
                    onClick={() => loadReports(a._id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedAssignment === a._id 
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs' 
                        : 'border-[var(--color-border)] hover:border-blue-500/40 hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    <div className="font-bold text-sm text-[var(--color-text-primary)] line-clamp-1">{a.title}</div>
                    <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-secondary)] mt-1.5">
                      <span>{a.course}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {a.submissionCount || 0} subs
                      </span>
                    </div>
                  </button>
                ))
              )}
              {!loading && assignments.length === 0 && (
                <div className="text-center py-6 text-[var(--color-text-secondary)] text-sm font-medium">No assignments found.</div>
              )}
            </div>
          </div>

          {/* Right Column: Reports */}
          <div className="lg:col-span-2 card-pro p-6 min-h-[450px]">
            {!selectedAssignment ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-secondary)] py-20 font-medium">
                <HiOutlineDocumentDuplicate className="w-16 h-16 mb-4 opacity-40 text-blue-500" />
                <p>Select an assignment on the left to inspect plagiarism comparisons.</p>
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center py-24">
                <div className="w-8 h-8 border-3 border-[var(--color-border)] border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Assignment Title & Run Check Button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--color-border)] pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                      {reportsData?.assignment?.title || 'Assignment Reports'}
                    </h2>
                    <p className="text-xs font-semibold text-[var(--color-text-secondary)] mt-1">
                      {reportsData?.totalReports || 0} pairs compared •{' '}
                      <span className="text-rose-500 font-bold">{reportsData?.flaggedCount || 0} flagged</span>
                    </p>
                  </div>
                  <button
                    onClick={() => runPlagiarismCheck(selectedAssignment)}
                    disabled={checking}
                    className="btn-primary flex items-center gap-2 text-xs sm:text-sm cursor-pointer shadow-sm disabled:opacity-60"
                  >
                    {checking ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <HiOutlinePlay className="w-4 h-4" />
                    )}
                    {checking ? 'Computing Fingerprints...' : 'Run Engine Scan'}
                  </button>
                </div>

                {/* Filters Bar */}
                <div className="grid sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <HiOutlineSearch className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter student name..."
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                      className="w-full bg-transparent text-xs text-[var(--color-text-primary)] placeholder:text-slate-400 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                      Min Similarity: <span className="text-blue-600 dark:text-sky-400 font-extrabold">{minSimilarity}%</span>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="10"
                      value={minSimilarity}
                      onChange={(e) => setMinSimilarity(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                    />
                  </div>
                </div>

                {filteredReports.length === 0 ? (
                  <div className="text-center py-12 text-[var(--color-text-secondary)] font-medium">
                    <HiOutlineCheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500/70" />
                    <p className="font-bold text-sm text-[var(--color-text-primary)]">No matches found for current filter criteria.</p>
                    <p className="text-xs mt-1 text-slate-400">Click "Run Engine Scan" or lower the similarity filter to view lower matches.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredReports.map(report => {
                      const threshold = reportsData?.assignment?.threshold || 70;
                      const isHigh = report.similarityScore >= threshold;
                      const isMed = report.similarityScore >= 40 && report.similarityScore < threshold;

                      return (
                        <div 
                          key={report._id} 
                          className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all hover:border-blue-500/40 hover:shadow-2xs"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-muted)]">Candidate A</div>
                                <div className="text-sm font-bold text-[var(--color-text-primary)] mt-0.5">{report.student1?.name || 'Student 1'}</div>
                              </div>
                              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500">VS</span>
                              <div className="flex-1">
                                <div className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-muted)]">Candidate B</div>
                                <div className="text-sm font-bold text-[var(--color-text-primary)] mt-0.5">{report.student2?.name || 'Student 2'}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 sm:pl-6 sm:border-l border-[var(--color-border)]">
                            <div className="text-right">
                              <div className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-muted)]">Match Score</div>
                              <div className={`text-xl font-black ${
                                isHigh ? 'text-rose-500' : isMed ? 'text-amber-500' : 'text-emerald-500'
                              }`}>
                                {report.similarityScore}%
                              </div>
                            </div>

                            <button
                              onClick={() => setInspectModalReport(report)}
                              className="btn-secondary text-xs p-2.5 cursor-pointer hover:text-blue-600 dark:hover:text-sky-300"
                              title="Inspect comparison report"
                            >
                              <HiOutlineEye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Project Documents Tab */
        <div className="card-pro p-6 min-h-[400px]">
          <div className="border-b border-[var(--color-border)] pb-4 mb-6">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Project Document Scans</h2>
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-1">
              Plagiarism checks performed on student capstone project milestone reports (PDF) and presentations (PPTX).
            </p>
          </div>

          {loadingProjects ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-3 border-[var(--color-border)] border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : projectReports.length === 0 ? (
            <div className="text-center py-16 text-[var(--color-text-secondary)] font-medium">
              <HiOutlineCheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500/70" />
              <p className="font-bold text-sm text-[var(--color-text-primary)]">No project document plagiarism reports found.</p>
              <p className="text-xs text-slate-400 mt-1">Uploaded reports will be automatically parsed with OCR and compared against existing corpus.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectReports.map(report => (
                <div key={report._id} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                      <h3 className="font-bold text-sm text-[var(--color-text-primary)] truncate">{report.project?.title || 'Capstone Project'}</h3>
                      <p className="text-xs font-medium text-[var(--color-text-secondary)] mt-0.5">
                        Author: <span className="font-semibold text-[var(--color-text-primary)]">{report.project?.student?.name || 'Student'}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] block mb-0.5">Similarity</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xl font-extrabold ${report.overallSimilarity >= 30 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {report.overallSimilarity}%
                        </span>
                        <button 
                          onClick={() => downloadPlagiarismReport(report._id)} 
                          className="btn-secondary p-1.5 cursor-pointer text-slate-500 hover:text-blue-600"
                          title="Download PDF Report"
                        >
                          <HiOutlineDownload className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border)] text-xs">
                    <span className="font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-300 rounded border border-blue-200 dark:border-blue-800">
                      {report.documentName === 'reportFile' ? 'Milestone Report (PDF)' : 'Presentation (PPTX)'}
                    </span>
                    
                    {report.matches && report.matches.length > 0 ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        {report.matches.length} matched segments
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-500">Original Document</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comparison Detail Modal */}
      <AnimatePresence>
        {inspectModalReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[var(--color-border)] p-6 overflow-hidden space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
                <div>
                  <h3 className="font-extrabold text-base text-[var(--color-text-primary)]">Pairwise Comparison Breakdown</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">Winnowing Fingerprint Intersection Analysis</p>
                </div>
                <button
                  onClick={() => setInspectModalReport(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-[var(--color-border)]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Student 1</span>
                  <div className="font-bold text-sm text-[var(--color-text-primary)]">{inspectModalReport.student1?.name}</div>
                  <div className="text-xs text-slate-500">{inspectModalReport.student1?.email}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Student 2</span>
                  <div className="font-bold text-sm text-[var(--color-text-primary)]">{inspectModalReport.student2?.name}</div>
                  <div className="text-xs text-slate-500">{inspectModalReport.student2?.email}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span>Calculated Similarity:</span>
                  <span className={`text-base font-extrabold ${inspectModalReport.similarityScore >= 70 ? 'text-rose-500' : 'text-amber-500'}`}>
                    {inspectModalReport.similarityScore}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono">
                  {inspectModalReport.similarityScore >= 70
                    ? "⚠️ High token fingerprint convergence detected across multiple function scopes and logic blocks. Faculty intervention recommended."
                    : "ℹ️ Moderate overlap detected, likely stemming from standard template boilerplate, library imports, or common utility patterns."}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                <button
                  onClick={() => setInspectModalReport(null)}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlagiarismPage;
