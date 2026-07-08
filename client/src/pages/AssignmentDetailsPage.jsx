import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
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
  HiOutlinePlay
} from 'react-icons/hi';
import { format } from 'date-fns';

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
  
  // Project submission state
  const [githubUrl, setGithubUrl] = useState('');
  const [projectReport, setProjectReport] = useState(null);

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
      
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to execute code.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="max-w-4xl mx-auto mt-10">
        <div className="glass rounded-2xl p-8 text-center text-rose-500">
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
    <div className="h-[calc(100vh-130px)] min-h-[600px] flex flex-col md:flex-row gap-4">
      {/* LEFT PANE: Question & Results */}
      <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden shadow-lg border border-slate-200/50 dark:border-slate-700/50 h-full">
        {/* Left Pane Header / Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={() => setLeftTab('description')}
            className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              leftTab === 'description'
                ? 'text-indigo-500 border-b-2 border-indigo-500 bg-white dark:bg-slate-800'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <HiOutlineDocumentText className="w-5 h-5" /> Description
          </button>
          <button
            onClick={() => setLeftTab('results')}
            className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              leftTab === 'results'
                ? 'text-indigo-500 border-b-2 border-indigo-500 bg-white dark:bg-slate-800'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <HiOutlineTerminal className="w-5 h-5" /> Test Results
          </button>
        </div>

        {/* Left Pane Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white/50 dark:bg-slate-900/30">
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
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{assignment.title}</h1>
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
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Constraints</h3>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-pre-wrap">
                  {assignment.constraints || 'No specific constraints.'}
                </div>
              </div>

              {/* Sample Test Cases */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Sample Test Cases</h3>
                {assignment.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                  <div key={tc._id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300">
                      Example {idx + 1}
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Input</div>
                        <pre className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">{tc.input || '(empty)'}</pre>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Output</div>
                        <pre className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">{tc.expectedOutput}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* RIGHT PANE: Editor or Project Submission */}
      <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden shadow-lg border border-slate-200/50 dark:border-slate-700/50 h-full">
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
                  <div className="text-center mt-4 text-xs font-bold text-slate-500 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    Admin Preview Mode
                  </div>
                ) : canSubmit ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    style={{ background: 'var(--gradient-brand)' }}
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
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                      style={{ background: 'var(--gradient-brand)' }}
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
