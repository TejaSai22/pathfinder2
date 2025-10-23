import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/auth'
import * as api from '../lib/api'

export default function Jobs() {
  const { user } = useAuth()
  const isStudent = useMemo(() => user?.role === 'student', [user])

  const [q, setQ] = useState('')
  const [location, setLocation] = useState('')
  const [skills, setSkills] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  const [rows, setRows] = useState<api.Job[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function search() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listJobs({ q, location, skills: skills.split(',').map(s=>s.trim()).filter(Boolean), page, pageSize })
      setRows(res.items)
      setTotal(res.total)
    } catch (e: any) {
      setError(e?.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    search()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <h2>Job Search</h2>
      <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr 1fr 1fr auto', alignItems: 'end', maxWidth: 900 }}>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span>Query</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="data analyst" />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span>Location</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Remote" />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span>Skills (comma-separated)</span>
          <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="python, sql" />
        </label>
        <button onClick={() => { setPage(1); search() }}>Search</button>
      </div>

      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : rows.length === 0 ? (
        <div>No jobs found.</div>
      ) : (
        <ul style={{ display: 'grid', gap: '0.75rem' }}>
          {rows.map((j) => (
            <li key={j.id} style={{ border: '1px solid #eee', padding: '0.75rem', borderRadius: 6 }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{j.title}</div>
                  <div style={{ color: '#666' }}>{j.location || '—'}</div>
                  {j.skills && j.skills.length > 0 && (
                    <div style={{ marginTop: 4, color: '#555' }}>Skills: {j.skills.join(', ')}</div>
                  )}
                </div>
                {isStudent && <Apply jobId={j.id} />}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button disabled={page<=1} onClick={() => setPage((p) => Math.max(1, p-1))}>Prev</button>
        <span>Page {page}</span>
        <button disabled={(page*pageSize)>=total} onClick={() => setPage((p) => p+1)}>Next</button>
      </div>
    </div>
  )
}

function Apply({ jobId }: { jobId: number }) {
  const [busy, setBusy] = useState(false)
  const [ok, setOk] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  return (
    <div>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setErr(null)
          setOk(null)
          try {
            const res = await api.applyToJob(jobId)
            setOk(`Applied: ${res.status}`)
          } catch (e: any) {
            setErr(e?.response?.data?.error || e?.message || 'Failed to apply')
          } finally {
            setBusy(false)
          }
        }}
      >
        {busy ? 'Applying…' : 'Apply'}
      </button>
      {ok && <small style={{ color: 'green', marginLeft: 8 }}>{ok}</small>}
      {err && <small style={{ color: 'crimson', marginLeft: 8 }}>{err}</small>}
    </div>
  )
}
