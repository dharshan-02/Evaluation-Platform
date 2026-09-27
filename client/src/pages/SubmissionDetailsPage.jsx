import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuth } from '../hooks/useAuth';
import api, { getBaseUrl } from '../lib/api';
import { 
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineCode,
  HiOutlineTerminal,
  HiOutlineDocumentText,
  HiOutlineLink,
  HiOutlineSparkles
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import PeerReviewSection from '../components/PeerReviewSection';

const SubmissionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('execution'); // 'execution', 'code', or 'ci'
  
  // CI/CD Webhook State
  const [webhookUrl, setWebhookUrl] = useState(null);
  const [isRegisteringWebhook, setIsRegisteringWebhook] = useState(false);
  
  // Grading State
  const [marks, setMarks] = useState('');
  const [manualGradeFeedback, setManualGradeFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [checkingWebPlagiarism, setCheckingWebPlagiarism] = useState(false);

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/submissions/${id}`);
      setSubmission(res.data.submission);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch submission details');
    } finally {
      setLoading(false);
    }
  };

  const handleWebPlagiarismCheck = async () => {
    try {
      setCheckingWebPlagiarism(true);
      const res = await api.post(`/plagiarism/check-web/${id}`);
      if (res.data.success) {
        setSubmission(prev => ({ ...prev, aiPlagiarismReport: res.data.report }));
        toast.success('Web plagiarism check complete');
      }
    } catch (err) {
      toast.error('Failed to run web plagiarism check');
    } finally {
      setCheckingWebPlagiarism(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="max-w-4xl mx-auto mt-10 animate-fade-in">
        <div className="glass-panel p-8 text-center text-rose-500">
          <h2 className="text-xl font-bold mb-2">Error Loading Submission</h2>
          <p>{error || 'Submission not found.'}</p>
          <button onClick={() => navigate('/submissions')} className="mt-4 px-4 py-2 bg-rose-500/10 rounded-lg font-semibold hover:bg-rose-500/20 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsGrading(true);
      const res = await api.post(`/submissions/${id}/grade`, {
        marks: Number(marks),
        manualGradeFeedback
      });
      setSubmission(res.data.submission);
      // Optional: Add a success toast here
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit grade');
    } finally {
      setIsGrading(false);
    }
  };

  const handleRegisterWebhook = async () => {
    try {
      setIsRegisteringWebhook(true);
      const res = await api.post('/webhooks/register', { submissionId: id });
      setWebhookUrl(res.data.webhookUrl);
      setSubmission(prev => ({ ...prev, githubWebhookEnabled: true }));
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Failed to register webhook');
    } finally {
      setIsRegisteringWebhook(false);
    }
  };

  const getStatusDisplay = () => {
    switch (submission.status) {
      case 'evaluated':
        return (
          <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-xl font-bold">
            <HiOutlineCheckCircle className="w-5 h-5" /> Evaluated
          </div>
        );
      case 'running':
        return (
          <div className="flex items-center gap-2 text-blue-500 bg-blue-500/10 px-4 py-2 rounded-xl font-bold">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
            </svg>
            Running Tests...
          </div>
        );
      case 'failed':
      case 'error':
        return (
          <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 px-4 py-2 rounded-xl font-bold">
            <HiOutlineXCircle className="w-5 h-5" /> Evaluation Failed
          </div>
        );
      case 'manual_evaluation':
        return (
          <div className="flex items-center gap-2 text-indigo-500 bg-indigo-500/10 px-4 py-2 rounded-xl font-bold">
            <HiOutlineDocumentText className="w-5 h-5" /> Pending Manual Grade
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl font-bold">
            <HiOutlineClock className="w-5 h-5" /> Pending Execution
          </div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(-1)}
            className="mt-1 p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">
              Submission Details
            </div>
            <h1 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight leading-tight">
              {submission.assignment?.title}
            </h1>
            <div className="text-sm font-medium text-[var(--color-text-secondary)] mt-1">
              By <span className="font-bold text-[var(--color-text-primary)]">{submission.student?.name}</span> • {format(new Date(submission.submittedAt), 'MMM dd, yyyy h:mm a')}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {getStatusDisplay()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summary Cards */}
        <div className="space-y-6">
          <div className="glass-panel p-6 text-center shadow-xs">
            <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Score</h3>
            <div className={`text-5xl font-black mb-2 tracking-tight ${
              submission.status === 'evaluated' 
                ? (submission.marks / (submission.assignment?.maxMarks || 100) >= 0.8 ? 'text-emerald-500' : 'text-amber-500')
                : 'text-[var(--color-text-muted)]'
            }`}>
              {submission.status === 'evaluated' ? submission.marks : '-'}
            </div>
            <div className="text-sm font-bold text-[var(--color-text-secondary)]">out of {submission.assignment?.maxMarks || 100}</div>
          </div>

          <div className="glass-panel p-6 shadow-xs">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-4 uppercase tracking-widest">Metrics</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-500">Test Cases Passed</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {submission.testCasesPassed} / {submission.totalTestCases}
                </span>
              </li>
              <li className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-500">Language</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">
                  {submission.language}
                </span>
              </li>
              {['admin', 'faculty'].includes(user.role) && submission.status === 'evaluated' && (
                <li className="flex flex-col pb-3 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex justify-between items-center w-full mb-2">
                    <span className="text-slate-500">Plagiarism Score</span>
                    <button 
                      onClick={handleWebPlagiarismCheck} 
                      disabled={checkingWebPlagiarism} 
                      className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-indigo-200 transition-colors disabled:opacity-50"
                    >
                      <HiOutlineSparkles className={checkingWebPlagiarism ? 'animate-pulse' : ''} /> 
                      {checkingWebPlagiarism ? 'Checking...' : 'Detect AI Code'}
                    </button>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-sm text-slate-500">Peer Comparison:</span>
                      <span className={`font-bold ${submission.plagiarismScore > 30 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {submission.plagiarismScore}%
                      </span>
                    </div>
                    {submission.aiPlagiarismReport && (
                      <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800 text-sm">
                        <div className="font-bold flex items-center gap-1 text-indigo-700 dark:text-indigo-400 mb-2">
                          <HiOutlineSparkles /> AI Generation Analysis
                        </div>
                        <div className="space-y-1 text-slate-600 dark:text-slate-300">
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className={submission.aiPlagiarismReport.isPlagiarized ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                              {submission.aiPlagiarismReport.isPlagiarized ? 'Flagged' : 'Clear'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Confidence:</span>
                            <span>{submission.aiPlagiarismReport.confidenceScore}%</span>
                          </div>
                          <p className="mt-2 text-xs italic opacity-80">{submission.aiPlagiarismReport.reasoning}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              )}
              {submission.status === 'evaluated' && submission.staticAnalysisReport && (
                <li className="flex flex-col pb-3 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex justify-between items-center w-full mb-2">
                    <span className="text-slate-500">Code Quality Score</span>
                    <span className={`font-bold ${submission.codeQualityScore >= 80 ? 'text-emerald-500' : submission.codeQualityScore >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {submission.codeQualityScore}/100
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Complexity</div>
                      <div className="text-lg font-bold text-slate-700 dark:text-slate-300">{submission.staticAnalysisReport.metrics?.cyclomaticComplexity || 0}</div>
                    </div>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Smells</div>
                      <div className="text-lg font-bold text-slate-700 dark:text-slate-300">{submission.staticAnalysisReport.metrics?.codeSmells || 0}</div>
                    </div>
                  </div>
                  {submission.staticAnalysisReport.issues && submission.staticAnalysisReport.issues.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs font-bold text-slate-500">Analysis Issues:</div>
                      {submission.staticAnalysisReport.issues.map((issue, idx) => (
                        <div key={idx} className={`p-2 text-xs rounded-lg border ${
                          issue.severity === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400' :
                          issue.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400' :
                          'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400'
                        }`}>
                          <span className="font-bold">{issue.file}:</span> {issue.message}
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Right Column: Execution Logs, Code, or Project Details */}
        <div className="lg:col-span-2 glass-panel overflow-hidden flex flex-col min-h-[500px] shadow-xs">
          {submission.assignment?.type === 'project' ? (
            <div className="p-8 flex-1 overflow-y-auto bg-[var(--color-bg-secondary)] space-y-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Project Submission</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500">
                      <HiOutlineLink className="w-5 h-5" />
                      <span className="font-semibold text-sm">GitHub Repository</span>
                    </div>
                    {submission.githubUrl ? (
                      <a href={submission.githubUrl} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline font-medium break-all">
                        {submission.githubUrl}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">No URL provided</span>
                    )}
                  </div>
                  
                  <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500">
                      <HiOutlineDocumentText className="w-5 h-5" />
                      <span className="font-semibold text-sm">Project Report</span>
                    </div>
                    {submission.projectReport ? (
                      <a href={`${getBaseUrl()}${submission.projectReport}`} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline font-medium">
                        View/Download Document
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">No report uploaded</span>
                    )}
                  </div>
                </div>
              </div>

              {['admin', 'faculty'].includes(user.role) && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Manual Grading</h4>
                  <form onSubmit={handleGradeSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Marks (out of {submission.assignment?.maxMarks})</label>
                      <input
                        type="number"
                        min="0"
                        max={submission.assignment?.maxMarks}
                        required
                        value={marks}
                        onChange={(e) => setMarks(e.target.value)}
                        className="input-field w-full md:w-1/3 px-4 py-2.5 rounded-xl text-sm outline-none"
                        placeholder="e.g. 85"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Feedback</label>
                      <textarea
                        rows="4"
                        value={manualGradeFeedback}
                        onChange={(e) => setManualGradeFeedback(e.target.value)}
                        className="input-field w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-y"
                        placeholder="Leave constructive feedback for the student..."
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      disabled={isGrading}
                      className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                      {isGrading ? 'Saving Grade...' : 'Submit Grade'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('execution')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'execution'
                  ? 'text-indigo-500 border-b-2 border-indigo-500 bg-[var(--color-bg-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              <HiOutlineTerminal className="w-5 h-5" /> Execution Logs
            </button>
            <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'code'
                ? 'text-indigo-500 border-b-2 border-indigo-500 bg-[var(--color-bg-primary)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            <HiOutlineCode className="w-5 h-5" /> Source Code
          </button>
          
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'reviews'
                ? 'text-indigo-500 border-b-2 border-indigo-500 bg-[var(--color-bg-primary)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            <HiOutlineDocumentText className="w-5 h-5" /> Peer Reviews
          </button>
            <button
              onClick={() => setActiveTab('ci')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'ci'
                  ? 'text-indigo-500 border-b-2 border-indigo-500 bg-[var(--color-bg-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              <HiOutlineLink className="w-5 h-5" /> CI/CD Pipeline
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto bg-[var(--color-bg-primary)]">
            {activeTab === 'execution' ? (
              <div className="space-y-6">
                {submission.feedback && (
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
                    <div className="font-bold text-slate-900 dark:text-white mb-2 text-xs uppercase">Compiler/System Feedback</div>
                    {submission.feedback}
                  </div>
                )}
                
                {(!submission.executionResults || submission.executionResults.length === 0) ? (
                  <div className="text-center py-10 text-slate-500">
                    No execution logs available yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submission.executionResults.map((result, idx) => {
                      const isHidden = result.testCase?.isHidden;
                      const hideDetails = isHidden && user.role === 'student';
                      
                      return (
                        <div key={result._id || idx} className={`rounded-xl border ${result.passed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'} overflow-hidden`}>
                          <div className={`px-4 py-3 border-b flex justify-between items-center ${result.passed ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
                            <div className="font-bold text-sm flex items-center gap-2">
                              {result.passed ? <HiOutlineCheckCircle className="text-emerald-500 w-5 h-5" /> : <HiOutlineXCircle className="text-rose-500 w-5 h-5" />}
                              <span className={result.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                                Test Case {result.testCase?.order || idx + 1} {isHidden ? '(Hidden)' : ''}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-slate-500 flex gap-4">
                              <span>{result.executionTime}ms</span>
                              <span>{result.memoryUsed}MB</span>
                            </div>
                          </div>
                          
                          <div className="p-4 space-y-3">
                            {result.error && (
                              <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-mono whitespace-pre-wrap">
                                {result.error}
                              </div>
                            )}
                            
                            {!hideDetails ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Expected Output</div>
                                  <pre className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto">
                                    {result.testCase?.expectedOutput || '(none)'}
                                  </pre>
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Actual Output</div>
                                  <pre className={`p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-mono overflow-x-auto ${!result.passed && result.actualOutput ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {result.actualOutput || '(none)'}
                                  </pre>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-2 text-sm text-slate-500 italic">
                                Details hidden for private test cases.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeTab === 'code' ? (
              <div className="space-y-6">
                {submission.githubUrl ? (
                  <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <HiOutlineLink className="w-6 h-6 text-slate-400" />
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">GitHub Repository</div>
                        <a href={submission.githubUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-500 hover:underline">
                          {submission.githubUrl}
                        </a>
                      </div>
                    </div>
                  </div>
                ) : submission.files && submission.files.length > 0 ? (
                  submission.files.map((file, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[600px]">
                      <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <HiOutlineDocumentText className="w-4 h-4" />
                        {file.name}
                      </div>
                      <div className="flex-1 bg-[#1e1e1e]">
                        <Editor
                          height="100%"
                          language={
                            submission.language === 'c' || submission.language === 'cpp' ? 'cpp' :
                            submission.language === 'python' ? 'python' :
                            submission.language === 'java' ? 'java' :
                            submission.language === 'javascript' ? 'javascript' :
                            submission.language === 'go' ? 'go' :
                            submission.language === 'ruby' ? 'ruby' :
                            submission.language === 'rust' ? 'rust' : 'plaintext'
                          }
                          theme="vs-dark"
                          value={file.content || '(File is empty or binary)'}
                          options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            padding: { top: 16 }
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-500">
                    No source code available.
                  </div>
                )}
              </div>
            ) : activeTab === 'ci' ? (
              <div className="space-y-6">
                {!submission.githubWebhookEnabled ? (
                  <div className="text-center py-10 glass-panel p-8">
                    <h3 className="text-xl font-bold mb-4 text-[var(--color-text-primary)] tracking-tight">Enable CI/CD Pipeline</h3>
                    <p className="text-[var(--color-text-secondary)] font-medium mb-6 max-w-md mx-auto">
                      Connect this submission to your GitHub repository to automatically evaluate your code every time you push.
                    </p>
                    <button
                      onClick={handleRegisterWebhook}
                      disabled={isRegisteringWebhook}
                      className="btn-primary inline-flex"
                    >
                      {isRegisteringWebhook ? 'Registering...' : 'Generate Webhook URL'}
                    </button>
                    {webhookUrl && (
                      <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-left">
                        <p className="text-sm font-bold mb-2">Webhook URL generated:</p>
                        <code className="text-xs bg-slate-200 dark:bg-slate-700 p-2 rounded break-all block">
                          {webhookUrl}
                        </code>
                        <p className="text-xs text-slate-500 mt-2">
                          Add this as a webhook payload URL in your GitHub repository settings.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <HiOutlineTerminal className="w-6 h-6 text-indigo-500" /> Commit History
                      </h3>
                      <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full">
                        Webhook Active
                      </span>
                    </div>

                    {!submission.commits || submission.commits.length === 0 ? (
                      <div className="text-center py-8 text-[var(--color-text-secondary)] font-medium glass-panel">
                        Waiting for your first git push...
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {submission.commits.slice().reverse().map((commit, idx) => (
                          <div key={idx} className="p-4 glass-panel flex items-center justify-between border-l-4 border-indigo-500">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm font-bold text-indigo-500">{commit.hash.substring(0, 7)}</span>
                                <span className="text-slate-400 text-xs text-slate-500">{format(new Date(commit.timestamp || Date.now()), 'MMM dd, h:mm a')}</span>
                              </div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{commit.message}</p>
                              <p className="text-xs text-slate-500 mt-1">by {commit.author}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                commit.status === 'evaluated' ? 'bg-emerald-500/10 text-emerald-500' :
                                commit.status === 'error' ? 'bg-rose-500/10 text-rose-500' :
                                'bg-amber-500/10 text-amber-500 animate-pulse'
                              }`}>
                                {commit.status.toUpperCase()}
                              </span>
                              {commit.status === 'evaluated' && (
                                <div className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                  Score: {commit.marks}
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
            ) : activeTab === 'reviews' ? (
              <div className="space-y-6">
                <PeerReviewSection submission={submission} />
              </div>
            ) : null}
          </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetailsPage;
