import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"

export type NotificationType = "success" | "error" | "info" | "warning"

interface NotificationProps {
  id: string
  type: NotificationType
  title: string
  message?: string
  onClose: (id: string) => void
}

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />
}

export function Notification({ id, type, title, message, onClose }: NotificationProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className="pointer-events-auto flex w-full max-w-sm rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden"
    >
      <div className="p-4 w-full flex items-start gap-3">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-medium text-slate-900">{title}</p>
          {message && <p className="mt-1 text-sm text-slate-500">{message}</p>}
        </div>
        <div className="flex flex-shrink-0">
          <button
            onClick={() => onClose(id)}
            className="inline-flex rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Minimal toast container (could be managed by Zustand in actual implementation)
export function NotificationContainer({ notifications, onClose }: { notifications: Omit<NotificationProps, 'onClose'>[], onClose: (id: string) => void }) {
  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-6 pointer-events-none w-full sm:w-auto">
      <AnimatePresence>
        {notifications.map(n => (
          <Notification key={n.id} {...n} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  )
}
