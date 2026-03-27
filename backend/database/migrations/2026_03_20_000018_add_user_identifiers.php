<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Keep as VARCHAR so leading zeros would still be representable (even though we validate "exactly 7 digits").
            $table->string('employee_number', 7)->nullable()->unique()->after('email');
            $table->string('student_number', 7)->nullable()->unique()->after('employee_number');
        });

        // For MySQL environments, enforce role as an ENUM at the DB level.
        if (DB::getDriverName() === 'mysql') {
            try {
                DB::statement("ALTER TABLE users MODIFY role ENUM('dean','faculty','student') NOT NULL DEFAULT 'student'");
            } catch (\Throwable) {
                // If DB-level enum change fails, the app still enforces the role values via validation.
            }
        }

        // Assign existing Dean account employee_number = 2202191.
        // We assign only the first dean user to avoid unique collisions if multiple dean users exist.
        $deanIds = DB::table('users')
            ->where('role', 'dean')
            ->orderBy('id')
            ->pluck('id')
            ->values()
            ->all();

        if (! empty($deanIds)) {
            $taken = DB::table('users')->where('employee_number', '2202191')->first();
            if ($taken) {
                // If it is not a dean, do not override (prevents breaking uniqueness unexpectedly).
                if (($taken->role ?? null) !== 'dean') {
                    throw new \RuntimeException('employee_number=2202191 is already taken by a non-dean user.');
                }
            } else {
                DB::table('users')->where('id', $deanIds[0])->update(['employee_number' => '2202191']);
            }
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['employee_number', 'student_number']);
        });

        // role enum changes are best-effort and not reversed here.
    }
};

