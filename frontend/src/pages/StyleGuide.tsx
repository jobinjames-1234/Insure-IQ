import React from "react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import { MetricCard } from "../components/ui/MetricCard"
import { Badge } from "../components/ui/Badge"
import { ConfidencePill } from "../components/ui/ConfidencePill"
import { TrustStrip } from "../components/ui/TrustStrip"
import { Modal } from "../components/ui/Modal"
import { DataTable } from "../components/ui/DataTable"
import { EmptyState } from "../components/ui/EmptyState"
import { Skeleton } from "../components/ui/Skeleton"
import { Stepper } from "../components/ui/Stepper"
import { FileUpload } from "../components/ui/FileUpload"
import { PageHeader } from "../components/ui/PageHeader"
import { NotificationContainer } from "../components/ui/Notification"
import { ShieldCheck, User } from "lucide-react"

export function StyleGuide() {
  const [modalOpen, setModalOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<any[]>([])

  const addNotification = (type: any) => {
    const id = Math.random().toString(36).substr(2, 9)
    setNotifications(prev => [...prev, { id, type, title: `Test ${type} notification`, message: "This is a detailed message." }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  const tableData = [
    { id: 1, name: "Alice Johnson", policy: "POL-10023", status: "Active" },
    { id: 2, name: "Bob Smith", policy: "POL-10024", status: "Pending" }
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 bg-slate-50 min-h-screen">
      <PageHeader 
        title="Design System Style Guide" 
        description="Verify all UI components match the expected Mercury aesthetic." 
      />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Buttons</h2>
        <div className="flex gap-4 items-center">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button isLoading>Loading</Button>
        </div>
      </section>

      <section className="space-y-4 max-w-sm">
        <h2 className="text-xl font-semibold border-b pb-2">Forms</h2>
        <Input label="Email Address" placeholder="name@example.com" />
        <Input label="Password" type="password" error="Password is too short" />
        <Select label="State">
          <option>California</option>
          <option>New York</option>
        </Select>
        <FileUpload onFileSelect={(f) => console.log(f.name)} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Cards & Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>Standard Card</CardTitle></CardHeader>
            <CardContent>Content goes here.</CardContent>
          </Card>
          <MetricCard title="Total Premium" value="$24,500" trend={12.5} icon={<ShieldCheck />} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Indicators</h2>
        <div className="flex gap-4 items-center flex-wrap">
          <Badge variant="success">Active</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="danger">Lapsed</Badge>
          <ConfidencePill score={84} />
          <ConfidencePill score={65} />
          <ConfidencePill score={32} />
        </div>
        <div className="mt-4">
          <TrustStrip />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Data & State</h2>
        <DataTable 
          data={tableData}
          rowKey={(item) => String(item.id)}
          columns={[
            { key: "name", title: "Customer Name" },
            { key: "policy", title: "Policy Number" },
            { key: "status", title: "Status", render: (item) => <Badge variant={item.status === "Active" ? "success" : "warning"}>{item.status}</Badge>}
          ]}
        />
        <EmptyState 
          icon={<User className="h-6 w-6" />}
          title="No customers found"
          description="Get started by creating a new customer profile."
          action={<Button>Create Customer</Button>}
        />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Overlays</h2>
        <div className="flex gap-4">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button onClick={() => addNotification("success")} variant="secondary">Success Toast</Button>
          <Button onClick={() => addNotification("error")} variant="danger">Error Toast</Button>
        </div>
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Important Action">
          <p className="text-slate-600 mb-4">Are you sure you want to perform this action?</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => setModalOpen(false)}>Confirm</Button>
          </div>
        </Modal>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Stepper</h2>
        <Stepper steps={[
          { id: 1, title: "Personal Info", status: "complete" },
          { id: 2, title: "Vehicle Details", status: "current" },
          { id: 3, title: "Coverage", status: "upcoming" }
        ]} />
      </section>

      <NotificationContainer notifications={notifications} onClose={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
    </div>
  )
}
