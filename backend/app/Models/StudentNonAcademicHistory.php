<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentNonAcademicHistory extends Model
{
    use HasFactory;

    protected $table = 'student_non_academic_history';

    protected $fillable = [
        'student_id',
        'event_id',
        'role',
        'result',
        'achievements',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
