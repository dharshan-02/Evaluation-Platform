import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { 
  HiOutlinePlay, 
  HiOutlineRefresh, 
  HiOutlineDocumentText,
  HiOutlineTerminal,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowLeft,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlineCode
} from 'react-icons/hi';
import toast from 'react-hot-toast';

import ReactMarkdown from 'react-markdown';

const DEFAULT_CODE = {
  python: 'print("Hello, World!")\n',
  javascript: 'console.log("Hello, World!");\n',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n',
  ruby: 'puts "Hello, World!"\n',
  rust: 'fn main() {\n    println!("Hello, World!");\n}\n'
};

const PlaygroundPage = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState('sandbox'); // 'sandbox' | 'challenges'
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_CODE['python']);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [aiReview, setAiReview] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Challenges State
  const [challenges, setChallenges] = useState([]);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [challengeResults, setChallengeResults] = useState(null);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [selectedPathLanguage, setSelectedPathLanguage] = useState('python');

  useEffect(() => {
    if (mode === 'challenges' && challenges.length === 0) {
      fetchChallenges();
    }
  }, [mode]);

  const fetchChallenges = async () => {
    try {
      setLoadingChallenges(true);
      const res = await api.get('/gamification/challenges');
      setChallenges(res.data.challenges);
      setCompletedChallenges(res.data.completedChallenges || []);
    } catch (err) {
      toast.error('Failed to load challenges');
    } finally {
      setLoadingChallenges(false);
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (code === DEFAULT_CODE[language] || code.trim() === '') {
      setCode(DEFAULT_CODE[newLang]);
    }
  };

  const handleAIReview = async () => {
    if (!code.trim()) return;
    try {
      setIsReviewing(true);
      setShowReviewModal(true);
      setAiReview('Analyzing your code...');
      const res = await api.post('/ai/review', { code, language });
      if (res.data.success) {
        setAiReview(res.data.review);
      }
    } catch (err) {
      setAiReview('Failed to generate AI Review. Please try again.');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleRunSandbox = async () => {
    if (!code.trim()) return;

    try {
      setIsRunning(true);
      setError('');
      setOutput('Running...');
      setMetrics(null);

      const res = await api.post('/execute/test/playground', {
        code,
        language,
        input
      });

      const result = res.data.result;
      
      if (result.error) {
        setError(result.error);
        setOutput('');
      } else {
        setOutput(result.output || '(No output)');
        setError('');
      }
      
      setMetrics({
        time: result.executionTime,
        memory: result.memoryUsed,
        exitCode: result.exitCode
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to execute code.');
      setOutput('');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitChallenge = async () => {
    if (!code.trim() || !activeChallenge) return;

    try {
      setIsRunning(true);
      setChallengeResults(null);

      const res = await api.post(`/execute/challenge/${activeChallenge._id}`, {
        code,
        language: activeChallenge.language
      });

      setChallengeResults(res.data);
      
      if (res.data.allPassed) {
        if (!completedChallenges.includes(activeChallenge._id)) {
           setCompletedChallenges([...completedChallenges, activeChallenge._id]);
        }
        toast.success(`Challenge Completed! +${res.data.pointsAwarded} points`, {
          icon: '🎉',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      }
    } catch (err) {
      toast.error('Failed to submit challenge');
    } finally {
      setIsRunning(false);
    }
  };

  const selectChallenge = (challenge) => {
    setActiveChallenge(challenge);
    setCode(challenge.defaultCode);
    setLanguage(challenge.language);
    setChallengeResults(null);
  };

  const backToChallenges = () => {
    setActiveChallenge(null);
    setCode(DEFAULT_CODE[language]);
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Code Playground</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Write, test, and debug code or solve challenges to earn points.
          </p>
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl">
          <button
            onClick={() => setMode('sandbox')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === 'sandbox' 
                ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Sandbox
          </button>
          <button
            onClick={() => setMode('challenges')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              mode === 'challenges' 
                ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <HiOutlineSparkles className="w-4 h-4" />
            Challenges
          </button>
        </div>
      </div>

      {mode === 'challenges' && !activeChallenge ? (
        <div className="flex-1 glass rounded-2xl p-6 overflow-y-auto flex flex-col">
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Choose Your Path</h2>
          
          <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
            {['python', 'javascript', 'c'].map(lang => (
              <button 
                key={lang}
                onClick={() => setSelectedPathLanguage(lang)}
                className={`px-4 py-2 rounded-t-lg font-bold text-sm uppercase transition-colors ${selectedPathLanguage === lang ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                {lang}
              </button>
            ))}
          </div>

          {loadingChallenges ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : challenges.filter(c => c.language === selectedPathLanguage).length === 0 ? (
            <p className="text-slate-500 text-center py-10">No challenges available for this language yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
              {challenges.filter(c => c.language === selectedPathLanguage).map((c, index, arr) => {
                const isLevel1 = c.levelNumber === 1;
                let isUnlocked = isLevel1;
                
                if (!isLevel1) {
                  const previousChallenge = arr.find(prev => prev.levelNumber === c.levelNumber - 1);
                  if (previousChallenge && completedChallenges.includes(previousChallenge._id)) {
                    isUnlocked = true;
                  }
                }
                
                const isCompleted = completedChallenges.includes(c._id);

                return (
                  <div 
                    key={c._id} 
                    onClick={() => isUnlocked ? selectChallenge(c) : null} 
                    className={`relative p-5 rounded-xl border transition-all ${isUnlocked ? 'cursor-pointer hover:shadow-lg hover:border-indigo-500 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 group' : 'opacity-70 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 cursor-not-allowed'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-bold ${isUnlocked ? 'text-slate-900 dark:text-white group-hover:text-indigo-500' : 'text-slate-500'} transition-colors flex items-center gap-2`}>
                        {!isUnlocked ? <HiOutlineLockClosed className="text-slate-400 w-4 h-4" /> : isCompleted ? <HiOutlineCheckCircle className="text-emerald-500 w-4 h-4" /> : <HiOutlineLockOpen className="text-indigo-400 w-4 h-4" />}
                        {c.title}
                      </h3>
                      {isUnlocked && <span className="text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-md">{c.points} pts</span>}
                    </div>
                    <div className="flex gap-2 text-xs font-semibold mt-4">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300">Level {c.levelNumber}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3">
            {mode === 'challenges' && activeChallenge ? (
              <div className="flex items-center gap-4">
                <button onClick={backToChallenges} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <HiOutlineArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">{activeChallenge.title}</h2>
                  <p className="text-xs text-slate-500">{activeChallenge.level} • {activeChallenge.language}</p>
                </div>
              </div>
            ) : (
              <select
                value={language}
                onChange={handleLanguageChange}
                className="input-field px-4 py-2 rounded-xl text-sm font-semibold outline-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="go">Go</option>
                <option value="ruby">Ruby</option>
                <option value="rust">Rust</option>
              </select>
            )}
            
            <button
              onClick={mode === 'sandbox' ? handleRunSandbox : handleSubmitChallenge}
              disabled={isRunning || !code.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--gradient-brand)' }}
            >
              {isRunning ? (
                <HiOutlineRefresh className="w-5 h-5 animate-spin" />
              ) : mode === 'sandbox' ? (
                <HiOutlinePlay className="w-5 h-5" />
              ) : (
                <HiOutlineCode className="w-5 h-5" />
              )}
              {isRunning ? 'Running...' : mode === 'sandbox' ? 'Run Code' : 'Submit Solution'}
            </button>
            <button
              onClick={handleAIReview}
              disabled={isReviewing || !code.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 dark:text-indigo-300 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiOutlineSparkles className={`w-5 h-5 ${isReviewing ? 'animate-pulse' : ''}`} />
              {isReviewing ? 'Reviewing...' : 'AI Code Review'}
            </button>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Left Pane: Editor */}
            <div className="glass rounded-2xl overflow-hidden flex flex-col border border-slate-200/50 dark:border-slate-700/50">
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50 flex items-center gap-2">
                <HiOutlineDocumentText className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {mode === 'challenges' ? `solution.${language}` : `source_code.${language}`}
                </span>
              </div>
              <div className="flex-1 relative">
                <Editor
                  height="100%"
                  language={language === 'c' || language === 'cpp' ? 'cpp' : language}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    lineHeight: 1.6,
                    padding: { top: 16 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    formatOnPaste: true,
                  }}
                />
              </div>
            </div>

            {/* Right Pane: I/O or Challenge Details */}
            {mode === 'sandbox' ? (
              <div className="flex flex-col gap-4 min-h-0">
                <div className="glass rounded-2xl p-4 flex flex-col h-1/3 border border-slate-200/50 dark:border-slate-700/50">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                    Standard Input (stdin)
                  </label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter input values here..."
                    className="flex-1 w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-mono text-slate-800 dark:text-slate-200 outline-none resize-none"
                  />
                </div>
                <div className="glass rounded-2xl p-4 flex flex-col flex-1 border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      <HiOutlineTerminal className="w-4 h-4" />
                      Execution Output
                    </label>
                    {metrics && (
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                        <span>{metrics.time}ms</span>
                        <span>{metrics.memory}MB</span>
                        <span className={metrics.exitCode === 0 ? 'text-emerald-500' : 'text-rose-500'}>
                          Exit: {metrics.exitCode}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 w-full bg-slate-950 rounded-xl p-4 overflow-y-auto font-mono text-sm relative">
                    {error ? <div className="text-rose-400 whitespace-pre-wrap">{error}</div> : <div className="text-slate-300 whitespace-pre-wrap">{output}</div>}
                    {!output && !error && !isRunning && (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs italic">
                        Run the code to see output...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass rounded-2xl flex flex-col min-h-0 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">Problem Description</h3>
                  <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                    {activeChallenge?.description}
                  </div>
                </div>
                
                <div className="flex-1 p-5 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/20">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Test Results</h3>
                  
                  {!challengeResults && !isRunning && (
                    <div className="text-center text-slate-500 text-sm py-10">
                      Submit your solution to see test results.
                    </div>
                  )}

                  {isRunning && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      <span className="text-sm text-slate-500 font-medium animate-pulse">Running test cases...</span>
                    </div>
                  )}

                  {challengeResults && (
                    <div className="space-y-3">
                      {challengeResults.results.map((res, i) => (
                        <div key={i} className={`p-4 rounded-xl border ${res.passed ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800'}`}>
                          <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                            {res.passed ? <HiOutlineCheckCircle className="text-emerald-500 w-5 h-5" /> : <HiOutlineXCircle className="text-rose-500 w-5 h-5" />}
                            <span className={res.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>Test Case {i + 1}</span>
                            <span className="ml-auto text-xs font-mono text-slate-500">{res.executionTime}ms</span>
                          </div>
                          
                          {!res.passed && (
                            <div className="mt-2 space-y-2 text-xs font-mono bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                              <div>
                                <span className="text-slate-500">Input:</span>
                                <div className="text-slate-700 dark:text-slate-300 mt-0.5">{res.input}</div>
                              </div>
                              <div>
                                <span className="text-slate-500">Expected:</span>
                                <div className="text-emerald-600 dark:text-emerald-400 mt-0.5">{res.expectedOutput}</div>
                              </div>
                              <div>
                                <span className="text-slate-500">Actual Output:</span>
                                <div className="text-rose-600 dark:text-rose-400 mt-0.5">{res.error ? res.error : (res.actualOutput || '(Empty)')}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {challengeResults.allPassed && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white text-center shadow-lg transform transition-all hover:scale-[1.02]">
                          <div className="font-extrabold text-lg flex items-center justify-center gap-2">
                            <HiOutlineSparkles className="w-6 h-6" />
                            Success!
                          </div>
                          <p className="text-sm font-medium mt-1 text-white/90">
                            You earned {challengeResults.pointsAwarded} points for solving this challenge.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

    {/* AI Review Modal */}
    <AnimatePresence>
      {showReviewModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <HiOutlineSparkles className="text-indigo-500" /> AI Code Review
              </h2>
              <button onClick={() => setShowReviewModal(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <HiOutlineXCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 prose prose-sm sm:prose dark:prose-invert max-w-none">
              {isReviewing && aiReview === 'Analyzing your code...' ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                  <p>Analyzing code structure and time complexity...</p>
                </div>
              ) : (
                <ReactMarkdown>{aiReview}</ReactMarkdown>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    </div>
  );
};

export default PlaygroundPage;
