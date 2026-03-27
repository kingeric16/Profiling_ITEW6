<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SkillMaster;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SkillMasterController extends Controller
{
    public function index(): JsonResponse
    {
        $skills = SkillMaster::query()
            ->orderBy('skill_category', 'asc')
            ->orderBy('skill_name', 'asc')
            ->get();

        return response()->json(['skills' => $skills]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'skill_name' => ['required', 'string', 'max:255'],
            'skill_category' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $skill = SkillMaster::create([
            'skill_name' => $request->skill_name,
            'skill_category' => $request->skill_category,
        ]);

        Audit::log($request->user(), 'create_skill_master', ['skill_id' => $skill->id, 'skill_name' => $skill->skill_name]);

        return response()->json([
            'message' => 'Skill created successfully',
            'skill' => $skill,
        ], 201);
    }

    public function update(Request $request, SkillMaster $skill): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'skill_name' => ['required', 'string', 'max:255'],
            'skill_category' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $skill->update([
            'skill_name' => $request->skill_name,
            'skill_category' => $request->skill_category,
        ]);

        Audit::log($request->user(), 'update_skill_master', ['skill_id' => $skill->id, 'skill_name' => $skill->skill_name]);

        return response()->json([
            'message' => 'Skill updated successfully',
            'skill' => $skill->fresh(),
        ]);
    }

    public function destroy(Request $request, SkillMaster $skill): JsonResponse
    {
        $skill->delete();

        Audit::log($request->user(), 'delete_skill_master', ['skill_id' => $skill->id, 'skill_name' => $skill->skill_name]);

        return response()->json(['message' => 'Skill deleted successfully']);
    }
}

