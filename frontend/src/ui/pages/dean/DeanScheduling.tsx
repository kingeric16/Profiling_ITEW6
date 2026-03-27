import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../DashboardLayout'
import { apiFetch } from '../../auth'
import { readPageCache, writePageCache } from '../../pageCache'

export function DeanScheduling() {
  const cached = readPageCache<any>('dean.scheduling')
  const [data, setData] = useState<any | null>(cached)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    if (!cached) setLoading(true)
    apiFetch('/api/dashboard/dean')
      .then(async (res) => {
        if (!res.ok) return
        const payload = (await res.json()) as any
        setData(payload)
        writePageCache('dean.scheduling', payload)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout activeKey="scheduling" title="Scheduling">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">Scheduling Overview</div>
            <div className="panel-subtitle">Monitor readiness for schedule encoding</div>
          </div>
        </div>

        <div className="stats-grid">
          {(
            [
              { label: 'Total Students', value: data?.summary?.totalStudents ?? 0 },
              { label: 'Total Faculty', value: data?.summary?.totalFaculty ?? 0 },
              { label: 'Total Courses', value: data?.summary?.totalCourses ?? 0 },
              { label: 'Total Events', value: data?.summary?.totalEvents ?? 0 },
              { label: 'Total Enrolled', value: data?.summary?.totalEnrolledStudents ?? 0 },
            ] as const
          ).map((s) => (
            <div key={s.label} className="stat-tile">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{loading ? '…' : s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ height: 12 }} />

        <div className="grid-2">
          <div className="card">
            <div className="card-title">What you can do here</div>
            <div className="card-subtitle">Scheduling endpoints can be wired next.</div>
            <div className="muted" style={{ marginTop: 10 }}>
              This page is ready for: section creation, room/time slot setup, and faculty assignments. Once your MySQL tables are present,
              this module can display and validate schedule conflicts.
            </div>
          </div>

          <div className="card">
            <div className="card-title">Required tables</div>
            <div className="card-subtitle">To fully enable scheduling.</div>
            <div className="mini-list" style={{ marginTop: 10 }}>
              {['sections', 'subjects', 'faculty_assignments', 'rooms (optional)'].map((t) => (
                <div key={t} className="mini-item">
                  <span>{t}</span>
                  <span className="badge-soft amber">setup</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

