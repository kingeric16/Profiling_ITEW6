<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SkillMaster extends Model
{
    use HasFactory;

    protected $table = 'skill_master';

    protected $fillable = [
        'skill_name',
        'skill_category',
    ];

    public function studentSkills(): HasMany
    {
        return $this->hasMany(StudentSkill::class);
    }
}
