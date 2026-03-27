import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '../../DashboardLayout'
import { apiFetch } from '../../auth'
import { readPageCache, writePageCache } from '../../pageCache'

export function FacultySchedule() {
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

  const grouped = useMemo(() => {
    const g = new Map<string, any[]>()
    for (const r of items ?? []) {
      const day = (r.schedule_day || 'Unscheduled') as string
      g.set(day, [...(g.get(day) ?? []), r])
    }
    return Array.from(g.entries())
  }, [items])

  return (
    <DashboardLayout activeKey="schedule" title="Schedule">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">Weekly Schedule</div>
            <div className="panel-subtitle">Organized by day</div>
          </div>
        </div>

        <div className="grid-2">
          {loading ? (
            <div className="card">
              <div className="card-title">Loading…</div>
              <div className="card-subtitle">Fetching your schedule.</div>
            </div>
          ) : (items?.length ?? 0) === 0 ? (
            <div className="card">
              <div className="card-title">No schedule yet</div>
              <div className="card-subtitle">Once assignments are encoded in the database, your schedule will appear here.</div>
            </div>
          ) : (
            grouped.map(([day, list]) => (
              <div key={day} className="card">
                <div className="card-title">{day}</div>
                <div className="card-subtitle">{list.length} class(es)</div>
                <div style={{ marginTop: 10 }} className="mini-table">
                  {list.map((r) => (
                    <div key={r.assignment_id ?? `${r.subject_code}-${r.section_name}-${r.start_time}`} className="mini-row">
                      <div className="mini-main">
                        <div className="mini-title">{(r.subject_code || '—') + (r.section_name ? ` • ${r.section_name}` : '')}</div>
                        <div className="mini-sub">{r.subject_name || ''}</div>
                      </div>
                      <div className="mini-meta">
                        {(r.start_time || '—') + (r.end_time ? `-${r.end_time}` : '')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

