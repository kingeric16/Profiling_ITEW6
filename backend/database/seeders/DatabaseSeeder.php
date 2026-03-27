<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Course;
use App\Models\Section;
use App\Models\Subject;
use App\Models\Faculty;
use App\Models\Student;
use App\Models\SkillMaster;
use App\Models\Event;
use App\Models\Curriculum;
use App\Models\FacultyAssignment;
use App\Models\StudentSkill;
use App\Models\StudentAffiliation;
use App\Models\StudentViolation;
use App\Models\StudentMedicalHistory;
use App\Models\StudentAcademicHistory;
use App\Models\StudentNonAcademicHistory;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call(DeanUserSeeder::class);

        // ========== COURSES ==========
        $bscs = Course::firstOrCreate(
            ['course_code' => 'BSCS'],
            [
                'course_name' => 'Bachelor of Science in Computer Science',
                'department' => 'Computer Studies',
            ]
        );

        $bsit = Course::firstOrCreate(
            ['course_code' => 'BSIT'],
            [
                'course_name' => 'Bachelor of Science in Information Technology',
                'department' => 'Computer Studies',
            ]
        );

        $bsis = Course::firstOrCreate(
            ['course_code' => 'BSIS'],
            [
                'course_name' => 'Bachelor of Science in Information Systems',
                'department' => 'Computer Studies',
            ]
        );

        // ========== SECTIONS ==========
        $cs1a = Section::firstOrCreate(
            ['section_name' => 'CS-1A'],
            [
                'course_id' => $bscs->id,
                'year_level' => 1,
            ]
        );

        $cs2a = Section::firstOrCreate(
            ['section_name' => 'CS-2A'],
            [
                'course_id' => $bscs->id,
                'year_level' => 2,
            ]
        );

        $cs3a = Section::firstOrCreate(
            ['section_name' => 'CS-3A'],
            [
                'course_id' => $bscs->id,
                'year_level' => 3,
            ]
        );

        // ========== SUBJECTS ==========
        $subjects = [
            ['code' => 'CS101', 'name' => 'Introduction to Computer Science', 'units' => 3.0],
            ['code' => 'CS102', 'name' => 'Programming Fundamentals', 'units' => 4.0],
            ['code' => 'CS103', 'name' => 'Discrete Mathematics', 'units' => 3.0],
            ['code' => 'CS201', 'name' => 'Data Structures and Algorithms', 'units' => 4.0],
            ['code' => 'CS202', 'name' => 'Object-Oriented Programming', 'units' => 4.0],
            ['code' => 'CS203', 'name' => 'Database Management Systems', 'units' => 3.0],
            ['code' => 'CS301', 'name' => 'Software Engineering', 'units' => 3.0],
            ['code' => 'CS302', 'name' => 'Web Development', 'units' => 3.0],
            ['code' => 'CS303', 'name' => 'Computer Networks', 'units' => 3.0],
            ['code' => 'IT101', 'name' => 'Information Technology Fundamentals', 'units' => 3.0],
            ['code' => 'MATH101', 'name' => 'Calculus I', 'units' => 3.0],
            ['code' => 'ENG101', 'name' => 'English Communication', 'units' => 3.0],
        ];

        $subjectModels = [];
        foreach ($subjects as $subject) {
            $subjectModels[$subject['code']] = Subject::firstOrCreate(
                ['subject_code' => $subject['code']],
                [
                    'subject_name' => $subject['name'],
                    'units' => $subject['units'],
                ]
            );
        }

        // ========== CURRICULUM MAPPING ==========
        // Year 1 subjects for BSCS
        $year1Subjects = ['CS101', 'CS102', 'CS103', 'MATH101', 'ENG101'];
        foreach ($year1Subjects as $code) {
            Curriculum::firstOrCreate([
                'course_id' => $bscs->id,
                'subject_id' => $subjectModels[$code]->id,
                'year_level' => 1,
            ]);
        }

        // Year 2 subjects for BSCS
        $year2Subjects = ['CS201', 'CS202', 'CS203'];
        foreach ($year2Subjects as $code) {
            Curriculum::firstOrCreate([
                'course_id' => $bscs->id,
                'subject_id' => $subjectModels[$code]->id,
                'year_level' => 2,
            ]);
        }

        // Year 3 subjects for BSCS
        $year3Subjects = ['CS301', 'CS302', 'CS303'];
        foreach ($year3Subjects as $code) {
            Curriculum::firstOrCreate([
                'course_id' => $bscs->id,
                'subject_id' => $subjectModels[$code]->id,
                'year_level' => 3,
            ]);
        }

        // ========== SKILLS ==========
        $skills = [
            ['name' => 'Programming', 'category' => 'Technical'],
            ['name' => 'Web Development', 'category' => 'Technical'],
            ['name' => 'Database Design', 'category' => 'Technical'],
            ['name' => 'Basketball', 'category' => 'Sports'],
            ['name' => 'Volleyball', 'category' => 'Sports'],
            ['name' => 'Leadership', 'category' => 'Leadership'],
            ['name' => 'Public Speaking', 'category' => 'Leadership'],
            ['name' => 'Graphic Design', 'category' => 'Arts'],
            ['name' => 'Video Editing', 'category' => 'Arts'],
            ['name' => 'Project Management', 'category' => 'Leadership'],
        ];

        $skillModels = [];
        foreach ($skills as $skill) {
            $skillModels[$skill['name']] = SkillMaster::firstOrCreate(
                ['skill_name' => $skill['name']],
                ['skill_category' => $skill['category']]
            );
        }

        // ========== EVENTS ==========
        $events = [
            [
                'name' => 'Intramurals Basketball Tournament',
                'category' => 'Sports',
                'skill' => 'Basketball',
                'gpa' => 2.0,
                'date' => now()->addDays(15),
                'location' => 'University Gymnasium',
                'description' => 'Annual basketball tournament for all departments',
            ],
            [
                'name' => 'Programming Hackathon 2026',
                'category' => 'Academic',
                'skill' => 'Programming',
                'gpa' => 2.5,
                'date' => now()->addDays(30),
                'location' => 'Computer Laboratory',
                'description' => '24-hour coding competition',
            ],
            [
                'name' => 'Leadership Summit',
                'category' => 'Cultural',
                'skill' => 'Leadership',
                'gpa' => 2.0,
                'date' => now()->addDays(45),
                'location' => 'Conference Hall',
                'description' => 'Student leadership development program',
            ],
            [
                'name' => 'Web Design Competition',
                'category' => 'Academic',
                'skill' => 'Web Development',
                'gpa' => 2.5,
                'date' => now()->addDays(60),
                'location' => 'IT Building',
                'description' => 'Showcase your web design skills',
            ],
        ];

        $eventModels = [];
        foreach ($events as $event) {
            $eventModels[$event['name']] = Event::firstOrCreate(
                ['event_name' => $event['name']],
                [
                    'category' => $event['category'],
                    'required_skill' => $event['skill'],
                    'required_gpa' => $event['gpa'],
                    'event_date' => $event['date'],
                    'location' => $event['location'],
                    'description' => $event['description'],
                ]
            );
        }

        // ========== FACULTY ==========
        $facultyData = [
            ['first' => 'Maria', 'last' => 'Santos', 'email' => 'maria.santos@ccs.edu', 'dept' => 'Computer Science', 'spec' => 'Algorithms'],
            ['first' => 'Juan', 'last' => 'Dela Cruz', 'email' => 'juan.delacruz@ccs.edu', 'dept' => 'Computer Science', 'spec' => 'Database Systems'],
            ['first' => 'Ana', 'last' => 'Reyes', 'email' => 'ana.reyes@ccs.edu', 'dept' => 'Computer Science', 'spec' => 'Web Development'],
            ['first' => 'Pedro', 'last' => 'Garcia', 'email' => 'pedro.garcia@ccs.edu', 'dept' => 'Computer Science', 'spec' => 'Software Engineering'],
            ['first' => 'Rosa', 'last' => 'Cruz', 'email' => 'rosa.cruz@ccs.edu', 'dept' => 'Mathematics', 'spec' => 'Calculus'],
        ];

        $facultyModels = [];
        foreach ($facultyData as $fac) {
            // Create user account
            $user = User::firstOrCreate(
                ['email' => $fac['email']],
                [
                    'name' => $fac['first'] . ' ' . $fac['last'],
                    'password' => Hash::make('password'),
                    'role' => 'faculty',
                ]
            );

            // Create faculty record
            $facultyModels[$fac['email']] = Faculty::firstOrCreate(
                ['email' => $fac['email']],
                [
                    'first_name' => $fac['first'],
                    'last_name' => $fac['last'],
                    'department' => $fac['dept'],
                    'specialization' => $fac['spec'],
                ]
            );
        }

        // ========== STUDENTS ==========
        $studentUser = User::firstOrCreate(
            ['email' => 'student@ccs.edu'],
            [
                'name' => 'Jane Student',
                'password' => Hash::make('password'),
                'role' => 'student',
            ]
        );

        $student = Student::firstOrCreate(
            ['email' => 'student@ccs.edu'],
            [
                'student_number' => '2024-00001',
                'first_name' => 'Jane',
                'middle_name' => 'Marie',
                'last_name' => 'Student',
                'gender' => 'female',
                'birthdate' => '2005-05-15',
                'contact_number' => '09171234567',
                'guardian_name' => 'John Student',
                'guardian_contact' => '09187654321',
                'height' => 165.0,
                'weight' => 55.0,
                'bmi' => 20.2,
                'course_id' => $bscs->id,
                'section_id' => $cs3a->id,
                'year_level' => 3,
                'enrollment_status' => 'Enrolled',
                'overall_gpa' => 1.75,
            ]
        );

        // ========== STUDENT SKILLS ==========
        $studentSkills = [
            ['skill' => 'Programming', 'level' => 'advanced'],
            ['skill' => 'Web Development', 'level' => 'intermediate'],
            ['skill' => 'Database Design', 'level' => 'intermediate'],
            ['skill' => 'Leadership', 'level' => 'advanced'],
            ['skill' => 'Public Speaking', 'level' => 'intermediate'],
        ];

        foreach ($studentSkills as $ss) {
            StudentSkill::firstOrCreate([
                'student_id' => $student->id,
                'skill_id' => $skillModels[$ss['skill']]->id,
            ], [
                'skill_level' => $ss['level'],
            ]);
        }

        // ========== STUDENT AFFILIATIONS ==========
        $affiliations = [
            ['org' => 'Computer Science Society', 'role' => 'President', 'status' => 'active'],
            ['org' => 'Google Developer Student Club', 'role' => 'Core Team Member', 'status' => 'active'],
            ['org' => 'ACM Student Chapter', 'role' => 'Member', 'status' => 'active'],
        ];

        foreach ($affiliations as $aff) {
            StudentAffiliation::firstOrCreate([
                'student_id' => $student->id,
                'organization_name' => $aff['org'],
            ], [
                'role' => $aff['role'],
                'status' => $aff['status'],
            ]);
        }

        // ========== STUDENT MEDICAL HISTORY ==========
        StudentMedicalHistory::firstOrCreate(
            ['student_id' => $student->id],
            [
                'medical_condition' => 'None',
                'allergies' => 'Peanuts',
                'medications' => 'None',
                'last_checkup_date' => now()->subMonths(3),
                'notes' => 'Healthy, no major concerns',
            ]
        );

        // ========== STUDENT VIOLATIONS ==========
        // No violations for this student (clean record)

        // ========== STUDENT ACADEMIC HISTORY ==========
        // Year 1 grades
        $year1Grades = [
            ['subject' => 'CS101', 'grade' => 1.5, 'sem' => 'first', 'year' => '2024-2025'],
            ['subject' => 'CS102', 'grade' => 1.75, 'sem' => 'first', 'year' => '2024-2025'],
            ['subject' => 'CS103', 'grade' => 2.0, 'sem' => 'first', 'year' => '2024-2025'],
            ['subject' => 'MATH101', 'grade' => 1.75, 'sem' => 'first', 'year' => '2024-2025'],
            ['subject' => 'ENG101', 'grade' => 1.5, 'sem' => 'second', 'year' => '2024-2025'],
        ];

        foreach ($year1Grades as $grade) {
            StudentAcademicHistory::firstOrCreate([
                'student_id' => $student->id,
                'subject_id' => $subjectModels[$grade['subject']]->id,
                'semester' => $grade['sem'],
                'school_year' => $grade['year'],
            ], [
                'grade' => $grade['grade'],
            ]);
        }

        // Year 2 grades
        $year2Grades = [
            ['subject' => 'CS201', 'grade' => 1.75, 'sem' => 'first', 'year' => '2025-2026'],
            ['subject' => 'CS202', 'grade' => 1.5, 'sem' => 'first', 'year' => '2025-2026'],
            ['subject' => 'CS203', 'grade' => 2.0, 'sem' => 'second', 'year' => '2025-2026'],
        ];

        foreach ($year2Grades as $grade) {
            StudentAcademicHistory::firstOrCreate([
                'student_id' => $student->id,
                'subject_id' => $subjectModels[$grade['subject']]->id,
                'semester' => $grade['sem'],
                'school_year' => $grade['year'],
            ], [
                'grade' => $grade['grade'],
            ]);
        }

        // ========== STUDENT NON-ACADEMIC HISTORY ==========
        StudentNonAcademicHistory::firstOrCreate([
            'student_id' => $student->id,
            'event_id' => $eventModels['Programming Hackathon 2026']->id,
        ], [
            'role' => 'Participant',
            'result' => 'winner',
            'achievements' => 'First Place - Best Overall Project',
        ]);

        StudentNonAcademicHistory::firstOrCreate([
            'student_id' => $student->id,
            'event_id' => $eventModels['Leadership Summit']->id,
        ], [
            'role' => 'Speaker',
            'result' => 'participated',
            'achievements' => 'Delivered keynote on student leadership',
        ]);

        // ========== FACULTY ASSIGNMENTS (SCHEDULE) ==========
        // Note: Due to unique constraint on (faculty_id, subject_id, section_id, semester, school_year),
        // each subject can only have one schedule entry per semester
        $schedules = [
            ['faculty' => 'maria.santos@ccs.edu', 'subject' => 'CS301', 'section' => $cs3a->id, 'day' => 'Monday', 'start' => '08:00', 'end' => '10:00', 'room' => 'Room 301'],
            ['faculty' => 'ana.reyes@ccs.edu', 'subject' => 'CS302', 'section' => $cs3a->id, 'day' => 'Tuesday', 'start' => '10:00', 'end' => '12:00', 'room' => 'Lab 1'],
            ['faculty' => 'pedro.garcia@ccs.edu', 'subject' => 'CS303', 'section' => $cs3a->id, 'day' => 'Wednesday', 'start' => '14:00', 'end' => '16:00', 'room' => 'Room 302'],
        ];

        foreach ($schedules as $sched) {
            FacultyAssignment::firstOrCreate([
                'faculty_id' => $facultyModels[$sched['faculty']]->id,
                'subject_id' => $subjectModels[$sched['subject']]->id,
                'section_id' => $sched['section'],
                'semester' => 'first',
                'school_year' => '2025-2026',
                'schedule_day' => $sched['day'],
                'start_time' => $sched['start'],
            ], [
                'end_time' => $sched['end'],
                'room' => $sched['room'],
            ]);
        }

        $this->command->info('✅ Database seeded successfully with comprehensive test data!');
        $this->command->info('📧 Student Login: student@ccs.edu / password');
        $this->command->info('📧 Dean Login: dean@ccs.edu / password');
        $this->command->info('📧 Faculty Login: maria.santos@ccs.edu / password');
    }
}
