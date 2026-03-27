import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../../api'
import { DashboardLayout } from '../../DashboardLayout'
import { readPageCache, writePageCache } from '../../pageCache'

type ScheduleRow = {
  assignment_id: number
  subject_id: number
  subject_code: string | null
  subject_name: string | null
  section_id: number
  section_name: string | null
  school_year: string | null
}

type StudentRow = { id: number; student_number: string | null; first_name: string; last_name: string; section_id: number; year_level: number }

export function FacultyGrades() {
  const navigate = useNavigate()
  const location = useLocation()

  const qp = useMemo(() => new URLSearchParams(location.search), [location.search])
  const preStudentId = qp.get('student_id')

  const cached = readPageCache<{ schedule: ScheduleRow[]; students: StudentRow[] }>('faculty.grades.context')
  const [schedule, setSchedule] = useState<ScheduleRow[]>(cached?.schedule ?? [])
  const [students, setStudents] = useState<StudentRow[]>(cached?.students ?? [])
  const [loading, setLoading] = useState(!cached)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    student_id: preStudentId ?? '',
    subject_id: '',
    semester: '1st Semester',
    school_year: '',
    grade: '',
  })

  useEffect(() => {
    ;(async () => {
      if (!cached) setLoading(true)
      setError(null)
      try {
        const [dashRes, studentsRes] = await Promise.all([api.get('/api/dashboard/faculty'), api.get('/api/students')])
        const schedulePayload = (dashRes.data?.schedule ?? []) as ScheduleRow[]
        const studentsPayload = (studentsRes.data?.students ?? []) as StudentRow[]
        setSchedule(schedulePayload)
        setStudents(studentsPayload)
        writePageCache('faculty.grades.context', { schedule: schedulePayload, students: studentsPayload }, 120_000)
      } catch (e: any) {
        setSchedule([])
        setStudents([])
        setError(e?.message || 'Failed to load grade entry data.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const student = useMemo(() => {
    const id = Number(form.student_id || 0)
    if (!id) return null
    return students.find((s) => s.id === id) ?? null
  }, [form.student_id, students])

  const allowedSubjects = useMemo(() => {
    if (!student) return schedule
    return schedule.filter((r) => Number(r.section_id) === Number(student.section_id))
  }, [schedule, student])

  const suggestedYear = useMemo(() => {
    if (!schedule.length) return ''
    const years = Array.from(new Set(schedule.map((s) => s.school_year).filter(Boolean))) as string[]
    return years[0] ?? ''
  }, [schedule])

  useEffect(() => {
    if (!form.school_year && suggestedYear) setForm((p) => ({ ...p, school_year: suggestedYear }))
  }, [suggestedYear])

  async function submit() {
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      const payload = {
        student_id: Number(form.student_id),
        subject_id: Number(form.subject_id),
        grade: Number(form.grade),
        semester: form.semester,
        school_year: form.school_year,
      }
      await api.post('/api/faculty/submit-grade', payload)
      setSuccess('Grade submitted successfully.')
      setForm((p) => ({ ...p, grade: '' }))
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to submit grade.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout activeKey="grades" title="Grade Entry">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">Submit Grade</div>
            <div className="panel-subtitle">Select a student, then pick a subject from your schedule</div>
          </div>
          <button type="button" className="btn-sm btn-outline" onClick={() => navigate('/faculty/students')}>
            Back to Students
          </button>
        </div>

        {error ? <div className="login-error">{error}</div> : null}
        {success ? (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: 10, borderRadius: 12, color: '#065f46' }}>{success}</div>
        ) : null}

        <div style={{ height: 12 }} />

        <div className="grid-2">
          <div className="table-card">
            <div className="table-card-title">Grade form</div>
            <div className="table-card-sub">{loading ? 'Loading…' : 'All fields are required.'}</div>

            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              <div>
                <div className="section-heading">Student</div>
                <select
                  className="form-input"
                  value={form.student_id}
                  onChange={(e) => setForm((p) => ({ ...p, student_id: e.target.value, subject_id: '' }))}
                  disabled={loading || saving}
                >
                  <option value="">Select student…</option>
                  {students.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {(s.student_number ? `${s.student_number} • ` : '') + `${s.last_name}, ${s.first_name}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="section-heading">Subject (from your assigned section)</div>
                <select
                  className="form-input"
                  value={form.subject_id}
                  onChange={(e) => setForm((p) => ({ ...p, subject_id: e.target.value }))}
                  disabled={loading || saving || !form.student_id}
                >
                  <option value="">{form.student_id ? 'Select subject…' : 'Select a student first…'}</option>
                  {allowedSubjects.map((r) => (
                    <option key={r.assignment_id} value={String(r.subject_id)}>
                      {(r.subject_code || '—') + ' • ' + (r.subject_name || '') + ' • ' + (r.section_name || '—')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="two-col">
                <div>
                  <div className="section-heading">Semester</div>
                  <select className="form-input" value={form.semester} onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))} disabled={loading || saving}>
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
                <div>
                  <div className="section-heading">School year</div>
                  <input className="form-input" value={form.school_year} onChange={(e) => setForm((p) => ({ ...p, school_year: e.target.value }))} placeholder="e.g., 2025-2026" disabled={loading || saving} />
                </div>
              </div>

              <div>
                <div className="section-heading">Grade</div>
                <input className="form-input" value={form.grade} onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))} placeholder="0.0 - 5.0" disabled={loading || saving} />
              </div>

              <button
                type="button"
                className="btn-sm btn-primary"
                onClick={submit}
                disabled={loading || saving || !form.student_id || !form.subject_id || !form.school_year || form.grade.trim() === ''}
              >
                {saving ? 'Submitting…' : 'Submit grade'}
              </button>
            </div>
          </div>

          <div className="table-card">
            <div className="table-card-title">Student context</div>
            <div className="table-card-sub">Quick confirmation before you submit</div>

            {!student ? (
              <div className="muted" style={{ padding: 10 }}>
                Select a student to see details.
              </div>
            ) : (
              <div className="mini-list" style={{ marginTop: 10 }}>
                <div className="mini-item">
                  <span>Student</span>
                  <span className="badge-soft gray">
                    {student.last_name}, {student.first_name}
                  </span>
                </div>
                <div className="mini-item">
                  <span>Student #</span>
                  <span className="badge-soft blue">{student.student_number ?? '—'}</span>
                </div>
                <div className="mini-item">
                  <span>Year level</span>
                  <span className="badge-soft amber">{student.year_level}</span>
                </div>
                <div className="mini-item">
                  <span>Section ID</span>
                  <span className="badge-soft gray">{student.section_id}</span>
                </div>
                <div className="mini-item">
                  <span>Allowed subjects</span>
                  <span className="badge-soft green">{allowedSubjects.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

