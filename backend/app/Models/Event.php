<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_name',
        'category',
        'required_skill',
        'required_gpa',
        'event_date',
        'location',
        'description',
    ];

    protected $casts = [
        'event_date' => 'date',
        'required_gpa' => 'decimal:2',
    ];

    public function nonAcademicHistory(): HasMany
    {
        return $this->hasMany(StudentNonAcademicHistory::class);
    }
}
