<?php

declare(strict_types=1);

// Usage:
// php scripts/create_user.php --email="user@example.com" --password="secret" --name="Full Name" --role="dean"

$root = dirname(__DIR__);
require $root . '/vendor/autoload.php';

$app = require $root . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

function arg(string $name, ?string $default = null): ?string
{
    $prefix = '--' . $name . '=';
    foreach ($_SERVER['argv'] as $a) {
        if (str_starts_with($a, $prefix)) {
            return substr($a, strlen($prefix));
        }
    }
    return $default;
}

$email = arg('email');
$password = arg('password');
$name = arg('name', 'Dean Account');
$role = arg('role', 'dean');

if (! $email || ! $password) {
    fwrite(STDERR, "Missing --email or --password\n");
    exit(2);
}

$user = App\Models\User::query()->where('email', $email)->first();
if ($user) {
    fwrite(STDOUT, "User already exists: {$email}\n");
    exit(0);
}

$user = App\Models\User::query()->create([
    'name' => $name,
    'email' => $email,
    'role' => $role,
    'password' => Illuminate\Support\Facades\Hash::make($password),
]);

fwrite(STDOUT, "Created user id={$user->id} email={$user->email} role={$user->role}\n");

