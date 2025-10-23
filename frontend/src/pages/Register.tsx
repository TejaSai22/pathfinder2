import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Register() {
  const { register, error, loading } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'student' | 'employer' | 'advisor' | 'admin'>('student')
  const [localError, setLocalError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError(null)
    try {
      await register(name, email, password, role)
      navigate('/')
    } catch (e: any) {
      setLocalError(e?.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h2>Register</h2>
      {(localError || error) && (
        <div style={{ color: 'crimson', marginBottom: '0.75rem' }}>{localError || error}</div>
      )}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ada Lovelace" />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span>Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="student">Student</option>
            <option value="employer">Employer</option>
            <option value="advisor">Advisor</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Register'}
        </button>
      </form>
      <p style={{ marginTop: '0.75rem' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  )
}
