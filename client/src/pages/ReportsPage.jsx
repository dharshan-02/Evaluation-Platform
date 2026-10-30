import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { 
  HiOutlineDocumentDownload,
  HiOutlineDocumentReport,
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck
} from 'react-icons/hi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ReportsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [plagiarismReports, setPlagiarismReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments');
      const list = res.data.assignments || [];
      setAssignments(list);
      if (list.length > 0) {
        loadAssignmentReports(list[0]._id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignmentReports = async (assignmentId) => {
    try {
      setLoadingDetails(true);
      setSelectedAssignment(assignmentId);
      
      const subsRes = await api.get(`/submissions?assignmentId=${assignmentId}&status=evaluated&limit=100`);
      setSubmissions(subsRes.data.submissions || []);

      if (user?.role !== 'student') {
        const plagRes = await api.get(`/plagiarism/assignment/${assignmentId}`);
        setPlagiarismReports(plagRes.data.reports || []);
      } else {
        setPlagiarismReports([]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load reports data');
    } finally {
      setLoadingDetails(false);
    }
  };

  const downloadSubmissionReport = (submissionId) => {
    downloadPdfBlob(`/reports/submission/${submissionId}`, `submission_report_${submissionId}.pdf`);
  };

  const downloadPlagiarismReport = (reportId) => {
    downloadPdfBlob(`/reports/plagiarism/${reportId}`, `plagiarism_report_${reportId}.pdf`);
  };

  const downloadPdfBlob = async (url, filename) => {
    const toastId = toast.loading('Compiling and generating PDF report...');
    try {
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('PDF report downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error('Failed to download PDF', err);
      toast.error('Failed to generate PDF report', { id: toastId });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center shadow-sm">
              <HiOutlineDocumentReport className="w-6 h-6" />
            </div>
            Academic PDF Reports Hub
          </h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-2">
            Generate and export signed verification PDF dossiers for student submissions and similarity scans.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assignment Selection */}
        <div className="card-pro p-5 flex flex-col h-[fit-content]">
          <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-3 pb-2 border-b border-[var(--color-border)] flex items-center justify-between">
            <span>Select Assignment</span>
            <span className="text-xs font-semibold text-slate-400">{assignments.length} total</span>
          </h3>
          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1 scrollbar-thin">
            {loading && !selectedAssignment ? (
              <div className="text-center py-10">
                <div className="w-6 h-6 border-2 border-slate-200 dark:border-slate-700 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              assignments.map(a => (
                <button
                  key={a._id}
                  onClick={() => loadAssignmentReports(a._id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedAssignment === a._id 
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs' 
                      : 'border-[var(--color-border)] hover:border-blue-500/40 hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  <div className="font-bold text-sm text-[var(--color-text-primary)] line-clamp-1">{a.title}</div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-1 font-medium">{a.course}</div>
                </button>
              ))
            )}
            {!loading && assignments.length === 0 && (
              <div className="text-center py-6 text-[var(--color-text-secondary)] text-sm font-medium">No assignments found.</div>
            )}
          </div>
        </div>

        {/* Right Column: Reports */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedAssignment ? (
            <div className="card-pro p-16 flex flex-col items-center justify-center text-slate-400 min-h-[350px]">
              <HiOutlineClipboardList className="w-16 h-16 mb-4 opacity-40 text-blue-500" />
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">Select an assignment to view available reports.</p>
            </div>
          ) : loadingDetails ? (
            <div className="card-pro p-16 flex justify-center items-center min-h-[350px]">
              <div className="w-8 h-8 border-3 border-[var(--color-border)] border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Submission Reports */}
              <div className="card-pro p-6">
                <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-4 border-b border-[var(--color-border)] pb-3 flex justify-between items-center">
                  <span>Student Evaluation Reports</span>
                  <span className="text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-300 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    {submissions.length} Evaluated
                  </span>
                </h3>
                
                {submissions.length === 0 ? (
                  <div className="text-center py-10 text-[var(--color-text-secondary)] text-xs font-medium">
                    No evaluated submissions found for this assignment yet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                    {submissions.map(sub => (
                      <div key={sub._id} className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex justify-between items-center hover:border-blue-500/40 transition-colors">
                        <div>
                          <div className="font-bold text-sm text-[var(--color-text-primary)]">{sub.student?.name || 'Student'}</div>
                          <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                            Score: <strong className="text-emerald-500">{sub.marks}</strong> / {sub.assignment?.maxMarks || 100} • {format(new Date(sub.submittedAt), 'MMM dd')}
                          </div>
                        </div>
                        <button
                          onClick={() => downloadSubmissionReport(sub._id)}
                          className="btn-secondary text-xs p-2 flex items-center gap-1.5 cursor-pointer text-blue-600 dark:text-sky-400 hover:text-blue-700"
                          title="Download Evaluation PDF"
                        >
                          <HiOutlineDocumentDownload className="w-4 h-4" />
                          <span>PDF</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Plagiarism Reports */}
              {plagiarismReports.length > 0 && (
                <div className="card-pro p-6">
                  <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-4 border-b border-[var(--color-border)] pb-3 flex justify-between items-center">
                    <span>Similarity Comparison Reports</span>
                    <span className="text-xs font-bold bg-rose-500/10 text-rose-500 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                      {plagiarismReports.length} Comparisons
                    </span>
                  </h3>
                  
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                    {plagiarismReports.map(report => (
                      <div key={report._id} className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex justify-between items-center hover:border-rose-500/40 transition-colors">
                        <div>
                          <div className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
                            <span>{report.student1?.name}</span>
                            <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">vs</span>
                            <span>{report.student2?.name}</span>
                          </div>
                          <div className={`text-xs font-bold mt-1 ${report.similarityScore > 70 ? 'text-rose-500' : 'text-amber-500'}`}>
                            {report.similarityScore}% Similarity Convergence
                          </div>
                        </div>
                        <button
                          onClick={() => downloadPlagiarismReport(report._id)}
                          className="btn-secondary text-xs p-2 flex items-center gap-1.5 cursor-pointer text-rose-500 hover:text-rose-600"
                          title="Download Plagiarism PDF"
                        >
                          <HiOutlineDocumentDownload className="w-4 h-4" />
                          <span>PDF</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
