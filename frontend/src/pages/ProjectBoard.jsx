import React, { useEffect, useState, useRef } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { projectsApi, tasksApi, aiApi } from '../utils/api'
import { Plus, Trash2, Bot, Send, RotateCcw, X, ChevronDown, Loader2 } from 'lucide-react'

const COLUMNS = [
  { id: 'TODO', label: 'TO DO', color: 'text-muted' },
  { id: 'IN_PROGRESS', label: 'IN PROGRESS', color: 'text-warning' },
  { id: 'DONE', label: 'DONE', color: 'text-success' },
]

const LABELS = ['BACKEND', 'FRONTEND', 'DEVOPS', 'TESTING', 'DOCS']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']

const priorityBadge = { LOW: 'bg-muted/20 text-muted', MEDIUM: 'bg-warning/15 text-warning', HIGH: 'bg-danger/15 text-danger' }
const labelBadge = { BACKEND: 'bg-accent/15 text-accent', FRONTEND: 'bg-purple-500/15 text-purple-400',
  DEVOPS: 'bg-success/15 text-success', TESTING: 'bg-yellow-500/15 text-yellow-400', DOCS: 'bg-muted/15 text-muted' }

export default function ProjectBoard() {
  const { id } = useParams()
  const { loadProjects } = useOutletContext()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [aiOpen, setAiOpen] = useState(true)
  const [aiHistory, setAiHistory] = useState([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAddTask, setShowAddTask] = useState(null) // column id
  const [newTask, setNewTask] = useState({ title: '', description: '', label: 'BACKEND', priority: 'MEDIUM' })
  const [editTask, setEditTask] = useState(null)
  const [stats, setStats] = useState(null)
  const chatEnd = useRef(null)

  useEffect(() => { load() }, [id])
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [aiHistory])

  const load = async () => {
    try {
      const [pRes, tRes, hRes, sRes] = await Promise.all([
        projectsApi.getById(id),
        tasksApi.getByProject(id),
        aiApi.getHistory(id),
        projectsApi.getStats(id),
      ])
      setProject(pRes.data)
      setTasks(tRes.data)
      setAiHistory(hRes.data)
      setStats(sRes.data)
    } catch {}
  }

  const columnTasks = (col) => tasks.filter(t => t.status === col)

  const moveTask = async (taskId, newStatus) => {
    try {
      await tasksApi.updateStatus(taskId, newStatus)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
      const sRes = await projectsApi.getStats(id)
      setStats(sRes.data)
    } catch {}
  }

  const handleAddTask = async (colId) => {
    if (!newTask.title.trim()) return
    try {
      const res = await tasksApi.create(id, { ...newTask, status: colId })
      setTasks(prev => [res.data, ...prev])
      setNewTask({ title: '', description: '', label: 'BACKEND', priority: 'MEDIUM' })
      setShowAddTask(null)
      const sRes = await projectsApi.getStats(id)
      setStats(sRes.data)
    } catch {}
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await tasksApi.delete(taskId)
      setTasks(prev => prev.filter(t => t.id !== taskId))
      const sRes = await projectsApi.getStats(id)
      setStats(sRes.data)
    } catch {}
  }

  const handleUpdateTask = async () => {
    if (!editTask) return
    try {
      const res = await tasksApi.update(editTask.id, editTask)
      setTasks(prev => prev.map(t => t.id === editTask.id ? res.data : t))
      setEditTask(null)
    } catch {}
  }

  const sendAi = async () => {
    if (!aiInput.trim() || aiLoading) return
    const msg = aiInput.trim()
    setAiInput('')
    setAiHistory(prev => [...prev, { role: 'user', content: msg }])
    setAiLoading(true)
    try {
      const res = await aiApi.chat(id, msg)
      setAiHistory(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setAiHistory(prev => [...prev, { role: 'assistant', content: 'Could not reach AI service. Is the backend running?' }])
    } finally { setAiLoading(false) }
  }

  const clearAi = async () => {
    try { await aiApi.clearHistory(id) } catch {}
    setAiHistory([])
  }

  if (!project) return (
    <div className="flex items-center justify-center h-full text-muted text-sm">
      <Loader2 size={20} className="animate-spin mr-2" /> Loading project…
    </div>
  )

  return (
    <div className="flex h-full overflow-hidden">
      {/* Kanban area */}
      <div className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-textPrimary">{project.name}</h1>
              <p className="text-textSecondary text-xs mt-0.5">{project.description || 'No description'}</p>
            </div>
            {stats && (
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="text-muted">{stats.total} tasks</span>
                <div className="h-1.5 w-32 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${stats.completionPercent}%` }} />
                </div>
                <span className="text-accent">{stats.completionPercent}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Board */}
        <div className="flex gap-4 items-start">
          {COLUMNS.map(col => (
            <div key={col.id} className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono tracking-widest ${col.color}`}>{col.label}</span>
                  <span className="text-[10px] font-mono text-muted bg-border rounded px-1.5 py-0.5">
                    {columnTasks(col.id).length}
                  </span>
                </div>
                <button onClick={() => setShowAddTask(col.id)}
                  className="text-muted hover:text-accent transition-colors">
                  <Plus size={13} />
                </button>
              </div>

              <div className="space-y-2 kanban-col">
                {columnTasks(col.id).map(task => (
                  <div key={task.id}
                    className="task-card bg-panel border border-border rounded-lg p-3 group cursor-pointer"
                    onClick={() => setEditTask({ ...task })}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-textPrimary font-medium leading-snug flex-1">{task.title}</p>
                      <button onClick={e => { e.stopPropagation(); handleDeleteTask(task.id) }}
                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-all flex-shrink-0">
                        <Trash2 size={11} />
                      </button>
                    </div>
                    {task.description && (
                      <p className="text-[11px] text-textSecondary mt-1.5 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {task.label && (
                        <span className={`text-[9px] font-mono rounded px-1.5 py-0.5 ${labelBadge[task.label] || 'bg-muted/20 text-muted'}`}>
                          {task.label}
                        </span>
                      )}
                      {task.priority && task.priority !== 'MEDIUM' && (
                        <span className={`text-[9px] font-mono rounded px-1.5 py-0.5 ${priorityBadge[task.priority]}`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                    {/* Move buttons */}
                    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      {COLUMNS.filter(c => c.id !== col.id).map(c => (
                        <button key={c.id} onClick={() => moveTask(task.id, c.id)}
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border border-border hover:border-accent hover:text-accent transition-colors text-muted`}>
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Add task form */}
                {showAddTask === col.id && (
                  <div className="bg-panel border border-accent/40 rounded-lg p-3 fade-in">
                    <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                      placeholder="Task title…"
                      className="w-full text-xs bg-surface border border-border rounded px-2 py-1.5 text-textPrimary placeholder-muted mb-2 focus:outline-none focus:border-accent"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleAddTask(col.id)} />
                    <input value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                      placeholder="Description (optional)"
                      className="w-full text-xs bg-surface border border-border rounded px-2 py-1.5 text-textPrimary placeholder-muted mb-2 focus:outline-none focus:border-accent" />
                    <div className="flex gap-2 mb-2">
                      <select value={newTask.label} onChange={e => setNewTask(p => ({ ...p, label: e.target.value }))}
                        className="flex-1 text-xs bg-surface border border-border rounded px-2 py-1.5 text-textSecondary focus:outline-none focus:border-accent">
                        {LABELS.map(l => <option key={l}>{l}</option>)}
                      </select>
                      <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}
                        className="flex-1 text-xs bg-surface border border-border rounded px-2 py-1.5 text-textSecondary focus:outline-none focus:border-accent">
                        {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleAddTask(col.id)}
                        className="flex-1 text-xs bg-accent hover:bg-accentHover text-white rounded px-2 py-1.5 transition-colors">
                        Add Task
                      </button>
                      <button onClick={() => setShowAddTask(null)}
                        className="text-xs text-muted hover:text-textPrimary px-2 py-1.5">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Panel */}
      <div className={`flex-shrink-0 bg-[#0a0a0d] border-l border-border flex flex-col transition-all duration-300 ${aiOpen ? 'w-80' : 'w-10'}`}>
        <div className="h-10 border-b border-border flex items-center px-3 justify-between flex-shrink-0">
          {aiOpen && <span className="text-[10px] font-mono text-accent tracking-widest">AI JAVA ASSISTANT</span>}
          <button onClick={() => setAiOpen(v => !v)} className="text-muted hover:text-textPrimary ml-auto">
            {aiOpen ? <X size={13} /> : <Bot size={14} />}
          </button>
        </div>

        {aiOpen && (
          <>
            {/* Chat history */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
              {aiHistory.length === 0 && (
                <div className="text-muted text-[11px] pt-2">
                  <Bot size={20} className="mb-2 text-accent/50" />
                  <p>Ask me about your project tasks, priorities, or architecture decisions.</p>
                  <div className="mt-3 space-y-1">
                    {['Suggest task priorities', 'Analyze my backlog', 'Help write a task description'].map(q => (
                      <button key={q} onClick={() => { setAiInput(q); }}
                        className="block w-full text-left text-[10px] font-mono text-accent/70 hover:text-accent border border-accent/20 hover:border-accent/50 rounded px-2 py-1.5 transition-colors">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {aiHistory.map((msg, i) => (
                <div key={i} className={`fade-in ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-[90%] rounded-lg px-3 py-2 text-[11px] leading-relaxed text-left ai-message ${
                    msg.role === 'user'
                      ? 'bg-accent/20 text-textPrimary'
                      : 'bg-panel border border-border text-textSecondary'
                  }`}>
                    <div dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>')
                        .replace(/^(\d+\.) /gm, '<br/>$1 ')
                        .replace(/^[-•] /gm, '<br/>• ')
                    }} />
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="fade-in">
                  <div className="inline-flex items-center gap-1.5 bg-panel border border-border rounded-lg px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" style={{ animationDelay: '200ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEnd} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex-shrink-0">
              <div className="flex gap-2 items-end">
                <textarea value={aiInput} onChange={e => setAiInput(e.target.value)}
                  placeholder="Ask J-Flow AI…"
                  rows={2}
                  className="flex-1 text-xs bg-surface border border-border rounded px-2 py-1.5 text-textPrimary placeholder-muted focus:outline-none focus:border-accent resize-none"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAi() } }} />
                <div className="flex flex-col gap-1">
                  <button onClick={sendAi} disabled={aiLoading}
                    className="p-1.5 bg-accent hover:bg-accentHover disabled:opacity-50 rounded text-white transition-colors">
                    <Send size={12} />
                  </button>
                  <button onClick={clearAi} title="Clear history"
                    className="p-1.5 text-muted hover:text-textPrimary border border-border rounded transition-colors">
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>
              <p className="text-[9px] text-muted font-mono mt-1.5">Enter to send · Shift+Enter for newline</p>
            </div>
          </>
        )}
      </div>

      {/* Edit Task Modal */}
      {editTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setEditTask(null)}>
          <div className="bg-panel border border-border rounded-xl p-6 w-full max-w-md fade-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-textPrimary">Edit Task</h3>
              <button onClick={() => setEditTask(null)} className="text-muted hover:text-textPrimary">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <input value={editTask.title} onChange={e => setEditTask(p => ({ ...p, title: e.target.value }))}
                className="w-full text-sm bg-surface border border-border rounded px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                placeholder="Task title" />
              <textarea value={editTask.description || ''} onChange={e => setEditTask(p => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full text-sm bg-surface border border-border rounded px-3 py-2 text-textPrimary placeholder-muted focus:outline-none focus:border-accent resize-none"
                placeholder="Description…" />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-mono text-muted mb-1 block">STATUS</label>
                  <select value={editTask.status} onChange={e => setEditTask(p => ({ ...p, status: e.target.value }))}
                    className="w-full text-xs bg-surface border border-border rounded px-2 py-1.5 text-textSecondary focus:outline-none focus:border-accent">
                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-mono text-muted mb-1 block">PRIORITY</label>
                  <select value={editTask.priority || 'MEDIUM'} onChange={e => setEditTask(p => ({ ...p, priority: e.target.value }))}
                    className="w-full text-xs bg-surface border border-border rounded px-2 py-1.5 text-textSecondary focus:outline-none focus:border-accent">
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-muted mb-1 block">LABEL</label>
                <select value={editTask.label || 'BACKEND'} onChange={e => setEditTask(p => ({ ...p, label: e.target.value }))}
                  className="w-full text-xs bg-surface border border-border rounded px-2 py-1.5 text-textSecondary focus:outline-none focus:border-accent">
                  {LABELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleUpdateTask}
                className="flex-1 text-sm bg-accent hover:bg-accentHover text-white rounded px-3 py-2 transition-colors">
                Save Changes
              </button>
              <button onClick={() => setEditTask(null)}
                className="text-sm text-muted hover:text-textPrimary border border-border rounded px-3 py-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
