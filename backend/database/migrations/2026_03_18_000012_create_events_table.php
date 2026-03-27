<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('event_name');
            $table->enum('category', ['sports', 'academic', 'cultural']);
            $table->string('required_skill')->nullable();
            $table->decimal('required_gpa', 3, 2)->nullable();
            $table->date('event_date');
            $table->string('location');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
