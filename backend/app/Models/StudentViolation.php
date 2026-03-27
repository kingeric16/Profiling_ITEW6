<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentViolation extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'violation_type',
        'severity_level',
        'violation_date',
        'clearance_status',
        'description',
    ];

    protected $casts = [
        'violation_date' => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
