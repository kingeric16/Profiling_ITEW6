<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class Audit
{
    public static function log(?\App\Models\User $user, string $action, array $meta = []): void
    {
        try {
            DB::table('audit_logs')->insert([
                'action' => $action,
                'actor_role' => $user?->role,
                'actor_id' => $user?->id,
                'meta' => empty($meta) ? null : json_encode($meta, JSON_UNESCAPED_UNICODE),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable) {
            // ignore
        }
    }
}

