import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '../../DashboardLayout'
import api from '../../../api'
import { readPageCache, writePageCache } from '../../pageCache'

export function DeanStudents() {
  type Course = { id: number; course_name: string }
  type Section = { id: number; section_name: string; course_id: number; year_level: number }
  type StudentRow = {
    id: number
    student_number: string
    first_name: string
    middle_name?: string | null
    last_name: string
    email: string
    gender: 'male' | 'female' | 'other'
    birthdate: string
    contact_number: string
    guardian_name: string
    guardian_contact: string
    enrollment_status?: 'Enrolled' | 'Graduated' | 'Dropped' | null
    height?: number | null
    weight?: number | null
    bmi?: number | null
    course_id: number
    section_id: number
    year_level: number
    overall_gpa?: number | null
    course?: { course_name: string } | null
    section?: { section_name: string } | null
  }

  type StudentDetail = StudentRow & {
    skills: any[]
    affiliations: any[]
    violations: any[]
    medicalHistory: any[]
    academicHistory: any[]
    nonAcademicHistory: any[]
  }

  const cached = readPageCache<{ students: StudentRow[]; courses: Course[]; sections: Section[] }>('dean.students.core')
  const [students, setStudents] = useState<StudentRow[]>(cached?.students ?? [])
  const [courses, setCourses] = useState<Course[]>(cached?.courses ?? [])
  const [sections, setSections] = useState<Section[]>(cached?.sections ?? [])
  const [loading, setLoading] = useState(!cached)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [viewOpen, setViewOpen] = useState(false)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewStudent, setViewStudent] = useState<StudentDetail | null>(null)

  const [medicalSaving, setMedicalSaving] = useState(false)
  const [medicalError, setMedicalError] = useState<string | null>(null)
  const [medicalForm, setMedicalForm] = useState({
    medical_condition: '',
    allergies: '',
    medications: '',
    last_checkup_date: '',
    notes: '',
  })

  const [form, setForm] = useState({
    student_number: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'male' as 'male' | 'female' | 'other',
    birthdate: '',
    email: '',
    contact_number: '',
    guardian_name: '',
    guardian_contact: '',
    height: '',
    weight: '',
    bmi: '',
    course_id: '',
    section_id: '',
    year_level: '1',
  })

  useEffect(() => {
    ;(async () => {
      if (!cached) setLoading(true)
      try {
        const [studentsRes, coursesRes, sectionsRes] = await Promise.all([
          api.get('/api/students'),
          api.get('/api/courses'),
          api.get('/api/sections'),
        ])
        const studentsPayload = (studentsRes.data?.students ?? []) as StudentRow[]
        const coursesPayload = (coursesRes.data?.courses ?? []) as Course[]
        const sectionsPayload = (sectionsRes.data?.sections ?? []) as Section[]
        setStudents(studentsPayload)
        setCourses(coursesPayload)
        setSections(sectionsPayload)
        writePageCache('dean.students.core', { students: studentsPayload, courses: coursesPayload, sections: sectionsPayload })
      } catch (e: any) {
        setStudents([])
        setCourses([])
        setSections([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const yearLevels = useMemo(() => Array.from(new Set(students.map((s) => s.year_level).filter((v): v is number => v != null))).sort(), [students])

  const filteredStudents = students.filter((student) => {
    const t = searchTerm.trim().toLowerCase()
    const matchesSearch =
      !t ||
      student.first_name.toLowerCase().includes(t) ||
      student.last_name.toLowerCase().includes(t) ||
      student.student_number.toLowerCase().includes(t) ||
      student.email.toLowerCase().includes(t)

    const matchesCourse = selectedCourse === 'all' || String(student.course_id) === selectedCourse
    const matchesYear = selectedYear === 'all' || String(student.year_level) === selectedYear

    return matchesSearch && matchesCourse && matchesYear
  })

  const getGpaBadge = (gpa: number | null | undefined) => {
    if (gpa == null) return 'badge-soft gray'
    if (gpa >= 3.5) return 'badge-soft green'
    if (gpa >= 3.0) return 'badge-soft blue'
    if (gpa >= 2.5) return 'badge-soft amber'
    return 'badge-soft red'
  }

  function resetForm() {
    setForm({
      student_number: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      gender: 'male',
      birthdate: '',
      email: '',
      contact_number: '',
      guardian_name: '',
      guardian_contact: '',
      height: '',
      weight: '',
      bmi: '',
      course_id: '',
      section_id: '',
      year_level: '1',
    })
  }

  function openCreate() {
    setError(null)
    setEditingId(null)
    resetForm()
    setModalOpen(true)
  }

  function openEdit(s: StudentRow) {
    setError(null)
    setEditingId(s.id)
    setForm({
      student_number: s.student_number ?? '',
      first_name: s.first_name ?? '',
      middle_name: (s.middle_name ?? '') as string,
      last_name: s.last_name ?? '',
      gender: s.gender ?? 'male',
      birthdate: s.birthdate ? String(s.birthdate).slice(0, 10) : '',
      email: s.email ?? '',
      contact_number: s.contact_number ?? '',
      guardian_name: s.guardian_name ?? '',
      guardian_contact: s.guardian_contact ?? '',
      height: s.height != null ? String(s.height) : '',
      weight: s.weight != null ? String(s.weight) : '',
      bmi: s.bmi != null ? String(s.bmi) : '',
      course_id: s.course_id ? String(s.course_id) : '',
      section_id: s.section_id ? String(s.section_id) : '',
      year_level: s.year_level ? String(s.year_level) : '1',
    })
    setModalOpen(true)
  }

  async function refreshStudents() {
    const res = await api.get('/api/students')
    const studentsPayload = (res.data?.students ?? []) as StudentRow[]
    setStudents(studentsPayload)
    writePageCache('dean.students.core', { students: studentsPayload, courses, sections })
  }

  async function submitForm() {
    setSaving(true)
    setError(null)
    try {
      const payload: any = {
        student_number: form.student_number,
        first_name: form.first_name,
        middle_name: form.middle_name || null,
        last_name: form.last_name,
        gender: form.gender,
        birthdate: form.birthdate,
        email: form.email,
        contact_number: form.contact_number,
        guardian_name: form.guardian_name,
        guardian_contact: form.guardian_contact,
        height: form.height !== '' ? Number(form.height) : null,
        weight: form.weight !== '' ? Number(form.weight) : null,
        bmi: form.bmi !== '' ? Number(form.bmi) : null,
        course_id: Number(form.course_id),
        section_id: Number(form.section_id),
        year_level: Number(form.year_level),
      }

      if (!editingId) {
        await api.post('/api/students', payload)
      } else {
        await api.put(`/api/students/${editingId}`, payload)
      }

      setModalOpen(false)
      await refreshStudents()
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Save failed.'
      setError(String(msg))
    } finally {
      setSaving(false)
    }
  }

  async function deleteStudent(id: number) {
    if (!confirm('Delete this student record? This cannot be undone.')) return
    setSaving(true)
    setError(null)
    try {
      await api.delete(`/api/students/${id}`)
      await refreshStudents()
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Delete failed.'
      setError(String(msg))
    } finally {
      setSaving(false)
    }
  }

  async function openView(id: number) {
    setViewOpen(true)
    setViewLoading(true)
    setViewStudent(null)
    setMedicalError(null)
    setMedicalForm({
      medical_condition: '',
      allergies: '',
      medications: '',
      last_checkup_date: '',
      notes: '',
    })
    try {
      const res = await api.get(`/api/students/${id}`)
      setViewStudent((res.data?.student ?? null) as StudentDetail | null)
    } finally {
      setViewLoading(false)
    }
  }

  async function saveMedicalHistory() {
    if (!viewStudent) return
    setMedicalSaving(true)
    setMedicalError(null)
    try {
      const existing = Array.isArray(viewStudent.medicalHistory) ? viewStudent.medicalHistory : []

      const newRow = {
        medical_condition: medicalForm.medical_condition || null,
        allergies: medicalForm.allergies || null,
        medications: medicalForm.medications || null,
        last_checkup_date: medicalForm.last_checkup_date || null,
        notes: medicalForm.notes || null,
      }

      const payload = {
        medical_history: [...existing, newRow],
      }

      await api.put(`/api/students/${viewStudent.id}/medical-history`, payload)

      const res = await api.get(`/api/students/${viewStudent.id}`)
      setViewStudent((res.data?.student ?? null) as StudentDetail | null)

      setMedicalForm({
        medical_condition: '',
        allergies: '',
        medications: '',
        last_checkup_date: '',
        notes: '',
      })
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to save medical history.'
      setMedicalError(String(msg))
    } finally {
      setMedicalSaving(false)
    }
  }

  const filteredSections = useMemo(() => {
    const cid = Number(form.course_id || 0)
    const yl = Number(form.year_level || 0)
    return sections.filter((s) => (!cid || s.course_id === cid) && (!yl || s.year_level === yl))
  }, [form.course_id, form.year_level, sections])

  return (
    <DashboardLayout activeKey="students" title="Students">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">Student Directory</div>
            <div className="panel-subtitle">System-wide overview with local filtering</div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <input
              type="text"
              className="form-input"
              style={{ width: 220 }}
              placeholder="Search name/email/student #…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select className="form-input" style={{ width: 160 }} value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              <option value="all">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.course_name}
                </option>
              ))}
            </select>
            <select className="form-input" style={{ width: 120 }} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="all">All years</option>
              {yearLevels.map((y) => (
                <option key={String(y)} value={String(y)}>
                  Year {y}
                </option>
              ))}
            </select>

            <button type="button" className="btn-sm btn-primary" onClick={openCreate} disabled={loading || saving}>
              Add student
            </button>
          </div>
        </div>

        {error ? <div className="login-error">{error}</div> : null}

        <div className="table-card">
          <div className="table-card-title">Students</div>
          <div className="table-card-sub">{loading ? 'Loading…' : `Showing ${filteredStudents.length} of ${students.length}`}</div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student #</th>
                  <th>Name</th>
                  <th>Course</th>
                  <th>Year</th>
                  <th>GPA</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="muted">
                      Loading…
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted">
                      {searchTerm || selectedCourse !== 'all' || selectedYear !== 'all' ? 'No students match your criteria.' : 'No students found.'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.slice(0, 60).map((student) => (
                    <tr key={student.id}>
                      <td>{student.student_number}</td>
                      <td style={{ fontWeight: 700 }}>{`${student.last_name}, ${student.first_name}`}</td>
                      <td>
                        {student.course?.course_name ? (
                          <span className="badge-soft blue">{student.course.course_name}</span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>{student.year_level ?? '—'}</td>
                      <td>
                        {student.overall_gpa != null ? (
                          <span className={getGpaBadge(student.overall_gpa)}>{Number(student.overall_gpa).toFixed(2)}</span>
                        ) : (
                          <span className="badge-soft gray">—</span>
                        )}
                      </td>
                      <td>
                        <button type="button" className="btn-xs btn-soft" onClick={() => openView(student.id)} disabled={saving}>
                          View
                        </button>
                        <button type="button" className="btn-xs btn-outline" onClick={() => openEdit(student)} disabled={saving}>
                          Edit
                        </button>
                        <button type="button" className="btn-xs btn-outline" onClick={() => deleteStudent(student.id)} disabled={saving}>
                          Delete
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

      {modalOpen ? (
        <div className="modal-overlay">
          <div className="modal-card dean-student-modal-card">
            <div className="dean-student-modal-header">
              <div className="dean-student-modal-title-block">
                <div className="dean-student-modal-title">{editingId ? 'Edit student' : 'Add student'}</div>
              </div>
              <button type="button" className="btn-xs btn-outline" onClick={() => setModalOpen(false)} disabled={saving}>
                Close
              </button>
            </div>

            {error ? <div className="login-error">{error}</div> : null}

            <div className="dean-student-modal-body">
              <div className="grid-2 dean-student-modal-grid">
              <div className="card">
                <div className="card-title">Student details</div>
                <div className="card-subtitle">Required fields for creating a complete student record</div>
                <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                  <div className="two-col">
                    <div>
                      <div className="section-heading">Student number</div>
                      <input
                        className="form-input"
                        value={form.student_number}
                        onChange={(e) => setForm((p) => ({ ...p, student_number: e.target.value }))}
                        inputMode="numeric"
                        maxLength={7}
                        placeholder="7-digit ID"
                      />
                    </div>
                    <div>
                      <div className="section-heading">Gender</div>
                      <select className="form-input" value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value as any }))}>
                        <option value="male">male</option>
                        <option value="female">female</option>
                        <option value="other">other</option>
                      </select>
                    </div>
                  </div>

                  <div className="two-col">
                    <div>
                      <div className="section-heading">First name</div>
                      <input className="form-input" value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} />
                    </div>
                    <div>
                      <div className="section-heading">Middle name (optional)</div>
                      <input className="form-input" value={form.middle_name} onChange={(e) => setForm((p) => ({ ...p, middle_name: e.target.value }))} />
                    </div>
                  </div>

                  <div className="two-col">
                    <div>
                      <div className="section-heading">Last name</div>
                      <input className="form-input" value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} />
                    </div>
                    <div>
                      <div className="section-heading">Birthdate</div>
                      <input type="date" className="form-input" value={form.birthdate} onChange={(e) => setForm((p) => ({ ...p, birthdate: e.target.value }))} />
                    </div>
                  </div>

                  <div className="two-col">
                    <div>
                      <div className="section-heading">Email</div>
                      <input className="form-input" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                    </div>
                    <div>
                      <div className="section-heading">Contact number</div>
                      <input className="form-input" value={form.contact_number} onChange={(e) => setForm((p) => ({ ...p, contact_number: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-title">Academic placement</div>
                <div className="card-subtitle">Course, year level, and section</div>
                <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                  <div>
                    <div className="section-heading">Course</div>
                    <select className="form-input" value={form.course_id} onChange={(e) => setForm((p) => ({ ...p, course_id: e.target.value, section_id: '' }))}>
                      <option value="">Select course…</option>
                      {courses.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.course_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="two-col">
                    <div>
                      <div className="section-heading">Year level</div>
                      <select className="form-input" value={form.year_level} onChange={(e) => setForm((p) => ({ ...p, year_level: e.target.value, section_id: '' }))}>
                        {[1, 2, 3, 4, 5].map((y) => (
                          <option key={y} value={String(y)}>
                            Year {y}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="section-heading">Section</div>
                      <select className="form-input" value={form.section_id} onChange={(e) => setForm((p) => ({ ...p, section_id: e.target.value }))}>
                        <option value="">Select section…</option>
                        {filteredSections.map((s) => (
                          <option key={s.id} value={String(s.id)}>
                            {s.section_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="section-heading">BMI / height / weight (optional)</div>
                    <div className="dean-student-metrics-row">
                      <input className="form-input" placeholder="H" value={form.height} onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))} />
                      <input className="form-input" placeholder="W" value={form.weight} onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))} />
                      <input className="form-input" placeholder="BMI" value={form.bmi} onChange={(e) => setForm((p) => ({ ...p, bmi: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <div className="section-heading">Guardian name</div>
                    <input className="form-input" value={form.guardian_name} onChange={(e) => setForm((p) => ({ ...p, guardian_name: e.target.value }))} />
                  </div>
                  <div>
                    <div className="section-heading">Guardian contact</div>
                    <input className="form-input" value={form.guardian_contact} onChange={(e) => setForm((p) => ({ ...p, guardian_contact: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>
            </div>

            <div className="dean-student-modal-actions">
              <button type="button" className="btn-sm btn-outline" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="btn-sm btn-primary" onClick={submitForm} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
                        {viewStudent.year_level} • {viewStudent.section?.section_name ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">Comprehensive data</div>
                  <div className="card-subtitle">Skills, affiliations, violations, history</div>
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

                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                    <div className="section-heading" style={{ marginBottom: 6 }}>
                      Medical record
                    </div>

                    {medicalError ? <div className="login-error" style={{ marginBottom: 10 }}>{medicalError}</div> : null}

                    {(viewStudent.medicalHistory ?? []).length === 0 ? (
                      <div className="mini-empty" style={{ marginBottom: 10 }}>
                        No medical history yet.
                      </div>
                    ) : (
                      <div className="mini-list" style={{ marginBottom: 12 }}>
                        {(viewStudent.medicalHistory ?? []).map((m: any, idx: number) => (
                          <div key={idx} className="mini-item" style={{ alignItems: 'flex-start' }}>
                            <span>{m.medical_condition ?? '—'}</span>
                            <span className="badge-soft gray">
                              {m.last_checkup_date ? new Date(m.last_checkup_date).toLocaleDateString() : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'grid', gap: 10 }}>
                      <div className="two-col">
                        <div>
                          <div className="section-heading">Medical condition</div>
                          <input
                            className="form-input"
                            value={medicalForm.medical_condition}
                            onChange={(e) => setMedicalForm((p) => ({ ...p, medical_condition: e.target.value }))}
                          />
                        </div>
                        <div>
                          <div className="section-heading">Last checkup date</div>
                          <input
                            type="date"
                            className="form-input"
                            value={medicalForm.last_checkup_date}
                            onChange={(e) => setMedicalForm((p) => ({ ...p, last_checkup_date: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="two-col">
                        <div>
                          <div className="section-heading">Allergies</div>
                          <input
                            className="form-input"
                            value={medicalForm.allergies}
                            onChange={(e) => setMedicalForm((p) => ({ ...p, allergies: e.target.value }))}
                          />
                        </div>
                        <div>
                          <div className="section-heading">Medications</div>
                          <input
                            className="form-input"
                            value={medicalForm.medications}
                            onChange={(e) => setMedicalForm((p) => ({ ...p, medications: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="section-heading">Notes (optional)</div>
                        <input
                          className="form-input"
                          value={medicalForm.notes}
                          onChange={(e) => setMedicalForm((p) => ({ ...p, notes: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                      <button
                        type="button"
                        className="btn-sm btn-primary"
                        onClick={saveMedicalHistory}
                        disabled={medicalSaving}
                      >
                        {medicalSaving ? 'Saving…' : 'Save medical record'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  )
}

