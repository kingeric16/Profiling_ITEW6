<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('faculty_assignments', function (Blueprint $table) {
            // These columns are expected by DashboardController queries and Faculty UI pages.
            $table->string('room')->nullable()->after('section_id');
            $table->string('schedule_day')->nullable()->after('semester');
            $table->string('start_time')->nullable()->after('schedule_day');
            $table->string('end_time')->nullable()->after('start_time');
        });
    }

    public function down(): void
    {
        Schema::table('faculty_assignments', function (Blueprint $table) {
            $table->dropColumn(['room', 'schedule_day', 'start_time', 'end_time']);
        });
    }
};

