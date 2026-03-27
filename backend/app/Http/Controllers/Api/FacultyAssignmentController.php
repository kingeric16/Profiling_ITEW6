<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FacultyAssignment;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FacultyAssignmentController extends Controller
{
    public function index(): JsonResponse
    {
        $items = FacultyAssignment::with(['faculty', 'subject', 'section'])
            ->orderBy('school_year', 'desc')
            ->orderBy('semester', 'asc')
            ->get();

        return response()->json(['assignments' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'faculty_id' => ['required', 'exists:faculty,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'section_id' => ['required', 'exists:sections,id'],
            'semester' => ['required', 'in:first,second,summer'],
            'school_year' => ['required', 'string', 'max:9'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $item = FacultyAssignment::create([
            'faculty_id' => $request->faculty_id,
            'subject_id' => $request->subject_id,
            'section_id' => $request->section_id,
            'semester' => $request->semester,
            'school_year' => $request->school_year,
        ]);

        Audit::log($request->user(), 'create_faculty_assignment', ['assignment_id' => $item->id]);

        return response()->json(['message' => 'Assignment created successfully', 'assignment' => $item->load(['faculty', 'subject', 'section'])], 201);
    }

    public function update(Request $request, FacultyAssignment $assignment): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'faculty_id' => ['required', 'exists:faculty,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'section_id' => ['required', 'exists:sections,id'],
            'semester' => ['required', 'in:first,second,summer'],
            'school_year' => ['required', 'string', 'max:9'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $assignment->update([
            'faculty_id' => $request->faculty_id,
            'subject_id' => $request->subject_id,
            'section_id' => $request->section_id,
            'semester' => $request->semester,
            'school_year' => $request->school_year,
        ]);

        Audit::log($request->user(), 'update_faculty_assignment', ['assignment_id' => $assignment->id]);

        return response()->json(['message' => 'Assignment updated successfully', 'assignment' => $assignment->fresh()->load(['faculty', 'subject', 'section'])]);
    }

    public function destroy(Request $request, FacultyAssignment $assignment): JsonResponse
    {
        $assignment->delete();

        Audit::log($request->user(), 'delete_faculty_assignment', ['assignment_id' => $assignment->id]);

        return response()->json(['message' => 'Assignment deleted successfully']);
    }
}

