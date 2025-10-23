import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Root() {
  const navigate = useNavigate()
  const { user, loading, logout } = useAuth()

  return (
    <div>
      <header style={{ padding: '1rem', borderBottom: '1px solid #eee', marginBottom: '1rem' }}>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/">Home</Link>
          <Link to="/jobs">Jobs</Link>
          {!user && !loading && (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
          {user && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span>Hello, {user.name}</span>
              {user.role === 'student' && <Link to="/student">Student</Link>}
              {user.role === 'employer' && <Link to="/employer">Employer</Link>}
              {(user.role === 'admin' || user.role === 'advisor') && <Link to="/admin">Admin</Link>}
              <button
                onClick={async () => {
                  await logout()
                  navigate('/')
                }}
              >
                Logout
              </button>
            </div>
          )}
        </nav>
      </header>
      <main style={{ padding: '0 1rem' }}>
        <Outlet />
      </main>
    </div>
  )
}
