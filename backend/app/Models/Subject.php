<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_code',
        'subject_name',
        'units',
    ];

    protected $casts = [
        'units' => 'decimal:1',
    ];

    public function curriculum(): HasMany
    {
        return $this->hasMany(Curriculum::class);
    }

    public function academicHistory(): HasMany
    {
        return $this->hasMany(StudentAcademicHistory::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(FacultyAssignment::class);
    }

    // Used by FacultyController@myGradeSubmissions (whereHas('subject.facultyAssignments', ...)).
    public function facultyAssignments(): HasMany
    {
        return $this->hasMany(FacultyAssignment::class, 'subject_id', 'id');
    }
}
