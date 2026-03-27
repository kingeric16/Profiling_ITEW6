import { useEffect, useState } from 'react'
import api from '../../api'
import { DashboardLayout } from '../DashboardLayout'
import { readPageCache, writePageCache } from '../pageCache'

type Payload = {
  summary: {
    totalStudents: number
    totalFaculty: number
    totalCourses: number
    totalEvents: number
    totalEnrolledStudents: number
  }
  recentStudents: Array<{ id: number; name: string; email: string; created_at: string }>
  recentFaculty: Array<{ id: number; name: string; email: string; created_at: string }>
  upcomingEvents: Array<{ event_id: number; event_name: string; category: string; event_date: string }>
  enrollmentStats: Array<{ course_name: string; year_level: string; total: number }>
  auditLogs: Array<{ action: string; actor_role: string | null; actor_id: number | null; created_at: string }>
}

function CalendarWidget() {
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
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of month
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
        <div className="section-heading">Calendar</div>
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
        <span style={{ fontSize: '11px', color: '#374151' }}>Today</span>
        <span className="badge-soft green">On track</span>
      </div>
    </div>
  )
}

export function DeanDashboard() {
  const cached = readPageCache<Payload>('dean.dashboard')
  const [data, setData] = useState<Payload | null>(cached)
  const [loading, setLoading] = useState(!cached)
  const nextEvent = data?.upcomingEvents?.[0] ?? null
  const latestAudit = data?.auditLogs?.[0] ?? null

  useEffect(() => {
    if (!data) setLoading(true)
    api.get('/api/dashboard/dean')
      .then((res) => {
        const payload = res.data as Payload
        setData(payload)
        writePageCache('dean.dashboard', payload)
      })
      .catch(() => {
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout activeKey="dashboard" title="Academic Overview">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">Dean Dashboard</div>
            <div className="panel-subtitle">Live summary pulled from the database</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-sm btn-outline" disabled title="Create endpoint not yet wired">
              Add Student
            </button>
            <button type="button" className="btn-sm btn-outline" disabled title="Create endpoint not yet wired">
              Add Faculty
            </button>
            <button type="button" className="btn-sm btn-outline" disabled title="Create endpoint not yet wired">
              Create Event
            </button>
            <button type="button" className="btn-sm btn-outline" disabled title="Create endpoint not yet wired">
              Manage Curriculum
            </button>
          </div>
        </div>

        <div className="stats-grid">
          {(
            [
              { label: 'Total Students', value: data?.summary.totalStudents ?? 0 },
              { label: 'Total Faculty', value: data?.summary.totalFaculty ?? 0 },
              { label: 'Total Courses', value: data?.summary.totalCourses ?? 0 },
              { label: 'Total Events', value: data?.summary.totalEvents ?? 0 },
              { label: 'Total Enrolled', value: data?.summary.totalEnrolledStudents ?? 0 },
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
            <div className="table-card-title">Recent Students</div>
            <div className="table-card-sub">Latest added</div>
            <div className="mini-table">
              {(data?.recentStudents ?? []).map((s) => (
                <div key={s.id} className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">{s.name}</div>
                    <div className="mini-sub">{s.email}</div>
                  </div>
                  <div className="mini-meta">{new Date(s.created_at).toLocaleDateString()}</div>
                </div>
              ))}
              {!loading && (data?.recentStudents?.length ?? 0) === 0 ? <div className="mini-empty">No students yet.</div> : null}
            </div>
          </div>

          <div className="table-card">
            <div className="table-card-title">Recent Faculty</div>
            <div className="table-card-sub">Latest added</div>
            <div className="mini-table">
              {(data?.recentFaculty ?? []).map((f) => (
                <div key={f.id} className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">{f.name}</div>
                    <div className="mini-sub">{f.email}</div>
                  </div>
                  <div className="mini-meta">{new Date(f.created_at).toLocaleDateString()}</div>
                </div>
              ))}
              {!loading && (data?.recentFaculty?.length ?? 0) === 0 ? <div className="mini-empty">No faculty yet.</div> : null}
            </div>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="two-col">
          <div className="table-card">
            <div className="table-card-title">Upcoming Events</div>
            <div className="table-card-sub">Events schedule</div>
            <div className="mini-table">
              {(data?.upcomingEvents ?? []).map((e) => (
                <div key={e.event_id} className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">{e.event_name}</div>
                    <div className="mini-sub">{e.category}</div>
                  </div>
                  <div className="mini-meta">{e.event_date ? new Date(e.event_date).toLocaleDateString() : '—'}</div>
                </div>
              ))}
              {!loading && (data?.upcomingEvents?.length ?? 0) === 0 ? <div className="mini-empty">No events yet.</div> : null}
            </div>
          </div>

          <div className="table-card">
            <div className="table-card-title">Enrollment Statistics</div>
            <div className="table-card-sub">Per course / year level</div>
            <div className="mini-table">
              {(data?.enrollmentStats ?? []).map((r, idx) => (
                <div key={`${r.course_name}-${idx}`} className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">{r.course_name}</div>
                    <div className="mini-sub">Year: {r.year_level}</div>
                  </div>
                  <div className="mini-meta">{r.total}</div>
                </div>
              ))}
              {!loading && (data?.enrollmentStats?.length ?? 0) === 0 ? <div className="mini-empty">No enrollment data yet.</div> : null}
            </div>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="table-card">
          <div className="table-card-title">System Activity</div>
          <div className="table-card-sub">From audit_logs</div>
          <div className="mini-table">
            {(data?.auditLogs ?? []).map((a, idx) => (
              <div key={`${a.action}-${idx}`} className="mini-row">
                <div className="mini-main">
                  <div className="mini-title">{a.action}</div>
                  <div className="mini-sub">
                    {a.actor_role ?? '—'} {a.actor_id ? `#${a.actor_id}` : ''}
                  </div>
                </div>
                <div className="mini-meta">{new Date(a.created_at).toLocaleString()}</div>
              </div>
            ))}
            {!loading && (data?.auditLogs?.length ?? 0) === 0 ? <div className="mini-empty">No activity yet.</div> : null}
          </div>
        </div>
      </div>

      <aside className="side-stack">
        <div className="profile-card">
          <div className="avatar" aria-hidden="true">
            D
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Dean</div>
              <span className="profile-badge">dean</span>
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Dashboard</div>
          </div>
        </div>

        <div className="calendar-card">
          <div className="section-heading">Next Event</div>
          {loading ? (
            <div className="mini-empty">Loading…</div>
          ) : nextEvent ? (
            <div className="mini-list">
              <div className="mini-item">
                <span>{nextEvent.event_name}</span>
                <span className="badge-soft amber">{nextEvent.category ?? 'Event'}</span>
              </div>
              <div className="mini-item">
                <span>Date</span>
                <span className="badge-soft blue">
                  {nextEvent.event_date ? new Date(nextEvent.event_date).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>
          ) : (
            <CalendarWidget />
          )}
        </div>

        <div className="schedule-card">
          <div className="section-heading">Recent Activity</div>
          {latestAudit ? (
            <div className="mini-list">
              <div className="mini-item">
                <span>Action</span>
                <span className="badge-soft gray">{latestAudit.action}</span>
              </div>
              <div className="mini-item">
                <span>When</span>
                <span className="badge-soft amber">
                  {latestAudit.created_at ? new Date(latestAudit.created_at).toLocaleString() : '—'}
                </span>
              </div>
            </div>
          ) : (
            <div className="mini-empty">No audit activity.</div>
          )}
        </div>

        <div className="reminders-card">
          <div className="section-heading">System Totals</div>
          <div className="mini-list">
            <div className="mini-item">
              <span>Students</span>
              <span className="badge-soft blue">{data?.summary.totalStudents ?? 0}</span>
            </div>
            <div className="mini-item">
              <span>Faculty</span>
              <span className="badge-soft green">{data?.summary.totalFaculty ?? 0}</span>
            </div>
            <div className="mini-item">
              <span>Enrolled</span>
              <span className="badge-soft amber">{data?.summary.totalEnrolledStudents ?? 0}</span>
            </div>
          </div>
        </div>
      </aside>
    </DashboardLayout>
  )
}

