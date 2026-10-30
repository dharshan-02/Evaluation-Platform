import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  HiOutlineSearch, 
  HiOutlineFilter,
  HiOutlineDocumentReport,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiChevronUp,
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
  HiChevronDoubleLeft,
  HiChevronDoubleRight,
  HiOutlineDownload,
  HiOutlineArrowRight
} from 'react-icons/hi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const SubmissionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  
  const assignmentIdFilter = searchParams.get('assignmentId') || '';
  const statusFilter = searchParams.get('status') || 'all';

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentIdFilter, statusFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      let url = '/submissions?';
      if (assignmentIdFilter) url += `assignmentId=${assignmentIdFilter}&`;
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      
      const res = await api.get(url);
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error('Error fetching submissions', err);
    } finally {
      setLoading(false);
    }
  };

  const setFilterStatus = (status) => {
    setSearchParams(prev => {
      if (status === 'all') prev.delete('status');
      else prev.set('status', status);
      return prev;
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'evaluated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Evaluated
          </span>
        );
      case 'running':
      case 'executing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20">
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Executing
          </span>
        );
      case 'failed':
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <HiOutlineXCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <HiOutlineClock className="w-3.5 h-3.5" /> Pending Queue
          </span>
        );
    }
  };

  const getScoreColor = (marks, maxMarks) => {
    if (!maxMarks || maxMarks === 0) return 'text-slate-500';
    const ratio = marks / maxMarks;
    if (ratio >= 0.8) return 'text-emerald-500 font-extrabold';
    if (ratio >= 0.5) return 'text-amber-500 font-extrabold';
    return 'text-rose-500 font-extrabold';
  };

  const columns = useMemo(() => {
    const cols = [
      {
        accessorFn: row => row.assignment?.title,
        id: 'assignment',
        header: 'Problem Title',
        cell: info => (
          <div>
            <div className="font-bold text-sm text-[var(--color-text-primary)] tracking-tight line-clamp-1">
              {info.getValue() || 'Algorithmic Problem'}
            </div>
            <div className="text-xs font-medium text-[var(--color-text-secondary)] mt-0.5">{info.row.original.assignment?.course || 'CS Course'}</div>
          </div>
        )
      }
    ];

    if (['admin', 'faculty'].includes(user?.role)) {
      cols.push({
        accessorFn: row => row.student?.name,
        id: 'student',
        header: 'Student',
        cell: info => (
          <div>
            <div className="text-sm font-bold text-[var(--color-text-primary)]">
              {info.getValue() || 'Unknown Student'}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{info.row.original.student?.email}</div>
          </div>
        )
      });
    }

    cols.push(
      {
        accessorKey: 'language',
        header: 'Runtime',
        cell: info => (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[var(--color-text-secondary)] uppercase tracking-wider border border-[var(--color-border)]">
            {info.getValue()}
          </span>
        )
      },
      {
        accessorFn: row => new Date(row.submittedAt),
        id: 'submittedAt',
        header: 'Submitted',
        cell: info => <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{format(info.getValue(), 'MMM dd, h:mm a')}</span>
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: info => getStatusBadge(info.getValue())
      },
      {
        accessorKey: 'marks',
        header: 'Score',
        cell: info => {
          if (info.row.original.status === 'evaluated') {
            return (
              <span className={`text-sm ${getScoreColor(info.getValue(), info.row.original.assignment?.maxMarks)}`}>
                {info.getValue()} / {info.row.original.assignment?.maxMarks || 100}
              </span>
            );
          }
          return <span className="text-slate-400 font-bold text-sm">-</span>;
        }
      },
      {
        id: 'action',
        header: '',
        cell: info => (
          <Link
            to={`/submissions/${info.row.original._id}`}
            className="btn-secondary text-xs p-1.5 inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-sky-300"
          >
            <span>Review</span>
            <HiOutlineArrowRight className="w-3.5 h-3.5" />
          </Link>
        )
      }
    );

    return cols;
  }, [user]);

  const table = useReactTable({
    data: submissions,
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

  const handleExportCSV = () => {
    const rows = table.getRowModel().rows;
    const csvHeaders = ['Assignment', 'Course', 'Student Name', 'Email', 'Language', 'Status', 'Score', 'Max Score', 'Submitted At'];
    
    const csvContent = [
      csvHeaders.join(','),
      ...rows.map(row => {
        const s = row.original;
        return [
          `"${s.assignment?.title || ''}"`,
          `"${s.assignment?.course || ''}"`,
          `"${s.student?.name || ''}"`,
          `"${s.student?.email || ''}"`,
          `"${s.language || ''}"`,
          `"${s.status || ''}"`,
          `"${s.marks || 0}"`,
          `"${s.assignment?.maxMarks || 100}"`,
          `"${new Date(s.submittedAt).toLocaleString()}"`
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `submissions_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Submissions exported to CSV');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-sm">
              <HiOutlineDocumentReport className="w-6 h-6" />
            </div>
            Submissions & Evaluations
          </h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-2">
            {user?.role === 'student' 
              ? 'Inspect execution test case logs, memory metrics, runtime performance, and faculty marks.' 
              : 'Review automated Docker test runs, perform manual grading, and inspect student code.'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {assignmentIdFilter && (
            <button
              onClick={() => {
                setSearchParams(prev => {
                  prev.delete('assignmentId');
                  return prev;
                });
              }}
              className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline px-3 py-1.5"
            >
              Clear Assignment Filter
            </button>
          )}
          
          {['admin', 'faculty'].includes(user?.role) && submissions.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="btn-secondary text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <HiOutlineDownload className="w-4 h-4 text-emerald-500" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="card-pro p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none">
          {['all', 'evaluated', 'running', 'pending', 'failed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer shrink-0 ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-[var(--color-text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80 group">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder={user?.role === 'student' ? "Search assignment..." : "Search student or problem..."}
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="input-field w-full pl-10 pr-4 py-2 text-xs sm:text-sm outline-none"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="card-pro overflow-hidden flex flex-col animate-slide-up">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-3 border-[var(--color-border)] border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide">Syncing evaluation logs...</p>
            </div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-800 shadow-xs">
              <HiOutlineDocumentReport className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">No submissions found</h3>
            <p className="text-sm text-[var(--color-text-secondary)] font-medium mt-1">Try adjusting the filter status or search keyword.</p>
          </div>
        ) : (
          <>
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
                    <tr 
                      key={row.id} 
                      className="hover:bg-[var(--color-bg-hover)] transition-colors group"
                    >
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
          </>
        )}
      </div>
    </div>
  );
};

export default SubmissionsPage;
