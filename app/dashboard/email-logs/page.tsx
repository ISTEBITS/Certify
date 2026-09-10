'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Mail,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RotateCw,
  Trash2,
  Eye,
  Loader2,
  Calendar,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface EmailLogItem {
  _id: string
  participantId: string
  certificateId: string
  eventId: string
  recipientEmail: string
  participantName: string
  eventName: string
  certificateNumber: string
  status: 'pending' | 'success' | 'failed'
  errorMessage?: string
  messageIds?: string[]
  sentAt?: string
  createdAt: string
}

interface EventItem {
  _id: string
  name: string
}

interface LogStats {
  total: number
  success: number
  failed: number
  pending: number
  successRate: number
}

export default function EmailLogsPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<EmailLogItem[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [stats, setStats] = useState<LogStats>({
    total: 0,
    success: 0,
    failed: 0,
    pending: 0,
    successRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [eventFilter, setEventFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [selectedLog, setSelectedLog] = useState<EmailLogItem | null>(null)
  const [clearing, setClearing] = useState(false)

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events')
      const data = await res.json()
      if (Array.isArray(data)) {
        setEvents(data)
      }
    } catch (err) {
      console.error('Failed to load events:', err)
    }
  }

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        status: statusFilter,
        eventId: eventFilter,
        search: searchQuery,
      })

      const res = await fetch(`/api/email-logs?${params.toString()}`)
      const data = await res.json()

      if (res.ok) {
        setLogs(data.logs || [])
        setStats(data.stats || { total: 0, success: 0, failed: 0, pending: 0, successRate: 0 })
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalRecords(data.pagination?.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch email logs:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to retrieve email audit logs.',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, statusFilter, eventFilter, searchQuery, toast])

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const exportCSV = () => {
    if (logs.length === 0) return

    const headers = ['Timestamp', 'Recipient Name', 'Recipient Email', 'Event Name', 'Certificate ID', 'Status', 'Message ID / Error']
    const rows = logs.map((log) => [
      new Date(log.createdAt).toISOString(),
      `"${log.participantName.replace(/"/g, '""')}"`,
      `"${log.recipientEmail}"`,
      `"${log.eventName.replace(/"/g, '""')}"`,
      `"${log.certificateNumber}"`,
      log.status.toUpperCase(),
      `"${(log.errorMessage || log.messageIds?.[0] || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `email-audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Export Generated',
      description: `Exported ${logs.length} log records to CSV.`,
    })
  }

  const handleClearLogs = async () => {
    setClearing(true)
    try {
      const res = await fetch('/api/email-logs', { method: 'DELETE' })
      if (res.ok) {
        toast({
          title: 'Logs Cleared',
          description: 'All past email log records have been cleared.',
        })
        fetchLogs()
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to clear email logs.',
      })
    } finally {
      setClearing(false)
    }
  }

  if (loading && !refreshing) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading email audit records...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-5 rounded-lg border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">Email Dispatch History</h1>
            <Badge variant="secondary" className="text-xs font-normal">
              {stats.total} Total Sends
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Complete audit trail of transactional certificate emails and delivery statuses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="h-8 text-xs gap-1.5"
          >
            <RotateCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={logs.length === 0}
            className="h-8 text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                disabled={logs.length === 0}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Logs
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base font-semibold">Clear Email History?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground">
                  Are you sure you want to permanently clear all stored email delivery audit records? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearLogs}
                  className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs gap-1.5"
                  disabled={clearing}
                >
                  {clearing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Clear All Logs
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Dispatched</p>
                <p className="text-2xl font-semibold text-foreground mt-1.5">{stats.total}</p>
              </div>
              <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
                <Mail className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Successfully Delivered</p>
                <p className="text-2xl font-semibold text-emerald-700 mt-1.5">{stats.success}</p>
              </div>
              <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg border border-emerald-100">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Failed Deliveries</p>
                <p className="text-2xl font-semibold text-red-700 mt-1.5">{stats.failed}</p>
              </div>
              <div className="bg-red-50 text-red-600 p-2.5 rounded-lg border border-red-100">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Delivery Success Rate</p>
                <p className="text-2xl font-semibold text-foreground mt-1.5">{stats.successRate}%</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg border border-blue-100">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by participant, email, certificate ID, or event..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="sm:col-span-3">
          <Select
            value={eventFilter}
            onValueChange={(val) => {
              setEventFilter(val)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((evt) => (
                <SelectItem key={evt._id} value={evt._id}>
                  {evt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-3">
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="success">Delivered (Success)</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Logs Table */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {logs.length > 0 ? (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">Candidate</th>
                      <th className="px-5 py-3">Event</th>
                      <th className="px-5 py-3">Certificate Number</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3">Sent At</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-foreground text-sm leading-tight">
                            {log.participantName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {log.recipientEmail}
                          </p>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="text-xs text-foreground font-medium">
                            {log.eventName}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="text-xs font-medium text-muted-foreground">
                            {log.certificateNumber}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          {log.status === 'success' ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-normal inline-flex items-center gap-1"
                            >
                              <CheckCircle className="h-3 w-3 text-emerald-600" />
                              Delivered
                            </Badge>
                          ) : log.status === 'failed' ? (
                            <Badge
                              variant="outline"
                              className="bg-red-50 text-red-700 border-red-200 text-xs font-normal inline-flex items-center gap-1"
                            >
                              <XCircle className="h-3 w-3 text-red-600" />
                              Failed
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-normal inline-flex items-center gap-1"
                            >
                              <Clock className="h-3 w-3 text-amber-600" />
                              Pending
                            </Badge>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-xs text-muted-foreground">
                          {new Date(log.sentAt || log.createdAt).toLocaleString('en-US', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Details
                            </Button>
                            <Link
                              href={`/verify/${log.certificateNumber}`}
                              target="_blank"
                              title="Verify Certificate"
                            >
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-card">
                <p className="text-xs text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{logs.length}</span> of{' '}
                  <span className="font-medium text-foreground">{totalRecords}</span> records
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-8 px-2.5 text-xs gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground px-2">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-8 px-2.5 text-xs gap-1"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 px-4 text-muted-foreground">
              <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <h3 className="text-sm font-medium text-foreground mb-1">No email logs found</h3>
              <p className="text-xs max-w-sm mx-auto mb-4">
                {searchQuery || statusFilter !== 'all' || eventFilter !== 'all'
                  ? 'No records match the current filter criteria.'
                  : 'Email logs will appear here once certificates are sent to participants.'}
              </p>
              {(searchQuery || statusFilter !== 'all' || eventFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                    setEventFilter('all')
                    setPage(1)
                  }}
                  className="text-xs"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Email Dispatch Record</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Technical delivery telemetry and audit details.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-lg border border-border">
                <div>
                  <p className="text-[11px] text-muted-foreground">Recipient</p>
                  <p className="font-medium text-foreground mt-0.5">{selectedLog.participantName}</p>
                  <p className="text-muted-foreground text-[11px]">{selectedLog.recipientEmail}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Event</p>
                  <p className="font-medium text-foreground mt-0.5">{selectedLog.eventName}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">Certificate Number</p>
                <p className="font-medium text-foreground">{selectedLog.certificateNumber}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">Delivery Status</p>
                <div>
                  {selectedLog.status === 'success' ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Delivered Successfully
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Failed
                    </Badge>
                  )}
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div className="space-y-1">
                  <p className="text-[11px] text-red-600 font-medium">Error Description</p>
                  <p className="p-2 bg-red-50 text-red-700 rounded border border-red-200 text-xs">
                    {selectedLog.errorMessage}
                  </p>
                </div>
              )}

              {selectedLog.messageIds && selectedLog.messageIds.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">Mailtrap Message IDs</p>
                  <pre className="p-2 bg-muted text-foreground rounded border border-border text-[11px] overflow-x-auto">
                    {selectedLog.messageIds.join('\n')}
                  </pre>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">Recorded Timestamp</p>
                <p className="text-muted-foreground">{new Date(selectedLog.createdAt).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
