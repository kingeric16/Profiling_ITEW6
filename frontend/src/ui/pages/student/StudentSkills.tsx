import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../DashboardLayout'
import { apiFetch } from '../../auth'
import { readPageCache, writePageCache } from '../../pageCache'

export function StudentSkills() {
  const cached = readPageCache<Array<{ skill_name: string | null; skill_category: string | null; skill_level: string | null }>>('student.skills')
  const [items, setItems] = useState<Array<{ skill_name: string | null; skill_category: string | null; skill_level: string | null }> | null>(cached ?? null)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    if (!cached) setLoading(true)
    apiFetch('/api/dashboard/student')
      .then(async (res) => {
        if (!res.ok) return
        const json = (await res.json()) as any
        const payload = Array.isArray(json?.skills) ? json.skills : []
        setItems(payload)
        writePageCache('student.skills', payload, 120_000)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout activeKey="skills" title="Skills">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">My Skills</div>
            <div className="panel-subtitle">Skills recorded in your student profile</div>
          </div>
        </div>

        <div className="table-card">
          <div className="table-card-title">Skills</div>
          <div className="table-card-sub">{loading ? 'Loading…' : `Showing ${(items?.length ?? 0).toString()} skill(s)`}</div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Category</th>
                  <th>Level</th>
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
                      No skills recorded yet.
                    </td>
                  </tr>
                ) : (
                  (items ?? []).map((s, idx) => (
                    <tr key={`${s.skill_name ?? 'skill'}-${idx}`}>
                      <td style={{ fontWeight: 700 }}>{s.skill_name ?? '—'}</td>
                      <td>{s.skill_category ?? '—'}</td>
                      <td>
                        <span className="badge">{s.skill_level ?? '—'}</span>
                      </td>
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

