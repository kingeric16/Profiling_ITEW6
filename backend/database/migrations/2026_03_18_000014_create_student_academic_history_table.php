<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_academic_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained();
            $table->foreignId('subject_id')->constrained();
            $table->decimal('grade', 5, 2);
            $table->enum('semester', ['first', 'second', 'summer']);
            $table->string('school_year', 9);
            $table->timestamps();

            // MySQL max identifier length is 64; auto-generated name exceeds it.
            $table->unique(['student_id', 'subject_id', 'semester', 'school_year'], 'sah_stu_subj_sem_sy_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_academic_history');
    }
};
