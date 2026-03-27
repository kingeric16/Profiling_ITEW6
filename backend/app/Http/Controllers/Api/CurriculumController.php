<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Curriculum;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CurriculumController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Curriculum::with(['course', 'subject'])
            ->orderBy('year_level', 'asc')
            ->get();

        return response()->json(['curriculum' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'course_id' => ['required', 'exists:courses,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'year_level' => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $item = Curriculum::create([
            'course_id' => $request->course_id,
            'subject_id' => $request->subject_id,
            'year_level' => $request->year_level,
        ]);

        Audit::log($request->user(), 'create_curriculum', ['curriculum_id' => $item->id]);

        return response()->json(['message' => 'Curriculum created successfully', 'curriculum' => $item->load(['course', 'subject'])], 201);
    }

    public function update(Request $request, Curriculum $curriculum): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'course_id' => ['required', 'exists:courses,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'year_level' => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $curriculum->update([
            'course_id' => $request->course_id,
            'subject_id' => $request->subject_id,
            'year_level' => $request->year_level,
        ]);

        Audit::log($request->user(), 'update_curriculum', ['curriculum_id' => $curriculum->id]);

        return response()->json(['message' => 'Curriculum updated successfully', 'curriculum' => $curriculum->fresh()->load(['course', 'subject'])]);
    }

    public function destroy(Request $request, Curriculum $curriculum): JsonResponse
    {
        $curriculum->delete();

        Audit::log($request->user(), 'delete_curriculum', ['curriculum_id' => $curriculum->id]);

        return response()->json(['message' => 'Curriculum deleted successfully']);
    }
}

