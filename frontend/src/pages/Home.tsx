import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../lib/auth'

export default function Home() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && !loading) {
      if (user.role === 'student') navigate('/student')
      if (user.role === 'employer') navigate('/employer')
      if (user.role === 'admin' || user.role === 'advisor') navigate('/admin')
    }
  }, [user, loading, navigate])

  return (
    <div>
      <h1>Pathfinder</h1>
      <p>Welcome! Please login or register to continue.</p>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </div>
  )
}
