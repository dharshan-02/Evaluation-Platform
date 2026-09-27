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
        cell: info => <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] uppercase tracking-widest border border-[var(--color-border)] shadow-xs">{info.getValue()}</span>,
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: info => (
          <Link to={`/assignments/${info.row.original._id}`} className="font-bold text-[var(--color-text-primary)] hover:text-indigo-500 transition-colors tracking-tight">
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight">Assignments</h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-1">
            {user?.role === 'student' ? 'View and submit your course assignments.' : 'Manage course assignments and evaluations.'}
          </p>
        </div>

        {['admin', 'faculty'].includes(user?.role) && (
          <button
            onClick={() => navigate('/assignments/new')}
            className="btn-primary flex items-center gap-2 shadow-md"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Create Assignment
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)] group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="input-field w-full pl-10 pr-4 py-2.5 outline-none"
          />
        </div>
        
        <div className="relative min-w-[160px] group">
          <HiOutlineFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)] group-focus-within:text-indigo-500 transition-colors" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-full pl-10 pr-4 py-2.5 outline-none appearance-none cursor-pointer"
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
          <div className="animate-pulse-subtle flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[var(--color-border)] border-t-[var(--color-text-primary)] rounded-full animate-spin"></div>
            <p className="mt-4 text-[var(--color-text-secondary)] font-medium tracking-wide">Loading assignments...</p>
          </div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="glass-panel p-12 text-center animate-slide-up">
          <div className="w-16 h-16 bg-[var(--color-bg-hover)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--color-border)] shadow-xs">
            <HiOutlineCode className="w-8 h-8 text-[var(--color-text-muted)]" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">No assignments found</h3>
          <p className="text-[var(--color-text-secondary)] font-medium mt-2">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden flex flex-col animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    {headerGroup.headers.map(header => (
                      <th 
                        key={header.id} 
                        onClick={header.column.getToggleSortingHandler()}
                        className="px-6 py-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors select-none"
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
          <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-secondary)]">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Page <strong className="text-[var(--color-text-primary)]">{table.getState().pagination.pageIndex + 1}</strong> of{' '}
              <strong className="text-[var(--color-text-primary)]">{table.getPageCount()}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="p-1 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] disabled:opacity-50 transition-colors cursor-pointer"
              >
                <HiChevronDoubleLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] disabled:opacity-50 transition-colors cursor-pointer"
              >
                <HiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] disabled:opacity-50 transition-colors cursor-pointer"
              >
                <HiChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="p-1 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] disabled:opacity-50 transition-colors cursor-pointer"
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
