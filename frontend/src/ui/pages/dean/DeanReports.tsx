import { useEffect, useMemo, useState } from 'react'
import api from '../../../api'
import { DashboardLayout } from '../../DashboardLayout'
import { readPageCache, writePageCache } from '../../pageCache'

type Course = { id: number; course_name: string }

type StudentRow = {
  id: number
  student_number: string
  first_name: string
  middle_name?: string | null
  last_name: string
  overall_gpa: number | null
  year_level: number | null
  height?: number | string | null
  course?: { course_name: string } | null
  section?: { section_name: string } | null
  skills?: Array<{ skill_level: string; skill?: { skill_name: string; skill_category: string } } | any>
  violations?: Array<{ severity_level: string; violation_type: string }> | any[]
}

type ReportResult = {
  report_name?: string
  qualified_students?: StudentRow[]
  students?: StudentRow[]
  criteria?: any
  filters_applied?: any
}

export function DeanReports() {
  const cachedCourses = readPageCache<Course[]>('dean.reports.courses')
  const [courses, setCourses] = useState<Course[]>(cachedCourses ?? [])
  // skills catalog is not required for the current UI (skill filters are text-based)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Qualification report inputs
  const [minHeight, setMinHeight] = useState<number>(170)
  const [minGpa, setMinGpa] = useState<number>(2.0)

  // Advanced search inputs
  const [skillInput, setSkillInput] = useState('Programming')
  const [courseId, setCourseId] = useState<string>('all')
  const [yearLevel, setYearLevel] = useState<string>('all')
  const [minGpaSearch, setMinGpaSearch] = useState<string>('2.0')
  const [noViolations, setNoViolations] = useState<boolean>(false)
  const [eventParticipation, setEventParticipation] = useState<string>('')

  const yearOptions = useMemo(() => [1, 2, 3, 4, 5], [])

  useEffect(() => {
    // preload catalog data for filters
    api
      .get('/api/courses')
      .then((res) => {
        const payload = res.data as { courses?: Course[] }
        const coursesPayload = Array.isArray(payload.courses) ? payload.courses : []
        setCourses(coursesPayload)
        writePageCache('dean.reports.courses', coursesPayload)
      })
      .catch(() => setCourses([]))
  }, [])

  async function runQualification(type: 'basketball' | 'programming' | 'leadership' | 'noViolations' | 'topPerforming') {
    setError(null)
    setLoading(true)
    try {
      if (type === 'basketball') {
        const res = await api.post('/api/reports/qualifications/basketball', { min_height: minHeight })
        setResult(res.data as ReportResult)
      } else if (type === 'programming') {
        const res = await api.post('/api/reports/qualifications/programming', { min_gpa: minGpa })
        setResult(res.data as ReportResult)
      } else if (type === 'leadership') {
        const res = await api.post('/api/reports/qualifications/leadership', {})
        setResult(res.data as ReportResult)
      } else if (type === 'noViolations') {
        const res = await api.post('/api/reports/qualifications/no-violations', {})
        setResult(res.data as ReportResult)
      } else {
        const res = await api.post('/api/reports/qualifications/top-performing', {})
        setResult(res.data as ReportResult)
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to generate report.')
    } finally {
      setLoading(false)
    }
  }

  async function runAdvancedSearch() {
    setError(null)
    setLoading(true)
    try {
      const skillsParsed = skillInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const payload: any = {
        skills: skillsParsed.length ? skillsParsed : undefined,
        min_gpa: minGpaSearch !== '' ? Number(minGpaSearch) : undefined,
        course_id: courseId !== 'all' ? Number(courseId) : undefined,
        year_level: yearLevel !== 'all' ? Number(yearLevel) : undefined,
        no_violations: noViolations || undefined,
        event_participation: eventParticipation !== '' ? eventParticipation : undefined,
        limit: 100,
      }

      // Clean undefined keys
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])

      const res = await api.post('/api/students/advanced-search', payload)
      setResult(res.data as ReportResult)
    } catch (e: any) {
      setError(e?.message || 'Failed to run search.')
    } finally {
      setLoading(false)
    }
  }

  const rows: StudentRow[] = (result?.qualified_students ?? result?.students ?? []) as StudentRow[]

  async function exportCsv(type: 'enrollment' | 'performance' | 'students' | 'grades') {
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/api/reports/export', { type }, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_report_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Export failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout activeKey="reports" title="Reports">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">CCS Reports Generator</div>
            <div className="panel-subtitle">Generate qualifications, filter students, and export results</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-sm btn-outline" onClick={() => exportCsv('students')} disabled={loading}>
              Export Students
            </button>
            <button type="button" className="btn-sm btn-outline" onClick={() => exportCsv('enrollment')} disabled={loading}>
              Export Enrollment
            </button>
            <button type="button" className="btn-sm btn-outline" onClick={() => exportCsv('performance')} disabled={loading}>
              Export Performance
            </button>
            <button type="button" className="btn-sm btn-outline" onClick={() => exportCsv('grades')} disabled={loading}>
              Export Grades
            </button>
          </div>
        </div>

        {error ? <div className="login-error">{error}</div> : null}

        <div className="grid-2">
          <div className="table-card">
            <div className="table-card-title">Qualification Reports</div>
            <div className="table-card-sub">Based on skills, height/GPA, and violations</div>

            <div className="actions">
              <button className="btn-sm btn-primary" type="button" onClick={() => runQualification('basketball')} disabled={loading}>
                Basketball Tryouts
              </button>
              <button className="btn-sm btn-primary" type="button" onClick={() => runQualification('programming')} disabled={loading}>
                Programming Contest
              </button>
              <button className="btn-sm btn-primary" type="button" onClick={() => runQualification('leadership')} disabled={loading}>
                Leadership Skills
              </button>
              <button className="btn-sm btn-outline" type="button" onClick={() => runQualification('noViolations')} disabled={loading}>
                No Violations
              </button>
              <button className="btn-sm btn-outline" type="button" onClick={() => runQualification('topPerforming')} disabled={loading}>
                Top GPA
              </button>
            </div>

            <div style={{ height: 10 }} />

            <div className="two-col" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
              <div>
                <div className="section-heading">Basketball min height</div>
                <input
                  className="form-input"
                  value={String(minHeight)}
                  onChange={(e) => setMinHeight(Number(e.target.value))}
                />
              </div>
              <div>
                <div className="section-heading">Programming min GPA</div>
                <input
                  className="form-input"
                  value={String(minGpa)}
                  onChange={(e) => setMinGpa(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="table-card">
            <div className="table-card-title">Advanced Student Search</div>
            <div className="table-card-sub">Filter by skill, GPA, course/year, violations, and event participation</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              <div>
                <div className="section-heading">Skills (comma-separated)</div>
                <input className="form-input" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 220 }}>
                  <div className="section-heading">Course</div>
                  <select className="form-input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                    <option value="all">All courses</option>
                    {courses.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.course_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: 160 }}>
                  <div className="section-heading">Year level</div>
                  <select className="form-input" value={yearLevel} onChange={(e) => setYearLevel(e.target.value)}>
                    <option value="all">All years</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={String(y)}>
                        Year {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 220 }}>
                  <div className="section-heading">Min GPA</div>
                  <input className="form-input" value={minGpaSearch} onChange={(e) => setMinGpaSearch(e.target.value)} />
                </div>

                <div style={{ minWidth: 220 }}>
                  <div className="section-heading">Event participation keyword</div>
                  <input
                    className="form-input"
                    value={eventParticipation}
                    onChange={(e) => setEventParticipation(e.target.value)}
                    placeholder="e.g., Basketball / Programming / Sports..."
                  />
                </div>
              </div>

              <label className="login-check" style={{ alignItems: 'center', marginTop: 4 }}>
                <input type="checkbox" checked={noViolations} onChange={(e) => setNoViolations(e.target.checked)} />
                <span>No violations (strict)</span>
              </label>

              <button type="button" className="btn-sm btn-primary" onClick={runAdvancedSearch} disabled={loading}>
                Search
              </button>
            </div>
          </div>
        </div>

        <div style={{ height: 14 }} />

        <div className="table-card">
          <div className="table-card-title">Results</div>
          <div className="table-card-sub">
            {loading
              ? 'Generating…'
              : result?.report_name
                ? `${result.report_name} (${rows.length} student(s))`
                : result?.filters_applied
                  ? `Search results (${rows.length} student(s))`
                  : 'Run a report or search to see results'}
          </div>

          <div style={{ height: 10 }} />

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student #</th>
                  <th>Name</th>
                  <th>Course</th>
                  <th>Year</th>
                  <th>GPA</th>
                  <th>Key Skill</th>
                  <th>Violations</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="muted">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="muted">
                      No results found.
                    </td>
                  </tr>
                ) : (
                  rows.map((s) => {
                    const keySkill = (s.skills ?? [])[0]?.skill?.skill_name ?? '—'
                    const violationCount = (s.violations ?? []).length
                    return (
                      <tr key={s.id}>
                        <td>{s.student_number}</td>
                        <td style={{ fontWeight: 700 }}>
                          {s.last_name}, {s.first_name}
                        </td>
                        <td>{s.course?.course_name ?? '—'}</td>
                        <td>{s.year_level ?? '—'}</td>
                        <td>{s.overall_gpa != null ? Number(s.overall_gpa).toFixed(2) : '—'}</td>
                        <td>{keySkill}</td>
                        <td>
                          <span className={violationCount ? 'badge-soft red' : 'badge-soft green'} style={{ borderRadius: 999, padding: '2px 8px', fontSize: 10 }}>
                            {violationCount ? `${violationCount}` : 'None'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

