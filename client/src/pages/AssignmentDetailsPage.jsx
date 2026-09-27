import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { 
  HiOutlineClock, 
  HiOutlineDocumentText, 
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineTerminal,
  HiOutlineCode,
  HiOutlinePlay,
  HiOutlineTrash
} from 'react-icons/hi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const LANGUAGE_TEMPLATES = {
  javascript: `// Write your JavaScript code here
function main() {
  console.log("Hello, World!");
}

main();`,
  python: `# Write your Python code here
def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()`,
  java: `// Write your Java code here
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  cpp: `// Write your C++ code here
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  c: `// Write your C code here
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  go: `// Write your Go code here
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
  ruby: `# Write your Ruby code here
def main
  puts "Hello, World!"
end

main`,
  rust: `// Write your Rust code here
fn main() {
    println!("Hello, World!");
}`
};

const AssignmentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Layout state
  const [leftTab, setLeftTab] = useState('description'); // 'description' | 'results'
  
  // Submission state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [executionResults, setExecutionResults] = useState(null);
  const [executionSummary, setExecutionSummary] = useState(null);
  
  // History state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Project submission state
  const [githubUrl, setGithubUrl] = useState('');
  const [projectReport, setProjectReport] = useState(null);

  // Rubric state
  const [rubric, setRubric] = useState(null);
  const [rubricItems, setRubricItems] = useState([{ criteria: '', maxPoints: 10 }]);
  const [savingRubric, setSavingRubric] = useState(false);

  // Interview state
  const [interviews, setInterviews] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [newSlot, setNewSlot] = useState({ date: '', time: '', duration: 15, meetingLink: '' });
  const [bookingSlot, setBookingSlot] = useState(null);

  // Unit Test state
  const [testFramework, setTestFramework] = useState('none');
  const [unitTestCode, setUnitTestCode] = useState('');
  const [savingTests, setSavingTests] = useState(false);

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/assignments/${id}`);
      setAssignment(res.data.assignment);
      if (res.data.assignment.allowedLanguages?.length > 0) {
        setLanguage(res.data.assignment.allowedLanguages[0]);
      }
      
      if (res.data.assignment.testFramework) {
        setTestFramework(res.data.assignment.testFramework);
        setUnitTestCode(res.data.assignment.unitTestCode || '');
      }
      
      // If user has a previous submission, we could fetch its execution results here
      // But for simplicity, we'll let them submit again to see new results.
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch assignment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!language) return;
    
    const currentTemplate = LANGUAGE_TEMPLATES[language];
    if (!currentTemplate) return;

    // Only overwrite if code is completely empty or matches another default template
    const isCodeEmpty = !code || !code.trim();
    const isCodeATemplate = Object.values(LANGUAGE_TEMPLATES).some(t => t === code);
    
    if (isCodeEmpty || isCodeATemplate) {
      setCode(currentTemplate);
    }
  }, [language]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get(`/assignments/${id}/history`);
      setHistory(res.data.history);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (leftTab === 'history') {
      fetchHistory();
    } else if (leftTab === 'rubric' && isAdminOrFaculty) {
      fetchRubric();
    } else if (leftTab === 'interviews') {
      fetchInterviews();
    }
  }, [leftTab, id]);

  const fetchInterviews = async () => {
    try {
      setLoadingInterviews(true);
      const res = await api.get(`/assignments/${id}/interviews`);
      setInterviews(res.data.interviews || []);
    } catch (err) {
      toast.error('Failed to load viva slots');
    } finally {
      setLoadingInterviews(false);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!newSlot.date || !newSlot.time) return;
    
    try {
      const startTime = new Date(`${newSlot.date}T${newSlot.time}`);
      const endTime = new Date(startTime.getTime() + newSlot.duration * 60000);
      
      const payload = {
        slots: [{
          startTime,
          endTime,
          meetingLink: newSlot.meetingLink
        }]
      };
      
      await api.post(`/assignments/${id}/interviews`, payload);
      toast.success('Slot created successfully');
      setNewSlot({ date: '', time: '', duration: 15, meetingLink: '' });
      fetchInterviews();
    } catch (err) {
      toast.error('Failed to create slot');
    }
  };

  const handleBookSlot = async (slotId) => {
    try {
      setBookingSlot(slotId);
      await api.post(`/interviews/${slotId}/book`);
      toast.success('Slot booked successfully');
      fetchInterviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book slot');
    } finally {
      setBookingSlot(null);
    }
  };

  const handleCancelSlot = async (slotId) => {
    try {
      await api.post(`/interviews/${slotId}/cancel`);
      toast.success('Slot cancelled');
      fetchInterviews();
    } catch (err) {
      toast.error('Failed to cancel slot');
    }
  };

  const fetchRubric = async () => {
    try {
      const res = await api.get(`/assignments/${id}/rubric`);
      if (res.data.rubric) {
        setRubric(res.data.rubric);
        setRubricItems(res.data.rubric.items || [{ criteria: '', maxPoints: 10 }]);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load rubric');
      }
    }
  };

  const handleSaveRubric = async () => {
    try {
      setSavingRubric(true);
      const res = await api.post(`/assignments/${id}/rubric`, { items: rubricItems });
      setRubric(res.data.rubric);
      toast.success('Rubric saved successfully');
    } catch (err) {
      toast.error('Failed to save rubric');
    } finally {
      setSavingRubric(false);
    }
  };

  const handleSaveUnitTests = async () => {
    try {
      setSavingTests(true);
      // We can reuse the assignment update endpoint (assuming it exists, or just send a PUT to /assignments/:id)
      await api.put(`/assignments/${id}`, {
        testFramework,
        unitTestCode
      });
      toast.success('Unit tests configuration saved');
      fetchAssignment(); // Refresh assignment state
    } catch (err) {
      toast.error('Failed to save unit tests config');
    } finally {
      setSavingTests(false);
    }
  };

  const handleSubmitCode = async () => {
    setSubmitError(null);
    setExecutionResults(null);
    setExecutionSummary(null);

    if (!code.trim()) {
      setSubmitError('Please write some code before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setLeftTab('results'); // Switch to results tab immediately
      
      // 1. Save submission
      const formData = new FormData();
      formData.append('assignmentId', id);
      formData.append('language', language);
      formData.append('code', code);

      const subRes = await api.post('/submissions', formData);
      const submissionId = subRes.data.submission._id;

      // 2. Execute submission
      const execRes = await api.post(`/execute/${submissionId}`);
      
      setExecutionSummary(execRes.data.submission);
      setExecutionResults(execRes.data.results);
      
      // Update assignment state to reflect submission
      setAssignment(prev => ({
        ...prev,
        userSubmission: execRes.data.submission
      }));
      
      // Refresh history in background
      if (leftTab === 'history') fetchHistory();
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to execute code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setExecutionResults(null);
    setExecutionSummary(null);

    if (!githubUrl.trim()) {
      setSubmitError('Please provide a GitHub URL.');
      return;
    }

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('assignmentId', id);
      formData.append('githubUrl', githubUrl);
      if (projectReport) {
        formData.append('file', projectReport);
      }

      const subRes = await api.post('/submissions', formData);
      
      setAssignment(prev => ({
        ...prev,
        userSubmission: subRes.data.submission
      }));
      setLeftTab('results');
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to submit project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunCode = async () => {
    setSubmitError(null);
    setExecutionResults(null);
    setExecutionSummary(null);

    if (!code.trim()) {
      setSubmitError('Please write some code before running.');
      return;
    }

    try {
      setSubmitting(true);
      setLeftTab('results'); // Switch to results tab immediately
      
      const payload = {
        assignmentId: id,
        language,
        code
      };

      // Execute submission against public test cases only
      const execRes = await api.post(`/execute/run-public`, payload);
      
      setExecutionSummary(execRes.data.summary);
      setExecutionResults(execRes.data.results);
      
      // Refresh history in background
      if (leftTab === 'history') fetchHistory();
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to execute code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      toast.success('Assignment deleted successfully');
      navigate('/assignments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete assignment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAdminOrFaculty = ['admin', 'faculty'].includes(user?.role);

  if (error || !assignment) {
    return (
      <div className="max-w-4xl mx-auto mt-10 animate-fade-in">
        <div className="glass-panel p-8 text-center text-rose-500">
          <h2 className="text-xl font-bold mb-2">Error Loading Assignment</h2>
          <p>{error || 'Assignment not found.'}</p>
          <button onClick={() => navigate('/assignments')} className="mt-4 px-4 py-2 bg-rose-500/10 rounded-lg font-semibold hover:bg-rose-500/20 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Add a buffer to the deadline to avoid timezone issues showing "closed" prematurely
  const deadline = new Date(assignment.dueDate);
  deadline.setHours(23, 59, 59, 999);
  const isPastDue = deadline < new Date();
  const canSubmit = user.role === 'student' && assignment.status === 'active' && !isPastDue;

  return (
    <div className="h-[calc(100vh-130px)] min-h-[600px] flex flex-col md:flex-row gap-4 animate-fade-in">
      {/* LEFT PANE: Question & Results */}
      <div className="flex-1 flex flex-col glass-panel h-full overflow-hidden">
        {/* Left Pane Header / Tabs */}
        <div className="flex overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] backdrop-blur-md hide-scrollbar">
          {[
            { id: 'description', label: 'Description', icon: HiOutlineDocumentText },
            { id: 'history', label: 'Submissions', icon: HiOutlineClock },
            { id: 'results', label: 'Test Results', icon: HiOutlineTerminal },
            ...(isAdminOrFaculty ? [
              { id: 'rubric', label: 'Rubric', icon: HiOutlineDocumentText },
              { id: 'interviews', label: 'Viva Slots', icon: HiOutlineClock },
              { id: 'unit-tests', label: 'Unit Tests', icon: HiOutlineTerminal }
            ] : [
              { id: 'interviews', label: 'Viva Slots', icon: HiOutlineClock }
            ])
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setLeftTab(tab.id)}
              className={`relative flex-1 py-4 px-6 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                leftTab === tab.id
                  ? 'text-indigo-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-5 h-5 z-10" /> 
              <span className="z-10">{tab.label}</span>
              {leftTab === tab.id && (
                <motion.div
                  layoutId="assignmentActiveTab"
                  className="absolute inset-0 bg-indigo-500/10 border-b-2 border-indigo-500 z-0"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Left Pane Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[var(--color-bg-primary)]">
          {leftTab === 'description' ? (
            <div className="space-y-6">
              {/* Assignment Header Info */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <button onClick={() => navigate('/assignments')} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                    <HiOutlineArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-500 uppercase tracking-wider border border-indigo-500/20">
                    {assignment.course}
                  </span>
                  {user?.role === 'student' && assignment.userSubmission ? (
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                      <HiOutlineCheckCircle className="w-4 h-4 inline-block mr-1 -mt-0.5" />Completed
                    </span>
                  ) : isPastDue ? (
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">Closed</span>
                  ) : assignment.status === 'active' ? (
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Active</span>
                  ) : (
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">Draft</span>
                  )}
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{assignment.title}</h1>
                  {isAdminOrFaculty && (
                    <button onClick={handleDeleteAssignment} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors" title="Delete Assignment">
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5"><HiOutlineClock className="w-4 h-4" /> Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy h:mm a')}</span>
                </div>
              </div>
              
              <hr className="border-slate-200 dark:border-slate-700/50" />

              {/* Description */}
              <div className="prose prose-slate dark:prose-invert prose-sm max-w-none whitespace-pre-wrap">
                {assignment.description || 'No description provided.'}
              </div>

              {/* Constraints */}
              <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4 border border-[var(--color-border)]">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3 uppercase tracking-wider">Constraints</h3>
                <div className="text-xs text-[var(--color-text-secondary)] font-mono whitespace-pre-wrap">
                  {assignment.constraints || 'No specific constraints.'}
                </div>
              </div>

              {/* Sample Test Cases */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">Sample Test Cases</h3>
                {assignment.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                  <div key={tc._id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-hidden shadow-xs">
                    <div className="px-4 py-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] font-bold text-xs text-[var(--color-text-secondary)]">
                      Example {idx + 1}
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Input</div>
                        <pre className="p-3 bg-[var(--color-bg-hover)] rounded-lg text-xs font-mono text-[var(--color-text-primary)] overflow-x-auto whitespace-pre-wrap border border-[var(--color-border)] shadow-inner">{tc.input || '(empty)'}</pre>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Output</div>
                        <pre className="p-3 bg-[var(--color-bg-hover)] rounded-lg text-xs font-mono text-[var(--color-text-primary)] overflow-x-auto whitespace-pre-wrap border border-[var(--color-border)] shadow-inner">{tc.expectedOutput}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : leftTab === 'results' ? (
            <div className="space-y-6 h-full">
              {submitError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm">
                  {submitError}
                </div>
              )}

              {submitting ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                  <div className="text-slate-500 font-semibold animate-pulse">Running test cases...</div>
                </div>
              ) : executionResults ? (
                <div className="space-y-6">
                  <div className={`p-6 rounded-2xl border text-center ${
                    executionSummary.marks === executionSummary.maxMarks 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-amber-500/10 border-amber-500/30'
                  }`}>
                    <h2 className={`text-2xl font-bold mb-2 ${
                      executionSummary.marks === executionSummary.maxMarks ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {executionSummary.marks === executionSummary.maxMarks ? 'Accepted!' : 'Not Quite There'}
                    </h2>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      Passed {executionSummary.testCasesPassed} / {executionSummary.totalTestCases} Test Cases
                    </p>
                    <p className="text-sm mt-1 opacity-80">Score: {executionSummary.marks} / {executionSummary.maxMarks}</p>
                  </div>

                  <div className="space-y-4">
                    {executionResults.map((result, idx) => {
                      const isHidden = result.testCase?.isHidden;
                      const hideDetails = isHidden && user.role === 'student';
                      
                      return (
                        <div key={idx} className={`rounded-xl border ${result.passed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'} overflow-hidden`}>
                          <div className={`px-4 py-3 border-b flex justify-between items-center ${result.passed ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
                            <div className="font-bold text-sm flex items-center gap-2">
                              {result.passed ? <HiOutlineCheckCircle className="text-emerald-500 w-5 h-5" /> : <HiOutlineXCircle className="text-rose-500 w-5 h-5" />}
                              <span className={result.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                                Test Case {idx + 1} {isHidden ? '(Hidden)' : ''}
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
                                  <pre className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                                    {result.testCase?.expectedOutput || '(none)'}
                                  </pre>
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Actual Output</div>
                                  <pre className={`p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap ${result.passed ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'}`}>
                                    {result.actualOutput || '(none)'}
                                  </pre>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4 text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
                                <HiOutlineLockClosed className="w-4 h-4" /> Hidden Test Case Details
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <HiOutlineTerminal className="w-16 h-16 mb-4 opacity-50" />
                  <p className="font-semibold text-center max-w-sm">Submit your code to see the test results here.</p>
                </div>
              )}
            </div>
          ) : leftTab === 'history' ? (
            <div className="h-full flex flex-col">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Submission History</h2>
              
              {loadingHistory ? (
                <div className="flex-1 flex justify-center items-center">
                  <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
              ) : history.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <HiOutlineClock className="w-12 h-12 mb-2 opacity-50" />
                  <p className="font-semibold">No submissions yet.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                  {history.map((run, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold ${
                            run.status === 'Accepted' ? 'text-emerald-500' :
                            run.status === 'Wrong Answer' ? 'text-amber-500' : 'text-rose-500'
                          }`}>
                            {run.status}
                          </span>
                          <span className="text-xs text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                            {run.type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-semibold">
                          {format(new Date(run.createdAt), 'MMM dd, yyyy h:mm a')}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Passed</div>
                          <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{run.testCasesPassed} / {run.totalTestCases}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Lang</div>
                          <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{run.language}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : leftTab === 'rubric' && isAdminOrFaculty ? (
            <div className="h-full flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Grading Rubric</h2>
                  <p className="text-sm text-slate-500">Configure criteria for manual grading and peer reviews.</p>
                </div>
                <button
                  onClick={handleSaveRubric}
                  disabled={savingRubric}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold text-sm transition-colors"
                >
                  {savingRubric ? 'Saving...' : 'Save Rubric'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {rubricItems.map((item, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 relative">
                    <button
                      onClick={() => setRubricItems(rubricItems.filter((_, i) => i !== idx))}
                      className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Criteria Name</label>
                      <input
                        type="text"
                        value={item.criteria}
                        onChange={(e) => {
                          const newItems = [...rubricItems];
                          newItems[idx].criteria = e.target.value;
                          setRubricItems(newItems);
                        }}
                        placeholder="e.g. Code Quality"
                        className="input-field w-full px-3 py-2 rounded-lg text-sm outline-none"
                      />
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description (Optional)</label>
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => {
                            const newItems = [...rubricItems];
                            newItems[idx].description = e.target.value;
                            setRubricItems(newItems);
                          }}
                          placeholder="What is being evaluated?"
                          className="input-field w-full px-3 py-2 rounded-lg text-sm outline-none"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Max Points</label>
                        <input
                          type="number"
                          value={item.maxPoints}
                          onChange={(e) => {
                            const newItems = [...rubricItems];
                            newItems[idx].maxPoints = parseInt(e.target.value) || 0;
                            setRubricItems(newItems);
                          }}
                          min="0"
                          className="input-field w-full px-3 py-2 rounded-lg text-sm outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => setRubricItems([...rubricItems, { criteria: '', maxPoints: 10 }])}
                  className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors font-bold text-sm"
                >
                  + Add Criteria
                </button>
              </div>
            </div>
          ) : leftTab === 'interviews' ? (
            <div className="h-full flex flex-col space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Viva / Interview Slots</h2>
                  <p className="text-sm text-slate-500">
                    {isAdminOrFaculty ? 'Manage your availability slots for student vivas.' : 'Book an available slot for your viva.'}
                  </p>
                </div>
              </div>

              {isAdminOrFaculty && (
                <div className="glass-panel p-4 mb-4">
                  <h3 className="text-sm font-bold mb-3 text-slate-800 dark:text-slate-200">Create New Slot</h3>
                  <form onSubmit={handleCreateSlot} className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                      <input type="date" required value={newSlot.date} onChange={e => setNewSlot({...newSlot, date: e.target.value})} className="input-field px-3 py-2 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time</label>
                      <input type="time" required value={newSlot.time} onChange={e => setNewSlot({...newSlot, time: e.target.value})} className="input-field px-3 py-2 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration (min)</label>
                      <input type="number" value={newSlot.duration} onChange={e => setNewSlot({...newSlot, duration: e.target.value})} className="input-field px-3 py-2 rounded-lg text-sm w-24" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Meeting Link (Optional)</label>
                      <input type="url" placeholder="https://meet.google.com/..." value={newSlot.meetingLink} onChange={e => setNewSlot({...newSlot, meetingLink: e.target.value})} className="input-field w-full px-3 py-2 rounded-lg text-sm" />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold text-sm transition-colors h-[38px]">
                      Add Slot
                    </button>
                  </form>
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-3">
                {loadingInterviews ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                  </div>
                ) : interviews.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 glass-panel">
                    No slots available right now.
                  </div>
                ) : (
                  interviews.map(slot => (
                    <div key={slot._id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {format(new Date(slot.startTime), 'MMM dd, yyyy - h:mm a')}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            slot.status === 'open' ? 'bg-emerald-500/10 text-emerald-500' :
                            slot.status === 'booked' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-slate-500/10 text-slate-500'
                          }`}>
                            {slot.status.toUpperCase()}
                          </span>
                        </div>
                        {isAdminOrFaculty && slot.student && (
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Booked by: <span className="font-bold">{slot.student.name}</span>
                          </div>
                        )}
                        {!isAdminOrFaculty && slot.faculty && (
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Faculty: <span className="font-bold">{slot.faculty.name}</span>
                          </div>
                        )}
                        {slot.meetingLink && (
                          <a href={slot.meetingLink} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline mt-1 inline-block">
                            Join Meeting Link
                          </a>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {user.role === 'student' && slot.status === 'open' && (
                          <button
                            onClick={() => handleBookSlot(slot._id)}
                            disabled={bookingSlot === slot._id}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-bold transition-colors"
                          >
                            {bookingSlot === slot._id ? 'Booking...' : 'Book Slot'}
                          </button>
                        )}
                        {((user.role === 'student' && slot.student?._id === user.id) || (isAdminOrFaculty && slot.status !== 'cancelled')) && (
                          <button
                            onClick={() => handleCancelSlot(slot._id)}
                            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg text-sm font-bold transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : leftTab === 'unit-tests' && isAdminOrFaculty ? (
            <div className="h-full flex flex-col space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unit Test Configuration</h2>
                  <p className="text-sm text-slate-500">
                    Define the testing framework and the test suite code to run against submissions.
                  </p>
                </div>
                <button
                  onClick={handleSaveUnitTests}
                  disabled={savingTests}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold text-sm transition-colors"
                >
                  {savingTests ? 'Saving...' : 'Save Tests'}
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Testing Framework</label>
                  <select
                    value={testFramework}
                    onChange={(e) => setTestFramework(e.target.value)}
                    className="input-field w-full md:w-1/2 px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="none">None (Standard I/O)</option>
                    <option value="mocha">Mocha/Chai (JavaScript)</option>
                    <option value="pytest">PyTest (Python)</option>
                    <option value="junit">JUnit (Java)</option>
                    <option value="gtest">Google Test (C++)</option>
                  </select>
                </div>

                {testFramework !== 'none' && (
                  <div className="flex-1 flex flex-col mt-4 min-h-[400px]">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Test Suite Code</label>
                    <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <Editor
                        height="100%"
                        language={
                          testFramework === 'pytest' ? 'python' :
                          testFramework === 'mocha' ? 'javascript' :
                          testFramework === 'junit' ? 'java' :
                          testFramework === 'gtest' ? 'cpp' : 'javascript'
                        }
                        theme="vs-dark"
                        value={unitTestCode}
                        onChange={(value) => setUnitTestCode(value)}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineHeight: 1.5,
                          padding: { top: 16 },
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* RIGHT PANE: Editor or Project Submission */}
      <div className="flex-1 flex flex-col glass-panel h-full overflow-hidden">
        {assignment.type === 'project' ? (
          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50">
            <div className="w-full max-w-md space-y-6 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiOutlineCode className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Project Submission</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Submit your repository link and project report.</p>
              </div>
              
              <form onSubmit={handleSubmitProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">GitHub Repository URL <span className="text-rose-500">*</span></label>
                  <input
                    type="url"
                    required
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="input-field w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Project Report (PDF/Docx)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setProjectReport(e.target.files[0])}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
                
                {user.role !== 'student' ? (
                  <div className="text-center mt-4 text-xs font-bold text-slate-500 px-3 py-2 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
                    Admin Preview Mode
                  </div>
                ) : canSubmit ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Submitting...' : 'Submit Project'}
                  </button>
                ) : (
                  <div className="text-center mt-4 text-xs font-bold text-rose-500 px-3 py-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                    {isPastDue ? 'Deadline Passed' : 'Not Active'}
                  </div>
                )}
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <HiOutlineCode className="w-5 h-5 text-indigo-500" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="input-field px-3 py-1.5 rounded-lg text-sm font-bold outline-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {assignment.allowedLanguages?.map(lang => (
                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                {user.role !== 'student' ? (
                  <span className="text-xs font-bold text-slate-500 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                    Admin Preview Mode
                  </span>
                ) : canSubmit ? (
                  <>
                    <button
                      onClick={handleRunCode}
                      disabled={submitting}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                    >
                      <HiOutlinePlay className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      Run
                    </button>
                    <button
                      onClick={handleSubmitCode}
                      disabled={submitting}
                      className="btn-primary flex items-center gap-2"
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <HiOutlinePlay className="w-4 h-4" />
                      )}
                      Submit
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-bold text-rose-500 px-3 py-1 bg-rose-500/10 rounded-full border border-rose-500/20">
                    {isPastDue ? 'Deadline Passed' : 'Not Active'}
                  </span>
                )}
              </div>
            </div>

            {/* Editor Instance */}
            <div className="flex-1 bg-[#1e1e1e] relative">
              <Editor
                height="100%"
                language={language === 'c' || language === 'cpp' ? 'cpp' : language === 'ruby' ? 'ruby' : language === 'rust' ? 'rust' : language === 'go' ? 'go' : language}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  formatOnPaste: true,
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssignmentDetailsPage;
