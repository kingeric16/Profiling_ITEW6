<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Section;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SectionController extends Controller
{
    public function index(): JsonResponse
    {
        $sections = Section::with('course')
            ->orderBy('year_level', 'asc')
            ->orderBy('section_name', 'asc')
            ->get();

        return response()->json(['sections' => $sections]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'section_name' => ['required', 'string', 'max:255'],
            'course_id' => ['required', 'exists:courses,id'],
            'year_level' => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $section = Section::create([
            'section_name' => $request->section_name,
            'course_id' => $request->course_id,
            'year_level' => $request->year_level,
        ]);

        Audit::log($request->user(), 'create_section', ['section_id' => $section->id]);

        return response()->json(['message' => 'Section created successfully', 'section' => $section->load('course')], 201);
    }

    public function update(Request $request, Section $section): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'section_name' => ['required', 'string', 'max:255'],
            'course_id' => ['required', 'exists:courses,id'],
            'year_level' => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $section->update([
            'section_name' => $request->section_name,
            'course_id' => $request->course_id,
            'year_level' => $request->year_level,
        ]);

        Audit::log($request->user(), 'update_section', ['section_id' => $section->id]);

        return response()->json(['message' => 'Section updated successfully', 'section' => $section->fresh()->load('course')]);
    }

    public function destroy(Request $request, Section $section): JsonResponse
    {
        $section->delete();

        Audit::log($request->user(), 'delete_section', ['section_id' => $section->id]);

        return response()->json(['message' => 'Section deleted successfully']);
    }
}

