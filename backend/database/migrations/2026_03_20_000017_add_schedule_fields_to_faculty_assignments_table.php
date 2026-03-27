<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $existingColumns = [];
        try {
            if (DB::getDriverName() === 'sqlite') {
                $rows = DB::select("PRAGMA table_info('faculty_assignments')");
                $existingColumns = array_map(fn ($r) => (string) ($r->name ?? ''), $rows);
            } else {
                $rows = DB::select("
                    SELECT COLUMN_NAME as name
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'faculty_assignments'
                ");
                $existingColumns = array_map(fn ($r) => (string) ($r->name ?? ''), $rows);
            }
        } catch (\Throwable) {
            // If introspection fails, fall back to attempting adds.
            $existingColumns = [];
        }

        Schema::table('faculty_assignments', function (Blueprint $table) use ($existingColumns) {
            // Used by DashboardController for Faculty schedule/classes pages.
            if (!in_array('room', $existingColumns, true)) {
                $table->string('room')->nullable()->after('section_id');
            }
            if (!in_array('schedule_day', $existingColumns, true)) {
                $table->string('schedule_day')->nullable()->after('semester');
            }
            if (!in_array('start_time', $existingColumns, true)) {
                $table->time('start_time')->nullable()->after('schedule_day');
            }
            if (!in_array('end_time', $existingColumns, true)) {
                $table->time('end_time')->nullable()->after('start_time');
            }
        });
    }

    public function down(): void
    {
        Schema::table('faculty_assignments', function (Blueprint $table) {
            $table->dropColumn('room');
            $table->dropColumn('schedule_day');
            $table->dropColumn('start_time');
            $table->dropColumn('end_time');
        });
    }
};

