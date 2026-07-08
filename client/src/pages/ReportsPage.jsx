import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { 
  HiOutlineDocumentDownload,
  HiOutlineDocumentReport,
  HiOutlineClipboardList
} from 'react-icons/hi';
import { format } from 'date-fns';

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
      setAssignments(res.data.assignments);
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
      setSubmissions(subsRes.data.submissions);

      // Only faculty and admins can view plagiarism reports
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
    // We can just open the API URL directly, and the browser will download it since it returns a PDF
    const token = localStorage.getItem('token');
    if (token) {
      window.open(`/api/reports/submission/${submissionId}?token=${token}`, '_blank');
      // Actually, standard window.open doesn't attach auth headers easily. 
      // Instead, we can fetch the blob and trigger a download.
      downloadPdfBlob(`/reports/submission/${submissionId}`, `submission_report_${submissionId}.pdf`);
    }
  };

  const downloadPlagiarismReport = (reportId) => {
    downloadPdfBlob(`/reports/plagiarism/${reportId}`, `plagiarism_report_${reportId}.pdf`);
  };

  const downloadPdfBlob = async (url, filename) => {
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
    } catch (err) {
      console.error('Failed to download PDF', err);
      alert('Failed to download PDF.');
    }
  };


  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HiOutlineDocumentReport className="w-6 h-6 text-indigo-500" />
          PDF Reports Hub
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Generate and download official PDF evaluation and plagiarism reports.
        </p>
      </div>

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
                  onClick={() => loadAssignmentReports(a._id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedAssignment === a._id 
                      ? 'border-indigo-500 bg-indigo-500/10' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{a.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{a.course}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Reports */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedAssignment ? (
            <div className="glass rounded-2xl p-6 h-[400px] flex flex-col items-center justify-center text-slate-400">
              <HiOutlineClipboardList className="w-16 h-16 mb-4 opacity-50" />
              <p>Select an assignment to view available reports.</p>
            </div>
          ) : loadingDetails ? (
            <div className="glass rounded-2xl p-6 h-[400px] flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Submission Reports */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700/50 pb-3 flex justify-between items-center">
                  <span>Student Evaluation Reports</span>
                  <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded-md">{submissions.length}</span>
                </h3>
                
                {submissions.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No evaluated submissions found for this assignment.</p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {submissions.map(sub => (
                      <div key={sub._id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center group">
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white">{sub.student?.name}</div>
                          <div className="text-xs text-slate-500">Score: {sub.marks} / {sub.assignment?.maxMarks || 100} • {format(new Date(sub.submittedAt), 'MMM dd')}</div>
                        </div>
                        <button
                          onClick={() => downloadSubmissionReport(sub._id)}
                          className="p-2 rounded-lg bg-white dark:bg-slate-700 text-indigo-500 border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-indigo-50 dark:hover:bg-slate-600 transition-colors"
                          title="Download PDF"
                        >
                          <HiOutlineDocumentDownload className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Plagiarism Reports */}
              {plagiarismReports.length > 0 && (
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700/50 pb-3 flex justify-between items-center">
                    <span>Plagiarism Reports</span>
                    <span className="text-xs font-semibold bg-rose-500/10 text-rose-500 px-2 py-1 rounded-md">{plagiarismReports.length}</span>
                  </h3>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {plagiarismReports.map(report => (
                      <div key={report._id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            {report.student1?.name} <span className="text-xs text-slate-400">vs</span> {report.student2?.name}
                          </div>
                          <div className={`text-xs font-semibold mt-1 ${report.similarityScore > 70 ? 'text-rose-500' : 'text-amber-500'}`}>
                            {report.similarityScore}% Similarity
                          </div>
                        </div>
                        <button
                          onClick={() => downloadPlagiarismReport(report._id)}
                          className="p-2 rounded-lg bg-white dark:bg-slate-700 text-rose-500 border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-rose-50 dark:hover:bg-slate-600 transition-colors"
                          title="Download PDF"
                        >
                          <HiOutlineDocumentDownload className="w-5 h-5" />
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
