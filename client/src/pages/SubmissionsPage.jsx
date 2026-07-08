import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
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
  HiOutlineDownload
} from 'react-icons/hi';
import { format } from 'date-fns';

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
      setSubmissions(res.data.submissions);
    } catch (err) {
      console.error('Error fetching submissions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (e) => {
    setSearchParams(prev => {
      if (e.target.value === 'all') prev.delete('status');
      else prev.set('status', e.target.value);
      return prev;
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'evaluated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Evaluated
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
            </svg>
            Running
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <HiOutlineXCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <HiOutlineClock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  const getScoreColor = (marks, maxMarks) => {
    if (!maxMarks || maxMarks === 0) return 'text-slate-500';
    const ratio = marks / maxMarks;
    if (ratio >= 0.8) return 'text-emerald-500';
    if (ratio >= 0.5) return 'text-amber-500';
    return 'text-rose-500';
  };

  const columns = useMemo(() => {
    const cols = [
      {
        accessorFn: row => row.assignment?.title,
        id: 'assignment',
        header: 'Assignment',
        cell: info => (
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
              {info.getValue() || 'Deleted Assignment'}
            </div>
            <div className="text-xs text-slate-500 mt-1">{info.row.original.assignment?.course || 'Unknown'}</div>
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
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {info.getValue() || 'Unknown Student'}
            </div>
            <div className="text-xs text-slate-500 mt-1">{info.row.original.student?.email}</div>
          </div>
        )
      });
    }

    cols.push(
      {
        accessorKey: 'language',
        header: 'Language',
        cell: info => (
          <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
            {info.getValue()}
          </span>
        )
      },
      {
        accessorFn: row => new Date(row.submittedAt),
        id: 'submittedAt',
        header: 'Submitted At',
        cell: info => <span className="text-sm text-slate-600 dark:text-slate-400">{format(info.getValue(), 'MMM dd, h:mm a')}</span>
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
              <span className={`font-bold text-sm ${getScoreColor(info.getValue(), info.row.original.assignment?.maxMarks)}`}>
                {info.getValue()} / {info.row.original.assignment?.maxMarks || 100}
              </span>
            );
          }
          return <span className="text-slate-400 font-bold text-sm">-</span>;
        }
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
    // Get currently filtered and sorted rows
    const rows = table.getRowModel().rows;
    
    // Define headers
    const csvHeaders = ['Assignment', 'Course', 'Student Name', 'Email', 'Language', 'Status', 'Score', 'Max Score', 'Submitted At'];
    
    // Generate CSV content
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
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `submissions_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Submissions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {user?.role === 'student' ? 'Track your project evaluation statuses.' : 'Review and monitor student project submissions.'}
          </p>
        </div>
        
        {assignmentIdFilter && (
          <button
            onClick={() => {
              setSearchParams(prev => {
                prev.delete('assignmentId');
                return prev;
              });
            }}
            className="text-sm font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
          >
            Clear Assignment Filter
          </button>
        )}
        
        {['admin', 'faculty'].includes(user?.role) && submissions.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: 'var(--gradient-brand)' }}
          >
            <HiOutlineDownload className="w-4 h-4" />
            Export to CSV
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder={user?.role === 'student' ? "Search by assignment title..." : "Search by student name or assignment..."}
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="input-field w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
          />
        </div>
        
        <div className="relative min-w-[160px] group">
          <HiOutlineFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="input-field w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="evaluated">Evaluated</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass rounded-2xl overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineDocumentReport className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No submissions found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      {headerGroup.headers.map(header => (
                        <th 
                          key={header.id} 
                          onClick={header.column.getToggleSortingHandler()}
                          className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors select-none"
                        >
                          <div className="flex items-center gap-2">
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
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                  {table.getRowModel().rows.map(row => (
                    <tr 
                      key={row.id} 
                      onClick={() => navigate(`/submissions/${row.original._id}`)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
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
            <div className="px-6 py-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/20">
              <span className="text-sm text-slate-500">
                Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{' '}
                <strong>{table.getPageCount()}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  <HiChevronDoubleLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  <HiChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-1 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  <HiChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="p-1 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  <HiChevronDoubleRight className="w-5 h-5" />
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
