import { Outlet, Link } from 'react-router-dom'

export default function Root() {
  return (
    <div>
      <header style={{ padding: '1rem', borderBottom: '1px solid #eee', marginBottom: '1rem' }}>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </nav>
      </header>
      <main style={{ padding: '0 1rem' }}>
        <Outlet />
      </main>
    </div>
  )
}
