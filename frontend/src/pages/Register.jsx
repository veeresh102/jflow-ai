import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { default as api } from '../utils/api'

const ROLES = [
  'Frontend',
  'Backend',
  'Full Stack',
  'Data Analysis',
  'Data Analytics',
]

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    try {
      await api.post('/auth/register', { username, email, password, role })
      setSuccess('Registration completed. Redirecting to login...')
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-lg bg-panel border border-border rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-textPrimary mb-4">Create your J-Flow AI account</h1>
        <p className="text-sm text-muted mb-6">Choose your role and join the project dashboard with AI-enhanced collaboration.</p>

        <form onSubmit={handleSubmit} className="grid gap-4">
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
            <label className="text-xs font-mono text-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full mt-1 rounded border border-border bg-surface px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none"
              placeholder="Email address"
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
          <div>
            <label className="text-xs font-mono text-muted">Role <span className="text-red-500">*</span></label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              required
              className="w-full mt-1 rounded border border-border bg-surface px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none"
            >
              <option value="" disabled>Select your role</option>
              {ROLES.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}
          {success && <div className="text-sm text-green-500">{success}</div>}

          <button
            type="submit"
            className="w-full bg-accent text-white rounded px-4 py-2 text-sm font-medium hover:bg-accentHover transition-colors"
          >
            Register
          </button>
        </form>

        <div className="mt-6 text-sm text-muted">
          Already have an account? <Link to="/login" className="text-accent hover:text-accentHover">Sign in here</Link>.
        </div>
      </div>
    </div>
  )
}
