import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Login } from "./Login";
import { RequireAuth } from "./RequireAuth";
import { DeanDashboard } from "./pages/DeanDashboard";
import { FacultyDashboard } from "./pages/FacultyDashboard";
import { StudentDashboard } from "./pages/StudentDashboard";
import { DeanStudents } from "./pages/dean/DeanStudents";
import { DeanFaculty } from "./pages/dean/DeanFaculty";
import { DeanCurriculum } from "./pages/dean/DeanCurriculum";
import { DeanScheduling } from "./pages/dean/DeanScheduling";
import { DeanEvents } from "./pages/dean/DeanEvents";
import { DeanReports } from "./pages/dean/DeanReports";
import { FacultyClasses } from "./pages/faculty/FacultyClasses";
import { FacultyGrades } from "./pages/faculty/FacultyGrades";
import { FacultyStudents } from "./pages/faculty/FacultyStudents";
import { FacultySchedule } from "./pages/faculty/FacultySchedule";
import { StudentProfile } from "./pages/student/StudentProfile";
import { StudentSubjects } from "./pages/student/StudentSubjects";
import { StudentEvents } from "./pages/student/StudentEvents";
import { StudentSkills } from "./pages/student/StudentSkills";
import { StudentSchedule } from "./pages/student/StudentSchedule";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth allow={["dean"]} />}>
          <Route path="/dean" element={<DeanDashboard />} />
          <Route path="/dean/students" element={<DeanStudents />} />
          <Route path="/dean/faculty" element={<DeanFaculty />} />
          <Route path="/dean/curriculum" element={<DeanCurriculum />} />
          <Route path="/dean/scheduling" element={<DeanScheduling />} />
          <Route path="/dean/events" element={<DeanEvents />} />
          <Route path="/dean/reports" element={<DeanReports />} />
        </Route>
        <Route element={<RequireAuth allow={["faculty"]} />}>
          <Route path="/faculty" element={<FacultyDashboard />} />
          <Route path="/faculty/classes" element={<FacultyClasses />} />
          <Route path="/faculty/grades" element={<FacultyGrades />} />
          <Route path="/faculty/students" element={<FacultyStudents />} />
          <Route path="/faculty/schedule" element={<FacultySchedule />} />
        </Route>
        <Route element={<RequireAuth allow={["student"]} />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/subjects" element={<StudentSubjects />} />
          <Route path="/student/schedule" element={<StudentSchedule />} />
          <Route path="/student/events" element={<StudentEvents />} />
          <Route path="/student/skills" element={<StudentSkills />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
