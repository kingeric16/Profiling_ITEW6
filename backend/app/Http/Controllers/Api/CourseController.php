<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CourseController extends Controller
{
    public function index(): JsonResponse
    {
        $courses = Course::with(['sections', 'students'])->get();

        return response()->json(['courses' => $courses]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_code' => 'required|string|unique:courses,course_code',
            'course_name' => 'required|string',
            'department' => 'required|string',
        ]);

        $course = Course::create($validated);

        return response()->json([
            'message' => 'Course created successfully',
            'course' => $course
        ], 201);
    }

    public function show(Course $course): JsonResponse
    {
        $course->load(['sections', 'students']);

        return response()->json(['course' => $course]);
    }

    public function update(Request $request, Course $course): JsonResponse
    {
        $validated = $request->validate([
            'course_code' => 'required|string|unique:courses,course_code,' . $course->id,
            'course_name' => 'required|string',
            'department' => 'required|string',
        ]);

        $course->update($validated);

        return response()->json([
            'message' => 'Course updated successfully',
            'course' => $course->fresh()
        ]);
    }

    public function destroy(Course $course): JsonResponse
    {
        $course->delete();

        return response()->json(['message' => 'Course deleted successfully']);
    }
}
