<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DeanUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $email = env('DEFAULT_DEAN_EMAIL', 'mirandakianandrei25@gmail.com');
        $password = env('DEFAULT_DEAN_PASSWORD', 'password');

        $existing = User::query()
            ->where('email', $email)
            ->first();

        if ($existing) {
            return;
        }

        User::query()->create([
            'name' => 'Dean Account',
            'email' => $email,
            'role' => 'dean',
            'password' => Hash::make($password),
        ]);
    }
}
