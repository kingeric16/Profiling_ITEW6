import { useEffect, useState } from 'react'
import api from '../../../api'
import { DashboardLayout } from '../../DashboardLayout'
import { readPageCache, writePageCache } from '../../pageCache'

type StudentProfile = {
  id: number
  student_number: string
  first_name: string
  middle_name?: string | null
  last_name: string
  email: string
  contact_number: string
  enrollment_status?: string | null
  year_level: number | null
  overall_gpa: number | null
  course?: { course_name: string } | null
  section?: { section_name: string } | null
  skills: Array<{ skill_level: string; skill: { skill_name: string; skill_category: string } }>
  affiliations: Array<{ organization_name: string; role: string; status: string }>
  violations: Array<{ violation_type: string; severity_level: string; violation_date: string; clearance_status: string; description?: string | null }>
  medicalHistory: Array<{ medical_condition?: string | null; allergies?: string | null; medications?: string | null; last_checkup_date?: string | null; notes?: string | null }>
  academicHistory: Array<{ semester: string; school_year: string; grade: number; subject: { subject_code: string; subject_name: string; units: number } }>
  nonAcademicHistory: Array<{ role: string; result: string; achievements?: string | null; event: { event_name: string; category: string; event_date: string; location: string } }>
}

export function StudentProfile() {
  const cached = readPageCache<StudentProfile>('student.profile')
  const [student, setStudent] = useState<StudentProfile | null>(cached)
  const [loading, setLoading] = useState(!cached)
  const [tab, setTab] = useState<'overview' | 'skills' | 'affiliations' | 'academic' | 'violations' | 'events' | 'medical'>('overview')
  const [editing, setEditing] = useState(false)
  const [emailDraft, setEmailDraft] = useState('')
  const [contactDraft, setContactDraft] = useState('')

  async function loadProfile() {
    if (!student) setLoading(true)
    try {
      const res = await api.get('/api/students/me')
      const payload = res.data as { student: StudentProfile }
      setStudent(payload.student)
      writePageCache('student.profile', payload.student, 120_000)
      setEmailDraft(payload.student.email)
      setContactDraft(payload.student.contact_number)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  async function handleSave() {
    if (!student) return
    await api.put(`/api/students/${student.id}`, {
      email: emailDraft,
      contact_number: contactDraft,
    })
    setEditing(false)
    await loadProfile()
  }

  return (
    <DashboardLayout activeKey="profile" title="Student Profile">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">My CCS Profile</div>
            <div className="panel-subtitle">Comprehensive profiling snapshot</div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className={`btn-sm ${editing ? 'btn-outline' : 'btn-primary'}`}
              onClick={() => setEditing((v) => !v)}
              disabled={loading}
            >
              {editing ? 'Cancel' : 'Edit Contact'}
            </button>
            {editing ? (
              <button type="button" className="btn-sm btn-primary" onClick={handleSave} disabled={loading}>
                Save
              </button>
            ) : null}
          </div>
        </div>

        <div className="tab-nav">
          {(
            [
              ['overview', 'Overview'],
              ['skills', 'Skills'],
              ['affiliations', 'Affiliations'],
              ['academic', 'Academic History'],
              ['violations', 'Violations'],
              ['events', 'Event Participation'],
              ['medical', 'Medical History'],
            ] as const
          ).map(([key, label]) => (
            <button key={key} className={['tab-btn', tab === key ? 'active' : ''].join(' ')} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {loading || !student ? (
          <div className="table-card">
            <div className="muted" style={{ padding: 18 }}>
              Loading…
            </div>
          </div>
        ) : tab === 'overview' ? (
          <div className="two-col">
            <div className="table-card">
              <div className="table-card-title">Account</div>
              <div className="table-card-sub">Update email and contact number</div>

              <div className="mini-table">
                <div className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">Student #</div>
                    <div className="mini-sub">{student.student_number}</div>
                  </div>
                </div>

                <div className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">Email</div>
                    <div className="mini-sub">
                      {editing ? (
                        <input className="form-input" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} />
                      ) : (
                        student.email
                      )}
                    </div>
                  </div>
                </div>

                <div className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">Contact Number</div>
                    <div className="mini-sub">
                      {editing ? (
                        <input className="form-input" value={contactDraft} onChange={(e) => setContactDraft(e.target.value)} />
                      ) : (
                        student.contact_number
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="table-card">
              <div className="table-card-title">Academic Status</div>
              <div className="table-card-sub">Course, section, year level, and GPA</div>

              <div className="mini-table">
                <div className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">Course</div>
                    <div className="mini-sub">{student.course?.course_name ?? '—'}</div>
                  </div>
                  <div className="mini-meta">
                    <span className="badge-soft blue">Year {student.year_level ?? '—'}</span>
                  </div>
                </div>

                <div className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">Section</div>
                    <div className="mini-sub">{student.section?.section_name ?? '—'}</div>
                  </div>
                </div>

                <div className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">Enrollment status</div>
                    <div className="mini-sub">{student.enrollment_status ?? '—'}</div>
                  </div>
                  <div className="mini-meta">
                    <span
                      className={`badge-soft ${
                        student.enrollment_status === 'Enrolled'
                          ? 'green'
                          : student.enrollment_status === 'Graduated'
                            ? 'blue'
                            : student.enrollment_status === 'Dropped'
                              ? 'red'
                              : 'gray'
                      }`}
                    >
                      {student.enrollment_status ?? '—'}
                    </span>
                  </div>
                </div>

                <div className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">Overall GPA</div>
                    <div className="mini-sub">{student.overall_gpa != null ? Number(student.overall_gpa).toFixed(2) : '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : tab === 'skills' ? (
          <div className="table-card">
            <div className="table-card-title">Skills</div>
            <div className="table-card-sub">Recorded skills and proficiency levels</div>

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
                  {student.skills.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="muted">
                        No skills recorded.
                      </td>
                    </tr>
                  ) : (
                    student.skills.map((s, idx) => (
                      <tr key={`${s.skill.skill_name}-${idx}`}>
                        <td style={{ fontWeight: 700 }}>{s.skill.skill_name}</td>
                        <td>{s.skill.skill_category}</td>
                        <td>
                          <span className="badge-soft amber">{s.skill_level}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === 'affiliations' ? (
          <div className="table-card">
            <div className="table-card-title">Affiliations</div>
            <div className="table-card-sub">Organizations, roles, and status</div>

            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {student.affiliations.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="muted">
                        No affiliations found.
                      </td>
                    </tr>
                  ) : (
                    student.affiliations.map((a, idx) => (
                      <tr key={`${a.organization_name}-${idx}`}>
                        <td style={{ fontWeight: 700 }}>{a.organization_name}</td>
                        <td>{a.role}</td>
                        <td>
                          <span className="badge-soft green">{a.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === 'academic' ? (
          <div className="table-card">
            <div className="table-card-title">Academic History</div>
            <div className="table-card-sub">Subjects, semesters, and grades</div>

            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Semester</th>
                    <th>School Year</th>
                    <th>Subject</th>
                    <th>Units</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {student.academicHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="muted">
                        No academic records found.
                      </td>
                    </tr>
                  ) : (
                    student.academicHistory.map((r, idx) => (
                      <tr key={`${r.subject.subject_code}-${r.semester}-${idx}`}>
                        <td>{r.semester}</td>
                        <td>{r.school_year}</td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{r.subject.subject_code}</div>
                          <div className="muted">{r.subject.subject_name}</div>
                        </td>
                        <td>{r.subject.units}</td>
                        <td>
                          <span className="badge-soft blue">{Number(r.grade).toFixed(2)}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === 'violations' ? (
          <div className="table-card">
            <div className="table-card-title">Violations</div>
            <div className="table-card-sub">Any recorded violations and clearance status</div>

            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Date</th>
                    <th>Clearance</th>
                  </tr>
                </thead>
                <tbody>
                  {student.violations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="muted">
                        No violations recorded.
                      </td>
                    </tr>
                  ) : (
                    student.violations.map((v, idx) => (
                      <tr key={`${v.violation_type}-${idx}`}>
                        <td style={{ fontWeight: 700 }}>{v.violation_type}</td>
                        <td>
                          <span className={['badge-soft', v.severity_level === 'major' ? 'red' : v.severity_level === 'critical' ? 'red' : 'amber'].join(' ')}>
                            {v.severity_level}
                          </span>
                        </td>
                        <td>{v.violation_date ? new Date(v.violation_date).toLocaleDateString() : '—'}</td>
                        <td>
                          <span className="badge-soft blue">{v.clearance_status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === 'events' ? (
          <div className="table-card">
            <div className="table-card-title">Event Participation</div>
            <div className="table-card-sub">College events you participated in</div>

            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {student.nonAcademicHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="muted">
                        No event participation records found.
                      </td>
                    </tr>
                  ) : (
                    student.nonAcademicHistory.map((h, idx) => (
                      <tr key={`${h.event.event_name}-${idx}`}>
                        <td style={{ fontWeight: 700 }}>{h.event.event_name}</td>
                        <td>{h.event.category}</td>
                        <td>{h.event.event_date ? new Date(h.event.event_date).toLocaleDateString() : '—'}</td>
                        <td>
                          <span className="badge-soft green">{h.result}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="table-card">
            <div className="table-card-title">Medical History</div>
            <div className="table-card-sub">Allergy, medications, checkups, and notes</div>

            <div className="mini-table">
              {student.medicalHistory.length === 0 ? (
                <div className="mini-empty">No medical history records found.</div>
              ) : (
                student.medicalHistory.map((m, idx) => (
                  <div key={idx} className="mini-row" style={{ alignItems: 'flex-start' }}>
                    <div className="mini-main">
                      <div className="mini-title">{m.medical_condition ?? '—'}</div>
                      <div className="mini-sub">{m.allergies ? `Allergies: ${m.allergies}` : ''}</div>
                      <div className="mini-sub">{m.medications ? `Medications: ${m.medications}` : ''}</div>
                      {m.notes ? <div className="mini-sub">{m.notes}</div> : null}
                    </div>
                    <div className="mini-meta">{m.last_checkup_date ? new Date(m.last_checkup_date).toLocaleDateString() : '—'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <aside className="side-stack">
        {loading || !student ? (
          <div className="calendar-card">
            <div className="section-heading">At a glance</div>
            <div className="mini-empty">Loading…</div>
          </div>
        ) : (
          <>
            <div className="profile-card">
              <div className="avatar" aria-hidden="true">
                {[student.first_name, student.middle_name, student.last_name]
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => (p as string)[0]?.toUpperCase())
                  .join('')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  {student.last_name}, {student.first_name}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{student.email}</div>
              </div>
            </div>

            <div className="calendar-card">
              <div className="section-heading">At a glance</div>
              <div className="mini-list">
                <div className="mini-item">
                  <span>Skills</span>
                  <span className="badge-soft green">{student.skills.length}</span>
                </div>
                <div className="mini-item">
                  <span>Affiliations</span>
                  <span className="badge-soft blue">{student.affiliations.length}</span>
                </div>
                <div className="mini-item">
                  <span>Violations</span>
                  <span className="badge-soft amber">{student.violations.length}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </DashboardLayout>
  )
}

