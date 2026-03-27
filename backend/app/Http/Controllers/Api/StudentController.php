<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\FacultyAssignment;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    private function resolveFacultyId(Request $request): ?int
    {
        $user = $request->user();
        if (! $user) return null;

        // Best-effort mapping:
        // 1) if a Faculty row exists that matches the logged-in user's email, use it
        // 2) otherwise fall back to user id (some setups may mirror IDs)
        try {
            $byEmail = Faculty::query()->where('email', $user->email)->value('id');
            if ($byEmail) {
                return (int) $byEmail;
            }
        } catch (\Throwable) {
            // ignore
        }

        return (int) $user->id;
    }

    private function allowedSectionIdsForFaculty(Request $request): array
    {
        $facultyId = $this->resolveFacultyId($request);
        if (! $facultyId) return [];

        try {
            return FacultyAssignment::query()
                ->where('faculty_id', $facultyId)
                ->distinct()
                ->pluck('section_id')
                ->map(fn ($id) => (int) $id)
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    public function index(Request $request): JsonResponse
    {
        $query = Student::with(['course', 'section', 'skills.skill']);

        $user = $request->user();
        if ($user) {
            if ($user->role === 'student') {
                // Students can only access their own record.
                $query->where('email', $user->email);
            } elseif ($user->role === 'faculty') {
                // Faculty can only access students in sections assigned to them.
                $allowedSectionIds = $this->allowedSectionIdsForFaculty($request);
                if (! empty($allowedSectionIds)) {
                    $query->whereIn('section_id', $allowedSectionIds);
                } else {
                    // If we can't resolve assignments, return empty instead of leaking data.
                    $query->whereRaw('1 = 0');
                }
            }
        }

        if ($request->has('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        if ($request->has('year_level')) {
            $query->where('year_level', $request->year_level);
        }

        if ($request->has('skill')) {
            $query->whereHas('skills.skill', function ($q) use ($request) {
                $q->where('skill_name', 'like', '%' . $request->skill . '%');
            });
        }

        if ($request->has('min_gpa')) {
            $query->where('overall_gpa', '>=', $request->min_gpa);
        }

        if ($request->has('no_violations')) {
            $query->whereDoesntHave('violations', function ($q) {
                $q->where('severity_level', 'major');
            });
        }

        $students = $query->get();

        return response()->json([
            'students' => $students
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_number' => ['required', 'regex:/^\d{7}$/', 'unique:students,student_number', 'unique:users,student_number'],
            'first_name' => 'required|string',
            'middle_name' => 'nullable|string',
            'last_name' => 'required|string',
            'gender' => 'required|in:male,female,other',
            'birthdate' => 'required|date',
            'email' => 'required|email|unique:students,email',
            'contact_number' => 'required|string',
            'guardian_name' => 'required|string',
            'guardian_contact' => 'required|string',
            'height' => 'nullable|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'course_id' => 'required|exists:courses,id',
            'section_id' => 'required|exists:sections,id',
            'year_level' => 'required|integer|min:1|max:5',
            'enrollment_status' => 'nullable|in:Enrolled,Graduated,Dropped',
            'overall_gpa' => 'nullable|numeric|min:0|max:5',
        ]);

        $student = Student::create($validated);

        return response()->json([
            'message' => 'Student created successfully',
            'student' => $student->load(['course', 'section'])
        ], 201);
    }

    public function show(Request $request, Student $student): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            if ($user->role === 'student') {
                if ($student->email !== $user->email) {
                    return response()->json(['message' => 'Forbidden.'], 403);
                }
            } elseif ($user->role === 'faculty') {
                $allowedSectionIds = $this->allowedSectionIdsForFaculty($request);
                if (empty($allowedSectionIds) || ! in_array((int) $student->section_id, $allowedSectionIds, true)) {
                    return response()->json(['message' => 'Forbidden.'], 403);
                }
            }
        }

        $student->load([
            'course',
            'section',
            'skills.skill',
            'affiliations',
            'violations',
            'medicalHistory',
            'academicHistory.subject',
            'nonAcademicHistory.event'
        ]);

        return response()->json(['student' => $student]);
    }

    public function update(Request $request, Student $student): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            if ($user->role === 'student') {
                if ($student->email !== $user->email) {
                    return response()->json(['message' => 'Forbidden.'], 403);
                }
            } elseif ($user->role !== 'dean') {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        }

        // Students can only update contact fields.
        if ($user && $user->role === 'student') {
            $validated = $request->validate([
                'email' => 'required|email|unique:students,email,' . $student->id,
                'contact_number' => 'required|string',
            ]);
        } else {
            // Dean/admin can update the full student record.
            $validated = $request->validate([
                'student_number' => ['sometimes', 'regex:/^\d{7}$/', Rule::unique('students', 'student_number')->ignore($student->id)],
                'first_name' => ['sometimes', 'string', 'max:255'],
                'middle_name' => ['nullable', 'string', 'max:255'],
                'last_name' => ['sometimes', 'string', 'max:255'],
                'gender' => ['sometimes', 'in:male,female,other'],
                'birthdate' => ['sometimes', 'date'],
                'email' => ['sometimes', 'email', Rule::unique('students', 'email')->ignore($student->id)],
                'contact_number' => ['sometimes', 'string', 'max:20'],
                'guardian_name' => ['sometimes', 'string', 'max:255'],
                'guardian_contact' => ['sometimes', 'string', 'max:20'],
                'height' => ['nullable', 'numeric', 'min:0'],
                'weight' => ['nullable', 'numeric', 'min:0'],
                'bmi' => ['nullable', 'numeric', 'min:0'],
                'course_id' => ['sometimes', 'exists:courses,id'],
                'section_id' => ['sometimes', 'exists:sections,id'],
                'year_level' => ['sometimes', 'integer', 'min:1', 'max:5'],
                'enrollment_status' => ['sometimes', 'nullable', 'in:Enrolled,Graduated,Dropped'],
                'overall_gpa' => ['nullable', 'numeric', 'min:0', 'max:5'],
            ]);
        }

        $student->update($validated);

        return response()->json([
            'message' => 'Student updated successfully',
            'student' => $student->fresh()
        ]);
    }

    public function advancedSearch(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && $user->role !== 'dean') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $query = Student::with(['course', 'skills.skill', 'affiliations', 'violations']);

        // Complex search conditions
        if ($request->name) {
            $names = explode(' ', $request->name);
            $query->where(function ($q) use ($names) {
                foreach ($names as $name) {
                    $q->orWhere('first_name', 'like', "%{$name}%")
                      ->orWhere('last_name', 'like', "%{$name}%");
                }
            });
        }

        // Multiple skill filter
        if ($request->skills && is_array($request->skills)) {
            $query->whereHas('skills.skill', function ($q) use ($request) {
                $q->whereIn('skill_name', $request->skills);
            });
        }

        // Course / year / GPA filters (for admin search)
        if ($request->has('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        if ($request->has('year_level')) {
            $query->where('year_level', $request->year_level);
        }

        if ($request->has('min_gpa')) {
            $query->where('overall_gpa', '>=', $request->min_gpa);
        }

        if ($request->has('no_violations')) {
            // Strict: exclude students with any violations.
            $query->whereDoesntHave('violations');
        }

        // Date range for violations
        if ($request->no_violations_from) {
            $query->whereDoesntHave('violations')
                  ->orWhereHas('violations', function ($q) use ($request) {
                      $q->where('violation_date', '<', $request->no_violations_from);
                  });
        }

        // Performance filters
        if ($request->top_performers) {
            $query->where('overall_gpa', '>=', 3.0)
                  ->orderBy('overall_gpa', 'desc');
        }

        // Event participation
        if ($request->event_participation) {
            // Event participation is stored in `student_non_academic_history`.
            // We match by event name (partial).
            $query->whereHas('nonAcademicHistory.event', function ($q) use ($request) {
                $q->where('event_name', 'like', '%' . $request->event_participation . '%');
            });
        }

        // Basketball tryout qualifications
        if ($request->basketball_qualification) {
            $query->whereHas('skills.skill', function ($q) {
                    $q->where('skill_name', 'like', '%basketball%');
                })
                ->where('height', '>=', $request->min_height ?? 170)
                ->whereDoesntHave('violations', function ($q) {
                    $q->where('severity_level', 'major');
                });
        }

        // Programming contest qualifications
        if ($request->programming_contest) {
            $query->whereHas('skills.skill', function ($q) {
                    $q->where('skill_name', 'like', '%programming%');
                })
                ->where('overall_gpa', '>=', $request->min_gpa ?? 2.0);
        }

        $students = $query->orderBy('last_name', 'asc')
            ->paginate($request->limit ?? 100);

        return response()->json([
            'students' => $students->items(),
            'filters_applied' => $request->all(),
            'pagination' => [
                'current_page' => $students->currentPage(),
                'total' => $students->total(),
            ]
        ]);
    }

    public function destroy(Student $student): JsonResponse
    {
        $request = request();
        $user = $request?->user();
        if ($user && $user->role !== 'dean') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $studentNumber = $student->student_number;
        $student->delete();

        return response()->json(['message' => 'Student deleted successfully']);
    }

    /**
     * Convenience endpoint for the currently authenticated student.
     * Used by the Student Profile page.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($user->role !== 'student') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $student = Student::query()
            ->where('email', $user->email)
            ->with([
                'course',
                'section',
                'skills.skill',
                'affiliations',
                'violations',
                'medicalHistory',
                'academicHistory.subject',
                'nonAcademicHistory.event',
            ])
            ->first();

        if (! $student) {
            return response()->json(['message' => 'Student profile not found.'], 404);
        }

        return response()->json(['student' => $student]);
    }
}
