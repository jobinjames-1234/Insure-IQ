import React, { useCallback } from "react"
import { cn } from "../../lib/utils"
import { UploadCloud } from "lucide-react"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSizeMB?: number
  className?: string
}

export function FileUpload({ onFileSelect, accept, maxSizeMB = 10, className }: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true)
    } else if (e.type === "dragleave") {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0])
    }
  }, [onFileSelect])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0])
    }
  }, [onFileSelect])

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed transition-colors",
        isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <UploadCloud className={cn("h-8 w-8 mb-2", isDragging ? "text-indigo-500" : "text-slate-400")} />
      <p className="text-sm font-medium text-slate-700">
        <span className="text-indigo-600 font-semibold cursor-pointer">Click to upload</span> or drag and drop
      </p>
      <p className="text-xs text-slate-500 mt-1">
        {accept ? accept.split(",").join(", ") : "All files"} up to {maxSizeMB}MB
      </p>
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept={accept}
        onChange={handleChange}
      />
    </div>
  )
}
