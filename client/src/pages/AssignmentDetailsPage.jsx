import { useState, useEffect, useCallback } from 'react';
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
  HiOutlineTrash,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineTag,
  HiOutlineLightBulb,
  HiOutlineLink,
  HiOutlineUpload,
  HiOutlineExternalLink,
  HiOutlineFolder,
  HiOutlinePaperClip
} from 'react-icons/hi';
import { FaGithub } from 'react-icons/fa';
import { HiArrowsPointingOut, HiArrowsPointingIn } from 'react-icons/hi2';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Helper to format inline code backticks in problem descriptions like LeetCode
const renderFormattedText = (text) => {
  if (!text) return null;
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={i} className="px-1.5 py-0.5 mx-0.5 text-xs font-mono rounded bg-[#2a2a2a] text-[#eff1f6]/90 border border-[#3e3e3e]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

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

  // Bottom panel state (LeetCode-style Testcase / Test Result)
  const [bottomTab, setBottomTab] = useState('testcase'); // 'testcase' | 'testresult'
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [customTestCases, setCustomTestCases] = useState([]);
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(false);
  const [bottomPanelFullscreen, setBottomPanelFullscreen] = useState(false);

  // Initialize custom test cases from assignment's public test cases
  useEffect(() => {
    if (assignment?.testCases) {
      const publicCases = assignment.testCases.filter(tc => !tc.isHidden);
      if (publicCases.length > 0 && customTestCases.length === 0) {
        setCustomTestCases(publicCases.map(tc => ({
          id: tc._id || Math.random().toString(36).substr(2, 9),
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || ''
        })));
      }
    }
  }, [assignment]);

  const addCustomTestCase = useCallback(() => {
    setCustomTestCases(prev => [
      ...prev,
      { id: Math.random().toString(36).substr(2, 9), input: '', expectedOutput: '' }
    ]);
    setActiveCaseIdx(customTestCases.length);
  }, [customTestCases.length]);

  const removeCustomTestCase = useCallback((idx) => {
    if (customTestCases.length <= 1) return;
    setCustomTestCases(prev => prev.filter((_, i) => i !== idx));
    setActiveCaseIdx(prev => Math.min(prev, customTestCases.length - 2));
  }, [customTestCases.length]);

  const updateCustomTestCase = useCallback((idx, field, value) => {
    setCustomTestCases(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  }, []);

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
      setBottomTab('testresult');
      if (bottomPanelCollapsed) setBottomPanelCollapsed(false);
      
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

    // Basic GitHub URL validation
    const trimmedUrl = githubUrl.trim();
    if (!trimmedUrl) {
      setSubmitError('Please provide a valid GitHub repository URL.');
      return;
    }

    if (!trimmedUrl.includes('github.com')) {
      setSubmitError('Please enter a valid GitHub link (e.g., https://github.com/username/project).');
      return;
    }

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('assignmentId', id);
      formData.append('githubUrl', trimmedUrl);
      if (projectReport) {
        formData.append('file', projectReport);
      }

      const subRes = await api.post('/submissions', formData);
      
      setAssignment(prev => ({
        ...prev,
        userSubmission: subRes.data.submission
      }));
      toast.success('Project submitted successfully!');
      fetchHistory();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to submit project.';
      setSubmitError(errMsg);
      toast.error(errMsg);
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
      setBottomTab('testresult');
      if (bottomPanelCollapsed) setBottomPanelCollapsed(false);
      
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
    <div className="h-[calc(100vh-130px)] min-h-[600px] flex flex-col md:flex-row gap-3 animate-fade-in p-2">
      {/* LEFT PANE: Question & Details (LeetCode Professional Theme) */}
      <div className="flex-1 flex flex-col rounded-xl border border-[#333] bg-[#1a1a1a] h-full overflow-hidden shadow-lg">
        {/* Left Pane Header / Tabs */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2d2d2d] bg-[#222222] select-none flex-shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {[
              { id: 'description', label: 'Description', icon: HiOutlineDocumentText },
              { id: 'history', label: 'Submissions', icon: HiOutlineClock },
              ...(isAdminOrFaculty ? [
                { id: 'rubric', label: 'Rubric', icon: HiOutlineDocumentText },
                { id: 'interviews', label: 'Viva Slots', icon: HiOutlineClock },
                { id: 'unit-tests', label: 'Unit Tests', icon: HiOutlineTerminal }
              ] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setLeftTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  leftTab === tab.id
                    ? 'bg-[#2f2f2f] text-white font-semibold shadow-xs'
                    : 'text-[#8c8c8c] hover:text-[#e0e0e0] hover:bg-[#282828]'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${leftTab === tab.id ? 'text-[#38bdf8]' : 'text-[#8c8c8c]'}`} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <button 
            onClick={() => navigate('/assignments')} 
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#8c8c8c] hover:text-white rounded hover:bg-[#2c2c2c] transition-colors"
            title="Back to Assignments"
          >
            <HiOutlineArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        {/* Left Pane Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#1a1a1a] text-[#eff1f6]">
          {leftTab === 'description' ? (
            <div className="space-y-6 max-w-3xl">
              {/* Problem Title & Header Bar */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h1 className="text-2xl font-bold text-white tracking-tight leading-snug">
                    {assignment.title}
                  </h1>
                  {isAdminOrFaculty && (
                    <button 
                      onClick={handleDeleteAssignment} 
                      className="p-1.5 text-[#888] hover:text-rose-400 hover:bg-[#2c2c2c] rounded transition-colors flex-shrink-0" 
                      title="Delete Assignment"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Badges / Pill Tags (LeetCode style: Difficulty pill, Topics, Companies, Hints) */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Status / Difficulty badge */}
                  {user?.role === 'student' && assignment.userSubmission ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Solved
                    </span>
                  ) : isPastDue ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      Closed
                    </span>
                  ) : assignment.status === 'active' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Draft
                    </span>
                  )}

                  {/* Course Pill */}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2a2a2a] text-[#b3b3b3] border border-[#3e3e3e] flex items-center gap-1.5">
                    <HiOutlineTag className="w-3.5 h-3.5 text-[#888]" />
                    {assignment.course}
                  </span>

                  {/* Due Date Pill */}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2a2a2a] text-[#a0a0a0] border border-[#3e3e3e] flex items-center gap-1.5">
                    <HiOutlineClock className="w-3.5 h-3.5 text-[#888]" />
                    Due {format(new Date(assignment.dueDate), 'MMM dd, yyyy h:mm a')}
                  </span>
                </div>
              </div>

              {/* Problem Description with clean typography and inline code styling */}
              <div className="text-[14px] leading-relaxed text-[#d1d5db] space-y-3 font-normal whitespace-pre-wrap">
                {renderFormattedText(assignment.description) || (
                  <span className="text-[#888] italic">No description provided.</span>
                )}
              </div>

              {/* Examples Section */}
              {assignment.testCases && assignment.testCases.filter(tc => !tc.isHidden).length > 0 && (
                <div className="space-y-5 pt-2">
                  {assignment.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                    <div key={tc._id || idx} className="space-y-2">
                      <div className="text-sm font-semibold text-white">
                        Example {idx + 1}:
                      </div>
                      <div className="p-4 rounded-lg bg-[#222222] border-l-2 border-[#555] font-mono text-[13px] text-[#e5e7eb] space-y-2 select-text">
                        <div>
                          <span className="font-semibold text-[#f3f4f6]">Input: </span>
                          <span className="text-[#93c5fd]">{tc.input || '(empty)'}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-[#f3f4f6]">Output: </span>
                          <span className="text-[#a7f3d0]">{tc.expectedOutput}</span>
                        </div>
                        {tc.explanation && (
                          <div>
                            <span className="font-semibold text-[#f3f4f6]">Explanation: </span>
                            <span className="text-[#d1d5db] font-sans text-xs">{tc.explanation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints Section */}
              <div className="space-y-3 pt-2">
                <div className="text-sm font-semibold text-white">
                  Constraints:
                </div>
                <div className="p-3.5 rounded-lg bg-[#222222] border border-[#2e2e2e] text-xs text-[#d1d5db] font-mono">
                  {assignment.constraints ? (
                    <ul className="list-disc list-inside space-y-1.5 marker:text-[#888]">
                      {assignment.constraints.split('\n').filter(Boolean).map((line, idx) => (
                        <li key={idx} className="leading-relaxed">
                          <span className="bg-[#2a2a2a] px-2 py-0.5 rounded border border-[#3e3e3e] text-[#f3f4f6]">
                            {line.trim()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-[#888] font-sans">No specific constraints provided.</span>
                  )}
                </div>
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
      <div className="flex-1 flex flex-col rounded-xl border border-[#333] bg-[#1e1e1e] h-full overflow-hidden shadow-lg">
        {assignment.type === 'project' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col items-center justify-center bg-[#1a1a1a]">
            <div className="w-full max-w-xl space-y-6 bg-[#222222] p-7 rounded-2xl border border-[#333] shadow-2xl">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-[#2e2e2e] pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-[#2a2a2a] text-[#38bdf8] border border-[#3e3e3e] rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                    <FaGithub className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Project Submission</h2>
                    <p className="text-xs text-[#8c8c8c] mt-0.5">Submit your GitHub repository and project documentation</p>
                  </div>
                </div>

                {/* Submission Status Badge */}
                {assignment.userSubmission ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 flex-shrink-0">
                    <HiOutlineCheckCircle className="w-4 h-4" /> Submitted
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2e2e2e] text-[#8c8c8c] border border-[#3e3e3e] flex-shrink-0">
                    Pending
                  </span>
                )}
              </div>

              {/* Already Submitted Info Banner if exists */}
              {assignment.userSubmission && (
                <div className="p-4 rounded-xl bg-[#2a2a2a] border border-[#383838] space-y-2.5">
                  <div className="text-xs font-semibold text-[#8c8c8c] uppercase tracking-wider">
                    Current Submission Details
                  </div>
                  {assignment.userSubmission.githubUrl && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#a0a0a0] flex items-center gap-1.5">
                        <FaGithub className="w-3.5 h-3.5" /> Repository:
                      </span>
                      <a 
                        href={assignment.userSubmission.githubUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[#38bdf8] hover:underline flex items-center gap-1 font-mono truncate max-w-[280px]"
                      >
                        {assignment.userSubmission.githubUrl}
                        <HiOutlineExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      </a>
                    </div>
                  )}
                  {assignment.userSubmission.projectReport && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#a0a0a0] flex items-center gap-1.5">
                        <HiOutlinePaperClip className="w-3.5 h-3.5" /> Report:
                      </span>
                      <a 
                        href={assignment.userSubmission.projectReport} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[#38bdf8] hover:underline flex items-center gap-1"
                      >
                        View Report
                        <HiOutlineExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                  {assignment.userSubmission.submittedAt && (
                    <div className="flex items-center justify-between text-[11px] text-[#777] pt-1 border-t border-[#333]">
                      <span>Submitted on</span>
                      <span>{format(new Date(assignment.userSubmission.submittedAt), 'MMM dd, yyyy h:mm a')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Submission Form */}
              <form onSubmit={handleSubmitProject} className="space-y-5">
                {submitError && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                    <HiOutlineXCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* GitHub Repository Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#cfcfcf]">
                    GitHub Repository URL <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#777]">
                      <FaGithub className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      required
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username/repository"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2a2a2a] border border-[#3e3e3e] rounded-xl text-xs sm:text-sm text-white placeholder-[#666] outline-none focus:border-[#555] transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-[#777]">Must be a public or accessible repository link.</p>
                </div>

                {/* Project Documentation Upload */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#cfcfcf]">
                    Project Documentation / Report <span className="text-[#777] font-normal">(Optional PDF/Docx)</span>
                  </label>
                  <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-[#3a3a3a] hover:border-[#555] bg-[#262626] rounded-xl cursor-pointer transition-colors group">
                    <HiOutlineUpload className="w-6 h-6 text-[#777] group-hover:text-[#38bdf8] transition-colors mb-2" />
                    {projectReport ? (
                      <div className="flex items-center gap-2 text-xs font-medium text-white truncate max-w-full px-2">
                        <HiOutlinePaperClip className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{projectReport.name}</span>
                        <span className="text-[10px] text-[#777]">({(projectReport.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs text-[#a0a0a0] font-medium group-hover:text-white transition-colors">
                          Click to browse file or drag and drop
                        </span>
                        <span className="text-[10px] text-[#666] mt-1">Supports PDF, DOC, DOCX up to 25MB</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setProjectReport(e.target.files[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Submit / Action Button */}
                {user.role !== 'student' ? (
                  <div className="text-center py-2.5 text-xs font-medium text-[#888] bg-[#2a2a2a] rounded-xl border border-[#383838]">
                    Faculty / Admin Preview Mode (Submissions disabled)
                  </div>
                ) : canSubmit ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] transition-all shadow-md shadow-emerald-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Submitting Project...</span>
                      </>
                    ) : (
                      <>
                        <HiOutlineCheckCircle className="w-4 h-4" />
                        <span>{assignment.userSubmission ? 'Update Project Submission' : 'Submit Project'}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="text-center py-2.5 text-xs font-semibold text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/20">
                    {isPastDue ? 'Assignment Deadline Passed' : 'Assignment Inactive'}
                  </div>
                )}
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Editor Toolbar (Professional dark header) */}
            <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-[#2d2d2d] bg-[#222222] select-none flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs text-[#8c8c8c] font-medium">
                  <HiOutlineCode className="w-4 h-4 text-[#38bdf8]" />
                  <span className="hidden sm:inline">Language:</span>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold outline-none border border-[#3e3e3e] bg-[#2a2a2a] text-[#eff1f6] hover:border-[#555] transition-colors cursor-pointer"
                >
                  {assignment.allowedLanguages?.map(lang => (
                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                {user.role !== 'student' ? (
                  <span className="text-xs font-medium text-[#888] px-2.5 py-1 bg-[#2a2a2a] rounded border border-[#3e3e3e]">
                    Admin Preview Mode
                  </span>
                ) : canSubmit ? (
                  <>
                    <button
                      onClick={handleRunCode}
                      disabled={submitting}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-[#eff1f6] bg-[#2e2e2e] hover:bg-[#3a3a3a] active:scale-95 transition-all border border-[#444] disabled:opacity-50"
                    >
                      <HiOutlinePlay className="w-3.5 h-3.5 text-emerald-400" />
                      Run
                    </button>
                    <button
                      onClick={handleSubmitCode}
                      disabled={submitting}
                      className="flex items-center gap-1.5 px-3.5 py-1 rounded-md text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all shadow-sm shadow-emerald-900/30 disabled:opacity-50"
                    >
                      {submitting ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                      )}
                      Submit
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-medium text-rose-400 px-2.5 py-1 bg-rose-500/10 rounded border border-rose-500/20">
                    {isPastDue ? 'Deadline Passed' : 'Not Active'}
                  </span>
                )}
              </div>
            </div>

            {/* Editor + Bottom Panel Split */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Editor Instance */}
              <div className={`bg-[#1e1e1e] relative transition-all duration-300 ${bottomPanelFullscreen ? 'h-0 overflow-hidden' : bottomPanelCollapsed ? 'flex-1' : 'flex-[1_1_60%] min-h-[120px]'}`}>
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

              {/* ===== Bottom Panel: Testcase / Test Result (LeetCode-style) ===== */}
              <div className={`flex flex-col border-t border-[#333] bg-[#1e1e1e] transition-all duration-300 ${
                bottomPanelFullscreen ? 'flex-1' : bottomPanelCollapsed ? 'flex-none' : 'flex-[0_0_40%] min-h-[160px]'
              }`}>
                {/* Panel Header / Tab Bar */}
                <div className="flex items-center justify-between px-4 py-0 bg-[#1e1e1e] border-b border-[#333] flex-shrink-0">
                  <div className="flex items-center gap-1">
                    {/* Testcase Tab */}
                    <button
                      onClick={() => { setBottomTab('testcase'); if (bottomPanelCollapsed) setBottomPanelCollapsed(false); }}
                      className={`flex items-center gap-2 px-3 py-2.5 text-sm font-semibold transition-colors relative ${
                        bottomTab === 'testcase'
                          ? 'text-white'
                          : 'text-[#858585] hover:text-[#cccccc]'
                      }`}
                    >
                      {executionResults && executionSummary?.testCasesPassed === executionSummary?.totalTestCases ? (
                        <HiOutlineCheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M7 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                      Testcase
                      {bottomTab === 'testcase' && (
                        <motion.div
                          layoutId="bottomPanelTab"
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full"
                          initial={false}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </button>

                    <span className="text-[#333] select-none">|</span>

                    {/* Test Result Tab */}
                    <button
                      onClick={() => { setBottomTab('testresult'); if (bottomPanelCollapsed) setBottomPanelCollapsed(false); }}
                      className={`flex items-center gap-2 px-3 py-2.5 text-sm font-semibold transition-colors relative ${
                        bottomTab === 'testresult'
                          ? 'text-white'
                          : 'text-[#858585] hover:text-[#cccccc]'
                      }`}
                    >
                      <HiOutlineTerminal className="w-4 h-4" />
                      Test Result
                      {bottomTab === 'testresult' && (
                        <motion.div
                          layoutId="bottomPanelTab"
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full"
                          initial={false}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </button>
                  </div>

                  {/* Panel Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setBottomPanelFullscreen(prev => !prev)}
                      className="p-1.5 text-[#858585] hover:text-white hover:bg-[#333] rounded transition-colors"
                      title={bottomPanelFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                      {bottomPanelFullscreen ? <HiArrowsPointingIn className="w-4 h-4" /> : <HiArrowsPointingOut className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { setBottomPanelCollapsed(prev => !prev); setBottomPanelFullscreen(false); }}
                      className="p-1.5 text-[#858585] hover:text-white hover:bg-[#333] rounded transition-colors"
                      title={bottomPanelCollapsed ? 'Expand' : 'Collapse'}
                    >
                      {bottomPanelCollapsed ? <HiOutlineChevronUp className="w-4 h-4" /> : <HiOutlineChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Panel Content */}
                {!bottomPanelCollapsed && (
                  <div className="flex-1 overflow-y-auto p-4">
                    <AnimatePresence mode="wait">
                      {bottomTab === 'testcase' ? (
                        <motion.div
                          key="testcase"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-4"
                        >
                          {/* Case Tabs */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {customTestCases.map((tc, idx) => (
                              <button
                                key={tc.id}
                                onClick={() => setActiveCaseIdx(idx)}
                                className={`group relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                  activeCaseIdx === idx
                                    ? 'bg-[#333] text-white shadow-sm'
                                    : 'text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2a2a]'
                                }`}
                              >
                                Case {idx + 1}
                                {customTestCases.length > 1 && activeCaseIdx === idx && (
                                  <span
                                    onClick={(e) => { e.stopPropagation(); removeCustomTestCase(idx); }}
                                    className="ml-2 text-[#666] hover:text-rose-400 cursor-pointer transition-colors"
                                  >
                                    ×
                                  </span>
                                )}
                              </button>
                            ))}
                            <button
                              onClick={addCustomTestCase}
                              className="px-2.5 py-1.5 text-[#858585] hover:text-white hover:bg-[#2a2a2a] rounded-lg text-sm font-bold transition-colors"
                              title="Add test case"
                            >
                              +
                            </button>
                          </div>

                          {/* Active Case Inputs (LeetCode exact style) */}
                          {customTestCases[activeCaseIdx] && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-semibold text-[#8c8c8c] mb-1.5 font-mono">
                                  input =
                                </label>
                                <textarea
                                  value={customTestCases[activeCaseIdx].input}
                                  onChange={(e) => updateCustomTestCase(activeCaseIdx, 'input', e.target.value)}
                                  placeholder="[1,2,3,4]"
                                  rows={2}
                                  className="w-full px-4 py-2.5 bg-[#2a2a2a] border border-[#3e3e3e] rounded-lg text-sm text-[#eff1f6] font-mono placeholder-[#555] focus:border-[#555] focus:outline-none resize-none transition-colors"
                                />
                              </div>
                              {customTestCases[activeCaseIdx].expectedOutput && (
                                <div>
                                  <label className="block text-xs font-semibold text-[#8c8c8c] mb-1.5 font-mono">
                                    expected output =
                                  </label>
                                  <div className="w-full px-4 py-2 bg-[#262626] border border-[#333] rounded-lg text-sm text-[#a7f3d0] font-mono select-text">
                                    {customTestCases[activeCaseIdx].expectedOutput}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="testresult"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-4"
                        >
                          {submitting ? (
                            <div className="flex items-center gap-3 py-6">
                              <div className="w-5 h-5 border-2 border-[#555] border-t-indigo-400 rounded-full animate-spin"></div>
                              <span className="text-sm text-[#858585] font-medium animate-pulse">Running test cases...</span>
                            </div>
                          ) : executionResults ? (
                            <div className="space-y-4">
                              {/* Summary Banner */}
                              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                                executionSummary?.testCasesPassed === executionSummary?.totalTestCases
                                  ? 'bg-emerald-500/10 border-emerald-500/20'
                                  : 'bg-rose-500/10 border-rose-500/20'
                              }`}>
                                {executionSummary?.testCasesPassed === executionSummary?.totalTestCases ? (
                                  <HiOutlineCheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                ) : (
                                  <HiOutlineXCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                                )}
                                <div>
                                  <span className={`text-sm font-bold ${
                                    executionSummary?.testCasesPassed === executionSummary?.totalTestCases
                                      ? 'text-emerald-400'
                                      : 'text-rose-400'
                                  }`}>
                                    {executionSummary?.testCasesPassed === executionSummary?.totalTestCases ? 'Accepted' : 'Wrong Answer'}
                                  </span>
                                  <span className="text-xs text-[#858585] ml-3">
                                    {executionSummary?.testCasesPassed}/{executionSummary?.totalTestCases} passed · Score: {executionSummary?.marks}/{executionSummary?.maxMarks}
                                  </span>
                                </div>
                              </div>

                              {/* Per-case Results */}
                              <div className="space-y-3">
                                {executionResults.map((result, idx) => {
                                  const isHidden = result.testCase?.isHidden;
                                  const hideDetails = isHidden && user.role === 'student';
                                  
                                  return (
                                    <div key={idx} className={`rounded-lg border overflow-hidden ${
                                      result.passed ? 'border-emerald-500/20' : 'border-rose-500/20'
                                    }`}>
                                      <div className={`flex items-center justify-between px-4 py-2 ${
                                        result.passed ? 'bg-emerald-500/5' : 'bg-rose-500/5'
                                      }`}>
                                        <div className="flex items-center gap-2">
                                          {result.passed
                                            ? <HiOutlineCheckCircle className="w-4 h-4 text-emerald-400" />
                                            : <HiOutlineXCircle className="w-4 h-4 text-rose-400" />
                                          }
                                          <span className={`text-xs font-bold ${
                                            result.passed ? 'text-emerald-400' : 'text-rose-400'
                                          }`}>
                                            Case {idx + 1} {isHidden ? '(Hidden)' : ''}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-[#666] font-mono">
                                          <span>{result.executionTime}ms</span>
                                          <span>{result.memoryUsed}MB</span>
                                        </div>
                                      </div>
                                      {!hideDetails && (
                                        <div className="px-4 py-3 space-y-2">
                                          {result.error && (
                                            <pre className="text-xs text-rose-400 font-mono bg-rose-500/5 px-3 py-2 rounded overflow-x-auto whitespace-pre-wrap">{result.error}</pre>
                                          )}
                                          <div className="grid grid-cols-2 gap-3">
                                            <div>
                                              <div className="text-[10px] text-[#666] font-bold uppercase mb-1">Expected</div>
                                              <pre className="text-xs text-[#d4d4d4] font-mono bg-[#2a2a2a] px-3 py-2 rounded overflow-x-auto whitespace-pre-wrap">{result.testCase?.expectedOutput || '(none)'}</pre>
                                            </div>
                                            <div>
                                              <div className="text-[10px] text-[#666] font-bold uppercase mb-1">Output</div>
                                              <pre className={`text-xs font-mono px-3 py-2 rounded overflow-x-auto whitespace-pre-wrap ${
                                                result.passed ? 'text-emerald-400 bg-emerald-500/5' : 'text-rose-400 bg-rose-500/5'
                                              }`}>{result.actualOutput || '(none)'}</pre>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-[#555]">
                              <HiOutlineTerminal className="w-10 h-10 mb-3 opacity-40" />
                              <p className="text-sm font-medium">Run or submit your code to see results</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssignmentDetailsPage;
