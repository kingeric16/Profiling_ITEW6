<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Event;
use App\Models\Course;
use App\Models\StudentAcademicHistory;
use App\Models\StudentSkill;
use App\Models\StudentViolation;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function enrollment(Request $request): JsonResponse
    {
        $query = Student::select([
                'courses.course_name',
                'students.year_level',
                DB::raw('COUNT(students.id) as total_students'),
                DB::raw('AVG(students.overall_gpa) as average_gpa')
            ])
            ->join('courses', 'students.course_id', '=', 'courses.id')
            ->groupBy('courses.course_name', 'students.year_level')
            ->orderBy('courses.course_name')
            ->orderBy('students.year_level');

        if ($request->course_id) {
            $query->where('courses.id', $request->course_id);
        }

        if ($request->year_level) {
            $query->where('students.year_level', $request->year_level);
        }

        $enrollmentStats = $query->get();

        return response()->json([
            'enrollment_stats' => $enrollmentStats,
            'filters' => $request->all()
        ]);
    }

    public function performance(Request $request): JsonResponse
    {
        $query = Student::with(['course', 'skills', 'academicHistory.subject']);

        // Top performers
        if ($request->top_performers) {
            $query->where('overall_gpa', '>=', 3.5)
                  ->orderBy('overall_gpa', 'desc')
                  ->limit(20);
        }

        // Students with specific skills
        if ($request->has_skill) {
            $query->whereHas('skills', function ($q) use ($request) {
                $q->where('skill_name', $request->has_skill);
            });
        }

        // Students without violations
        if ($request->no_violations) {
            $query->whereDoesntHave('violations');
        }

        // GPA range
        if ($request->gpa_min) {
            $query->where('overall_gpa', '>=', $request->gpa_min);
        }
        if ($request->gpa_max) {
            $query->where('overall_gpa', '<=', $request->gpa_max);
        }

        $students = $query->orderBy('overall_gpa', 'desc')->get();

        return response()->json([
            'students' => $students,
            'filters' => $request->all()
        ]);
    }

    public function export(Request $request): JsonResponse
    {
        $type = $request->type ?? 'enrollment';
        
        switch ($type) {
            case 'enrollment':
                return $this->exportEnrollmentReport($request);
            case 'performance':
                return $this->exportPerformanceReport($request);
            case 'students':
                return $this->exportStudentsReport($request);
            case 'grades':
                return $this->exportGradesReport($request);
            default:
                return response()->json(['message' => 'Invalid export type'], 400);
        }
    }

    private function exportEnrollmentReport(Request $request): JsonResponse
    {
        $students = Student::with(['course'])
            ->when($request->course_id, function ($q, $courseId) {
                $q->where('course_id', $courseId);
            })
            ->when($request->year_level, function ($q, $yearLevel) {
                $q->where('year_level', $yearLevel);
            })
            ->orderBy('last_name')
            ->get();

        $csvData = "Student Number,First Name,Last Name,Course,Year Level,GPA,Email\n";
        
        foreach ($students as $student) {
            $csvData .= sprintf(
                "%s,%s,%s,%s,%s,%.2f,%s\n",
                $student->student_number,
                $student->first_name,
                $student->last_name,
                $student->course->course_name ?? '',
                $student->year_level,
                $student->overall_gpa ?? 0,
                $student->email
            );
        }

        $filename = "enrollment_report_" . date('Y-m-d_His') . ".csv";
        
        Audit::log($request->user(), 'export_report', ['type' => 'enrollment', 'count' => $students->count()]);
        
        return response($csvData)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    private function exportPerformanceReport(Request $request): JsonResponse
    {
        $students = Student::with(['academicHistory.subject'])
            ->where('overall_gpa', '>=', ($request->min_gpa ?? 2.0))
            ->orderBy('overall_gpa', 'desc')
            ->get();

        $csvData = "Student Number,Student Name,Subject,Grade,Semester,School Year,Submitted Date\n";
        
        foreach ($students as $student) {
            foreach ($student->academicHistory as $history) {
                $csvData .= sprintf(
                    "%s,%s,%s,%.2f,%s,%s,%s\n",
                    $student->student_number,
                    $student->first_name . ' ' . $student->last_name,
                    $history->subject->subject_name ?? '',
                    $history->grade ?? 0,
                    $history->semester ?? '',
                    $history->school_year ?? '',
                    $history->created_at->format('Y-m-d')
                );
            }
        }

        $filename = "performance_report_" . date('Y-m-d_His') . ".csv";
        
        Audit::log($request->user(), 'export_report', ['type' => 'performance', 'count' => $students->count()]);
        
        return response($csvData)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    private function exportStudentsReport(Request $request): JsonResponse
    {
        $students = Student::with(['course', 'skills.skill', 'violations'])
            ->orderBy('last_name')
            ->get();

        $csvData = "Student Number,First Name,Last Name,Course,Year Level,GPA,Email,Skills,Violations\n";
        
        foreach ($students as $student) {
            $skills = $student->skills->pluck('skill_name')->implode('; ');
            $violations = $student->violations->pluck('violation_type')->implode('; ');
            
            $csvData .= sprintf(
                "%s,%s,%s,%s,%s,%.2f,%s,\"%s\",\"%s\"\n",
                $student->student_number,
                $student->first_name,
                $student->last_name,
                $student->course->course_name ?? '',
                $student->year_level,
                $student->overall_gpa ?? 0,
                $student->email,
                $skills,
                $violations
            );
        }

        $filename = "students_report_" . date('Y-m-d_His') . ".csv";
        
        Audit::log($request->user(), 'export_report', ['type' => 'students', 'count' => $students->count()]);
        
        return response($csvData)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    private function exportGradesReport(Request $request): JsonResponse
    {
        $grades = StudentAcademicHistory::with(['student', 'subject'])
            ->when($request->semester, function ($q, $semester) {
                $q->where('semester', $semester);
            })
            ->when($request->school_year, function ($q, $schoolYear) {
                $q->where('school_year', $schoolYear);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        $csvData = "Student Number,Student Name,Subject,Grade,Semester,School Year,Submitted Date\n";
        
        foreach ($grades as $grade) {
            $csvData .= sprintf(
                "%s,%s,%s,%.2f,%s,%s,%s\n",
                $grade->student->student_number,
                $grade->student->first_name . ' ' . $grade->student->last_name,
                $grade->subject->subject_name,
                $grade->grade,
                $grade->semester,
                $grade->school_year,
                $grade->created_at->format('Y-m-d')
            );
        }

        $filename = "grades_report_" . date('Y-m-d_His') . ".csv";
        
        Audit::log($request->user(), 'export_report', ['type' => 'grades', 'count' => $grades->count()]);
        
        return response($csvData)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    public function basketballQualifications(Request $request): JsonResponse
    {
        $minHeight = $request->min_height ?? 170;
        $students = Student::with(['skills.skill', 'course', 'section', 'violations'])
            ->whereHas('skills.skill', function ($q) {
                $q->where('skill_name', 'like', '%basketball%');
            })
            ->where('height', '>=', $minHeight)
            ->whereDoesntHave('violations', function ($q) {
                $q->where('severity_level', 'major');
            })
            ->orderBy('height', 'desc')
            ->get();

        Audit::log($request->user(), 'generate_report', ['type' => 'basketball_qualifications', 'count' => $students->count()]);
        
        return response()->json([
            'report_name' => 'Basketball Tryouts Qualified Students',
            'qualified_students' => $students,
            'criteria' => [
                'min_height' => $minHeight,
                'skill' => 'basketball',
                'no_major_violations' => true
            ]
        ]);
    }

    public function programmingQualifications(Request $request): JsonResponse
    {
        $minGPA = $request->min_gpa ?? 2.0;
        $students = Student::with(['skills.skill', 'course', 'section', 'violations'])
            ->whereHas('skills.skill', function ($q) {
                $q->where('skill_name', 'like', '%programming%');
            })
            ->where('overall_gpa', '>=', $minGPA)
            ->orderBy('overall_gpa', 'desc')
            ->get();

        Audit::log($request->user(), 'generate_report', ['type' => 'programming_qualifications', 'count' => $students->count()]);
        
        return response()->json([
            'report_name' => 'Programming Contest Qualified Students',
            'qualified_students' => $students,
            'criteria' => [
                'min_gpa' => $minGPA,
                'skill' => 'programming'
            ]
        ]);
    }

    public function leadershipQualifications(Request $request): JsonResponse
    {
        $students = Student::with(['affiliations', 'course', 'section', 'violations'])
            ->whereHas('affiliations', function ($q) {
                $q->where('organization_name', 'like', '%council%')
                  ->orWhere('role', 'like', '%president%')
                  ->orWhere('role', 'like', '%leader%')
                  ->orWhere('role', 'like', '%officer%');
            })
            ->where('overall_gpa', '>=', 2.5)
            ->orderBy('overall_gpa', 'desc')
            ->get();

        Audit::log($request->user(), 'generate_report', ['type' => 'leadership_qualifications', 'count' => $students->count()]);
        
        return response()->json([
            'report_name' => 'Students with Leadership Skills',
            'qualified_students' => $students,
            'criteria' => [
                'leadership_role' => true,
                'min_gpa' => 2.5
            ]
        ]);
    }

    // Legacy methods for backward compatibility
    public function basketballTryouts(): JsonResponse
    {
        return $this->basketballQualifications(request());
    }

    public function programmingContest(): JsonResponse
    {
        return $this->programmingQualifications(request());
    }

    public function leadershipSkills(): JsonResponse
    {
        return $this->leadershipQualifications(request());
    }

    public function noViolations(): JsonResponse
    {
        $students = Student::with(['course', 'section', 'violations'])
            ->whereDoesntHave('violations')
            ->get();

        return response()->json([
            'report_name' => 'Students with No Violations',
            'students' => $students
        ]);
    }

    public function topPerforming(): JsonResponse
    {
        $students = Student::with(['course', 'section', 'violations', 'skills.skill'])
            ->where('overall_gpa', '>=', 3.5)
            ->orderByDesc('overall_gpa')
            ->limit(50)
            ->get();

        return response()->json([
            'report_name' => 'Top Performing Students (GPA ≥ 3.5)',
            'students' => $students
        ]);
    }

    public function customReport(Request $request): JsonResponse
    {
        $query = Student::with(['course', 'section', 'skills.skill', 'violations']);

        if ($request->has('skills')) {
            $skills = explode(',', $request->skills);
            $query->whereHas('skills.skill', function ($q) use ($skills) {
                $q->whereIn('skill_name', $skills);
            });
        }

        if ($request->has('min_gpa')) {
            $query->where('overall_gpa', '>=', $request->min_gpa);
        }

        if ($request->has('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        if ($request->has('year_level')) {
            $query->where('year_level', $request->year_level);
        }

        if ($request->has('no_violations')) {
            $query->whereDoesntHave('violations');
        }

        if ($request->has('min_height')) {
            $query->where('height', '>=', $request->min_height);
        }

        $students = $query->get();

        return response()->json([
            'report_name' => 'Custom Report',
            'filters' => $request->all(),
            'students' => $students
        ]);
    }
}
