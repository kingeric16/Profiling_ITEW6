<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentMedicalHistory extends Model
{
    use HasFactory;

    protected $table = 'student_medical_history';

    protected $fillable = [
        'student_id',
        'medical_condition',
        'allergies',
        'medications',
        'last_checkup_date',
        'notes',
    ];

    protected $casts = [
        'last_checkup_date' => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
