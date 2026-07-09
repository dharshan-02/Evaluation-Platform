import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { 
  HiOutlineDocumentDuplicate,
  HiOutlinePlay,
  HiOutlineEye,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle
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
      <div className="glass p-8 text-center text-rose-500 rounded-2xl max-w-2xl mx-auto mt-10">
        <HiOutlineExclamationCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HiOutlineDocumentDuplicate className="w-6 h-6 text-indigo-500" />
          Plagiarism Detection
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review plagiarism reports for Assignment Submissions and Project Documents.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'assignments'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          Assignment Submissions
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'projects'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          Project Documents
        </button>
      </div>

      {activeTab === 'assignments' ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assignment Selection */}
        <div className="glass rounded-2xl p-6 h-[fit-content]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700/50 pb-3">
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
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{a.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{a.course} • {a.submissionCount || 0} Submissions</div>
                </button>
              ))
            )}
            {!loading && assignments.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-sm">No assignments found.</div>
            )}
          </div>
        </div>

        {/* Right Column: Reports */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 min-h-[400px]">
          {!selectedAssignment ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
              <HiOutlineDocumentDuplicate className="w-16 h-16 mb-4 opacity-50" />
              <p>Select an assignment to view or run plagiarism checks.</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-700/50 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {reportsData?.assignment?.title || 'Assignment Reports'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {reportsData?.totalReports} pairs compared • <span className="text-rose-500 font-semibold">{reportsData?.flaggedCount} flagged</span>
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
                <div className="p-3 bg-rose-500/10 text-rose-500 text-sm rounded-xl border border-rose-500/20">
                  {error}
                </div>
              )}

              {reportsData?.reports?.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <HiOutlineCheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
                  <p>No plagiarism reports generated yet.</p>
                  <p className="text-xs mt-1">Click "Run Plagiarism Check" to compare submissions.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reportsData?.reports?.map(report => (
                    <div key={report._id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-colors hover:border-indigo-500/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-slate-500 uppercase">Student 1</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{report.student1?.name}</div>
                          </div>
                          <div className="text-slate-300 dark:text-slate-600 font-bold px-2">VS</div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-slate-500 uppercase">Student 2</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{report.student2?.name}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 sm:pl-6 sm:border-l border-slate-200 dark:border-slate-700">
                        <div className="text-center">
                          <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Similarity</div>
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
                        <button className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
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
      <div className="glass rounded-2xl p-6 min-h-[400px]">
        <div className="border-b border-slate-200 dark:border-slate-700/50 pb-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Project Document Scans</h2>
          <p className="text-sm text-slate-500 mt-1">
            Recent plagiarism checks performed on student project reports and presentations.
          </p>
        </div>

        {loadingProjects ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : projectReports.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <HiOutlineCheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
            <p>No project document plagiarism reports found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectReports.map(report => (
              <div key={report._id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-4">
                
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{report.project?.title || 'Unknown Project'}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Student: <span className="font-semibold text-slate-700 dark:text-slate-300">{report.project?.student?.name || 'Unknown'}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Similarity</div>
                    <div className={`text-2xl font-bold ${
                      report.overallSimilarity >= 30 ? 'text-rose-500' : 'text-emerald-500'
                    }`}>
                      {report.overallSimilarity}%
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-md">
                    {report.documentName === 'reportFile' ? 'Project Report' : 'Presentation'}
                  </span>
                  
                  {report.matches && report.matches.length > 0 && (
                    <div className="text-xs text-rose-500 font-semibold bg-rose-100 dark:bg-rose-900/30 px-2 py-1 rounded-md">
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
