<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserProvisioningController extends Controller
{
    public function createFaculty(Request $request)
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'employee_number' => ['required', 'regex:/^\d{7}$/', 'unique:users,employee_number'],
            'password' => ['required', 'string', 'min:6'],
            'department' => ['nullable', 'string', 'max:255'],
            'specialization' => ['nullable', 'string', 'max:255'],
        ]);

        $nameParts = trim((string) ($validated['name'] ?? ''));
        $firstName = (string) ($validated['first_name'] ?? '');
        $lastName = (string) ($validated['last_name'] ?? '');

        if ((! $firstName || ! $lastName) && $nameParts !== '') {
            $chunks = preg_split('/\s+/', $nameParts) ?: [];
            $firstName = $firstName ?: ($chunks[0] ?? '');
            $lastName = $lastName ?: ($chunks[count($chunks) - 1] ?? '');
        }

        if ($firstName === '' || $lastName === '') {
            return response()->json(['message' => 'Missing faculty name. Provide first_name/last_name or name.'], 422);
        }

        $department = (string) ($validated['department'] ?? 'CCS');
        $specialization = $validated['specialization'] ?? null;
        $userName = $nameParts !== '' ? $nameParts : trim($firstName . ' ' . $lastName);

        $user = User::query()->create([
            'name' => $userName,
            'email' => $validated['email'],
            'employee_number' => $validated['employee_number'],
            'role' => 'faculty',
            'password' => Hash::make($validated['password']),
        ]);

        // Create corresponding domain record for faculty (used by faculty assignments + dashboards).
        $faculty = \App\Models\Faculty::query()->create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $validated['email'],
            'department' => $department,
            'specialization' => $specialization,
        ]);

        Audit::log($request->user(), 'create_faculty', ['faculty_user_id' => $user->id, 'faculty_id' => $faculty->id]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'faculty' => [
                'id' => $faculty->id,
                'first_name' => $faculty->first_name,
                'last_name' => $faculty->last_name,
                'email' => $faculty->email,
                'department' => $faculty->department,
            ],
        ], 201);
    }

    public function createStudent(Request $request)
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'student_number' => ['required', 'regex:/^\d{7}$/', 'unique:users,student_number', 'unique:students,student_number'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'gender' => ['required', 'in:male,female,other'],
            'birthdate' => ['required', 'date'],
            'contact_number' => ['required', 'string', 'max:20'],
            'guardian_name' => ['required', 'string', 'max:255'],
            'guardian_contact' => ['required', 'string', 'max:20'],
            'height' => ['nullable', 'numeric', 'min:0'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'bmi' => ['nullable', 'numeric', 'min:0'],
            'course_id' => ['required', 'exists:courses,id'],
            'section_id' => ['required', 'exists:sections,id'],
            'year_level' => ['required', 'integer', 'min:1', 'max:5'],
            'enrollment_status' => ['nullable', 'in:Enrolled,Graduated,Dropped'],
            'overall_gpa' => ['nullable', 'numeric', 'min:0', 'max:5'],
        ]);

        $userName = $validated['name'] ?? trim(($validated['first_name'] ?? '') . ' ' . ($validated['middle_name'] ?? '') . ' ' . ($validated['last_name'] ?? ''));

        $user = User::query()->create([
            'name' => $userName,
            'email' => $validated['email'],
            'student_number' => $validated['student_number'],
            'role' => 'student',
            'password' => Hash::make((string) $validated['password']),
        ]);

        // Create corresponding domain record for student (used by student dashboards + reports).
        $student = \App\Models\Student::query()->create([
            'student_number' => $validated['student_number'],
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'gender' => $validated['gender'],
            'birthdate' => $validated['birthdate'],
            'email' => $validated['email'],
            'contact_number' => $validated['contact_number'],
            'guardian_name' => $validated['guardian_name'],
            'guardian_contact' => $validated['guardian_contact'],
            'height' => $validated['height'] ?? null,
            'weight' => $validated['weight'] ?? null,
            'bmi' => $validated['bmi'] ?? null,
            'course_id' => $validated['course_id'],
            'section_id' => $validated['section_id'],
            'year_level' => $validated['year_level'],
            'enrollment_status' => $validated['enrollment_status'] ?? 'Enrolled',
            'overall_gpa' => $validated['overall_gpa'] ?? null,
        ]);

        Audit::log($request->user(), 'create_student', ['student_user_id' => $user->id, 'student_id' => $student->id]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'email' => $student->email,
                'course_id' => $student->course_id,
                'section_id' => $student->section_id,
                'year_level' => $student->year_level,
            ],
        ], 201);
    }
}

