import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '../../DashboardLayout'
import api from '../../../api'
import { readPageCache, writePageCache } from '../../pageCache'

export function StudentEvents() {
  const cachedEvents = readPageCache<Array<any>>('student.events.upcoming')
  const cachedProfile = readPageCache<any>('student.profile')
  const cachedHistory = Array.isArray(cachedProfile?.nonAcademicHistory) ? cachedProfile.nonAcademicHistory : []
  const hasCache = !!cachedEvents || !!cachedProfile

  const [tab, setTab] = useState<'upcoming' | 'my'>('upcoming')
  const [items, setItems] = useState<Array<any>>(cachedEvents ?? [])
  const [meEvents, setMeEvents] = useState<Array<any>>(cachedHistory)
  const [loading, setLoading] = useState(!hasCache)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [regOpen, setRegOpen] = useState(false)
  const [regEvent, setRegEvent] = useState<any | null>(null)
  const [regRole, setRegRole] = useState('Participant')
  const [regResult, setRegResult] = useState('')

  useEffect(() => {
    ;(async () => {
      if (!hasCache) setLoading(true)
      setError(null)
      try {
        const [eventsRes, meRes] = await Promise.all([api.get('/api/events'), api.get('/api/students/me')])
        const upcoming = Array.isArray(eventsRes.data?.items) ? eventsRes.data.items : []
        setItems(upcoming)
        writePageCache('student.events.upcoming', upcoming, 120_000)

        const me = meRes.data?.student
        const history = Array.isArray(me?.nonAcademicHistory) ? me.nonAcademicHistory : []
        setMeEvents(history)
        if (me) writePageCache('student.profile', me, 120_000)
      } catch (e: any) {
        setItems([])
        setMeEvents([])
        setError(e?.message || 'Failed to load events.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const myEventIds = useMemo(() => {
    const ids = new Set<number>()
    for (const row of meEvents) {
      const id = Number(row?.event_id ?? row?.event?.id ?? row?.event?.event_id ?? 0)
      if (id) ids.add(id)
    }
    return ids
  }, [meEvents])

  const myRows = useMemo(() => {
    return (meEvents ?? []).slice().sort((a, b) => {
      const ad = a?.event?.event_date ? new Date(a.event.event_date).getTime() : 0
      const bd = b?.event?.event_date ? new Date(b.event.event_date).getTime() : 0
      return bd - ad
    })
  }, [meEvents])

  function openRegister(e: any) {
    setRegEvent(e)
    setRegRole('Participant')
    setRegResult('')
    setRegOpen(true)
  }

  async function submitRegistration() {
    if (!regEvent?.event_id) return
    setSaving(true)
    setError(null)
    try {
      await api.post('/api/events/register', {
        event_id: Number(regEvent.event_id),
        role: regRole,
        result: regResult || null,
      })
      // refresh joined events list
      const meRes = await api.get('/api/students/me')
      const me = meRes.data?.student
      setMeEvents(Array.isArray(me?.nonAcademicHistory) ? me.nonAcademicHistory : [])
      if (me) writePageCache('student.profile', me, 120_000)
      setRegOpen(false)
      setTab('my')
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Registration failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout activeKey="events" title="Events">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">Events</div>
            <div className="panel-subtitle">Register for upcoming events and review your participation</div>
          </div>
        </div>

        {error ? <div className="login-error">{error}</div> : null}

        <div className="tab-nav" style={{ marginBottom: 10 }}>
          {(
            [
              ['upcoming', 'Upcoming events'],
              ['my', 'My registrations'],
            ] as const
          ).map(([k, label]) => (
            <button key={k} className={['tab-btn', tab === k ? 'active' : ''].join(' ')} onClick={() => setTab(k)} type="button">
              {label}
            </button>
          ))}
        </div>

        <div className="table-card">
          <div className="table-card-title">{tab === 'upcoming' ? 'Upcoming Events' : 'My registrations'}</div>
          <div className="table-card-sub">
            {loading
              ? 'Loading…'
              : tab === 'upcoming'
                ? `Showing ${items.length} event(s)`
                : `Showing ${myRows.length} registration(s)`}
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Location</th>
                  {tab === 'upcoming' ? <th>Action</th> : <th>Status</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      Loading…
                    </td>
                  </tr>
                ) : tab === 'upcoming' && items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      No events found.
                    </td>
                  </tr>
                ) : tab === 'my' && myRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      You have no event registrations yet.
                    </td>
                  </tr>
                ) : tab === 'upcoming' ? (
                  items.map((e) => (
                    <tr key={e.event_id ?? `${e.event_name}-${e.event_date}`}>
                      <td style={{ fontWeight: 700 }}>{e.event_name ?? '—'}</td>
                      <td>{e.category ?? '—'}</td>
                      <td>{e.event_date ? new Date(e.event_date).toLocaleDateString() : '—'}</td>
                      <td>{e.location ?? '—'}</td>
                      <td>
                        {myEventIds.has(Number(e.event_id)) ? (
                          <span className="badge-soft green">Registered</span>
                        ) : (
                          <button type="button" className="btn-xs btn-primary" onClick={() => openRegister(e)} disabled={saving}>
                            Register
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  myRows.map((r) => (
                    <tr key={r.id ?? `${r.event_id}-${r.created_at ?? ''}`}>
                      <td style={{ fontWeight: 700 }}>{r.event?.event_name ?? '—'}</td>
                      <td>{r.event?.category ?? '—'}</td>
                      <td>{r.event?.event_date ? new Date(r.event.event_date).toLocaleDateString() : '—'}</td>
                      <td>{r.event?.location ?? '—'}</td>
                      <td>
                        <span className="badge-soft blue">{r.role ?? 'Participant'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {regOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, width: 'min(720px, 100%)', maxHeight: '85vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Register for event</div>
              <button type="button" className="btn-xs btn-outline" onClick={() => setRegOpen(false)} disabled={saving}>
                Close
              </button>
            </div>

            <div style={{ height: 10 }} />

            <div className="card">
              <div className="card-title">{regEvent?.event_name ?? '—'}</div>
              <div className="card-subtitle">
                {(regEvent?.category ?? '—') +
                  (regEvent?.event_date ? ` • ${new Date(regEvent.event_date).toLocaleDateString()}` : '') +
                  (regEvent?.location ? ` • ${regEvent.location}` : '')}
              </div>

              <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                <div>
                  <div className="section-heading">Role in event</div>
                  <input className="form-input" value={regRole} onChange={(e) => setRegRole(e.target.value)} placeholder="e.g., Participant / Player / Competitor" />
                </div>
                <div>
                  <div className="section-heading">Result (optional)</div>
                  <input className="form-input" value={regResult} onChange={(e) => setRegResult(e.target.value)} placeholder="e.g., Joined / Winner / Finalist" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button type="button" className="btn-sm btn-outline" onClick={() => setRegOpen(false)} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="btn-sm btn-primary" onClick={submitRegistration} disabled={saving || !regRole.trim()}>
                {saving ? 'Registering…' : 'Confirm registration'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  )
}

