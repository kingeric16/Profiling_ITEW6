<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacultyAssignment extends Model
{
    use HasFactory;

    protected $table = 'faculty_assignments';

    protected $fillable = [
        'faculty_id',
        'subject_id',
        'section_id',
        'semester',
        'school_year',
        'room',
        'schedule_day',
        'start_time',
        'end_time',
    ];

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }
}
