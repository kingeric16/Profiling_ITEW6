<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sections', function (Blueprint $table) {
            $table->id();
            $table->string('section_name');
            $table->foreignId('course_id')->constrained();
            $table->integer('year_level');
            $table->timestamps();

            $table->unique(['course_id', 'year_level', 'section_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sections');
    }
};
