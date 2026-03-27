<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_affiliations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained();
            $table->string('organization_name');
            $table->string('role');
            $table->enum('status', ['active', 'inactive', 'graduated']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_affiliations');
    }
};
