import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSave, HiOutlineArrowLeft, HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi';
import api from '../lib/api';

const CreateAssignmentPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    dueDate: '',
    dueDate: '',
    type: 'code',
    memoryLimit: 256,
    timeLimit: 5,
    allowedLanguages: ['python', 'javascript', 'c_cpp', 'java', 'go', 'ruby', 'rust'],
  });

  const [testCases, setTestCases] = useState([
    { input: '', expectedOutput: '', isHidden: false }
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLanguageChange = (lang) => {
    setFormData(prev => {
      if (prev.allowedLanguages.includes(lang)) {
        return { ...prev, allowedLanguages: prev.allowedLanguages.filter(l => l !== lang) };
      }
      return { ...prev, allowedLanguages: [...prev.allowedLanguages, lang] };
    });
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...testCases];
    newTestCases[index][field] = value;
    setTestCases(newTestCases);
  };

  const addTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '', isHidden: false }]);
  };

  const removeTestCase = (index) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.title || !formData.course || !formData.dueDate) {
      setError('Please fill in all required fields (Title, Course, Due Date)');
      return;
    }

    if (formData.type === 'code' && testCases.some(tc => !tc.expectedOutput)) {
      setError('All test cases must have an expected output.');
      return;
    }

    try {
      setLoading(true);
      
      // 1. Create the assignment
      const res = await api.post('/assignments', formData);
      const assignmentId = res.data.assignment._id;

      // 2. Create the test cases if it's a code assignment
      if (formData.type === 'code') {
        for (let i = 0; i < testCases.length; i++) {
          await api.post(`/assignments/${assignmentId}/test-cases`, {
            ...testCases[i],
            order: i + 1
          });
        }
      }

      navigate(`/assignments/${assignmentId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const supportedLangs = [
    { id: 'python', name: 'Python' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'c_cpp', name: 'C/C++' },
    { id: 'java', name: 'Java' },
    { id: 'go', name: 'Go' },
    { id: 'ruby', name: 'Ruby' },
    { id: 'rust', name: 'Rust' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/assignments')}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Assignment</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure the problem statement, execution constraints, and test cases.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-3">
            Basic Information
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Assignment Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="code"
                  checked={formData.type === 'code'}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium">Coding Challenge</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="project"
                  checked={formData.type === 'project'}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium">Project (GitHub + Report)</span>
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Title <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Array Reversal"
                className="input-field w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Course <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="course"
                value={formData.course}
                onChange={handleChange}
                placeholder="e.g. CS101"
                className="input-field w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Describe the problem, input format, and output format..."
              className="input-field w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-y"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Due Date <span className="text-rose-500">*</span></label>
            <input
              type="datetime-local"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="input-field w-full md:w-1/2 px-4 py-2.5 rounded-xl text-sm outline-none"
            />
          </div>
        </div>

        {formData.type === 'code' && (
          <>
            {/* Execution Constraints */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-3">
                Execution Constraints
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Memory Limit (MB)</label>
                  <input
                    type="number"
                    name="memoryLimit"
                    value={formData.memoryLimit}
                    onChange={handleChange}
                    min="64"
                    max="1024"
                    className="input-field w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Time Limit (Seconds)</label>
                  <input
                    type="number"
                    name="timeLimit"
                    value={formData.timeLimit}
                    onChange={handleChange}
                    min="1"
                    max="30"
                    className="input-field w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Allowed Languages</label>
                <div className="flex flex-wrap gap-3">
                  {supportedLangs.map(lang => (
                    <label key={lang.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allowedLanguages.includes(lang.id)}
                        onChange={() => handleLanguageChange(lang.id)}
                        className="w-4 h-4 rounded text-indigo-500 border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">{lang.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Test Cases */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Test Cases
                </h2>
                <button
                  type="button"
                  onClick={addTestCase}
                  className="text-xs font-semibold text-indigo-500 bg-indigo-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-500/20 transition-colors"
                >
                  <HiOutlinePlus className="w-4 h-4" /> Add Test Case
                </button>
              </div>

              <div className="space-y-4">
                <AnimatePresence>
              {testCases.map((tc, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 relative group"
                >
                  <div className="absolute top-4 right-4 flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-500">
                      <input
                        type="checkbox"
                        checked={tc.isHidden}
                        onChange={(e) => handleTestCaseChange(idx, 'isHidden', e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-500 border-slate-300"
                      />
                      Hidden Test Case
                    </label>
                    <button
                      type="button"
                      onClick={() => removeTestCase(idx)}
                      disabled={testCases.length === 1}
                      className="text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-50"
                    >
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Test Case {idx + 1}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-400">Standard Input (stdin)</label>
                      <textarea
                        value={tc.input}
                        onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)}
                        rows="3"
                        className="input-field w-full px-3 py-2 rounded-lg text-sm font-mono outline-none resize-y"
                        placeholder="e.g. 5&#10;1 2 3 4 5"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-400">Expected Output (stdout) <span className="text-rose-500">*</span></label>
                      <textarea
                        value={tc.expectedOutput}
                        onChange={(e) => handleTestCaseChange(idx, 'expectedOutput', e.target.value)}
                        rows="3"
                        className="input-field w-full px-3 py-2 rounded-lg text-sm font-mono outline-none resize-y"
                        placeholder="e.g. 15"
                      ></textarea>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        </>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-70"
            style={{ background: 'var(--gradient-brand)', boxShadow: 'var(--shadow-md)' }}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
              </svg>
            ) : (
              <HiOutlineSave className="w-5 h-5" />
            )}
            Save Assignment
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAssignmentPage;
