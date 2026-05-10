import React, { useEffect, useState, useRef } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { projectsApi, aiApi } from '../utils/api'
import { ArrowRight, Plus, Trash2, BarChart2, Send, RotateCcw, Loader2 } from 'lucide-react'

function ChatPanel({ projectId }) {
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (projectId) {
      loadHistory()
    }
  }, [projectId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const loadHistory = async () => {
    try {
      const res = await aiApi.getHistory(projectId)
      setHistory(res.data)
    } catch {
      setHistory([])
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading || !projectId) return
    const message = input.trim()
    setInput('')
    setHistory(prev => [...prev, { role: 'user', content: message }])
    setLoading(true)

    try {
      const res = await aiApi.chat(projectId, message)
      setHistory(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setHistory(prev => [...prev, { role: 'assistant', content: 'Unable to reach the AI service. Please confirm the backend is running.' }])
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    if (!projectId) return
    try {
      await aiApi.clearHistory(projectId)
    } catch {}
    setHistory([])
  }

  return (
    <div className="sticky top-6 rounded-3xl border border-border bg-panel p-5 shadow-lg h-[calc(100vh-144px)] overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[10px] font-mono text-accent tracking-[0.3em]">AI ASSISTANT</div>
          <h2 className="text-lg font-semibold text-textPrimary mt-2">Quick Chat</h2>
          <p className="text-[12px] text-textSecondary mt-1">Get fast task guidance without leaving the dashboard.</p>
        </div>
        <button onClick={clearHistory} className="text-[11px] font-mono text-accent hover:text-accentHover">
          <RotateCcw size={14} className="inline mr-1" /> Reset
        </button>
      </div>

      <div className="flex flex-col gap-4 h-[calc(100%-120px)] overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {history.length === 0 ? (
            <div className="text-sm text-textSecondary">
              <p className="mb-3">Ask anything about project planning, priorities, or task execution.</p>
              <p className="text-xs text-muted">Example: "What should I build next?"</p>
            </div>
          ) : (
            history.map((item, idx) => (
              <div key={idx} className={`rounded-3xl p-4 ${item.role === 'assistant' ? 'bg-[#0d0d14] text-textSecondary' : 'bg-[#111118] text-textPrimary'}`}>
                <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-accent mb-2">
                  {item.role === 'assistant' ? 'Assistant' : 'You'}
                </div>
                <div className="text-sm leading-6 whitespace-pre-wrap">{item.content}</div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="mt-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={projectId ? 'Type your AI question...' : 'Select or create a project first.'}
            rows={4}
            className="w-full rounded-3xl border border-border bg-[#09090f] px-4 py-3 text-sm text-textPrimary focus:outline-none focus:border-accent resize-none"
            disabled={!projectId}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[10px] text-muted">Project ID: {projectId || 'N/A'}</span>
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim() || !projectId}
              className="inline-flex items-center gap-2 rounded-3xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentHover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { projects, loadProjects } = useOutletContext()
  const [stats, setStats] = useState({})
  const [activeProjectId, setActiveProjectId] = useState(null)

  useEffect(() => {
    if (projects.length > 0) {
      projects.forEach(async (p) => {
        try {
          const res = await projectsApi.getStats(p.id)
          setStats(prev => ({ ...prev, [p.id]: res.data }))
        } catch {}
      })
      setActiveProjectId((current) => current || projects[0].id)
    }
  }, [projects])

  const handleDelete = async (e, id) => {
    e.preventDefault()
    if (!confirm('Delete this project?')) return
    try {
      await projectsApi.delete(id)
      loadProjects()
    } catch {}
  }

  const statusColor = (status) => ({
    ACTIVE: 'text-success',
    ARCHIVED: 'text-muted',
    COMPLETED: 'text-accent',
  }[status] || 'text-muted')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-textPrimary tracking-tight">Projects</h1>
        <p className="text-textSecondary text-sm mt-1">Manage your active development sprints</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.55fr_0.95fr] gap-6">
        <div className="space-y-6">
          {projects.length === 0 ? (
            <div className="text-center py-24 text-muted rounded-3xl border border-border bg-panel">
              <BarChart2 size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">No projects yet.</p>
              <p className="text-xs mt-1">Click <span className="text-accent">+ NEW APP</span> in the sidebar to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
              {projects.map(p => {
                const s = stats[p.id]
                const pct = s?.completionPercent ?? 0
                return (
                  <Link key={p.id} to={`/project/${p.id}`}
                    className="group block bg-panel border border-border rounded-xl p-5 hover:border-accent/50 transition-colors relative overflow-hidden">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h2 className="font-medium text-textPrimary text-sm group-hover:text-accent transition-colors">{p.name}</h2>
                        {p.techStack && (
                          <span className="text-[10px] font-mono text-muted mt-0.5 block">{p.techStack}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono ${statusColor(p.status)}`}>{p.status}</span>
                        <button onClick={(e) => handleDelete(e, p.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-all p-0.5">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {p.description && (
                      <p className="text-xs text-textSecondary mb-3 line-clamp-2">{p.description}</p>
                    )}

                    {s && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] font-mono text-muted mb-1.5">
                          <span>{s.done}/{s.total} tasks done</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex gap-3 mt-2 text-[10px] font-mono">
                          <span className="text-muted">{s.todo} todo</span>
                          <span className="text-warning">{s.inProgress} active</span>
                          <span className="text-success">{s.done} done</span>
                        </div>
                      </div>
                    )}

                    <ArrowRight size={14} className="absolute bottom-4 right-4 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <ChatPanel projectId={activeProjectId} />
      </div>
    </div>
  )
}
