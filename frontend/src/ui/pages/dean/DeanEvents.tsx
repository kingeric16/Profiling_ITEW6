import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../DashboardLayout'
import { apiFetch } from '../../auth'
import { readPageCache, writePageCache } from '../../pageCache'

export function DeanEvents() {
  const cached = readPageCache<any[]>('dean.events')
  const [items, setItems] = useState<any[] | null>(cached)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    if (!cached) setLoading(true)
    apiFetch('/api/events')
      .then(async (res) => {
        if (!res.ok) return
        const json = (await res.json()) as any
        const payload = Array.isArray(json?.items) ? json.items : []
        setItems(payload)
        writePageCache('dean.events', payload)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout activeKey="events" title="Events">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">Event Management</div>
            <div className="panel-subtitle">Upcoming events from the database</div>
          </div>
          <button className="btn-sm btn-outline" type="button" disabled title="Create endpoint not yet wired">
            Create event
          </button>
        </div>

        <div className="table-card">
          <div className="table-card-title">Events</div>
          <div className="table-card-sub">{loading ? 'Loading…' : `Showing ${(items?.length ?? 0).toString()} event(s)`}</div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      Loading…
                    </td>
                  </tr>
                ) : (items?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      No events found.
                    </td>
                  </tr>
                ) : (
                  (items ?? []).map((e) => (
                    <tr key={e.event_id ?? `${e.event_name}-${e.event_date}`}>
                      <td style={{ fontWeight: 700 }}>{e.event_name ?? '—'}</td>
                      <td>{e.category ?? '—'}</td>
                      <td>{e.event_date ? new Date(e.event_date).toLocaleDateString() : '—'}</td>
                      <td>{e.location ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

