<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Event;
use App\Models\StudentNonAcademicHistory;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class EventController extends Controller
{
    public function index()
    {
        // Keep response shape consistent with the rest of the app (event_id instead of id).
        $events = DB::table('events')
            ->select('id as event_id', 'event_name', 'category', 'required_skill', 'required_gpa', 'event_date', 'location', 'description', 'created_at')
            ->orderBy('event_date', 'asc')
            ->get();

        return response()->json([
            'items' => $events
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'event_name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:sports,academic,cultural'],
            'required_skill' => ['nullable', 'string', 'max:255'],
            'required_gpa' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'event_date' => ['required', 'date', 'after:today'],
            'location' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $event = Event::create([
            'event_name' => $request->event_name,
            'category' => $request->category,
            'required_skill' => $request->required_skill,
            'required_gpa' => $request->required_gpa,
            'event_date' => $request->event_date,
            'location' => $request->location,
        ]);

        Audit::log($request->user(), 'create_event', [
            'event_id' => $event->id,
            'event_name' => $event->event_name
        ]);

        return response()->json([
            'message' => 'Event created successfully',
            'event' => $event
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $event = Event::find($id);
        if (!$event) {
            return response()->json([
                'message' => 'Event not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'event_name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:sports,academic,cultural'],
            'required_skill' => ['nullable', 'string', 'max:255'],
            'required_gpa' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'event_date' => ['required', 'date', 'after:today'],
            'location' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $event->update($request->only([
            'event_name',
            'category',
            'required_skill',
            'required_gpa',
            'event_date',
            'location'
        ]));

        Audit::log($request->user(), 'update_event', [
            'event_id' => $event->id,
            'event_name' => $event->event_name
        ]);

        return response()->json([
            'message' => 'Event updated successfully',
            'event' => $event->fresh()
        ]);
    }

    public function destroy($id)
    {
        $event = Event::find($id);
        if (!$event) {
            return response()->json([
                'message' => 'Event not found'
            ], 404);
        }

        $eventName = $event->event_name;
        $event->delete();

        Audit::log($request->user(), 'delete_event', [
            'event_id' => $id,
            'event_name' => $eventName
        ]);

        return response()->json([
            'message' => 'Event deleted successfully'
        ]);
    }

    public function registerStudent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'event_id' => ['required', 'exists:events,id'],
            'student_id' => ['nullable', 'exists:students,id'],
            'role' => ['required', 'string', 'max:255'],
            'result' => ['nullable', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $studentId = $request->student_id;

        // If a student is registering themselves, infer student_id by email.
        if (! $studentId && $user && $user->role === 'student') {
            $studentId = Student::where('email', $user->email)->value('id');
        }

        if (! $studentId) {
            return response()->json([
                'message' => 'student_id is required (or must belong to the authenticated student).',
            ], 422);
        }

        // Prevent a student from registering using another student's id.
        if ($user && $user->role === 'student') {
            $allowed = Student::where('id', $studentId)->where('email', $user->email)->exists();
            if (! $allowed) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        }

        // Check if already registered
        $existing = StudentNonAcademicHistory::where([
            'event_id' => $request->event_id,
            'student_id' => $studentId,
        ])->first();

        if ($existing) {
            $existing->update([
                'role' => $request->role,
                'result' => $request->result,
            ]);
        } else {
            StudentNonAcademicHistory::create([
                'event_id' => $request->event_id,
                'student_id' => $studentId,
                'role' => $request->role,
                'result' => $request->result,
            ]);
        }

        Audit::log($request->user(), 'register_student_event', [
            'event_id' => $request->event_id,
            'student_id' => $studentId
        ]);

        return response()->json([
            'message' => 'Student registered for event successfully'
        ]);
    }
}
