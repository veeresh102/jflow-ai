import React, { useEffect, useState, useRef } from 'react'
import { aiApi } from '../utils/api'
import { Bot, Send, RotateCcw, X, Loader2 } from 'lucide-react'

const PROMPTS = [
  'Suggest task priorities',
  'Analyze my backlog',
  'Help write a task description',
  'Give me a project status summary',
]

export default function Workbench() {
  const [aiHistory, setAiHistory] = useState([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [projectId, setProjectId] = useState(1)
  const chatEnd = useRef(null)

  useEffect(() => {
    loadHistory()
  }, [projectId])

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiHistory])

  const loadHistory = async () => {
    try {
      const res = await aiApi.getHistory(projectId)
      setAiHistory(res.data)
    } catch {
      setAiHistory([])
    }
  }

  const sendAi = async () => {
    if (!aiInput.trim() || aiLoading) return
    const msg = aiInput.trim()
    setAiInput('')
    setAiHistory(prev => [...prev, { role: 'user', content: msg }])
    setAiLoading(true)
    try {
      const res = await aiApi.chat(projectId, msg)
      setAiHistory(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setAiHistory(prev => [...prev, { role: 'assistant', content: 'Could not reach AI service. Is the backend running?' }])
    } finally {
      setAiLoading(false)
    }
  }

  const clearAi = async () => {
    try {
      await aiApi.clearHistory(projectId)
    } catch {}
    setAiHistory([])
  }

  return (
    <div className="min-h-screen p-6 bg-surface text-textPrimary">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">AI Workbench</h1>
        
        <div className="flex gap-6">
          {/* Main chat area */}
          <div className="flex-1 bg-panel border border-border rounded-2xl shadow-lg overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-border bg-[#050506]">
              <p className="text-[11px] font-mono text-accent tracking-widest">AI GEMINI ASSISTANT</p>
              <h2 className="text-lg font-semibold mt-2">Ask me about your project tasks, priorities, or architecture decisions.</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {aiHistory.length === 0 ? (
                <div className="text-sm text-muted space-y-4">
                  <p>Welcome! I'm your AI assistant. I can help you:</p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>Prioritize and organize your backlog</li>
                    <li>Suggest task breakdowns and improvements</li>
                    <li>Analyze project progress and bottlenecks</li>
                    <li>Help draft task descriptions and requirements</li>
                  </ul>
                  <p className="text-[10px] font-mono text-accent mt-4">💡 Try one of the quick prompts below to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiHistory.map((msg, index) => (
                    <div key={index} className={`rounded-lg p-3 ${msg.role === 'assistant' ? 'bg-[#111117] text-textSecondary' : 'bg-[#16161e] text-textPrimary'}`}>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent mb-2">
                        {msg.role === 'assistant' ? 'Assistant' : 'You'}
                      </div>
                      <div className="whitespace-pre-wrap text-sm leading-6">{msg.content}</div>
                    </div>
                  ))}
                  <div ref={chatEnd} />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border space-y-4 bg-[#050506]">
              <div className="flex items-center gap-2">
                <input type="number" value={projectId} min="1"
                  onChange={e => setProjectId(Number(e.target.value))}
                  placeholder="Project ID"
                  className="w-24 rounded border border-border bg-surface px-2 py-1 text-xs text-textPrimary focus:outline-none focus:border-accent" />
                <button onClick={clearAi} className="text-accent hover:text-accentHover text-xs font-mono ml-auto">
                  <RotateCcw size={14} className="inline mr-1" /> Clear
                </button>
              </div>

              <div className="flex items-end gap-3">
                <textarea value={aiInput} onChange={e => setAiInput(e.target.value)}
                  placeholder="Ask J-Flow AI…"
                  className="flex-1 min-h-[60px] rounded-lg border border-border bg-surface px-3 py-2 text-sm text-textPrimary focus:outline-none focus:border-accent"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAi() } }} />
                <button onClick={sendAi} disabled={aiLoading}
                  className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accentHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick prompts sidebar */}
          <div className="w-80 space-y-4">
            <div className="bg-panel border border-border rounded-2xl p-5">
              <p className="text-[10px] font-mono text-muted tracking-widest mb-4">QUICK PROMPTS</p>
              <div className="space-y-3">
                {PROMPTS.map(prompt => (
                  <button key={prompt} 
                    onClick={() => {
                      setAiInput(prompt);
                      setTimeout(() => {
                        const textarea = document.querySelector('textarea');
                        textarea?.focus();
                      }, 0);
                    }}
                    className="w-full text-left rounded-lg border border-border bg-surface px-4 py-3 text-sm text-textSecondary hover:border-accent hover:text-textPrimary hover:bg-[#0f0f15] transition-all duration-200">
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-panel border border-border rounded-2xl p-5">
              <p className="text-[10px] font-mono text-muted tracking-widest mb-3">INFO</p>
              <div className="space-y-2 text-xs text-textSecondary">
                <p>• Powered by Gemini AI</p>
                <p>• Context-aware responses</p>
                <p>• Full conversation history</p>
                <p className="text-[10px] font-mono text-accent mt-4">Enter to send • Shift+Enter for new line</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
