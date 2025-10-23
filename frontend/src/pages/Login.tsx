import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { login, error, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError(null)
    try {
      await login(email, password)
      navigate('/')
    } catch (e: any) {
      setLocalError(e?.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h2>Login</h2>
      {(localError || error) && (
        <div style={{ color: 'crimson', marginBottom: '0.75rem' }}>{localError || error}</div>
      )}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '0.75rem' }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  )
}
