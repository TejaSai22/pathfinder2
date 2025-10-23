import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/auth'
import * as api from '../lib/api'

export default function Employer() {
  const { user } = useAuth()
  const canView = useMemo(() => user?.role === 'employer', [user])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [salary, setSalary] = useState('')
  const [skills, setSkills] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const [jobs, setJobs] = useState<api.Job[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState<string | null>(null)

  async function refreshJobs() {
    setLoading(true)
    setLoadErr(null)
    try {
      const data = await api.listEmployerJobs()
      setJobs(data)
    } catch (e: any) {
      setLoadErr(e?.response?.data?.error || e?.message || 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canView) refreshJobs()
  }, [canView])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    setOk(null)
    try {
      const id = await api.createJob({
        title,
        description,
        location: location || undefined,
        salary: salary || undefined,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      })
      setOk(`Created job #${id.id}`)
      setTitle('')
      setDescription('')
      setLocation('')
      setSalary('')
      setSkills('')
      await refreshJobs()
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Failed to create job')
    } finally {
      setBusy(false)
    }
  }

  if (!canView) return <div>Forbidden</div>

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <h2>Employer Dashboard</h2>

      <section>
        <h3>Create Job</h3>
        <form onSubmit={onCreate} style={{ display: 'grid', gap: '0.5rem', maxWidth: 800 }}>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              <span>Location</span>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Remote" />
            </label>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              <span>Salary</span>
              <input value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="$100k" />
            </label>
          </div>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>Skills (comma-separated)</span>
            <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="react, typescript" />
          </label>
          <div>
            <button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create job'}</button>
            {ok && <small style={{ color: 'green', marginLeft: 8 }}>{ok}</small>}
            {err && <small style={{ color: 'crimson', marginLeft: 8 }}>{err}</small>}
          </div>
        </form>
      </section>

      <section>
        <h3>My Jobs</h3>
        {loading ? (
          <div>Loading…</div>
        ) : loadErr ? (
          <div style={{ color: 'crimson' }}>{loadErr}</div>
        ) : jobs.length === 0 ? (
          <div>No jobs yet.</div>
        ) : (
          <ul style={{ display: 'grid', gap: '0.75rem' }}>
            {jobs.map((j) => (
              <li key={j.id}>
                <JobApplicants jobId={j.id} title={j.title} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function JobApplicants({ jobId, title }: { jobId: number; title: string }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<api.Applicant[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setErr(null)
    try {
      const data = await api.listApplicants(jobId)
      setRows(data)
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Failed to load applicants')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && rows == null) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <div style={{ border: '1px solid #eee', padding: '0.75rem', borderRadius: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontWeight: 600, flex: 1 }}>{title}</div>
        <button onClick={() => setOpen((v) => !v)}>{open ? 'Hide' : 'View'} applicants</button>
      </div>
      {open && (
        <div style={{ marginTop: 8 }}>
          {loading ? (
            <div>Loading…</div>
          ) : err ? (
            <div style={{ color: 'crimson' }}>{err}</div>
          ) : rows == null || rows.length === 0 ? (
            <div>No applicants yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.applicationID}>
                    <td>{a.studentName}</td>
                    <td>{a.status}</td>
                    <td>
                      <UpdateStatus appId={a.applicationID} onUpdated={load} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

function UpdateStatus({ appId, onUpdated }: { appId: number; onUpdated: () => void }) {
  const [status, setStatus] = useState('Submitted')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="Submitted">Submitted</option>
        <option value="Viewed">Viewed</option>
        <option value="Shortlisted">Shortlisted</option>
        <option value="Accepted">Accepted</option>
        <option value="Rejected">Rejected</option>
      </select>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setErr(null)
          try {
            await api.updateApplicationStatus(appId, status)
            onUpdated()
          } catch (e: any) {
            setErr(e?.response?.data?.error || e?.message || 'Update failed')
          } finally {
            setBusy(false)
          }
        }}
      >
        {busy ? 'Saving…' : 'Save'}
      </button>
      {err && <small style={{ color: 'crimson' }}>{err}</small>}
    </div>
  )
}
