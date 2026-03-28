import { useEffect, useState } from "react";
import { DashboardLayout } from "../../DashboardLayout";
import api from "../../../api";
import { readPageCache, writePageCache } from "../../pageCache";

// Define the AcademicRecord interface
interface AcademicRecord {
  subject_id: number;
  grade: number;
  semester: string;
  school_year: string;
  subject?: {
    subject_code: string;
    subject_name: string;
    units?: number;
  };
}

export function StudentGrades() {
  // State management
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch grades data on component mount
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cached = readPageCache<AcademicRecord[]>("student-grades");
        if (cached) {
          setRecords(cached);
          setLoading(false);
          return;
        }

        // Get current student ID
        const meResponse = await api.get("/api/students/me");
        const studentId = meResponse.data?.student?.id;

        if (!studentId) {
          setError("Student ID not found");
          setLoading(false);
          return;
        }

        // Fetch academic history
        const response = await api.get(
          `/api/students/${studentId}/academic-history`,
        );
        const data = response.data?.academic_history || [];

        setRecords(data);
        writePageCache("student-grades", data, 120_000); // Cache for 2 minutes
      } catch (error: any) {
        console.error("Failed to fetch grades:", error);
        setError(error?.message || "Failed to load grades");
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  // Calculate GPA for all records
  const calculateGPA = (records: AcademicRecord[]) => {
    if (records.length === 0) return 0;
    const sum = records.reduce((acc, r) => acc + Number(r.grade), 0);
    return (sum / records.length).toFixed(2);
  };

  return (
    <DashboardLayout activeKey="grades" title="Grades & Transcript">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">Grades & Transcript</div>
            <div className="panel-subtitle">
              View your academic performance history
            </div>
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
              Loading grades...
            </div>
          </div>
        ) : records.length === 0 ? (
          <div className="table-card">
            <div className="muted" style={{ padding: 18, textAlign: "center" }}>
              <p style={{ marginBottom: 8 }}>No academic records found.</p>
              <p style={{ fontSize: "0.875rem" }}>
                Your grades will appear here once they are submitted by your
                instructors.
              </p>
            </div>
          </div>
        ) : (
          <div className="content-grid">
            {/* Overall GPA Card */}
            <div className="card">
              <div className="card-header">
                <h2>Overall GPA</h2>
              </div>
              <div className="card-body">
                <div
                  style={{
                    fontSize: "3rem",
                    fontWeight: "bold",
                    color: "#16a34a",
                  }}
                >
                  {calculateGPA(records)}
                </div>
                <p>Based on {records.length} subjects</p>
              </div>
            </div>

            {/* All Grades List */}
            <div className="card">
              <div className="card-header">
                <h2>All Grades</h2>
              </div>
              <div className="card-body">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Grade</th>
                      <th>Semester</th>
                      <th>School Year</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, i) => (
                      <tr key={i}>
                        <td>
                          {record.subject?.subject_name || "Unknown Subject"}
                        </td>
                        <td>{Number(record.grade).toFixed(2)}</td>
                        <td>
                          {record.semester === "first"
                            ? "1st"
                            : record.semester === "second"
                              ? "2nd"
                              : record.semester}{" "}
                          Semester
                        </td>
                        <td>{record.school_year}</td>
                        <td>
                          <span
                            className={`badge-soft ${Number(record.grade) >= 3.0 ? "red" : "green"}`}
                          >
                            {Number(record.grade) >= 3.0 ? "Failed" : "Passed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
