<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Faculty;
use App\Models\FacultyAssignment;
use App\Models\Student;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class FacultyController extends Controller
{
    private function resolveFacultyId(Request $request): int
    {
        $user = $request->user();
        if (!$user) {
            return 0;
        }

        $facultyId = (int) $user->id;
        try {
            $row = DB::table('faculty')->select('id')->where('email', $user->email)->first();
            if ($row && isset($row->id)) {
                $facultyId = (int) $row->id;
            }
        } catch (\Throwable) {
        }

        return $facultyId;
    }

    public function index()
    {
        $faculty = User::where('role', 'faculty')
            ->with(['faculty'])
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'faculty' => $faculty
        ]);
    }

    public function update(Request $request, $id)
    {
        $faculty = User::where('role', 'faculty')->find($id);
        if (!$faculty) {
            return response()->json([
                'message' => 'Faculty not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $id],
            'department' => ['nullable', 'string', 'max:255'],
            'specialization' => ['nullable', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $faculty->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        // Update or create faculty details
        if ($faculty->faculty) {
            $faculty->faculty->update([
                'department' => $request->department,
                'specialization' => $request->specialization,
            ]);
        } else {
            Faculty::create([
                'user_id' => $faculty->id,
                'department' => $request->department,
                'specialization' => $request->specialization,
            ]);
        }

        Audit::log($request->user(), 'update_faculty', [
            'faculty_id' => $faculty->id,
            'name' => $faculty->name
        ]);

        return response()->json([
            'message' => 'Faculty updated successfully',
            'faculty' => $faculty->fresh()
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $faculty = User::where('role', 'faculty')->find($id);
        if (!$faculty) {
            return response()->json([
                'message' => 'Faculty not found'
            ], 404);
        }

        $facultyName = $faculty->name;
        $faculty->delete();

        Audit::log($request->user(), 'delete_faculty', [
            'faculty_id' => $id,
            'name' => $facultyName
        ]);

        return response()->json([
            'message' => 'Faculty deleted successfully'
        ]);
    }

    public function submitGrade(Request $request)
    {
        $facultyId = $this->resolveFacultyId($request);
        if (!$facultyId) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'student_id' => ['required', 'exists:students,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'grade' => ['required', 'numeric', 'min:0', 'max:5'],
            'semester' => ['required', 'string'],
            'school_year' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Enforce faculty assignment: faculty must teach the subject for the student's section.
        try {
            $student = DB::table('students')->select('id', 'section_id')->where('id', (int) $request->student_id)->first();
            $sectionId = (int) ($student->section_id ?? 0);
            if (!$sectionId) {
                return response()->json(['message' => 'Student section not found.'], 422);
            }

            $hasAssignment = DB::table('faculty_assignments')
                ->where('faculty_id', $facultyId)
                ->where('subject_id', (int) $request->subject_id)
                ->where('section_id', $sectionId)
                ->exists();

            if (!$hasAssignment) {
                return response()->json(['message' => 'Forbidden. You are not assigned to this subject/section.'], 403);
            }
        } catch (\Throwable) {
            return response()->json(['message' => 'Unable to validate faculty assignment.'], 500);
        }

        // Check if grade already exists
        $existingGrade = \App\Models\StudentAcademicHistory::where([
            'student_id' => $request->student_id,
            'subject_id' => $request->subject_id,
            'semester' => $request->semester,
            'school_year' => $request->school_year,
        ])->first();

        if ($existingGrade) {
            $existingGrade->update([
                'grade' => $request->grade,
            ]);
        } else {
            \App\Models\StudentAcademicHistory::create([
                'student_id' => $request->student_id,
                'subject_id' => $request->subject_id,
                'grade' => $request->grade,
                'semester' => $request->semester,
                'school_year' => $request->school_year,
            ]);
        }

        Audit::log($request->user(), 'submit_grade', [
            'student_id' => $request->student_id,
            'subject_id' => $request->subject_id,
            'grade' => $request->grade
        ]);

        return response()->json([
            'message' => 'Grade submitted successfully'
        ]);
    }

    public function myGradeSubmissions(Request $request)
    {
        $facultyId = $this->resolveFacultyId($request);
        if (!$facultyId) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $grades = \App\Models\StudentAcademicHistory::with(['student', 'subject'])
            ->whereHas('subject.facultyAssignments', function ($q) use ($facultyId) {
                $q->where('faculty_id', $facultyId);
            })
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'grades' => $grades
        ]);
    }
}
