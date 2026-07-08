import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSparkles, HiOutlineX, HiOutlinePaperAirplane, HiOutlineChat } from 'react-icons/hi';
import api from "../lib/api";
import ReactMarkdown from 'react-markdown';

const AITutorWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', parts: [{ text: "Hi! I'm your AI Tutor. Need a hint or explanation? Just ask! (I won't write the code for you though!)" }] }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', parts: [{ text: input }] };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // The history for Gemini expects an array of { role, parts: [{ text }] }
      const history = messages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: msg.parts
      }));

      const res = await api.post('/ai/tutor', {
        message: input,
        history: history
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, { role: 'model', parts: [{ text: res.data.reply }] }]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'model', parts: [{ text: 'Sorry, I am having trouble connecting right now.' }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-xl z-50 text-white flex items-center justify-center transition-all ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-indigo-500/30'}`}
      >
        <HiOutlineSparkles className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <HiOutlineSparkles className="w-5 h-5" />
                <h3 className="font-bold">AI Tutor</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50 dark:bg-slate-900/50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-500 text-white rounded-br-sm' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-200 dark:border-slate-700'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.parts[0].text
                    ) : (
                      <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                        {msg.parts[0].text}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 border border-slate-200 dark:border-slate-700 flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for a hint..."
                className="w-full pl-4 pr-12 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white rounded-lg transition-colors"
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
