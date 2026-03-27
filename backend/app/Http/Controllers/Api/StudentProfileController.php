<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\FacultyAssignment;
use App\Models\Student;
use App\Models\StudentAcademicHistory;
use App\Models\StudentAffiliation;
use App\Models\StudentMedicalHistory;
use App\Models\StudentNonAcademicHistory;
use App\Models\StudentSkill;
use App\Models\StudentViolation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StudentProfileController extends Controller
{
    private function resolveFacultyId(Request $request): ?int
    {
        $user = $request->user();
        if (! $user) return null;

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

    private function authorizeAccess(Request $request, Student $student): void
    {
        $user = $request->user();
        if (! $user) {
            throw ValidationException::withMessages(['auth' => ['Unauthenticated.']]);
        }

        if ($user->role === 'student') {
            if ($student->email !== $user->email) {
                abort(403, 'Forbidden.');
            }
            return;
        }

        if ($user->role === 'faculty') {
            $allowed = $this->allowedSectionIdsForFaculty($request);
            if (empty($allowed) || ! in_array((int) $student->section_id, $allowed, true)) {
                abort(403, 'Forbidden.');
            }
            return;
        }

        // dean/admin
        if ($user->role !== 'dean') {
            abort(403, 'Forbidden.');
        }
    }

    private function authorizeDean(Request $request): void
    {
        $user = $request->user();
        if (! $user || $user->role !== 'dean') {
            abort(403, 'Forbidden.');
        }
    }

    public function skills(Request $request, Student $student): JsonResponse
    {
        $this->authorizeAccess($request, $student);

        $skills = $student->skills()->with('skill')->get();

        return response()->json(['skills' => $skills]);
    }

    public function setSkills(Request $request, Student $student): JsonResponse
    {
        $this->authorizeDean($request);

        $payload = $request->validate([
            'skills' => ['required', 'array'],
            'skills.*.skill_id' => ['required', 'exists:skill_master,id'],
            'skills.*.skill_level' => ['required', 'in:beginner,intermediate,advanced,expert'],
        ]);

        DB::transaction(function () use ($student, $payload) {
            StudentSkill::query()->where('student_id', $student->id)->delete();

            foreach ($payload['skills'] as $row) {
                StudentSkill::query()->create([
                    'student_id' => $student->id,
                    'skill_id' => $row['skill_id'],
                    'skill_level' => $row['skill_level'],
                ]);
            }
        });

        return response()->json([
            'message' => 'Skills updated successfully',
            'skills' => $student->fresh()->skills()->with('skill')->get(),
        ]);
    }

    public function affiliations(Request $request, Student $student): JsonResponse
    {
        $this->authorizeAccess($request, $student);

        return response()->json([
            'affiliations' => $student->affiliations()->get(),
        ]);
    }

    public function setAffiliations(Request $request, Student $student): JsonResponse
    {
        $this->authorizeDean($request);

        $payload = $request->validate([
            'affiliations' => ['required', 'array'],
            'affiliations.*.organization_name' => ['required', 'string', 'max:255'],
            'affiliations.*.role' => ['required', 'string', 'max:255'],
            'affiliations.*.status' => ['required', 'in:active,inactive,graduated'],
        ]);

        DB::transaction(function () use ($student, $payload) {
            StudentAffiliation::query()->where('student_id', $student->id)->delete();

            foreach ($payload['affiliations'] as $row) {
                StudentAffiliation::query()->create([
                    'student_id' => $student->id,
                    'organization_name' => $row['organization_name'],
                    'role' => $row['role'],
                    'status' => $row['status'],
                ]);
            }
        });

        return response()->json([
            'message' => 'Affiliations updated successfully',
            'affiliations' => $student->fresh()->affiliations()->get(),
        ]);
    }

    public function violations(Request $request, Student $student): JsonResponse
    {
        $this->authorizeAccess($request, $student);

        return response()->json([
            'violations' => $student->violations()->get(),
        ]);
    }

    public function setViolations(Request $request, Student $student): JsonResponse
    {
        $this->authorizeDean($request);

        $payload = $request->validate([
            'violations' => ['required', 'array'],
            'violations.*.violation_type' => ['required', 'string', 'max:255'],
            'violations.*.severity_level' => ['required', 'in:minor,major,critical'],
            'violations.*.violation_date' => ['required', 'date'],
            'violations.*.clearance_status' => ['required', 'in:pending,cleared,revoked'],
            'violations.*.description' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($student, $payload) {
            StudentViolation::query()->where('student_id', $student->id)->delete();

            foreach ($payload['violations'] as $row) {
                StudentViolation::query()->create([
                    'student_id' => $student->id,
                    'violation_type' => $row['violation_type'],
                    'severity_level' => $row['severity_level'],
                    'violation_date' => $row['violation_date'],
                    'clearance_status' => $row['clearance_status'],
                    'description' => $row['description'] ?? null,
                ]);
            }
        });

        return response()->json([
            'message' => 'Violations updated successfully',
            'violations' => $student->fresh()->violations()->get(),
        ]);
    }

    public function medicalHistory(Request $request, Student $student): JsonResponse
    {
        $this->authorizeAccess($request, $student);

        return response()->json([
            'medical_history' => $student->medicalHistory()->orderByDesc('last_checkup_date')->get(),
        ]);
    }

    public function setMedicalHistory(Request $request, Student $student): JsonResponse
    {
        $this->authorizeDean($request);

        $payload = $request->validate([
            'medical_history' => ['required', 'array'],
            'medical_history.*.medical_condition' => ['nullable', 'string', 'max:255'],
            'medical_history.*.allergies' => ['nullable', 'string'],
            'medical_history.*.medications' => ['nullable', 'string'],
            'medical_history.*.last_checkup_date' => ['nullable', 'date'],
            'medical_history.*.notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($student, $payload) {
            StudentMedicalHistory::query()->where('student_id', $student->id)->delete();

            foreach ($payload['medical_history'] as $row) {
                StudentMedicalHistory::query()->create([
                    'student_id' => $student->id,
                    'medical_condition' => $row['medical_condition'] ?? null,
                    'allergies' => $row['allergies'] ?? null,
                    'medications' => $row['medications'] ?? null,
                    'last_checkup_date' => $row['last_checkup_date'] ?? null,
                    'notes' => $row['notes'] ?? null,
                ]);
            }
        });

        return response()->json([
            'message' => 'Medical history updated successfully',
            'medical_history' => $student->fresh()->medicalHistory()->get(),
        ]);
    }

    public function academicHistory(Request $request, Student $student): JsonResponse
    {
        $this->authorizeAccess($request, $student);

        $history = $student->academicHistory()->with('subject')->orderByDesc('school_year')->orderByDesc('semester')->get();

        return response()->json(['academic_history' => $history]);
    }

    public function setAcademicHistory(Request $request, Student $student): JsonResponse
    {
        $this->authorizeDean($request);

        $payload = $request->validate([
            'academic_history' => ['required', 'array'],
            'academic_history.*.subject_id' => ['required', 'exists:subjects,id'],
            'academic_history.*.grade' => ['required', 'numeric', 'min:0', 'max:5'],
            'academic_history.*.semester' => ['required', 'in:first,second,summer'],
            'academic_history.*.school_year' => ['required', 'string', 'max:9'],
        ]);

        DB::transaction(function () use ($student, $payload) {
            StudentAcademicHistory::query()->where('student_id', $student->id)->delete();

            foreach ($payload['academic_history'] as $row) {
                StudentAcademicHistory::query()->create([
                    'student_id' => $student->id,
                    'subject_id' => $row['subject_id'],
                    'grade' => $row['grade'],
                    'semester' => $row['semester'],
                    'school_year' => $row['school_year'],
                ]);
            }
        });

        return response()->json([
            'message' => 'Academic history updated successfully',
            'academic_history' => $student->fresh()->academicHistory()->with('subject')->get(),
        ]);
    }

    public function nonAcademicHistory(Request $request, Student $student): JsonResponse
    {
        $this->authorizeAccess($request, $student);

        return response()->json([
            'non_academic_history' => $student->nonAcademicHistory()->with('event')->orderByDesc('created_at')->get(),
        ]);
    }

    public function setNonAcademicHistory(Request $request, Student $student): JsonResponse
    {
        $this->authorizeDean($request);

        $payload = $request->validate([
            'non_academic_history' => ['required', 'array'],
            'non_academic_history.*.event_id' => ['required', 'exists:events,id'],
            'non_academic_history.*.role' => ['required', 'string', 'max:255'],
            'non_academic_history.*.result' => ['required', 'in:participated,winner,finalist,participant'],
            'non_academic_history.*.achievements' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($student, $payload) {
            StudentNonAcademicHistory::query()->where('student_id', $student->id)->delete();

            foreach ($payload['non_academic_history'] as $row) {
                StudentNonAcademicHistory::query()->create([
                    'student_id' => $student->id,
                    'event_id' => $row['event_id'],
                    'role' => $row['role'],
                    'result' => $row['result'],
                    'achievements' => $row['achievements'] ?? null,
                ]);
            }
        });

        return response()->json([
            'message' => 'Non-academic history updated successfully',
            'non_academic_history' => $student->fresh()->nonAcademicHistory()->with('event')->get(),
        ]);
    }
}

