import React from "react"
import { cn } from "../../lib/utils"

interface Column<T> {
  key: string
  title: string
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  className?: string
  rowKey: (item: T) => string
}

export function DataTable<T>({ data, columns, className, rowKey }: DataTableProps<T>) {
  return (
    <div className={cn("w-full overflow-auto rounded-md border border-slate-200", className)}>
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="h-12 px-4 align-middle font-medium">
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="h-24 text-center text-slate-500">
                No results found.
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={rowKey(item)}
                className="transition-colors hover:bg-slate-50/50 data-[state=selected]:bg-slate-50 h-14"
              >
                {columns.map((col) => (
                  <td key={col.key} className="p-4 align-middle">
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
