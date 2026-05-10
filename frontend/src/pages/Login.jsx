import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { default as api } from '../utils/api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const response = await api.post('/auth/login', { username, password })
      const user = response.data
      localStorage.setItem('jflow-user', JSON.stringify(user))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md bg-panel border border-border rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-textPrimary mb-4">Login to J-Flow AI</h1>
        <p className="text-sm text-muted mb-6">Enter your account details to access your projects and AI workbench.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted">Username</label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full mt-1 rounded border border-border bg-surface px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none"
              placeholder="Username"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full mt-1 rounded border border-border bg-surface px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none"
              placeholder="Password"
            />
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <button
            type="submit"
            className="w-full bg-accent text-white rounded px-4 py-2 text-sm font-medium hover:bg-accentHover transition-colors"
          >
            Login
          </button>
        </form>

        <div className="mt-6 text-sm text-muted">
          Don&apos;t have an account? <Link to="/register" className="text-accent hover:text-accentHover">Register now</Link>
        </div>
      </div>
    </div>
  )
}
