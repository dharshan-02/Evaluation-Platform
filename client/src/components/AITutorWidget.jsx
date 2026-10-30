import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineSparkles, 
  HiOutlineX, 
  HiOutlinePaperAirplane, 
  HiOutlineRefresh,
  HiOutlineLightBulb,
  HiOutlineCode,
  HiOutlineExclamationCircle
} from 'react-icons/hi';
import api from "../lib/api";
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
  { label: 'Complexity hint', prompt: 'How do I analyze and optimize the Big-O time and space complexity of my algorithm?' },
  { label: 'Debug failed test', prompt: 'What are common edge cases that cause test cases to fail (e.g. empty inputs, duplicates, overflow)?' },
  { label: 'Algorithm pattern', prompt: 'Which algorithmic pattern fits this problem best (Two Pointers, Sliding Window, DP, or Hash Map)?' },
];

const AITutorWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'model', 
      parts: [{ text: "👋 Hi! I'm your **AI Code Tutor**. Need a conceptual hint, Big-O advice, or edge-case ideas? Ask away! *(I won't spoil the final answer though!)*" }] 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', parts: [{ text }] };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: msg.parts
      }));

      const res = await api.post('/ai/tutor', {
        message: text,
        history: history
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, { role: 'model', parts: [{ text: res.data.reply }] }]);
      }
    } catch (error) {
      console.error('AI Tutor error:', error);
      setMessages((prev) => [...prev, { 
        role: 'model', 
        parts: [{ text: '💡 **Hint**: Break down your problem into smaller subproblems. Check your base cases and boundary conditions while I reconnect.' }] 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleReset = () => {
    setMessages([
      { 
        role: 'model', 
        parts: [{ text: "Chat refreshed! Ready for your next coding question or problem hint." }] 
      }
    ]);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.08, rotate: 3 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-3.5 rounded-2xl shadow-xl z-50 text-white flex items-center gap-2.5 transition-all duration-300 ${
          isOpen 
            ? 'opacity-0 pointer-events-none scale-75' 
            : 'opacity-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:shadow-blue-500/30'
        }`}
        title="Open AI Tutor"
      >
        <div className="relative">
          <HiOutlineSparkles className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900 shadow-xs" />
        </div>
        <span className="hidden sm:inline font-bold text-xs tracking-wide">AI Tutor</span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-6 right-6 w-[360px] sm:w-[420px] h-[550px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-50 flex flex-col border border-slate-200/80 dark:border-slate-800 overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-4 flex justify-between items-center text-white shadow-md relative">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <HiOutlineSparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                    AI Coding Tutor
                    <span className="text-[10px] bg-emerald-400/30 text-emerald-100 px-1.5 py-0.2 rounded-full font-semibold border border-emerald-300/40">ONLINE</span>
                  </h3>
                  <p className="text-[11px] text-white/80 font-medium">Concept hints & algorithmic advice</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleReset} 
                  title="Clear conversation"
                  className="p-1.5 hover:bg-white/20 rounded-xl transition-colors text-white/80 hover:text-white"
                >
                  <HiOutlineRefresh className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  title="Close tutor"
                  className="p-1.5 hover:bg-white/20 rounded-xl transition-colors text-white/80 hover:text-white"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Prompt Pills */}
            <div className="flex gap-1.5 p-2 px-3 overflow-x-auto bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800 scrollbar-none">
              {SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(item.prompt)}
                  disabled={isLoading}
                  className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-sky-400 hover:text-blue-600 dark:hover:text-sky-300 transition-colors shadow-2xs"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-slate-50/60 dark:bg-slate-900/60 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs' 
                      : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/80 dark:border-slate-700/80'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.parts[0].text
                    ) : (
                      <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-2 prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-lg prose-pre:p-2.5">
                        <ReactMarkdown>
                          {msg.parts[0].text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800/90 rounded-2xl rounded-bl-xs px-4 py-3 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1.5 shadow-xs">
                    <span className="text-[11px] text-slate-400 font-medium mr-1">Tutor thinking</span>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 relative flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for hints, Big-O, edge cases..."
                className="w-full pl-4 pr-11 py-2.5 bg-slate-100 dark:bg-slate-800/90 border border-transparent focus:border-blue-500 dark:focus:border-sky-400 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none transition-all"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="absolute right-4.5 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-xs"
              >
                <HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AITutorWidget;
