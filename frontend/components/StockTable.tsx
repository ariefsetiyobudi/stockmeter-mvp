'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import type { FairValueResult } from '@/types';

interface StockTableProps {
  data: FairValueResult[];
  onRemove?: (ticker: string) => void;
  showRemoveButton?: boolean;
  className?: string;
}

/**
 * StockTable component displays stock comparison data with sortable columns
 * Requirements: 4.2, 4.3
 */
export default function StockTable({
  data,
  onRemove,
  showRemoveButton = false,
  className = '',
}: StockTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // Format currency
  const formatCurrency = (value: number | null): string => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Get valuation status badge
  const getStatusBadge = (status: 'undervalued' | 'fairly_priced' | 'overvalued') => {
    const statusConfig = {
      undervalued: {
        text: 'Undervalued',
        classes: 'bg-green-50 text-green-700 border-green-200',
        dotClasses: 'bg-green-500',
      },
      fairly_priced: {
        text: 'Fair',
        classes: 'bg-white text-gray-700 border-gray-200',
        dotClasses: 'bg-gray-400',
      },
      overvalued: {
        text: 'Overvalued',
        classes: 'bg-red-50 text-red-700 border-red-200',
        dotClasses: 'bg-red-500',
      },
    };

    const config = statusConfig[status];

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.classes}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dotClasses}`}></span>
        {config.text}
      </span>
    );
  };

  // Define columns
  const columns = useMemo<ColumnDef<FairValueResult>[]>(
    () => [
      {
        accessorKey: 'ticker',
        header: 'Ticker',
        cell: (info) => (
          <div className="font-semibold text-black">{info.getValue() as string}</div>
        ),
      },
      {
        accessorKey: 'currentPrice',
        header: 'Current Price',
        cell: (info) => (
          <div className="text-gray-900">{formatCurrency(info.getValue() as number)}</div>
        ),
      },
      {
        id: 'dcfFairValue',
        accessorFn: (row) => row.dcf.fairValue,
        header: 'DCF',
        cell: (info) => (
          <div className="text-gray-900">{formatCurrency(info.getValue() as number)}</div>
        ),
      },
      {
        id: 'ddmFairValue',
        accessorFn: (row) => row.ddm.fairValue,
        header: 'DDM',
        cell: (info) => (
          <div className="text-gray-900">{formatCurrency(info.getValue() as number | null)}</div>
        ),
      },
      {
        id: 'peFairValue',
        accessorFn: (row) => row.relativeValue.peRatioFairValue,
        header: 'P/E',
        cell: (info) => (
          <div className="text-gray-900">{formatCurrency(info.getValue() as number)}</div>
        ),
      },
      {
        id: 'grahamFairValue',
        accessorFn: (row) => row.graham.fairValue,
        header: 'Graham',
        cell: (info) => (
          <div className="text-gray-900">{formatCurrency(info.getValue() as number | null)}</div>
        ),
      },
      {
        accessorKey: 'valuationStatus',
        header: 'Status',
        cell: (info) => getStatusBadge(info.getValue() as any),
      },
      ...(showRemoveButton
        ? [
            {
              id: 'actions',
              header: '',
              cell: (info: any) => (
                <button
                  onClick={() => onRemove?.(info.row.original.ticker)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                  aria-label={`Remove ${info.row.original.ticker}`}
                >
                  Remove
                </button>
              ),
            } as ColumnDef<FairValueResult>,
          ]
        : []),
    ],
    [showRemoveButton, onRemove]
  );

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
        <p className="text-gray-500">No stocks to display</p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Table - Responsive with horizontal scroll on mobile */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? 'flex items-center gap-2 cursor-pointer select-none hover:text-gray-700'
                            : ''
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="flex flex-col">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUpIcon className="w-4 h-4" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDownIcon className="w-4 h-4" />
                            ) : (
                              <div className="flex flex-col">
                                <ChevronUpIcon className="w-3 h-3 text-gray-300" />
                                <ChevronDownIcon className="w-3 h-3 text-gray-300 -mt-1" />
                              </div>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-4 whitespace-nowrap text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
            <div className="text-sm text-gray-700">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
