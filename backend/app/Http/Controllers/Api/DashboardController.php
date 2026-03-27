<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardController extends Controller
{
    private function has(string $table): bool
    {
        try {
            return Schema::hasTable($table);
        } catch (\Throwable) {
            return false;
        }
    }

    private function safeCount(string $table): int
    {
        if (! $this->has($table)) {
            return 0;
        }
        try {
            return (int) DB::table($table)->count();
        } catch (\Throwable) {
            return 0;
        }
    }

    public function dean(Request $request)
    {
        $totalStudents = (int) DB::table('users')->where('role', 'student')->count();
        $totalFaculty = (int) DB::table('users')->where('role', 'faculty')->count();
        $totalCourses = $this->safeCount('courses');
        $totalEvents = $this->safeCount('events');
        $totalEnrolled = 0;
        if ($this->has('students')) {
            try {
                $totalEnrolled = (int) DB::table('students')
                    ->where('enrollment_status', 'Enrolled')
                    ->count();
            } catch (\Throwable) {
                $totalEnrolled = 0;
            }
        }

        $recentStudents = DB::table('users')
            ->select('id', 'name', 'email', 'created_at')
            ->where('role', 'student')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get();

        $recentFaculty = DB::table('users')
            ->select('id', 'name', 'email', 'created_at')
            ->where('role', 'faculty')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get();

        $audit = DB::table('audit_logs')
            ->select('action', 'actor_role', 'actor_id', 'created_at')
            ->orderByDesc('created_at')
            ->limit(12)
            ->get();

        $upcomingEvents = [];
        if ($this->has('events')) {
            try {
                $upcomingEvents = DB::table('events')
                    ->select('id as event_id', 'event_name', 'category', 'event_date', 'location')
                    ->orderBy('event_date')
                    ->limit(8)
                    ->get();
            } catch (\Throwable) {
            }
        }

        $enrollmentStats = [];
        if ($this->has('students') && $this->has('courses')) {
            try {
                $enrollmentStats = DB::table('students as s')
                    ->join('courses as c', 'c.id', '=', 's.course_id')
                    ->where('s.enrollment_status', 'Enrolled')
                    ->select('c.course_name', 's.year_level', DB::raw('COUNT(*) as total'))
                    ->groupBy('c.course_name', 's.year_level')
                    ->orderByDesc('total')
                    ->limit(12)
                    ->get();
            } catch (\Throwable) {
            }
        }

        return response()->json([
            'summary' => [
                'totalStudents' => $totalStudents,
                'totalFaculty' => $totalFaculty,
                'totalCourses' => $totalCourses,
                'totalEvents' => $totalEvents,
                'totalEnrolledStudents' => $totalEnrolled,
            ],
            'recentStudents' => $recentStudents,
            'recentFaculty' => $recentFaculty,
            'upcomingEvents' => $upcomingEvents,
            'enrollmentStats' => $enrollmentStats,
            'eventParticipation' => [],
            'auditLogs' => $audit,
        ]);
    }

    public function faculty(Request $request)
    {
        $user = $request->user();

        // Map logged-in faculty user to domain faculty row by email.
        $facultyId = (int) $user->id;
        if ($this->has('faculty')) {
            try {
                $row = DB::table('faculty')->select('id')->where('email', $user->email)->first();
                if ($row && isset($row->id)) {
                    $facultyId = (int) $row->id;
                } 
            } catch (\Throwable) {
            }
        }

        $summary = [
            'totalAssignedSubjects' => 0,
            'totalStudentsHandled' => 0,
            'upcomingClasses' => 0,
        ];

        $schedule = [];
        if ($this->has('faculty_assignments')) {
            try {
                $summary['totalAssignedSubjects'] = (int) DB::table('faculty_assignments')->where('faculty_id', $facultyId)->distinct('subject_id')->count('subject_id');
                $summary['upcomingClasses'] = (int) DB::table('faculty_assignments')->where('faculty_id', $facultyId)->count();

                if ($this->has('students')) {
                    $summary['totalStudentsHandled'] = (int) DB::table('faculty_assignments as fa')
                        ->join('students as s', 's.section_id', '=', 'fa.section_id')
                        ->where('fa.faculty_id', $facultyId)
                        ->distinct('s.id')
                        ->count('s.id');
                }

                $schedule = DB::table('faculty_assignments as fa')
                    ->leftJoin('subjects as sub', 'sub.id', '=', 'fa.subject_id')
                    ->leftJoin('sections as sec', 'sec.id', '=', 'fa.section_id')
                    ->where('fa.faculty_id', $facultyId)
                    ->select(
                        'fa.id as assignment_id',
                        'fa.subject_id',
                        'sub.subject_code',
                        'sub.subject_name',
                        'sec.section_name',
                        'fa.room',
                        'fa.schedule_day',
                        'fa.start_time',
                        'fa.end_time',
                        'fa.school_year',
                        'fa.section_id'
                    )
                    ->orderBy('fa.schedule_day')
                    ->orderBy('fa.start_time')
                    ->limit(25)
                    ->get();
            } catch (\Throwable) {
            }
        }

        $students = [];
        if (!empty($schedule) && $this->has('students')) {
            try {
                $sectionId = (int) ($schedule[0]->section_id ?? 0);
                if ($sectionId) {
                    $students = DB::table('students')
                        ->select('id', 'id as student_id', 'student_number', 'first_name', 'last_name', 'section_id', 'year_level')
                        ->where('section_id', $sectionId)
                        ->orderBy('last_name')
                        ->limit(25)
                        ->get();
                }
            } catch (\Throwable) {
            }
        }

        return response()->json([
            'summary' => $summary,
            'schedule' => $schedule,
            'students' => $students,
        ]);
    }

    public function student(Request $request)
    {
        $user = $request->user();

        $student = null;
        if ($this->has('students')) {
            try {
                // Your current migration maps student <-> auth user by shared `email`.
                // Only attempt `user_id` if that column exists (compat with older setups).
                $student = DB::table('students')->where('email', $user->email)->first();
                if (! $student) {
                    if (Schema::hasColumn('students', 'user_id')) {
                        $student = DB::table('students')->where('user_id', $user->id)->first();
                    }
                }
            } catch (\Throwable) {
                $student = null;
            }
        }

        $gpa = null;
        $studentId = $student ? (int) ($student->id ?? $student->student_id ?? 0) : 0;
        if ($student && $this->has('student_academic_history')) {
            try {
                $avgGrade = DB::table('student_academic_history')
                    ->where('student_id', $studentId)
                    ->avg('grade');
                $gpa = $avgGrade !== null ? (float) $avgGrade : null;
            } catch (\Throwable) {
            }
        }

        // Build subjects from your curriculum mapping, since there is no `enrollments` table/migration.
        // Additionally enrich each subject with the student's latest grade (from student_academic_history).
        $subjects = [];
        if ($student && $this->has('curriculum') && $this->has('subjects')) {
            try {
                $curriculumRows = DB::table('curriculum as cur')
                    ->join('subjects as sub', 'sub.id', '=', 'cur.subject_id')
                    ->where('cur.course_id', $student->course_id)
                    ->where('cur.year_level', $student->year_level)
                    ->select('cur.subject_id', 'sub.subject_code', 'sub.subject_name', 'sub.units')
                    ->orderBy('sub.subject_code')
                    ->limit(50)
                    ->get();

                $subjectIds = collect($curriculumRows)->pluck('subject_id')->filter()->values()->all();

                $latestHistoryBySubjectId = [];
                if (!empty($subjectIds) && $this->has('student_academic_history')) {
                    $historyRows = DB::table('student_academic_history')
                        ->where('student_id', $studentId)
                        ->whereIn('subject_id', $subjectIds)
                        ->orderByDesc('created_at')
                        ->get(['subject_id', 'grade', 'created_at']);

                    foreach ($historyRows as $row) {
                        $sid = (int) $row->subject_id;
                        if (!isset($latestHistoryBySubjectId[$sid])) {
                            $latestHistoryBySubjectId[$sid] = $row;
                        }
                    }
                }

                $subjects = collect($curriculumRows)->map(function ($row) use ($latestHistoryBySubjectId) {
                    $sid = (int) $row->subject_id;
                    $hist = $latestHistoryBySubjectId[$sid] ?? null;
                    $grade = $hist ? (float) $hist->grade : null;
                    $status = $grade != null ? ($grade >= 3.0 ? 'Passed' : 'Failed') : null;

                    return [
                        'subject_code' => $row->subject_code,
                        'subject_name' => $row->subject_name,
                        'units' => $row->units,
                        'grade' => $grade,
                        'status' => $status,
                    ];
                })->values()->all();
            } catch (\Throwable) {
                $subjects = [];
            }
        }

        $skills = [];
        if ($student && $this->has('student_skills')) {
            try {
                $skills = DB::table('student_skills as ss')
                    ->leftJoin('skill_master as sm', 'sm.id', '=', 'ss.skill_id')
                    ->where('ss.student_id', $studentId)
                    ->select('sm.skill_name', 'sm.skill_category', 'ss.skill_level')
                    ->orderByDesc('ss.skill_level')
                    ->limit(20)
                    ->get();
            } catch (\Throwable) {
            }
        }

        $medical = null;
        if ($student && $this->has('student_medical_history')) {
            try {
                $medical = DB::table('student_medical_history')
                    ->where('student_id', $studentId)
                    ->orderByDesc('last_checkup_date')
                    ->first();
            } catch (\Throwable) {
            }
        }

        $violations = [];
        if ($student && $this->has('student_violations')) {
            try {
                $violations = DB::table('student_violations')
                    ->where('student_id', $studentId)
                    ->orderByDesc('violation_date')
                    ->limit(10)
                    ->get();
            } catch (\Throwable) {
            }
        }

        // Fetch affiliations
        $affiliations = [];
        if ($student && $this->has('student_affiliations')) {
            try {
                $affiliations = DB::table('student_affiliations')
                    ->where('student_id', $studentId)
                    ->select('organization_name', 'role', 'status')
                    ->orderBy('organization_name')
                    ->limit(20)
                    ->get();
            } catch (\Throwable) {
            }
        }

        // Fetch academic history with subject details
        $academicHistory = [];
        if ($student && $this->has('student_academic_history')) {
            try {
                $records = DB::table('student_academic_history as sah')
                    ->leftJoin('subjects as sub', 'sub.id', '=', 'sah.subject_id')
                    ->where('sah.student_id', $studentId)
                    ->select(
                        'sub.subject_name',
                        'sah.grade',
                        'sah.semester',
                        'sah.school_year'
                    )
                    ->orderByDesc('sah.school_year')
                    ->orderByDesc('sah.semester')
                    ->limit(20)
                    ->get();
                
                // Cast grade to float for proper JSON serialization
                $academicHistory = $records->map(function ($record) {
                    return [
                        'subject_name' => $record->subject_name,
                        'grade' => $record->grade !== null ? (float) $record->grade : null,
                        'semester' => $record->semester,
                        'school_year' => $record->school_year,
                    ];
                })->all();
            } catch (\Throwable) {
            }
        }

        // Fetch upcoming events
        $upcomingEvents = [];
        if ($this->has('events')) {
            try {
                $upcomingEvents = DB::table('events')
                    ->select('event_name', 'category', 'event_date', 'location')
                    ->where('event_date', '>=', now())
                    ->orderBy('event_date')
                    ->limit(10)
                    ->get();
            } catch (\Throwable) {
            }
        }

        return response()->json([
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
                'course' => $student->course_id ?? null,
                'yearLevel' => $student->year_level ?? null,
                'gpa' => $gpa,
                'enrollmentStatus' => $student->enrollment_status ?? null,
                'studentNumber' => $student->student_number ?? null,
            ],
            'subjects' => $subjects,
            'skills' => $skills,
            'medical' => $medical,
            'violations' => $violations,
            'affiliations' => $affiliations,
            'academicHistory' => $academicHistory,
            'upcomingEvents' => $upcomingEvents,
        ]);
    }

    public function search(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        // Keep this endpoint aligned with your table schemas.
        // - `students.id` is aliased as `student_id`
        // - `faculty.id` is aliased as `faculty_id`
        // - `subjects.id` is aliased as `subject_id`
        if ($q === '') {
            $out = ['students' => [], 'faculty' => [], 'subjects' => []];

            if ($this->has('students')) {
                try {
                    $out['students'] = DB::table('students')
                        ->leftJoin('courses as c', 'c.id', '=', 'students.course_id')
                        ->select(
                            'students.id as student_id',
                            'students.student_number',
                            'students.first_name',
                            'students.last_name',
                            'students.email',
                            'c.course_name as course',
                            'students.year_level',
                            'students.overall_gpa as gpa',
                            'students.created_at'
                        )
                        ->orderByDesc('students.created_at')
                        ->limit(200)
                        ->get();
                } catch (\Throwable) {
                }
            }

            if ($this->has('faculty')) {
                try {
                    $out['faculty'] = DB::table('faculty')
                        ->select(
                            'faculty.id as faculty_id',
                            'faculty.first_name',
                            'faculty.last_name',
                            'faculty.department',
                            'faculty.email',
                            'faculty.created_at'
                        )
                        ->orderByDesc('faculty.created_at')
                        ->limit(200)
                        ->get();
                } catch (\Throwable) {
                }
            }

            if ($this->has('subjects')) {
                try {
                    $out['subjects'] = DB::table('subjects')
                        ->select('subjects.id as subject_id', 'subjects.subject_code', 'subjects.subject_name', 'subjects.units')
                        ->orderBy('subjects.subject_code')
                        ->limit(200)
                        ->get();
                } catch (\Throwable) {
                }
            }

            return response()->json($out);
        }

        $like = '%' . $q . '%';
        $out = ['students' => [], 'faculty' => [], 'subjects' => []];

        if ($this->has('students')) {
            try {
                $out['students'] = DB::table('students')
                    ->select('students.id as student_id', 'students.student_number', 'students.first_name', 'students.last_name')
                    ->where('students.first_name', 'like', $like)
                    ->orWhere('students.last_name', 'like', $like)
                    ->orWhere('students.student_number', 'like', $like)
                    ->limit(10)
                    ->get();
            } catch (\Throwable) {
            }
        }

        if ($this->has('faculty')) {
            try {
                $out['faculty'] = DB::table('faculty')
                    ->select('faculty.id as faculty_id', 'faculty.first_name', 'faculty.last_name', 'faculty.department')
                    ->where('faculty.first_name', 'like', $like)
                    ->orWhere('faculty.last_name', 'like', $like)
                    ->orWhere('faculty.department', 'like', $like)
                    ->limit(10)
                    ->get();
            } catch (\Throwable) {
            }
        }

        if ($this->has('subjects')) {
            try {
                $out['subjects'] = DB::table('subjects')
                    ->select('subjects.id as subject_id', 'subjects.subject_code', 'subjects.subject_name')
                    ->where('subjects.subject_code', 'like', $like)
                    ->orWhere('subjects.subject_name', 'like', $like)
                    ->limit(10)
                    ->get();
            } catch (\Throwable) {
            }
        }

        return response()->json($out);
    }

    public function events(Request $request)
    {
        if (! $this->has('events')) {
            return response()->json(['items' => []]);
        }

        try {
            $items = DB::table('events')
                ->select('id as event_id', 'event_name', 'category', 'event_date', 'location', 'description')
                ->orderBy('event_date')
                ->limit(100)
                ->get();

            return response()->json(['items' => $items]);
        } catch (\Throwable) {
            return response()->json(['items' => []]);
        }
    }
}

