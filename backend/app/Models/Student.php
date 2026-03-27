<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_number',
        'first_name',
        'middle_name',
        'last_name',
        'gender',
        'birthdate',
        'email',
        'contact_number',
        'guardian_name',
        'guardian_contact',
        'height',
        'weight',
        'bmi',
        'course_id',
        'section_id',
        'year_level',
        'enrollment_status',
        'overall_gpa',
    ];

    protected $casts = [
        'birthdate' => 'date',
        'height' => 'decimal:2',
        'weight' => 'decimal:2',
        'bmi' => 'decimal:2',
        'overall_gpa' => 'decimal:2',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function skills(): HasMany
    {
        return $this->hasMany(StudentSkill::class);
    }

    public function affiliations(): HasMany
    {
        return $this->hasMany(StudentAffiliation::class);
    }

    public function violations(): HasMany
    {
        return $this->hasMany(StudentViolation::class);
    }

    public function medicalHistory(): HasMany
    {
        return $this->hasMany(StudentMedicalHistory::class);
    }

    public function academicHistory(): HasMany
    {
        return $this->hasMany(StudentAcademicHistory::class);
    }

    public function nonAcademicHistory(): HasMany
    {
        return $this->hasMany(StudentNonAcademicHistory::class);
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->middle_name} {$this->last_name}";
    }
}
