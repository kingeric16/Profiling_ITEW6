import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../DashboardLayout'
import { apiFetch } from '../../auth'
import { readPageCache, writePageCache } from '../../pageCache'

export function StudentSubjects() {
  const cached = readPageCache<Array<{ subject_code: string; subject_name: string; units: number }>>('student.subjects')
  const [items, setItems] = useState<Array<{ subject_code: string; subject_name: string; units: number }> | null>(cached ?? null)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    if (!cached) setLoading(true)
    apiFetch('/api/dashboard/student')
      .then(async (res) => {
        if (!res.ok) return
        const json = (await res.json()) as any
        const payload = Array.isArray(json?.subjects) ? json.subjects : []
        setItems(payload)
        writePageCache('student.subjects', payload, 120_000)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout activeKey="subjects" title="Subjects">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">Enrolled Subjects</div>
            <div className="panel-subtitle">Your active subjects pulled from the database</div>
          </div>
        </div>

        <div className="table-card">
          <div className="table-card-title">Subjects</div>
          <div className="table-card-sub">{loading ? 'Loading…' : `Showing ${(items?.length ?? 0).toString()} subject(s)`}</div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Subject</th>
                  <th>Units</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="muted">
                      Loading…
                    </td>
                  </tr>
                ) : (items?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={3} className="muted">
                      No enrolled subjects found.
                    </td>
                  </tr>
                ) : (
                  (items ?? []).map((s) => (
                    <tr key={s.subject_code}>
                      <td style={{ fontWeight: 700 }}>{s.subject_code}</td>
                      <td>{s.subject_name}</td>
                      <td>{s.units}</td>
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

