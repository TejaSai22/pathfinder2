import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/auth'
import * as api from '../lib/api'

export default function Admin() {
  const { user } = useAuth()
  const canView = useMemo(() => user?.role === 'admin' || user?.role === 'advisor', [user])
  const [rows, setRows] = useState<api.User[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      setErr(null)
      try {
        const data = await api.listUsers()
        if (!ignore) setRows(data)
      } catch (e: any) {
        if (!ignore) setErr(e?.response?.data?.error || e?.message || 'Failed to load users')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    if (canView) load()
    return () => {
      ignore = true
    }
  }, [canView])

  if (!canView) return <div>Forbidden</div>

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <h2>Admin</h2>
      {loading ? (
        <div>Loading…</div>
      ) : err ? (
        <div style={{ color: 'crimson' }}>{err}</div>
      ) : rows.length === 0 ? (
        <div>No users.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
