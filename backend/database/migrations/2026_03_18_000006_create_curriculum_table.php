<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('curriculum', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained();
            $table->foreignId('subject_id')->constrained();
            $table->integer('year_level');
            $table->timestamps();
            
            $table->unique(['course_id', 'subject_id', 'year_level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('curriculum');
    }
};
