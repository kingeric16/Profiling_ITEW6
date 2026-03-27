import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../DashboardLayout'
import { apiFetch } from '../../auth'
import { readPageCache, writePageCache } from '../../pageCache'

export function DeanCurriculum() {
  const cached = readPageCache<any[]>('dean.curriculum.subjects')
  const [subjects, setSubjects] = useState<any[] | null>(cached)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    if (!cached) setLoading(true)
    apiFetch('/api/search?q=')
      .then(async (res) => {
        if (!res.ok) return
        const json = (await res.json()) as any
        const payload = Array.isArray(json?.subjects) ? json.subjects : []
        setSubjects(payload)
        writePageCache('dean.curriculum.subjects', payload)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout activeKey="curriculum" title="Curriculum">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">Subject Catalog</div>
            <div className="panel-subtitle">Reference list of subjects (from the database)</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button className="btn-sm btn-outline" type="button" disabled title="Create endpoint not yet wired">
              Add subject
            </button>
            <button className="btn-sm btn-outline" type="button" disabled title="Import endpoint not yet wired">
              Import
            </button>
          </div>
        </div>

        <div className="table-card">
          <div className="table-card-title">Subjects</div>
          <div className="table-card-sub">{loading ? 'Loading…' : `Showing ${(subjects?.length ?? 0).toString()} subject(s)`}</div>
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
                ) : (subjects?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={3} className="muted">
                      No subjects found.
                    </td>
                  </tr>
                ) : (
                  (subjects ?? []).map((s) => (
                    <tr key={s.subject_id ?? s.subject_code}>
                      <td style={{ fontWeight: 700 }}>{s.subject_code ?? '—'}</td>
                      <td>{s.subject_name ?? '—'}</td>
                      <td>{s.units ?? '—'}</td>
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

