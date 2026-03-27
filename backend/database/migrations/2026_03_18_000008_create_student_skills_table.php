<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained();
            $table->foreignId('skill_id')->constrained('skill_master');
            $table->enum('skill_level', ['beginner', 'intermediate', 'advanced', 'expert']);
            $table->timestamps();
            
            $table->unique(['student_id', 'skill_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_skills');
    }
};
