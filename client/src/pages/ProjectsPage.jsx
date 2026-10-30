import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { 
  HiOutlinePlus, 
  HiOutlineClipboardList, 
  HiOutlineUser, 
  HiOutlineSearch,
  HiOutlineArrowRight,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineDocumentReport
} from 'react-icons/hi';
import { FaGithub } from 'react-icons/fa';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.02 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const ProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const isStudent = user?.role === 'student';

  const filteredProjects = projects.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.title?.toLowerCase().includes(q) || 
           p.description?.toLowerCase().includes(q) || 
           p.student?.name?.toLowerCase().includes(q) ||
           p.guide?.name?.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 text-white flex items-center justify-center shadow-sm">
              <HiOutlineClipboardList className="w-6 h-6" />
            </div>
            Capstone Projects Hub
          </h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-2">
            Manage academic projects, scheduled reviews, presentations (PPTX), and automated report plagiarism scans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isStudent && (
            <button
              onClick={() => navigate('/projects/new')}
              className="btn-primary flex items-center gap-2 text-xs sm:text-sm shadow-sm cursor-pointer"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Create Project
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="card-pro p-4 flex items-center gap-3">
        <HiOutlineSearch className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by project title, guide, or student name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-slate-400 outline-none"
        />
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-sm font-medium shadow-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-3 border-[var(--color-border)] border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide">Fetching capstone projects...</p>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="card-pro p-16 text-center animate-slide-up">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-800 shadow-xs">
            <HiOutlineClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">No Projects Found</h3>
          <p className="text-sm text-[var(--color-text-secondary)] font-medium mt-1">
            {isStudent ? 'Create your new capstone project to get assigned to a faculty guide.' : 'No students have designated you as their project guide yet.'}
          </p>
          {isStudent && (
            <button
              onClick={() => navigate('/projects/new')}
              className="btn-primary mt-5 inline-flex items-center gap-2 text-xs"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Create Project Now
            </button>
          )}
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredProjects.map((project) => {
            const completedReviews = project.reviews?.filter(r => r.marksAwarded != null)?.length || 0;
            const totalReviews = project.reviews?.length || 0;

            return (
              <motion.div
                key={project._id}
                variants={cardVariants}
                className="card-pro p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 relative"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-300 uppercase tracking-widest border border-blue-200 dark:border-blue-800">
                      Capstone
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {format(new Date(project.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[var(--color-text-primary)] group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1 tracking-tight">
                    {project.title}
                  </h3>

                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mt-2 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[var(--color-border)] space-y-2 text-xs">
                    {!isStudent ? (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Student:</span>
                        <span className="font-bold text-[var(--color-text-primary)]">{project.student?.name || 'Unknown'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Faculty Guide:</span>
                        <span className="font-bold text-[var(--color-text-primary)]">{project.guide?.name || 'Unassigned'}</span>
                      </div>
                    )}

                    {project.githubUrl && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Repository:</span>
                        <a 
                          href={project.githubUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          onClick={(e) => e.stopPropagation()} 
                          className="flex items-center gap-1 text-blue-600 dark:text-sky-400 hover:underline font-medium"
                        >
                          <FaGithub className="w-3.5 h-3.5" />
                          <span>GitHub</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
                  {/* Reviews Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                      <span>Milestones</span>
                      <span>{completedReviews} / {totalReviews} Evaluated</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-500"
                        style={{ width: totalReviews > 0 ? `${(completedReviews / totalReviews) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => navigate(`/projects/${project._id}/collaborate`)}
                      className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 cursor-pointer"
                      title="Open Live IDE Room"
                    >
                      <HiOutlineUserGroup className="w-3.5 h-3.5 text-blue-500" />
                      <span>Pair Code</span>
                    </button>
                    <button
                      onClick={() => navigate(`/projects/${project._id}`)}
                      className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shadow-2xs"
                    >
                      <span>Project Details</span>
                      <HiOutlineArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default ProjectsPage;
