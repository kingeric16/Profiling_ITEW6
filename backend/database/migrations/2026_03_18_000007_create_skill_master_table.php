<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('skill_master', function (Blueprint $table) {
            $table->id();
            $table->string('skill_name');
            $table->string('skill_category');
            $table->timestamps();
            
            $table->unique(['skill_name', 'skill_category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('skill_master');
    }
};
