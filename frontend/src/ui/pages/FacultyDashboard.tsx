import { useEffect, useState } from 'react'
import api from '../../api'
import { DashboardLayout } from '../DashboardLayout'
import { readPageCache, writePageCache } from '../pageCache'

type Payload = {
  summary: { 
    totalAssignedSubjects: number; 
    totalStudentsHandled: number; 
    upcomingClasses: number;
    pendingGrades: number;
    averageGPA: number;
  }
  schedule: Array<{
    assignment_id: number
    subject_code: string | null
    subject_name: string | null
    section_name: string | null
    room: string | null
    schedule_day: string | null
    start_time: string | null
    end_time: string | null
    school_year: string | null
  }>
  students: Array<{ student_id: number; student_number: string | null; first_name: string; last_name: string; year_level: string | null; gpa?: number }>
  recentGrades: Array<{
    student_name: string;
    subject_name: string;
    grade: number;
    submitted_date: string;
  }>
  announcements: Array<{
    title: string;
    message: string;
    priority: string;
    created_at: string;
  }>
}

function FacultyCalendarWidget() {
  const currentDate = new Date()
  
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  const getDaysInMonth = (date: Date): (number | null)[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days: (number | null)[] = []
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    
    return days
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const today = new Date()
  const isToday = (day: number | null) => {
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear()
  }

  const days = getDaysInMonth(currentDate)

  return (
    <div className="calendar-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="section-heading">Academic Calendar</div>
        <span className="badge-soft amber">Week {getWeekNumber(currentDate)}</span>
      </div>
      
      <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '2px',
        marginBottom: '4px'
      }}>
        {weekDays.map(day => (
          <div 
            key={day}
            style={{ 
              fontSize: '10px', 
              fontWeight: '600', 
              color: '#64748b',
              textAlign: 'center',
              padding: '2px'
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '2px'
      }}>
        {days.map((day, index) => (
          <div
            key={index}
            onClick={() => day && undefined}
            style={{
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: day && isToday(day) ? '700' : '400',
              borderRadius: '4px',
              backgroundColor: day && isToday(day) ? '#10b981' : 'transparent',
              color: day && isToday(day) ? '#ffffff' : day ? '#374151' : '#e5e7eb',
              cursor: day ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              border: day && !isToday(day) ? '1px solid #e5e7eb' : 'none'
            }}
            onMouseEnter={(e) => {
              if (day && !isToday(day)) {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
                e.currentTarget.style.transform = 'scale(1.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (day && !isToday(day)) {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            {day || ''}
          </div>
        ))}
      </div>

      <div style={{ 
        marginTop: '12px', 
        paddingTop: '8px', 
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '11px', color: '#374151' }}>Teaching Schedule</span>
        <span className="badge-soft green">Active</span>
      </div>
    </div>
  )
}

export function FacultyDashboard() {
  const cached = readPageCache<Payload>('faculty.dashboard')
  const [data, setData] = useState<Payload | null>(cached)
  const [loading, setLoading] = useState(!cached)
  const nextSchedule = data?.schedule?.[0] ?? null

  useEffect(() => {
    if (!cached) setLoading(true)
    api.get('/api/dashboard/faculty')
      .then((res) => {
        const payload = res.data as Payload
        setData(payload)
        writePageCache('faculty.dashboard', payload, 60_000)
      })
      .catch(() => {
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout activeKey="dashboard" title="Faculty Dashboard">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">Faculty Overview</div>
            <div className="panel-subtitle">Academic performance & teaching load</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-sm btn-outline" disabled title="Endpoint not yet wired">
              Submit Grades
            </button>
            <button type="button" className="btn-sm btn-outline" disabled title="Endpoint not yet wired">
              Class Record
            </button>
            <button type="button" className="btn-sm btn-outline" disabled title="Endpoint not yet wired">
              Announcement
            </button>
          </div>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
          {(
            [
              { label: 'Assigned Subjects', value: data?.summary.totalAssignedSubjects ?? 0 },
              { label: 'Students Handled', value: data?.summary.totalStudentsHandled ?? 0 },
              { label: 'Upcoming Classes', value: data?.summary.upcomingClasses ?? 0 },
              { label: 'Pending Grades', value: data?.summary.pendingGrades ?? 0 },
              { label: 'Average GPA', value: data?.summary.averageGPA ? data.summary.averageGPA.toFixed(2) : '—' },
            ] as const
          ).map((s) => (
            <div key={s.label} className="stat-tile">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{loading ? '…' : s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ height: 12 }} />

        <div className="two-col">
          <div className="table-card">
            <div className="table-card-title">Today\'s Schedule</div>
            <div className="table-card-sub">Current teaching assignments</div>
            <div className="mini-table">
              {(data?.schedule ?? []).map((r) => (
                <div key={r.assignment_id} className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">
                      {(r.subject_code || '—') + ' • ' + (r.subject_name || '')}
                    </div>
                    <div className="mini-sub">
                      {r.section_name || '—'} {r.room ? `• Room ${r.room}` : ''}
                    </div>
                  </div>
                  <div className="mini-meta">
                    {(r.schedule_day || '') + ' ' + (r.start_time || '') + '-' + (r.end_time || '')}
                  </div>
                </div>
              ))}
              {!loading && (data?.schedule?.length ?? 0) === 0 ? <div className="mini-empty">No classes scheduled.</div> : null}
            </div>
          </div>

          <div className="table-card">
            <div className="table-card-title">Recent Grade Submissions</div>
            <div className="table-card-sub">Last 7 days</div>
            <div className="mini-table">
              {(data?.recentGrades ?? []).map((grade, idx) => (
                <div key={idx} className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">{grade.student_name}</div>
                    <div className="mini-sub">{grade.subject_name}</div>
                  </div>
                  <div className="mini-meta">
                    <span className="badge-soft green">{grade.grade}</span>
                  </div>
                </div>
              ))}
              {!loading && (data?.recentGrades?.length ?? 0) === 0 ? <div className="mini-empty">No recent submissions.</div> : null}
            </div>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="two-col">
          <div className="table-card">
            <div className="table-card-title">Students Performance</div>
            <div className="table-card-sub">Top performing students</div>
            <div className="mini-table">
              {(data?.students ?? [])
                .filter(s => s.gpa && s.gpa > 0)
                .sort((a, b) => (b.gpa || 0) - (a.gpa || 0))
                .slice(0, 8)
                .map((s) => (
                <div key={s.student_id} className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">{s.last_name + ', ' + s.first_name}</div>
                    <div className="mini-sub">{s.student_number || ''}</div>
                  </div>
                  <div className="mini-meta">
                    <span className="badge-soft amber">{s.year_level || '—'}</span>
                    <div style={{ fontSize: '11px', fontWeight: '600' }}>
                      {s.gpa ? s.gpa.toFixed(2) : '—'}
                    </div>
                  </div>
                </div>
              ))}
              {!loading && (data?.students?.length ?? 0) === 0 ? <div className="mini-empty">No students assigned.</div> : null}
            </div>
          </div>

          <div className="table-card">
            <div className="table-card-title">Department Announcements</div>
            <div className="table-card-sub">Recent updates</div>
            <div className="mini-table">
              {(data?.announcements ?? []).map((announcement, idx) => (
                <div key={idx} className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">{announcement.title}</div>
                    <div className="mini-sub">{announcement.message}</div>
                  </div>
                  <div className="mini-meta">
                    <span className={`badge-soft ${announcement.priority === 'high' ? 'red' : announcement.priority === 'medium' ? 'amber' : 'green'}`}>
                      {announcement.priority}
                    </span>
                  </div>
                </div>
              ))}
              {!loading && (data?.announcements?.length ?? 0) === 0 ? <div className="mini-empty">No announcements.</div> : null}
            </div>
          </div>
        </div>
      </div>

      <aside className="side-stack">
        <div className="profile-card">
          <div className="avatar" aria-hidden="true">
            F
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Faculty</div>
              <span className="profile-badge">faculty</span>
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Teaching Dashboard</div>
          </div>
        </div>

        <div className="calendar-card">
          <div className="section-heading">Next Schedule</div>
          {loading ? (
            <div className="mini-empty">Loading…</div>
          ) : nextSchedule ? (
            <div className="mini-list">
              <div className="mini-item">
                <span>{nextSchedule.subject_code ?? nextSchedule.subject_name ?? 'Class'}</span>
                <span className="badge-soft amber">{nextSchedule.schedule_day ?? 'Day'}</span>
              </div>
              <div className="mini-item">
                <span>Time</span>
                <span className="badge-soft blue">
                  {nextSchedule.start_time ? nextSchedule.start_time : '—'}
                  {nextSchedule.end_time ? `-${nextSchedule.end_time}` : ''}
                </span>
              </div>
            </div>
          ) : (
            <FacultyCalendarWidget />
          )}
        </div>

        <div className="schedule-card">
          <div className="section-heading">Teaching Snapshot</div>
          <div className="mini-list">
            <div className="mini-item">
              <span>Assigned Subjects</span>
              <span className="badge-soft blue">{data?.summary.totalAssignedSubjects ?? 0}</span>
            </div>
            <div className="mini-item">
              <span>Students Handled</span>
              <span className="badge-soft green">{data?.summary.totalStudentsHandled ?? 0}</span>
            </div>
            <div className="mini-item">
              <span>Upcoming Classes</span>
              <span className="badge-soft amber">{data?.summary.upcomingClasses ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="reminders-card">
          <div className="section-heading">Schedule Snapshot</div>
          <div className="mini-list">
            <div className="mini-item">
              <span>Total Schedule Entries</span>
              <span className="badge-soft blue">{data?.schedule?.length ?? 0}</span>
            </div>
            <div className="mini-item">
              <span>Next Class Day</span>
              <span className="badge-soft amber">{nextSchedule?.schedule_day ?? '—'}</span>
            </div>
            <div className="mini-item">
              <span>Next Section</span>
              <span className="badge-soft green">{nextSchedule?.section_name ?? '—'}</span>
            </div>
          </div>
        </div>
      </aside>
    </DashboardLayout>
  )
}

