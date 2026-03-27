<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faculty_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->constrained('faculty');
            $table->foreignId('subject_id')->constrained();
            $table->foreignId('section_id')->constrained();
            $table->enum('semester', ['first', 'second', 'summer']);
            $table->string('school_year', 9);
            $table->timestamps();

            $table->unique(['faculty_id', 'subject_id', 'section_id', 'semester', 'school_year'], 'fa_fac_sub_sec_sem_sy_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faculty_assignments');
    }
};
