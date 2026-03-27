<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SubjectController extends Controller
{
    public function index()
    {
        $subjects = Subject::query()
            ->orderBy('subject_code', 'asc')
            ->get();

        return response()->json([
            'subjects' => $subjects
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'subject_code' => ['required', 'string', 'max:20', 'unique:subjects,subject_code'],
            'subject_name' => ['required', 'string', 'max:255'],
            'units' => ['required', 'integer', 'min:1', 'max:6'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $subject = Subject::create([
            'subject_code' => strtoupper($request->subject_code),
            'subject_name' => $request->subject_name,
            'units' => $request->units,
        ]);

        Audit::log($request->user(), 'create_subject', [
            'subject_id' => $subject->id,
            'subject_code' => $subject->subject_code
        ]);

        return response()->json([
            'message' => 'Subject created successfully',
            'subject' => $subject
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $subject = Subject::find($id);
        if (!$subject) {
            return response()->json([
                'message' => 'Subject not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'subject_code' => ['required', 'string', 'max:20', 'unique:subjects,subject_code,' . $id],
            'subject_name' => ['required', 'string', 'max:255'],
            'units' => ['required', 'integer', 'min:1', 'max:6'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $subject->update([
            'subject_code' => strtoupper($request->subject_code),
            'subject_name' => $request->subject_name,
            'units' => $request->units,
        ]);

        Audit::log($request->user(), 'update_subject', [
            'subject_id' => $subject->id,
            'subject_code' => $subject->subject_code
        ]);

        return response()->json([
            'message' => 'Subject updated successfully',
            'subject' => $subject
        ]);
    }

    public function destroy($id)
    {
        $subject = Subject::find($id);
        if (!$subject) {
            return response()->json([
                'message' => 'Subject not found'
            ], 404);
        }

        $subjectCode = $subject->subject_code;
        $subject->delete();

        Audit::log($request->user(), 'delete_subject', [
            'subject_id' => $id,
            'subject_code' => $subjectCode
        ]);

        return response()->json([
            'message' => 'Subject deleted successfully'
        ]);
    }
}
