import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { 
  HiOutlinePlay, 
  HiOutlineRefresh, 
  HiOutlineDocumentText,
  HiOutlineTerminal
} from 'react-icons/hi';

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
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_CODE['python']);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    // Only reset code if it's still the default of the previous language
    if (code === DEFAULT_CODE[language] || code.trim() === '') {
      setCode(DEFAULT_CODE[newLang]);
    }
  };

  const handleRunCode = async () => {
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
      console.error(err);
      setError(err.response?.data?.message || 'Failed to execute code. The server might be down.');
      setOutput('');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Code Playground</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Write, test, and debug code in a sandboxed environment.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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
          
          <button
            onClick={handleRunCode}
            disabled={isRunning || !code.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--gradient-brand)' }}
          >
            {isRunning ? (
              <HiOutlineRefresh className="w-5 h-5 animate-spin" />
            ) : (
              <HiOutlinePlay className="w-5 h-5" />
            )}
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Editor Pane */}
        <div className="glass rounded-2xl overflow-hidden flex flex-col border border-slate-200/50 dark:border-slate-700/50">
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50 flex items-center gap-2">
            <HiOutlineDocumentText className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">source_code.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'ruby' ? 'rb' : language === 'rust' ? 'rs' : language}</span>
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
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                formatOnPaste: true,
              }}
            />
          </div>
        </div>

        {/* Input/Output Pane */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Stdin */}
          <div className="glass rounded-2xl p-4 flex flex-col h-1/3 border border-slate-200/50 dark:border-slate-700/50">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              Standard Input (stdin)
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input values here..."
              className="flex-1 w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Stdout / Stderr */}
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
              {error ? (
                <div className="text-rose-400 whitespace-pre-wrap">{error}</div>
              ) : (
                <div className="text-slate-300 whitespace-pre-wrap">{output}</div>
              )}
              
              {!output && !error && !isRunning && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs italic">
                  Run the code to see output...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaygroundPage;
