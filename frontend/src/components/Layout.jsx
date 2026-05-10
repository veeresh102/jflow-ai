import React, { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, GitBranch, Cpu, Server, Plus, ChevronRight, Circle } from 'lucide-react'
import { projectsApi } from '../utils/api'

const NAV = [
  { label: 'DASHBOARD', icon: LayoutDashboard, to: '/' },
  { label: 'REPOSITORIES', icon: GitBranch, to: '/repositories' },
  { label: 'AI WORKBENCH', icon: Cpu, to: '/workbench' },
  { label: 'INFRASTRUCTURE', icon: Server, to: '/infrastructure' },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('jflow-user')
    return saved ? JSON.parse(saved) : null
  })
  const [projects, setProjects] = useState([])
  const [showNewProject, setShowNewProject] = useState(false)
  const [newName, setNewName] = useState('')
  const [newStack, setNewStack] = useState('')

  useEffect(() => { loadProjects() }, [])

  const loadProjects = async () => {
    try {
      const res = await projectsApi.getAll()
      setProjects(res.data)
    } catch { /* backend not ready yet */ }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      const res = await projectsApi.create({ name: newName, techStack: newStack, status: 'ACTIVE' })
      setProjects(p => [res.data, ...p])
      setNewName(''); setNewStack(''); setShowNewProject(false)
      navigate(`/project/${res.data.id}`)
    } catch (error) {
      console.error('Project creation failed', error)
      alert('Unable to create project. Please make sure the backend is running and try again.')
    }
  }

  const activeProject = location.pathname.startsWith('/project/')
    ? location.pathname.split('/')[2] : null

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-panel border-r border-border flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-border">
          <div className="w-7 h-7 rounded bg-accent flex items-center justify-center text-white font-bold text-sm mr-2">J</div>
          <span className="font-semibold text-textPrimary tracking-wide text-sm">J-Flow AI</span>
        </div>

        {/* Active Projects */}
        <div className="px-3 pt-4 pb-2">
          <p className="text-[10px] font-mono text-muted tracking-widest mb-2">ACTIVE PROJECTS</p>
          <div className="space-y-0.5">
            {projects.filter(p => p.status === 'ACTIVE').map(p => (
              <Link key={p.id} to={`/project/${p.id}`}
                className={`block rounded px-2 py-2 text-xs transition-colors ${
                  activeProject === String(p.id)
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'text-textSecondary hover:bg-border hover:text-textPrimary'
                }`}>
                <div className="font-medium truncate">{p.name}</div>
                {p.techStack && (
                  <div className="text-[10px] font-mono text-muted mt-0.5 truncate">{p.techStack}</div>
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        {/* New App Button */}
        <div className="p-3 border-t border-border">
          {showNewProject ? (
            <div className="space-y-2">
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Project name"
                className="w-full text-xs bg-surface border border-border rounded px-2 py-1.5 text-textPrimary placeholder-muted focus:outline-none focus:border-accent"
                onKeyDown={e => e.key === 'Enter' && handleCreate()} />
              <input value={newStack} onChange={e => setNewStack(e.target.value)}
                placeholder="Tech stack (optional)"
                className="w-full text-xs bg-surface border border-border rounded px-2 py-1.5 text-textPrimary placeholder-muted focus:outline-none focus:border-accent" />
              <div className="flex gap-1">
                <button onClick={handleCreate}
                  className="flex-1 text-xs bg-accent hover:bg-accentHover text-white rounded px-2 py-1.5 transition-colors">
                  Create
                </button>
                <button onClick={() => setShowNewProject(false)}
                  className="text-xs text-muted hover:text-textPrimary px-2 py-1.5">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewProject(true)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-textSecondary border border-border rounded px-3 py-2 hover:border-accent hover:text-accent transition-colors">
              <Plus size={12} /> NEW APP
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-panel border-b border-border flex items-center px-6 flex-shrink-0">
          <nav className="flex items-center gap-6 flex-1">
            {NAV.map(item => {
              const active = item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to)
              return (
                <Link key={item.label} to={item.to}
                  className={`text-[11px] font-mono tracking-widest transition-colors ${
                    active ? 'text-textPrimary border-b-2 border-accent pb-0.5' : 'text-muted hover:text-textSecondary'
                  }`}>
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-[11px] font-mono text-textSecondary">Hi, {user.username}</span>
                <button
                  onClick={() => {
                    localStorage.removeItem('jflow-user')
                    setUser(null)
                    navigate('/login')
                  }}
                  className="text-[11px] font-mono text-muted hover:text-textPrimary"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[11px] font-mono text-muted hover:text-textPrimary">Login</Link>
                <Link to="/register" className="text-[11px] font-mono text-muted hover:text-textPrimary">Register</Link>
              </>
            )}
            <div className="flex items-center gap-2 text-[11px] font-mono text-success">
              <span className="w-2 h-2 rounded-full bg-success pulse-dot" />
              781: 21.8.2
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Outlet context={{ projects, setProjects, loadProjects }} />
        </main>

        {/* Status bar */}
        <footer className="h-7 bg-[#080809] border-t border-border flex items-center px-4 text-[10px] font-mono text-muted gap-6 flex-shrink-0">
          <span className="text-accent">branch: feature/ai-integration</span>
          <span>build: PASSING</span>
          <span>tests: PASSING</span>
          <div className="flex-1" />
          <span>LAST RUN: SUCCESS (PM 6:00)</span>
          <span>TRANSPILER: 48s</span>
        </footer>
      </div>
    </div>
  )
}
