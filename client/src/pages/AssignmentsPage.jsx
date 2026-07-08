import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  HiChevronDoubleRight
} from 'react-icons/hi';
import { format } from 'date-fns';

const AssignmentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sorting, setSorting] = useState([]);

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
      setAssignments(res.data.assignments);
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
          <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Completed
        </span>
      );
    }

    if (status === 'closed' || isPastDue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <HiOutlineXCircle className="w-3.5 h-3.5" /> Closed
        </span>
      );
    }
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
        Draft
      </span>
    );
  };

  const columns = useMemo(() => {
    const cols = [
      {
        accessorKey: 'course',
        header: 'Course',
        cell: info => <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">{info.getValue()}</span>,
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: info => (
          <Link to={`/assignments/${info.row.original._id}`} className="font-bold text-slate-900 dark:text-white hover:text-indigo-500 transition-colors">
            {info.getValue()}
          </Link>
        )
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: info => (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${info.getValue() === 'project' ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
            {info.getValue() === 'project' ? 'PROJECT' : 'CODE'}
          </span>
        )
      },
      {
        accessorFn: row => new Date(row.dueDate),
        id: 'dueDate',
        header: 'Due Date',
        cell: info => <span className="text-sm text-slate-500 dark:text-slate-400">{format(info.getValue(), 'MMM dd, yyyy')}</span>,
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
        cell: info => <span className="font-semibold text-slate-600 dark:text-slate-300">{info.getValue() || 0}</span>
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Assignments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {user?.role === 'student' ? 'View and submit your course assignments.' : 'Manage course assignments and evaluations.'}
          </p>
        </div>

        {['admin', 'faculty'].includes(user?.role) && (
          <button
            onClick={() => navigate('/assignments/new')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95"
            style={{ background: 'var(--gradient-brand)' }}
          >
            <HiOutlinePlus className="w-5 h-5" />
            Create Assignment
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="input-field w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
          />
        </div>
        
        <div className="relative min-w-[160px] group">
          <HiOutlineFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            {['admin', 'faculty'].includes(user?.role) && (
              <option value="draft">Drafts</option>
            )}
          </select>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiOutlineCode className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No assignments found</h3>
          <p className="text-slate-500 mt-2">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden flex flex-col">
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
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
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
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
