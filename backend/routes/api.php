<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\UserProvisioningController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\FacultyController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\StudentProfileController;
use App\Http\Controllers\Api\SkillMasterController;
use App\Http\Controllers\Api\SectionController;
use App\Http\Controllers\Api\CurriculumController;
use App\Http\Controllers\Api\FacultyAssignmentController;

Route::post('/login', [AuthController::class, 'login']);
Route::get('/login/avatar-preview', [AuthController::class, 'loginAvatarPreview']);

Route::post('/password-reset/request-otp', [AuthController::class, 'requestPasswordResetOtp']);
Route::post('/password-reset/verify-otp', [AuthController::class, 'verifyPasswordResetOtp']);
Route::post('/password-reset/change-password', [AuthController::class, 'resetPasswordWithOtp']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::patch('/me', [AuthController::class, 'updateMe']);
    Route::post('/me/password-otp', [AuthController::class, 'requestPasswordChangeOtp']);
    Route::post('/me/verify-password-otp', [AuthController::class, 'verifyPasswordChangeOtp']);
    Route::post('/me/avatar', [AuthController::class, 'updateAvatar']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/dashboard/dean', [DashboardController::class, 'dean'])->middleware('role:dean');
    Route::get('/dashboard/faculty', [DashboardController::class, 'faculty'])->middleware('role:faculty');
    Route::get('/dashboard/student', [DashboardController::class, 'student'])->middleware('role:student');
    Route::get('/search', [DashboardController::class, 'search']);

    /*
     * Provisioning endpoints (create both user + domain record).
     * Kept separate from CRUD endpoints to avoid route conflicts.
     */
    Route::post('/provision/faculty', [UserProvisioningController::class, 'createFaculty'])->middleware('role:dean');
    Route::post('/provision/student', [UserProvisioningController::class, 'createStudent'])->middleware('role:dean,faculty');

    /*
     * Public within authenticated roles
     * (read-only catalog endpoints)
     */
    Route::get('/events', [EventController::class, 'index']);
    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::get('/skills', [SkillMasterController::class, 'index']);
    Route::get('/sections', [SectionController::class, 'index']);
    Route::get('/curriculum', [CurriculumController::class, 'index']);
    Route::get('/faculty-assignments', [FacultyAssignmentController::class, 'index']);

    /*
     * Students (authorization handled inside StudentController)
     */
    Route::get('/students', [StudentController::class, 'index']);
    
    /*
     * Student self-profile (must come before /students/{student} to avoid route conflict)
     */
    Route::get('/students/me', [StudentController::class, 'me'])->middleware('role:student');
    
    Route::get('/students/{student}', [StudentController::class, 'show']);
    Route::put('/students/{student}', [StudentController::class, 'update'])->middleware('role:dean,student');
    Route::patch('/students/{student}', [StudentController::class, 'update'])->middleware('role:dean,student');

    /*
     * Event registration (authorization handled via role + controller checks)
     */
    Route::post('/events/register', [EventController::class, 'registerStudent'])->middleware('role:dean,faculty,student');

    /*
     * Student profile relations (skills/affiliations/violations/medical/academic/non-academic)
     * Authorization is enforced inside StudentProfileController.
     */
    Route::get('/students/{student}/skills', [StudentProfileController::class, 'skills']);
    Route::put('/students/{student}/skills', [StudentProfileController::class, 'setSkills'])->middleware('role:dean');

    Route::get('/students/{student}/affiliations', [StudentProfileController::class, 'affiliations']);
    Route::put('/students/{student}/affiliations', [StudentProfileController::class, 'setAffiliations'])->middleware('role:dean');

    Route::get('/students/{student}/violations', [StudentProfileController::class, 'violations']);
    Route::put('/students/{student}/violations', [StudentProfileController::class, 'setViolations'])->middleware('role:dean');

    Route::get('/students/{student}/medical-history', [StudentProfileController::class, 'medicalHistory']);
    Route::put('/students/{student}/medical-history', [StudentProfileController::class, 'setMedicalHistory'])->middleware('role:dean');

    Route::get('/students/{student}/academic-history', [StudentProfileController::class, 'academicHistory']);
    Route::put('/students/{student}/academic-history', [StudentProfileController::class, 'setAcademicHistory'])->middleware('role:dean');

    Route::get('/students/{student}/non-academic-history', [StudentProfileController::class, 'nonAcademicHistory']);
    Route::put('/students/{student}/non-academic-history', [StudentProfileController::class, 'setNonAcademicHistory'])->middleware('role:dean');

    /*
     * Dean/Admin (full management)
     */
    Route::middleware('role:dean')->group(function () {
        // Students CRUD + advanced qualification search
        Route::post('/students', [StudentController::class, 'store']);
        Route::delete('/students/{student}', [StudentController::class, 'destroy']);
        Route::post('/students/advanced-search', [StudentController::class, 'advancedSearch']);

        // Faculty CRUD
        Route::get('/faculty', [FacultyController::class, 'index']);
        Route::put('/faculty/{id}', [FacultyController::class, 'update']);
        Route::delete('/faculty/{id}', [FacultyController::class, 'destroy']);

        // Course CRUD
        Route::post('/courses', [CourseController::class, 'store']);
        Route::get('/courses/{course}', [CourseController::class, 'show']);
        Route::put('/courses/{course}', [CourseController::class, 'update']);
        Route::patch('/courses/{course}', [CourseController::class, 'update']);
        Route::delete('/courses/{course}', [CourseController::class, 'destroy']);

        // Subject CRUD
        Route::post('/subjects', [SubjectController::class, 'store']);
        Route::put('/subjects/{subject}', [SubjectController::class, 'update']);
        Route::patch('/subjects/{subject}', [SubjectController::class, 'update']);
        Route::delete('/subjects/{subject}', [SubjectController::class, 'destroy']);

        // Skills (skill_master) CRUD
        Route::post('/skills', [SkillMasterController::class, 'store']);
        Route::put('/skills/{skill}', [SkillMasterController::class, 'update']);
        Route::patch('/skills/{skill}', [SkillMasterController::class, 'update']);
        Route::delete('/skills/{skill}', [SkillMasterController::class, 'destroy']);

        // Sections CRUD
        Route::post('/sections', [SectionController::class, 'store']);
        Route::put('/sections/{section}', [SectionController::class, 'update']);
        Route::patch('/sections/{section}', [SectionController::class, 'update']);
        Route::delete('/sections/{section}', [SectionController::class, 'destroy']);

        // Curriculum CRUD
        Route::post('/curriculum', [CurriculumController::class, 'store']);
        Route::put('/curriculum/{curriculum}', [CurriculumController::class, 'update']);
        Route::patch('/curriculum/{curriculum}', [CurriculumController::class, 'update']);
        Route::delete('/curriculum/{curriculum}', [CurriculumController::class, 'destroy']);

        // Faculty Assignments CRUD
        Route::post('/faculty-assignments', [FacultyAssignmentController::class, 'store']);
        Route::put('/faculty-assignments/{assignment}', [FacultyAssignmentController::class, 'update']);
        Route::patch('/faculty-assignments/{assignment}', [FacultyAssignmentController::class, 'update']);
        Route::delete('/faculty-assignments/{assignment}', [FacultyAssignmentController::class, 'destroy']);

        // Events CRUD
        Route::post('/events', [EventController::class, 'store']);
        Route::put('/events/{id}', [EventController::class, 'update']);
        Route::patch('/events/{id}', [EventController::class, 'update']);
        Route::delete('/events/{id}', [EventController::class, 'destroy']);

        // Reports (qualification + analytics)
        Route::post('/reports/enrollment', [ReportController::class, 'enrollment']);
        Route::post('/reports/performance', [ReportController::class, 'performance']);
        Route::post('/reports/custom', [ReportController::class, 'customReport']);
        Route::post('/reports/qualifications/basketball', [ReportController::class, 'basketballQualifications']);
        Route::post('/reports/qualifications/programming', [ReportController::class, 'programmingQualifications']);
        Route::post('/reports/qualifications/leadership', [ReportController::class, 'leadershipQualifications']);
        Route::post('/reports/qualifications/no-violations', [ReportController::class, 'noViolations']);
        Route::post('/reports/qualifications/top-performing', [ReportController::class, 'topPerforming']);
        Route::post('/reports/export', [ReportController::class, 'export']);
    });

    /*
     * Faculty (teaching and grade submission)
     */
    Route::middleware('role:faculty')->group(function () {
        // Grade submission + history
        Route::post('/faculty/submit-grade', [FacultyController::class, 'submitGrade']);
        Route::get('/faculty/grades', [FacultyController::class, 'myGradeSubmissions']);
    });

    /*
     * Student (self-service)
     */
    Route::middleware('role:student')->group(function () {
        // Student update endpoints are declared above with combined middleware.
    });
});

