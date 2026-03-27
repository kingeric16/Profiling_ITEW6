import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../DashboardLayout'
import api from '../../../api'
import { readPageCache, writePageCache } from '../../pageCache'

type Student = { student_id: number; student_number: string | null; first_name: string; last_name: string; year_level: string | null }

export function FacultyStudents() {
  const cached = readPageCache<{ students: Student[]; schedule: any[]; sections: any[] }>('faculty.students.core')
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>(cached?.students ?? [])
  const [schedule, setSchedule] = useState<any[]>(cached?.schedule ?? [])
  const [sections, setSections] = useState<any[]>(cached?.sections ?? [])
  const [loading, setLoading] = useState(!cached)
  const [q, setQ] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [viewOpen, setViewOpen] = useState(false)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewStudent, setViewStudent] = useState<any | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    student_number: '',
    email: '',
    password: '',
    gender: 'male' as 'male' | 'female' | 'other',
    birthdate: '',
    contact_number: '',
    guardian_name: '',
    guardian_contact: '',
    height: '',
    weight: '',
    bmi: '',
    section_id: '',
  })

  async function refresh() {
    const res = await api.get('/api/dashboard/faculty')
    const studentsPayload = Array.isArray(res.data?.students) ? res.data.students : []
    const schedulePayload = Array.isArray(res.data?.schedule) ? res.data.schedule : []
    setStudents(studentsPayload)
    setSchedule(schedulePayload)
    writePageCache('faculty.students.core', { students: studentsPayload, schedule: schedulePayload, sections }, 120_000)
  }

  useEffect(() => {
    ;(async () => {
      if (!cached) setLoading(true)
      setError(null)
      try {
        const [dashRes, sectionsRes] = await Promise.all([api.get('/api/dashboard/faculty'), api.get('/api/sections')])
        const studentsPayload = Array.isArray(dashRes.data?.students) ? dashRes.data.students : []
        const schedulePayload = Array.isArray(dashRes.data?.schedule) ? dashRes.data.schedule : []
        const sectionsPayload = Array.isArray(sectionsRes.data?.sections) ? sectionsRes.data.sections : []
        setStudents(studentsPayload)
        setSchedule(schedulePayload)
        setSections(sectionsPayload)
        writePageCache('faculty.students.core', { students: studentsPayload, schedule: schedulePayload, sections: sectionsPayload }, 120_000)
      } catch (e: any) {
        setError(e?.message || 'Failed to load students.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const activeSection = useMemo(() => {
    const s = schedule?.[0]
    return s?.section_name ? String(s.section_name) : null
  }, [schedule])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return students
    return students.filter((s) => {
      const name = `${s.last_name}, ${s.first_name}`.toLowerCase()
      return name.includes(t) || String(s.student_number ?? '').toLowerCase().includes(t)
    })
  }, [q, students])

  async function openView(studentId: number) {
    setViewOpen(true)
    setViewLoading(true)
    setViewStudent(null)
    try {
      const res = await api.get(`/api/students/${studentId}`)
      setViewStudent(res.data?.student ?? null)
    } finally {
      setViewLoading(false)
    }
  }

  const assignedSectionOptions = useMemo(() => {
    const ids = new Set<number>()
    for (const r of schedule) {
      const id = Number(r?.section_id ?? 0)
      if (id) ids.add(id)
    }
    const out = Array.from(ids)
      .map((id) => {
        const sec = sections.find((s) => Number(s.id) === id)
        const name = sec?.section_name || schedule.find((r) => Number(r.section_id) === id)?.section_name || `Section ${id}`
        return { id, name, sec }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
    return out
  }, [schedule, sections])

  async function submitNewStudent() {
    setSaving(true)
    setError(null)
    try {
      const selected = assignedSectionOptions.find((s) => String(s.id) === String(addForm.section_id))
      const sec = selected?.sec
      if (!sec) {
        setError('Please select a section you are assigned to.')
        return
      }

      const payload: any = {
        first_name: addForm.first_name,
        middle_name: addForm.middle_name || null,
        last_name: addForm.last_name,
        student_number: addForm.student_number,
        email: addForm.email,
        password: addForm.password,
        gender: addForm.gender,
        birthdate: addForm.birthdate,
        contact_number: addForm.contact_number,
        guardian_name: addForm.guardian_name,
        guardian_contact: addForm.guardian_contact,
        height: addForm.height !== '' ? Number(addForm.height) : null,
        weight: addForm.weight !== '' ? Number(addForm.weight) : null,
        bmi: addForm.bmi !== '' ? Number(addForm.bmi) : null,
        course_id: Number(sec.course_id),
        section_id: Number(sec.id),
        year_level: Number(sec.year_level),
      }

      await api.post('/api/provision/student', payload)
      setAddOpen(false)
      await refresh()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Create student failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout activeKey="students" title="Students">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">Student List</div>
            <div className="panel-subtitle">{activeSection ? `Section: ${activeSection}` : 'Section: —'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <input className="form-input" style={{ width: 220 }} placeholder="Search by name or number…" value={q} onChange={(e) => setQ(e.target.value)} />
            <button type="button" className="btn-sm btn-primary" onClick={() => setAddOpen(true)} disabled={loading || saving}>
              Add student
            </button>
            <button type="button" className="btn-sm btn-outline" onClick={() => navigate('/faculty/grades')} disabled={loading}>
              Grade entry
            </button>
          </div>
        </div>

        {error ? <div className="login-error">{error}</div> : null}

        <div className="table-card">
          <div className="table-card-title">Directory</div>
          <div className="table-card-sub">{loading ? 'Loading…' : `Showing ${filtered.length} of ${students.length}`}</div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Number</th>
                  <th>Name</th>
                  <th>Year Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      Loading…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.student_id}>
                      <td>{s.student_number ?? '—'}</td>
                      <td style={{ fontWeight: 700 }}>{`${s.last_name}, ${s.first_name}`}</td>
                      <td>
                        <span className="badge-soft blue">{s.year_level ?? '—'}</span>
                      </td>
                      <td>
                        <button type="button" className="btn-xs btn-soft" onClick={() => openView(s.student_id)} disabled={loading}>
                          View
                        </button>
                        <button type="button" className="btn-xs btn-outline" onClick={() => navigate(`/faculty/grades?student_id=${encodeURIComponent(String(s.student_id))}`)} disabled={loading}>
                          Enter grade
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <aside className="side-stack">
        <div className="calendar-card">
          <div className="section-heading">Quick summary</div>
          <div className="mini-list">
            <div className="mini-item">
              <span>Total</span>
              <span className="badge-soft blue">{students.length}</span>
            </div>
            <div className="mini-item">
              <span>Filtered</span>
              <span className="badge-soft amber">{filtered.length}</span>
            </div>
            <div className="mini-item">
              <span>Assignments</span>
              <span className="badge-soft green">{schedule.length}</span>
            </div>
          </div>
        </div>
      </aside>

      {viewOpen ? (
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
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, width: 'min(960px, 100%)', maxHeight: '85vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Student profile</div>
              <button type="button" className="btn-xs btn-outline" onClick={() => setViewOpen(false)}>
                Close
              </button>
            </div>

            <div style={{ height: 10 }} />

            {viewLoading ? (
              <div className="muted" style={{ padding: 10 }}>
                Loading…
              </div>
            ) : !viewStudent ? (
              <div className="muted" style={{ padding: 10 }}>
                No data.
              </div>
            ) : (
              <div className="grid-2">
                <div className="card">
                  <div className="card-title">
                    {viewStudent.last_name}, {viewStudent.first_name} {viewStudent.middle_name ?? ''}
                  </div>
                  <div className="card-subtitle">{viewStudent.student_number}</div>
                  <div className="mini-list" style={{ marginTop: 10 }}>
                    <div className="mini-item">
                      <span>Email</span>
                      <span className="badge-soft gray">{viewStudent.email}</span>
                    </div>
                    <div className="mini-item">
                      <span>Course</span>
                      <span className="badge-soft blue">{viewStudent.course?.course_name ?? '—'}</span>
                    </div>
                    <div className="mini-item">
                      <span>Year/Section</span>
                      <span className="badge-soft amber">
                        {viewStudent.year_level ?? '—'} • {viewStudent.section?.section_name ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">Comprehensive data</div>
                  <div className="card-subtitle">Read-only (skills, violations, history)</div>
                  <div className="mini-list" style={{ marginTop: 10 }}>
                    <div className="mini-item">
                      <span>Skills</span>
                      <span className="badge-soft green">{(viewStudent.skills ?? []).length}</span>
                    </div>
                    <div className="mini-item">
                      <span>Affiliations</span>
                      <span className="badge-soft blue">{(viewStudent.affiliations ?? []).length}</span>
                    </div>
                    <div className="mini-item">
                      <span>Violations</span>
                      <span className="badge-soft red">{(viewStudent.violations ?? []).length}</span>
                    </div>
                    <div className="mini-item">
                      <span>Academic records</span>
                      <span className="badge-soft amber">{(viewStudent.academicHistory ?? []).length}</span>
                    </div>
                    <div className="mini-item">
                      <span>Event participation</span>
                      <span className="badge-soft gray">{(viewStudent.nonAcademicHistory ?? []).length}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn-sm btn-primary" onClick={() => navigate(`/faculty/grades?student_id=${encodeURIComponent(String(viewStudent.id))}`)}>
                      Enter grade
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {addOpen ? (
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
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, width: 'min(960px, 100%)', maxHeight: '85vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Add student (provision account)</div>
              <button type="button" className="btn-xs btn-outline" onClick={() => setAddOpen(false)} disabled={saving}>
                Close
              </button>
            </div>

            {error ? <div className="login-error">{error}</div> : null}

            <div style={{ height: 10 }} />

            <div className="grid-2">
              <div className="card">
                <div className="card-title">Student info</div>
                <div className="card-subtitle">Creates a login + student record</div>
                <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                  <div className="two-col">
                    <div>
                      <div className="section-heading">First name</div>
                      <input className="form-input" value={addForm.first_name} onChange={(e) => setAddForm((p) => ({ ...p, first_name: e.target.value }))} />
                    </div>
                    <div>
                      <div className="section-heading">Middle name (optional)</div>
                      <input className="form-input" value={addForm.middle_name} onChange={(e) => setAddForm((p) => ({ ...p, middle_name: e.target.value }))} />
                    </div>
                  </div>
                  <div className="two-col">
                    <div>
                      <div className="section-heading">Last name</div>
                      <input className="form-input" value={addForm.last_name} onChange={(e) => setAddForm((p) => ({ ...p, last_name: e.target.value }))} />
                    </div>
                    <div>
                      <div className="section-heading">Student number</div>
                      <input
                        className="form-input"
                        value={addForm.student_number}
                        onChange={(e) => setAddForm((p) => ({ ...p, student_number: e.target.value }))}
                        inputMode="numeric"
                        maxLength={7}
                        placeholder="7-digit ID"
                      />
                    </div>
                  </div>

                  <div className="two-col">
                    <div>
                      <div className="section-heading">Email</div>
                      <input className="form-input" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} />
                    </div>
                    <div>
                      <div className="section-heading">Password</div>
                      <input className="form-input" type="password" value={addForm.password} onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))} placeholder="min 6 chars" />
                    </div>
                  </div>

                  <div className="two-col">
                    <div>
                      <div className="section-heading">Gender</div>
                      <select className="form-input" value={addForm.gender} onChange={(e) => setAddForm((p) => ({ ...p, gender: e.target.value as any }))}>
                        <option value="male">male</option>
                        <option value="female">female</option>
                        <option value="other">other</option>
                      </select>
                    </div>
                    <div>
                      <div className="section-heading">Birthdate</div>
                      <input type="date" className="form-input" value={addForm.birthdate} onChange={(e) => setAddForm((p) => ({ ...p, birthdate: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <div className="section-heading">Contact number</div>
                    <input className="form-input" value={addForm.contact_number} onChange={(e) => setAddForm((p) => ({ ...p, contact_number: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-title">Placement & guardian</div>
                <div className="card-subtitle">Limited to your assigned sections</div>
                <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                  <div>
                    <div className="section-heading">Section</div>
                    <select className="form-input" value={addForm.section_id} onChange={(e) => setAddForm((p) => ({ ...p, section_id: e.target.value }))}>
                      <option value="">Select section…</option>
                      {assignedSectionOptions.map((s) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="two-col">
                    <div>
                      <div className="section-heading">Guardian name</div>
                      <input className="form-input" value={addForm.guardian_name} onChange={(e) => setAddForm((p) => ({ ...p, guardian_name: e.target.value }))} />
                    </div>
                    <div>
                      <div className="section-heading">Guardian contact</div>
                      <input className="form-input" value={addForm.guardian_contact} onChange={(e) => setAddForm((p) => ({ ...p, guardian_contact: e.target.value }))} />
                    </div>
                  </div>

                  <div className="two-col">
                    <div>
                      <div className="section-heading">Height (optional)</div>
                      <input className="form-input" value={addForm.height} onChange={(e) => setAddForm((p) => ({ ...p, height: e.target.value }))} />
                    </div>
                    <div>
                      <div className="section-heading">Weight (optional)</div>
                      <input className="form-input" value={addForm.weight} onChange={(e) => setAddForm((p) => ({ ...p, weight: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <div className="section-heading">BMI (optional)</div>
                    <input className="form-input" value={addForm.bmi} onChange={(e) => setAddForm((p) => ({ ...p, bmi: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button type="button" className="btn-sm btn-outline" onClick={() => setAddOpen(false)} disabled={saving}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-sm btn-primary"
                onClick={submitNewStudent}
                disabled={
                  saving ||
                  !addForm.first_name.trim() ||
                  !addForm.last_name.trim() ||
                  !addForm.student_number.trim() ||
                  addForm.student_number.trim().length !== 7 ||
                  !addForm.email.trim() ||
                  addForm.password.trim().length < 6 ||
                  !addForm.birthdate ||
                  !addForm.contact_number.trim() ||
                  !addForm.guardian_name.trim() ||
                  !addForm.guardian_contact.trim() ||
                  !addForm.section_id
                }
              >
                {saving ? 'Creating…' : 'Create student'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  )
}

