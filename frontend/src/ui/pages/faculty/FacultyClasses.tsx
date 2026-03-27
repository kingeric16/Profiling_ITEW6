import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../DashboardLayout'
import { apiFetch } from '../../auth'
import { readPageCache, writePageCache } from '../../pageCache'

export function FacultyClasses() {
  const cached = readPageCache<Array<any>>('faculty.schedule')
  const [items, setItems] = useState<Array<any> | null>(cached ?? null)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    if (!cached) setLoading(true)
    apiFetch('/api/dashboard/faculty')
      .then(async (res) => {
        if (!res.ok) return
        const json = (await res.json()) as any
        const payload = Array.isArray(json?.schedule) ? json.schedule : []
        setItems(payload)
        writePageCache('faculty.schedule', payload, 120_000)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout activeKey="classes" title="My Classes">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">Assigned Classes</div>
            <div className="panel-subtitle">Pulled from faculty assignments</div>
          </div>
        </div>

        <div className="table-card">
          <div className="table-card-title">Class List</div>
          <div className="table-card-sub">{loading ? 'Loading…' : `Showing ${(items?.length ?? 0).toString()} assignment(s)`}</div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Section</th>
                  <th>Room</th>
                  <th>Schedule</th>
                  <th>School Year</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      Loading…
                    </td>
                  </tr>
                ) : (items?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      No classes assigned yet.
                    </td>
                  </tr>
                ) : (
                  (items ?? []).map((r) => (
                    <tr key={r.assignment_id ?? `${r.subject_code}-${r.section_name}-${r.start_time}`}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{r.subject_code || '—'}</div>
                        <div className="muted">{r.subject_name || ''}</div>
                      </td>
                      <td>{r.section_name || '—'}</td>
                      <td>{r.room ? `Room ${r.room}` : '—'}</td>
                      <td>
                        {(r.schedule_day || '—') +
                          (r.start_time && r.end_time ? ` • ${r.start_time}-${r.end_time}` : '')}
                      </td>
                      <td>{r.school_year || '—'}</td>
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

