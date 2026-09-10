'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Copy,
  Download,
  Loader2,
  Check,
  Search,
} from 'lucide-react'

export interface ConsoleLog {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  details?: any
}

export interface EmailResult {
  certificateId: string
  participantName: string
  participantEmail: string
  eventName: string
  status: 'success' | 'failed'
  message?: string
  messageId?: string
}

interface EmailConsoleLogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  logs: ConsoleLog[]
  results?: EmailResult[]
  summary?: {
    total: number
    success: number
    failed: number
  }
  isSending?: boolean
  onClose?: () => void
}

const getLevelBadge = (level: ConsoleLog['level']) => {
  switch (level) {
    case 'success':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'error':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'warn':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'info':
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200'
  }
}

export default function EmailConsoleLog({
  open,
  onOpenChange,
  logs,
  results = [],
  summary,
  isSending = false,
  onClose,
}: EmailConsoleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'console' | 'recipients'>('console')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const exportLogs = () => {
    const logText = logs
      .map(
        (log) =>
          `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${
            log.details ? '\n  Details: ' + JSON.stringify(log.details, null, 2) : ''
          }`
      )
      .join('\n\n')

    const summaryText = summary
      ? `\n\n=== BATCH SUMMARY ===\nTotal: ${summary.total}\nSuccess: ${summary.success}\nFailed: ${summary.failed}`
      : ''

    const fullLog = `CERTIFY — BULK EMAIL DISPATCH REPORT\n${'='.repeat(50)}\nGenerated: ${new Date().toISOString()}\n\n${logText}${summaryText}`

    const blob = new Blob([fullLog], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `email-dispatch-report-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyLogsToClipboard = () => {
    const logText = logs
      .map((log) => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n')
    navigator.clipboard.writeText(logText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false
    if (searchQuery.trim() !== '') {
      return log.message.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const totalCount = summary?.total || (results.length > 0 ? results.length : logs.length > 0 ? 1 : 0)
  const successCount = summary?.success || results.filter((r) => r.status === 'success').length
  const failedCount = summary?.failed || results.filter((r) => r.status === 'failed').length
  const processedCount = successCount + failedCount
  const progressPercent = totalCount > 0 ? Math.min(100, Math.round((processedCount / totalCount) * 100)) : isSending ? 25 : 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-background text-foreground border-border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-semibold text-foreground">
                Email Dispatch Console
              </DialogTitle>
              {isSending ? (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs gap-1.5 font-normal">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Sending Batch
                </Badge>
              ) : (
                logs.length > 0 && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-normal">
                    Completed
                  </Badge>
                )
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Real-time delivery telemetry and candidate status tracking.
            </DialogDescription>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-muted/40 border-b border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 font-sans">
            <span>
              Progress: <strong className="text-foreground font-medium">{processedCount} of {totalCount} dispatched</strong>
            </span>
            <span className="font-medium text-foreground">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full bg-primary transition-all duration-300 ${isSending ? 'animate-pulse' : ''}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-3 px-6 py-3 bg-background border-b border-border text-center">
          <div className="p-2.5 rounded-lg border border-border bg-card">
            <p className="text-xl font-semibold text-foreground">{totalCount}</p>
            <p className="text-xs text-muted-foreground">Total In Batch</p>
          </div>
          <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50">
            <p className="text-xl font-semibold text-emerald-700">{successCount}</p>
            <p className="text-xs text-emerald-600">Successfully Sent</p>
          </div>
          <div className="p-2.5 rounded-lg border border-red-200 bg-red-50/50">
            <p className="text-xl font-semibold text-red-700">{failedCount}</p>
            <p className="text-xs text-red-600">Failed Delivery</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-2.5 bg-card border-b border-border">
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={activeTab === 'console' ? 'default' : 'ghost'}
              className="h-8 text-xs"
              onClick={() => setActiveTab('console')}
            >
              Delivery Logs ({filteredLogs.length})
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'recipients' ? 'default' : 'ghost'}
              className="h-8 text-xs"
              onClick={() => setActiveTab('recipients')}
            >
              Recipients ({results.length})
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'console' && (
              <>
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  aria-label="Filter log level"
                  className="bg-background border border-border text-foreground text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Levels</option>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warn">Warnings</option>
                  <option value="error">Errors</option>
                </select>

                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search logs"
                    className="bg-background border border-border text-foreground text-xs rounded-md pl-7 pr-3 py-1.5 w-36 focus:w-48 transition-all focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                  />
                </div>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={copyLogsToClipboard}
              className="h-8 text-xs gap-1"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              className="h-8 text-xs gap-1"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </div>

        {/* Tab 1: Live Logs View */}
        {activeTab === 'console' && (
          <div
            ref={scrollRef}
            className="flex-1 p-4 text-xs overflow-y-auto bg-background space-y-2 select-text"
          >
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-2.5 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`text-[10px] uppercase px-1.5 py-0 font-normal ${getLevelBadge(log.level)}`}>
                      {log.level}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-foreground leading-relaxed break-words font-sans">{log.message}</p>
                  {log.details && (
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-[11px] text-primary hover:underline font-sans">
                        Details Payload
                      </summary>
                      <pre className="mt-1 text-[11px] text-muted-foreground bg-muted p-2 rounded border border-border overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Info className="h-8 w-8 mb-2 opacity-40 text-muted-foreground" />
                <p className="text-xs">{logs.length === 0 ? 'Waiting for dispatch activity...' : 'No logs match your filter'}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Recipients View */}
        {activeTab === 'recipients' && (
          <div className="flex-1 p-4 overflow-y-auto bg-background space-y-2">
            {results.length > 0 ? (
              results.map((result, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border text-xs ${
                    result.status === 'success'
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : 'bg-red-50/30 border-red-200'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{result.participantName}</p>
                    <p className="text-muted-foreground text-[11px] truncate">{result.participantEmail}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">{result.certificateId}</span>
                    <Badge
                      variant="outline"
                      className={
                        result.status === 'success'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-normal'
                          : 'bg-red-50 text-red-700 border-red-200 font-normal'
                      }
                    >
                      {result.status === 'success' ? 'Delivered' : 'Failed'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Info className="h-8 w-8 mb-2 opacity-40 text-muted-foreground" />
                <p className="text-xs">Recipients list will update in real time as emails are sent.</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-card">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-border text-primary focus:ring-0"
            />
            Auto-scroll live log stream
          </label>

          <Button
            size="sm"
            onClick={() => {
              if (onClose) onClose()
              onOpenChange(false)
            }}
            className="h-8 text-xs"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
