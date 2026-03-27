import { useEffect, useState } from "react";
import api from "../../api";
import { DashboardLayout } from "../DashboardLayout";
import { readPageCache, writePageCache } from "../pageCache";

type Payload = {
  profile: {
    name: string;
    email: string;
    course: string | number | null;
    yearLevel: string | null;
    gpa: number | null;
    enrollmentStatus: string | null;
    studentNumber: string | null;
  };
  subjects: Array<{
    subject_code: string;
    subject_name: string;
    units: number;
    grade?: number;
    status?: string;
  }>;
  skills: Array<{
    skill_name: string | null;
    skill_category: string | null;
    skill_level: string | null;
  }>;
  medical: any | null;
  violations: Array<any>;
  affiliations: Array<{
    organization_name: string;
    role: string;
    status: string;
  }>;
  academicHistory: Array<{
    subject_name: string;
    grade: number;
    semester: string;
    school_year: string;
  }>;
  upcomingEvents: Array<{
    event_name: string;
    category: string;
    event_date: string;
    location: string;
  }>;
};

function StudentCalendarWidget() {
  const currentDate = new Date();

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const getDaysInMonth = (date: Date): (number | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const today = new Date();
  const isToday = (day: number | null) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="calendar-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div className="section-heading">Academic Calendar</div>
        <span className="badge-soft amber">
          Week {getWeekNumber(currentDate)}
        </span>
      </div>

      <div
        style={{
          marginBottom: "8px",
          fontSize: "13px",
          fontWeight: "600",
          color: "#1e293b",
        }}
      >
        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px",
          marginBottom: "4px",
        }}
      >
        {weekDays.map((day) => (
          <div
            key={day}
            style={{
              fontSize: "10px",
              fontWeight: "600",
              color: "#64748b",
              textAlign: "center",
              padding: "2px",
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px",
        }}
      >
        {days.map((day, index) => (
          <div
            key={index}
            onClick={() =>
              day &&
              console.log(
                `Selected: ${monthNames[currentDate.getMonth()]} ${day}, ${currentDate.getFullYear()}`,
              )
            }
            style={{
              aspectRatio: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: day && isToday(day) ? "700" : "400",
              borderRadius: "4px",
              backgroundColor: day && isToday(day) ? "#10b981" : "transparent",
              color:
                day && isToday(day) ? "#ffffff" : day ? "#374151" : "#e5e7eb",
              cursor: day ? "pointer" : "default",
              transition: "all 0.2s ease",
              border: day && !isToday(day) ? "1px solid #e5e7eb" : "none",
            }}
            onMouseEnter={(e) => {
              if (day && !isToday(day)) {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (day && !isToday(day)) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
          >
            {day || ""}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "12px",
          paddingTop: "8px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "11px", color: "#374151" }}>
          Academic Status
        </span>
        <span className="badge-soft green">Active</span>
      </div>
    </div>
  );
}

export function StudentDashboard() {
  const cached = readPageCache<Payload>("student.dashboard");
  const [data, setData] = useState<Payload | null>(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (!cached) setLoading(true);
    api
      .get("/api/dashboard/student")
      .then((res) => {
        const payload = res.data as Payload;
        setData(payload);
        writePageCache("student.dashboard", payload, 60_000);
      })
      .catch(() => {
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout activeKey="dashboard" title="Student Dashboard">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">Student Portal</div>
            <div className="panel-subtitle">
              Complete academic profile & performance
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <button type="button" className="btn-sm btn-outline">
              View Profile
            </button>
            <button type="button" className="btn-sm btn-outline">
              Grades
            </button>
            <button type="button" className="btn-sm btn-outline">
              Registration
            </button>
          </div>
        </div>

        <div
          className="stats-grid"
          style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
        >
          {(
            [
              {
                label: "Current GPA",
                value:
                  data?.profile.gpa != null
                    ? Number(data.profile.gpa).toFixed(2)
                    : "—",
              },
              { label: "Year Level", value: data?.profile.yearLevel ?? "—" },
              {
                label: "Enrolled Subjects",
                value: (data?.subjects?.length ?? 0).toString(),
              },
              {
                label: "Skills & Certifications",
                value: (data?.skills?.length ?? 0).toString(),
              },
            ] as const
          ).map((s) => (
            <div key={s.label} className="stat-tile">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{loading ? "…" : s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ height: 12 }} />

        <div className="two-col">
          <div className="table-card">
            <div className="table-card-title">Student Information</div>
            <div className="table-card-sub">Personal & academic details</div>
            <div className="mini-table">
              <div className="mini-row">
                <div className="mini-main">
                  <div className="mini-title">Full Name</div>
                  <div className="mini-sub">{data?.profile.name ?? "—"}</div>
                </div>
              </div>
              <div className="mini-row">
                <div className="mini-main">
                  <div className="mini-title">Student Number</div>
                  <div className="mini-sub">
                    {data?.profile.studentNumber ?? "—"}
                  </div>
                </div>
                <div className="mini-meta">
                  {data?.profile.yearLevel ?? "—"}
                </div>
              </div>
              <div className="mini-row">
                <div className="mini-main">
                  <div className="mini-title">Course & Year</div>
                  <div className="mini-sub">
                    {String(data?.profile.course ?? "—")}
                  </div>
                </div>
                <div className="mini-meta">
                  <span
                    className={`badge-soft ${data?.profile.enrollmentStatus === "Enrolled" ? "green" : "amber"}`}
                  >
                    {data?.profile.enrollmentStatus ?? "—"}
                  </span>
                </div>
              </div>
              <div className="mini-row">
                <div className="mini-main">
                  <div className="mini-title">Email</div>
                  <div className="mini-sub">{data?.profile.email ?? "—"}</div>
                </div>
              </div>
              {loading ? <div className="mini-empty">Loading…</div> : null}
            </div>
          </div>

          <div className="table-card">
            <div className="table-card-title">Current Enrollments</div>
            <div className="table-card-sub">This semester subjects</div>
            <div className="mini-table">
              {(data?.subjects ?? []).slice(0, 6).map((s) => (
                <div key={s.subject_code} className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">{s.subject_code}</div>
                    <div className="mini-sub">{s.subject_name}</div>
                  </div>
                  <div className="mini-meta">
                    <div style={{ fontSize: "11px", fontWeight: "600" }}>
                      {s.units}
                    </div>
                    {s.grade && (
                      <span className="badge-soft green">{s.grade}</span>
                    )}
                    {s.status && (
                      <span
                        className={`badge-soft ${s.status === "Passed" ? "green" : s.status === "Failed" ? "red" : "amber"}`}
                      >
                        {s.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {!loading && (data?.subjects?.length ?? 0) === 0 ? (
                <div className="mini-empty">No subjects enrolled.</div>
              ) : null}
            </div>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="two-col">
          <div className="table-card">
            <div className="table-card-title">Skills & Competencies</div>
            <div className="table-card-sub">Technical & soft skills</div>
            <div className="mini-table">
              {(data?.skills ?? []).slice(0, 8).map((s, idx) => (
                <div key={idx} className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">{s.skill_name ?? "—"}</div>
                    <div className="mini-sub">{s.skill_category ?? ""}</div>
                  </div>
                  <div className="mini-meta">
                    <span
                      className={`badge-soft ${s.skill_level === "Advanced" ? "green" : s.skill_level === "Intermediate" ? "amber" : "gray"}`}
                    >
                      {s.skill_level ?? "—"}
                    </span>
                  </div>
                </div>
              ))}
              {!loading && (data?.skills?.length ?? 0) === 0 ? (
                <div className="mini-empty">No skills recorded.</div>
              ) : null}
            </div>
          </div>

          <div className="table-card">
            <div className="table-card-title">Academic History</div>
            <div className="table-card-sub">Recent grades & performance</div>
            <div className="mini-table">
              {(data?.academicHistory ?? []).slice(0, 6).map((record, idx) => (
                <div key={idx} className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">{record.subject_name}</div>
                    <div className="mini-sub">
                      {record.semester} • {record.school_year}
                    </div>
                  </div>
                  <div className="mini-meta">
                    <span
                      className={`badge-soft ${Number(record.grade) >= 3.0 ? "green" : Number(record.grade) >= 2.0 ? "amber" : "red"}`}
                    >
                      {Number(record.grade).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
              {!loading && (data?.academicHistory?.length ?? 0) === 0 ? (
                <div className="mini-empty">No academic history.</div>
              ) : null}
            </div>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="two-col">
          <div className="table-card">
            <div className="table-card-title">Organizations & Affiliations</div>
            <div className="table-card-sub">Extra-curricular activities</div>
            <div className="mini-table">
              {(data?.affiliations ?? []).slice(0, 6).map((aff, idx) => (
                <div key={idx} className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">{aff.organization_name}</div>
                    <div className="mini-sub">Role: {aff.role}</div>
                  </div>
                  <div className="mini-meta">
                    <span
                      className={`badge-soft ${aff.status === "Active" ? "green" : aff.status === "Inactive" ? "red" : "amber"}`}
                    >
                      {aff.status}
                    </span>
                  </div>
                </div>
              ))}
              {!loading && (data?.affiliations?.length ?? 0) === 0 ? (
                <div className="mini-empty">No affiliations recorded.</div>
              ) : null}
            </div>
          </div>

          <div className="table-card">
            <div className="table-card-title">Disciplinary Record</div>
            <div className="table-card-sub">Violations & clearance status</div>
            <div className="mini-table">
              {(data?.violations ?? []).slice(0, 6).map((v: any, idx) => (
                <div key={idx} className="mini-row">
                  <div className="mini-main">
                    <div className="mini-title">
                      {v.violation_type ?? "Violation"}
                    </div>
                    <div className="mini-sub">{v.violation_date ?? ""}</div>
                  </div>
                  <div className="mini-meta">
                    <span
                      className={`badge-soft ${v.clearance_status === "Cleared" ? "green" : v.clearance_status === "Pending" ? "amber" : "red"}`}
                    >
                      {v.clearance_status ?? "—"}
                    </span>
                  </div>
                </div>
              ))}
              {!loading && (data?.violations?.length ?? 0) === 0 ? (
                <div className="mini-empty">No violations found.</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <aside className="side-stack">
        <div className="profile-card">
          <div className="avatar" aria-hidden="true">
            S
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13 }}>Student</div>
              <span className="profile-badge">student</span>
            </div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>Student Portal</div>
          </div>
        </div>

        <div className="calendar-card">
          <StudentCalendarWidget />
        </div>

        <div className="schedule-card">
          <div className="section-heading">Upcoming Events</div>
          <div className="mini-list">
            {(data?.upcomingEvents ?? []).slice(0, 4).map((event, idx) => (
              <div key={idx} className="mini-item">
                <span>{event.event_name}</span>
                <span
                  className={`badge-soft ${event.category === "academic" ? "green" : event.category === "sports" ? "amber" : "blue"}`}
                >
                  {event.category}
                </span>
              </div>
            ))}
            {!loading && (data?.upcomingEvents?.length ?? 0) === 0 ? (
              <div className="mini-item">
                <span>No upcoming events</span>
                <span className="badge-soft gray">—</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="reminders-card">
          <div className="section-heading">Medical Information</div>
          <div className="mini-list">
            <div className="mini-item">
              <span>Blood Type</span>
              <span className="badge-soft amber">
                {data?.medical?.blood_type ?? "—"}
              </span>
            </div>
            <div className="mini-item">
              <span>Allergies</span>
              <span className="badge-soft red">
                {data?.medical?.allergies ?? "None"}
              </span>
            </div>
            <div className="mini-item">
              <span>Last Checkup</span>
              <span className="badge-soft green">
                {data?.medical?.last_checkup_date ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </DashboardLayout>
  );
}
