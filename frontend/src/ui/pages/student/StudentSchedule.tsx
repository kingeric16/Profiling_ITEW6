import { useEffect, useState } from "react";
import { DashboardLayout } from "../../DashboardLayout";
import api from "../../../api";
import { readPageCache, writePageCache } from "../../pageCache";

type ScheduleItem = {
  assignment_id: number;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  section_name: string;
  room: string | null;
  schedule_day: string | null;
  start_time: string | null;
  end_time: string | null;
  school_year: string;
  section_id: number;
  faculty_name?: string;
};

type StudentProfile = {
  id: number;
  section_id: number;
  section?: { section_name: string };
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const TIME_SLOTS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

const SUBJECT_COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

function getColorForSubject(subjectId: number): string {
  return SUBJECT_COLORS[subjectId % SUBJECT_COLORS.length];
}

function parseTime(timeStr: string | null): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + minutes / 60;
}

export function StudentSchedule() {
  const cachedProfile = readPageCache<StudentProfile>("student.profile");
  const cachedSchedule = readPageCache<ScheduleItem[]>("student.schedule");

  const [profile, setProfile] = useState<StudentProfile | null>(cachedProfile);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(
    cachedSchedule ?? [],
  );
  const [loading, setLoading] = useState(!cachedProfile || !cachedSchedule);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "list">("week");

  useEffect(() => {
    (async () => {
      if (!cachedProfile || !cachedSchedule) setLoading(true);
      setError(null);

      try {
        // Fetch student profile to get section_id
        const profileRes = await api.get("/api/students/me");
        const studentData = profileRes.data?.student as StudentProfile;
        setProfile(studentData);
        writePageCache("student.profile", studentData, 120_000);

        if (!studentData?.section_id) {
          setSchedule([]);
          return;
        }

        // Fetch all faculty assignments
        const scheduleRes = await api.get("/api/faculty-assignments");
        const allAssignments = Array.isArray(scheduleRes.data?.assignments)
          ? scheduleRes.data.assignments
          : [];

        // Filter by student's section
        const mySchedule = allAssignments.filter(
          (item: any) =>
            Number(item.section_id) === Number(studentData.section_id),
        );

        // Fetch faculty names for each assignment
        const enrichedSchedule = await Promise.all(
          mySchedule.map(async (item: any) => {
            try {
              const facultyRes = await api.get(`/api/faculty`);
              const allFaculty = Array.isArray(facultyRes.data)
                ? facultyRes.data
                : [];
              const faculty = allFaculty.find(
                (f: any) => Number(f.id) === Number(item.faculty_id),
              );
              return {
                ...item,
                faculty_name: faculty
                  ? `${faculty.first_name} ${faculty.last_name}`
                  : "TBA",
              };
            } catch {
              return { ...item, faculty_name: "TBA" };
            }
          }),
        );

        setSchedule(enrichedSchedule);
        writePageCache("student.schedule", enrichedSchedule, 120_000);
      } catch (e: any) {
        setError(e?.message || "Failed to load schedule.");
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const scheduleByDay = DAYS.reduce(
    (acc, day) => {
      acc[day] = schedule
        .filter(
          (item) => item.schedule_day?.toLowerCase() === day.toLowerCase(),
        )
        .sort((a, b) => {
          const timeA = parseTime(a.start_time);
          const timeB = parseTime(b.start_time);
          return timeA - timeB;
        });
      return acc;
    },
    {} as Record<string, ScheduleItem[]>,
  );

  return (
    <DashboardLayout activeKey="schedule" title="Class Schedule">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">My Class Schedule</div>
            <div className="panel-subtitle">
              {profile?.section?.section_name
                ? `Section: ${profile.section.section_name}`
                : "Weekly timetable and class information"}
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
            <button
              type="button"
              className={`btn-sm ${viewMode === "week" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setViewMode("week")}
            >
              Week View
            </button>
            <button
              type="button"
              className={`btn-sm ${viewMode === "list" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setViewMode("list")}
            >
              List View
            </button>
          </div>
        </div>

        {error ? (
          <div className="login-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="table-card">
            <div className="muted" style={{ padding: 18 }}>
              Loading schedule...
            </div>
          </div>
        ) : !profile?.section_id ? (
          <div className="table-card">
            <div className="muted" style={{ padding: 18 }}>
              No section assigned. Please contact your administrator.
            </div>
          </div>
        ) : viewMode === "list" ? (
          <div className="table-card">
            <div className="table-card-title">All Classes</div>
            <div className="table-card-sub">
              Showing {schedule.length} class(es)
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Room</th>
                    <th>Faculty</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="muted">
                        No classes scheduled yet.
                      </td>
                    </tr>
                  ) : (
                    schedule.map((item) => (
                      <tr key={item.assignment_id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>
                            {item.subject_code}
                          </div>
                          <div className="muted">{item.subject_name}</div>
                        </td>
                        <td>{item.schedule_day || "—"}</td>
                        <td>
                          {item.start_time && item.end_time
                            ? `${item.start_time} - ${item.end_time}`
                            : "—"}
                        </td>
                        <td>{item.room || "—"}</td>
                        <td>{item.faculty_name || "TBA"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `80px repeat(${DAYS.length}, 1fr)`,
                gap: "8px",
                minWidth: "900px",
                padding: "16px",
              }}
            >
              {/* Header row */}
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "11px",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                TIME
              </div>
              {DAYS.map((day) => (
                <div
                  key={day}
                  style={{
                    fontWeight: 700,
                    fontSize: "13px",
                    color: "#1e293b",
                    textAlign: "center",
                    padding: "8px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                  }}
                >
                  {day}
                </div>
              ))}

              {/* Time slots */}
              {TIME_SLOTS.map((time, timeIdx) => (
                <div key={time} style={{ display: "contents" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      paddingTop: "8px",
                    }}
                  >
                    {time}
                  </div>

                  {DAYS.map((day) => {
                    const daySchedule = scheduleByDay[day] || [];
                    const classesInSlot = daySchedule.filter((item) => {
                      const startHour = parseTime(item.start_time);
                      const slotHour = parseTime(time);
                      return startHour >= slotHour && startHour < slotHour + 1;
                    });

                    return (
                      <div
                        key={`${day}-${time}`}
                        style={{
                          minHeight: "60px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          padding: "4px",
                          background: "#ffffff",
                          position: "relative",
                        }}
                      >
                        {classesInSlot.map((item) => (
                          <div
                            key={item.assignment_id}
                            style={{
                              background: getColorForSubject(item.subject_id),
                              color: "#ffffff",
                              padding: "6px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              marginBottom: "4px",
                              cursor: "pointer",
                              transition: "transform 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.02)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                            title={`${item.subject_name}\n${item.faculty_name}\nRoom: ${item.room || "TBA"}`}
                          >
                            <div
                              style={{ fontWeight: 700, marginBottom: "2px" }}
                            >
                              {item.subject_code}
                            </div>
                            <div style={{ fontSize: "10px", opacity: 0.9 }}>
                              {item.start_time}-{item.end_time}
                            </div>
                            <div style={{ fontSize: "10px", opacity: 0.9 }}>
                              {item.room || "TBA"}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && schedule.length > 0 && viewMode === "week" ? (
          <div
            style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "8px",
              marginTop: "16px",
            }}
          >
            <div
              style={{ fontWeight: 700, marginBottom: "8px", fontSize: "13px" }}
            >
              Legend
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {Array.from(new Set(schedule.map((s) => s.subject_id))).map(
                (subjectId, idx) => {
                  const subject = schedule.find(
                    (s) => s.subject_id === subjectId,
                  );
                  return (
                    <div
                      key={subjectId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "3px",
                          background: getColorForSubject(subjectId),
                        }}
                      />
                      <span style={{ fontSize: "12px" }}>
                        {subject?.subject_code} - {subject?.subject_name}
                      </span>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
