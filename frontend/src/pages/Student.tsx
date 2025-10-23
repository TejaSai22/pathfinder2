import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/auth'
import * as api from '../lib/api'

export default function Student() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<api.Profile>({ educationHistory: '', interests: '', skills: [] })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [careers, setCareers] = useState<api.CareerRecommendation[]>([])
  const [jobs, setJobs] = useState<api.JobRecommendation[]>([])
  const [apps, setApps] = useState<api.StudentApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const canView = useMemo(() => user?.role === 'student', [user])

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [p, cr, jr, a] = await Promise.all([
          api.getStudentProfile(),
          api.getCareerRecommendations(),
          api.getJobRecommendations(),
          api.listStudentApplications(),
        ])
        if (!ignore) {
          setProfile(p)
          setCareers(cr)
          setJobs(jr)
          setApps(a)
        }
      } catch (e: any) {
        if (!ignore) setError(e?.response?.data?.error || e?.message || 'Failed to load data')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    if (canView) load()
    return () => {
      ignore = true
    }
  }, [canView])

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      await api.updateStudentProfile(profile)
      const [cr, jr] = await Promise.all([
        api.getCareerRecommendations(),
        api.getJobRecommendations(),
      ])
      setCareers(cr)
      setJobs(jr)
    } catch (e: any) {
      setSaveError(e?.response?.data?.error || e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!canView) return <div>Forbidden</div>
  if (loading) return <div>Loading…</div>
  if (error) return <div style={{ color: 'crimson' }}>{error}</div>

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <section>
        <h2>My Profile</h2>
        <form onSubmit={onSaveProfile} style={{ display: 'grid', gap: '0.5rem', maxWidth: 720 }}>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>Education history</span>
            <textarea
              value={profile.educationHistory}
              onChange={(e) => setProfile({ ...profile, educationHistory: e.target.value })}
              rows={3}
            />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>Interests</span>
            <textarea
              value={profile.interests}
              onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
              rows={2}
            />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>Skills (comma-separated)</span>
            <input
              value={profile.skills.join(', ')}
              onChange={(e) =>
                setProfile({ ...profile, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
              }
              placeholder="python, sql, react"
            />
          </label>
          <div>
            <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            {saveError && <span style={{ marginLeft: '0.75rem', color: 'crimson' }}>{saveError}</span>}
          </div>
        </form>
      </section>

      <section>
        <h2>Career Recommendations</h2>
        {careers.length === 0 ? (
          <p>No recommendations yet.</p>
        ) : (
          <ul>
            {careers.map((c, i) => (
              <li key={i}>
                {c.title} <small style={{ color: '#666' }}>({c.score.toFixed(2)})</small>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Job Matches</h2>
        {jobs.length === 0 ? (
          <p>No matches yet.</p>
        ) : (
          <ul style={{ display: 'grid', gap: '0.5rem' }}>
            {jobs.map((j) => (
              <li key={j.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ flex: 1 }}>{j.title}</span>
                <small style={{ color: '#666' }}>score {j.score.toFixed(2)}</small>
                <ApplyButton jobId={j.id} onApplied={() => refreshApplications()} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>My Applications</h2>
        {apps.length === 0 ? (
          <p>You have not applied to any jobs yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Status</th>
                <th>Applied</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.applicationID}>
                  <td>{a.jobTitle || a.jobID}</td>
                  <td>{a.status}</td>
                  <td>{new Date(a.appliedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )

  async function refreshApplications() {
    const a = await api.listStudentApplications()
    setApps(a)
  }
}

function ApplyButton({ jobId, onApplied }: { jobId: number; onApplied?: () => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  return (
    <div>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setErr(null)
          try {
            await api.applyToJob(jobId)
            onApplied?.()
          } catch (e: any) {
            setErr(e?.response?.data?.error || e?.message || 'Failed to apply')
          } finally {
            setBusy(false)
          }
        }}
      >
        {busy ? 'Applying…' : 'Apply'}
      </button>
      {err && <small style={{ color: 'crimson', marginLeft: '0.5rem' }}>{err}</small>}
    </div>
  )
}
