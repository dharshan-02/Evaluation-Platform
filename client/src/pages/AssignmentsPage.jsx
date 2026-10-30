import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender 
} from '@tanstack/react-table';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { 
  HiOutlinePlus, 
  HiOutlineSearch, 
  HiOutlineFilter,
  HiOutlineCode,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiChevronUp,
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
  HiChevronDoubleLeft,
  HiChevronDoubleRight,
  HiOutlineClock,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineArrowRight
} from 'react-icons/hi';
import { format } from 'date-fns';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const AssignmentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sorting, setSorting] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  useEffect(() => {
    fetchAssignments();
  }, [statusFilter]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      let url = '/assignments?';
      if (statusFilter !== 'all') {
        url += `status=${statusFilter}&`;
      }
      
      const res = await api.get(url);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error('Error fetching assignments', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (assignment) => {
    const { status, dueDate, studentSubmission } = assignment;
    const isPastDue = new Date(dueDate) < new Date();

    if (user?.role === 'student' && studentSubmission) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20">
          <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Completed
        </span>
      );
    }

    if (status === 'closed' || isPastDue) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <HiOutlineXCircle className="w-3.5 h-3.5" /> Closed
        </span>
      );
    }
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
        Draft
      </span>
    );
  };

  const columns = useMemo(() => {
    const cols = [
      {
        accessorKey: 'course',
        header: 'Course',
        cell: info => <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] uppercase tracking-widest border border-[var(--color-border)] shadow-xs">{info.getValue()}</span>,
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: info => (
          <Link to={`/assignments/${info.row.original._id}`} className="font-bold text-[var(--color-text-primary)] hover:text-blue-600 dark:hover:text-sky-400 transition-colors tracking-tight">
            {info.getValue()}
          </Link>
        )
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: info => (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${info.getValue() === 'project' ? 'bg-indigo-600' : 'bg-blue-600'}`}>
            {info.getValue() === 'project' ? 'PROJECT' : 'CODE'}
          </span>
        )
      },
      {
        accessorFn: row => new Date(row.dueDate),
        id: 'dueDate',
        header: 'Due Date',
        cell: info => <span className="text-sm font-medium text-[var(--color-text-secondary)]">{format(info.getValue(), 'MMM dd, yyyy')}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: info => getStatusBadge(info.row.original),
      }
    ];

    if (['admin', 'faculty'].includes(user?.role)) {
      cols.push({
        accessorKey: 'submissionCount',
        header: 'Submissions',
        cell: info => <span className="font-bold text-[var(--color-text-secondary)]">{info.getValue() || 0}</span>
      });
    }

    return cols;
  }, [user]);

  const table = useReactTable({
    data: assignments,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const filteredAssignments = assignments.filter(a => {
    if (!globalFilter) return true;
    const q = globalFilter.toLowerCase();
    return a.title?.toLowerCase().includes(q) || a.course?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <HiOutlineCode className="w-6 h-6" />
            </div>
            Coding Challenges & Assignments
          </h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-2">
            {user?.role === 'student' 
              ? 'Solve algorithm challenges in Monaco editor, execute test cases in isolated containers, and receive instant feedback.' 
              : 'Create, monitor, and evaluate student algorithmic coding challenges.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-[var(--color-border)]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-400 shadow-2xs' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
            >
              <HiOutlineViewGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-400 shadow-2xs' : 'text-slate-400 hover:text-slate-600'}`}
              title="Table View"
            >
              <HiOutlineViewList className="w-4 h-4" />
            </button>
          </div>

          {['admin', 'faculty'].includes(user?.role) && (
            <button
              onClick={() => navigate('/assignments/new')}
              className="btn-primary flex items-center gap-2 text-xs sm:text-sm shadow-sm cursor-pointer"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Create Assignment
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="card-pro p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search problem title, course code, keywords..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="input-field w-full pl-10 pr-4 py-2 text-xs sm:text-sm outline-none"
          />
        </div>
        
        <div className="relative min-w-[160px] group">
          <HiOutlineFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] group-focus-within:text-blue-500 transition-colors" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-full pl-10 pr-4 py-2 text-xs sm:text-sm outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="closed">Closed Only</option>
            {['admin', 'faculty'].includes(user?.role) && (
              <option value="draft">Drafts</option>
            )}
          </select>
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-3 border-[var(--color-border)] border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide">Loading challenges...</p>
          </div>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="card-pro p-16 text-center animate-slide-up">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-800 shadow-xs">
            <HiOutlineCode className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">No assignments found</h3>
          <p className="text-sm text-[var(--color-text-secondary)] font-medium mt-1">Try adjusting your search criteria or filter options.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Modern Cards Grid View */
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredAssignments.map((assignment) => {
            const isStudent = user?.role === 'student';
            const hasSubmitted = isStudent && assignment.studentSubmission;

            return (
              <motion.div
                key={assignment._id}
                variants={cardVariants}
                className="card-pro p-5 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 relative"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-300 uppercase tracking-widest border border-blue-200 dark:border-blue-800">
                      {assignment.course}
                    </span>
                    {getStatusBadge(assignment)}
                  </div>

                  <h3 className="text-base font-bold text-[var(--color-text-primary)] group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1 tracking-tight">
                    {assignment.title}
                  </h3>

                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mt-2 leading-relaxed">
                    {assignment.description || 'Interactive algorithm problem with automated unit and stress testing.'}
                  </p>

                  {/* Languages Supported */}
                  <div className="flex flex-wrap gap-1 mt-4">
                    {(assignment.allowedLanguages || ['python', 'javascript', 'c_cpp', 'java']).slice(0, 4).map((lang, idx) => (
                      <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {lang === 'c_cpp' ? 'C++' : lang}
                      </span>
                    ))}
                    {(assignment.allowedLanguages?.length > 4) && (
                      <span className="text-[10px] text-slate-400 font-semibold px-1 py-0.5">
                        +{assignment.allowedLanguages.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-[var(--color-border)] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                    <HiOutlineClock className="w-4 h-4 text-slate-400" />
                    <span>Due: {format(new Date(assignment.dueDate), 'MMM dd')}</span>
                  </div>

                  <button
                    onClick={() => navigate(`/assignments/${assignment._id}`)}
                    className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shadow-xs"
                  >
                    <span>{hasSubmitted ? 'View Solution' : isStudent ? 'Solve Problem' : 'Manage'}</span>
                    <HiOutlineArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        /* Data Table View */
        <div className="card-pro overflow-hidden flex flex-col animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    {headerGroup.headers.map(header => (
                      <th 
                        key={header.id} 
                        onClick={header.column.getToggleSortingHandler()}
                        className="px-6 py-3.5 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <HiChevronUp className="w-4 h-4" />,
                            desc: <HiChevronDown className="w-4 h-4" />,
                          }[header.column.getIsSorted()] ?? null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-[var(--color-bg-hover)] transition-colors group">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="px-6 py-3.5 border-t border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-secondary)]">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
              Page <strong className="text-[var(--color-text-primary)]">{table.getState().pagination.pageIndex + 1}</strong> of{' '}
              <strong className="text-[var(--color-text-primary)]">{table.getPageCount()}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="btn-secondary text-xs p-1.5 disabled:opacity-40 cursor-pointer"
              >
                <HiChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="btn-secondary text-xs p-1.5 disabled:opacity-40 cursor-pointer"
              >
                <HiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
