<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Audit;
use App\Mail\PasswordChangeOtpMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * @return array<string, mixed>
     */
    private function userPayload(User $user): array
    {
        $avatarUrl = null;
        if ($user->avatar_path) {
            $avatarUrl = asset('storage/'.$user->avatar_path);
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'employee_number' => $user->employee_number,
            'student_number' => $user->student_number,
            'avatar_url' => $avatarUrl,
        ];
    }

    /**
     * Same lookup rules as login (email or 7-digit ID, scoped by selected role).
     */
    private function findUserForLoginIdentifier(string $role, string $identifier): ?User
    {
        $identifier = trim($identifier);
        if ($identifier === '') {
            return null;
        }

        $looksLikeId = preg_match('/^\d{7}$/', $identifier) === 1;
        $isNumericInput = ctype_digit($identifier);

        if ($isNumericInput && ! $looksLikeId) {
            return null;
        }

        if (! $looksLikeId && ! filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            return null;
        }

        $userQuery = User::query();
        // Important: prevent logging in with a different portal role.
        // Example: a Dean account should not be able to log in via the Student role picker.
        $userQuery->where('role', $role);
        if ($role === 'student') {
            if ($looksLikeId) {
                $userQuery->where('student_number', $identifier);
            } else {
                $userQuery->where('email', $identifier);
            }
        } else {
            if ($looksLikeId) {
                $userQuery->where('employee_number', $identifier);
            } else {
                $userQuery->where('email', $identifier);
            }
        }

        return $userQuery->first();
    }

    /**
     * Public preview for login UI: returns avatar URL for the account matching role + identifier (no auth).
     */
    public function loginAvatarPreview(Request $request)
    {
        $role = (string) $request->query('role', '');
        $identifier = (string) $request->query('identifier', '');

        if (! in_array($role, ['dean', 'faculty', 'student'], true)) {
            return response()->json(['avatar_url' => null]);
        }

        $user = $this->findUserForLoginIdentifier($role, $identifier);

        if (! $user) {
            return response()->json(['avatar_url' => null]);
        }

        return response()->json([
            'avatar_url' => $this->userPayload($user)['avatar_url'],
        ]);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'role' => ['required', 'in:dean,faculty,student'],
            // Can be either an email OR a 7-digit ID number.
            'identifier' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
        ]);

        $identifier = trim((string) $validated['identifier']);
        $role = (string) $validated['role'];

        $looksLikeId = preg_match('/^\d{7}$/', $identifier) === 1;
        $isNumericInput = ctype_digit($identifier);

        if ($isNumericInput && ! $looksLikeId) {
            throw ValidationException::withMessages([
                'identifier' => ['ID Number must be exactly 7 digits.'],
            ]);
        }

        if (! $looksLikeId && ! filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            throw ValidationException::withMessages([
                'identifier' => ['Invalid email format.'],
            ]);
        }

        $user = $this->findUserForLoginIdentifier($role, $identifier);

        if (! $user) {
            throw ValidationException::withMessages([
                // Keep `email` key for backwards compatibility with your current frontend,
                // but also include `identifier` for the new input mode.
                'email' => ['account does not exists'],
                'identifier' => ['account does not exists'],
            ]);
        }

        if (! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Incorrect password.'],
            ]);
        }

        $token = $user->createToken('web')->plainTextToken;
        Audit::log($user, 'login');

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => $this->userPayload($user),
        ]);
    }

    private function passwordOtpCacheKey(int $userId): string
    {
        return 'password_change_otp:'.$userId;
    }

    private function passwordUnlockCacheKey(int $userId): string
    {
        return 'password_change_unlocked:'.$userId;
    }

    private function passwordResetOtpCacheKey(int $userId): string
    {
        return 'password_reset_otp:'.$userId;
    }

    private function passwordResetUnlockCacheKey(int $userId): string
    {
        return 'password_reset_unlocked:'.$userId;
    }

    public function verifyPasswordChangeOtp(Request $request)
    {
        $request->validate([
            'otp' => ['required', 'string', 'size:6', 'regex:/^\d{6}$/'],
        ]);

        $user = $request->user();
        $key = $this->passwordOtpCacheKey($user->id);
        $stored = Cache::get($key);
        $providedHash = hash('sha256', (string) $request->input('otp'));

        if (! $stored || ! hash_equals((string) $stored, $providedHash)) {
            throw ValidationException::withMessages([
                'otp' => ['Invalid or expired verification code. Request a new code if needed.'],
            ]);
        }

        Cache::forget($key);
        Cache::put($this->passwordUnlockCacheKey($user->id), true, now()->addMinutes(15));

        Audit::log($user, 'verify_password_change_otp');

        return response()->json([
            'message' => 'Email verified. You can set a new password.',
        ]);
    }

    public function requestPasswordChangeOtp(Request $request)
    {
        $user = $request->user();

        $cooldownKey = 'password-otp-resend:'.$user->id;
        if (RateLimiter::tooManyAttempts($cooldownKey, 1)) {
            return response()->json([
                'message' => 'Please wait before requesting another code.',
                'retry_after' => RateLimiter::availableIn($cooldownKey),
            ], 429);
        }

        $hourlyKey = 'password-otp-hourly:'.$user->id;
        if (RateLimiter::tooManyAttempts($hourlyKey, 5)) {
            return response()->json([
                'message' => 'Too many verification codes requested. Try again later.',
                'retry_after' => RateLimiter::availableIn($hourlyKey),
            ], 429);
        }

        Cache::forget($this->passwordUnlockCacheKey($user->id));

        $otp = str_pad((string) random_int(0, 999_999), 6, '0', STR_PAD_LEFT);
        $hash = hash('sha256', $otp);

        Cache::put($this->passwordOtpCacheKey($user->id), $hash, now()->addMinutes(10));

        Mail::to($user->email)->send(new PasswordChangeOtpMail($otp, $user->name));

        RateLimiter::hit($cooldownKey, 60);
        RateLimiter::hit($hourlyKey, 3600);

        Audit::log($user, 'request_password_change_otp');

        return response()->json([
            'message' => 'Verification code sent to your email.',
        ]);
    }

    /**
     * Forgot password flow (anonymous):
     * - request OTP by email
     * - verify OTP
     * - unlock password change for 15 minutes
     */
    public function requestPasswordResetOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email:rfc,dns', 'max:255'],
        ]);

        $email = strtolower(trim((string) $validated['email']));
        $user = User::where('email', $email)->first();

        // Use a stable identifier for rate limiting even if the user doesn't exist.
        $rateId = $user?->id ?? md5($email);

        $cooldownKey = 'password-reset-otp-resend:'.$rateId;
        if (RateLimiter::tooManyAttempts($cooldownKey, 1)) {
            return response()->json([
                'message' => 'Please wait before requesting another code.',
                'retry_after' => RateLimiter::availableIn($cooldownKey),
            ], 429);
        }

        $hourlyKey = 'password-reset-otp-hourly:'.$rateId;
        if (RateLimiter::tooManyAttempts($hourlyKey, 5)) {
            return response()->json([
                'message' => 'Too many verification codes requested. Try again later.',
                'retry_after' => RateLimiter::availableIn($hourlyKey),
            ], 429);
        }

        if ($user) {
            Cache::forget($this->passwordResetUnlockCacheKey($user->id));

            $otp = str_pad((string) random_int(0, 999_999), 6, '0', STR_PAD_LEFT);
            $hash = hash('sha256', $otp);

            Cache::put($this->passwordResetOtpCacheKey($user->id), $hash, now()->addMinutes(10));

            Mail::to($user->email)->send(new PasswordChangeOtpMail($otp, $user->name));

            Audit::log($user, 'request_password_reset_otp');
        }

        // Always record the hits to prevent OTP endpoint abuse.
        RateLimiter::hit($cooldownKey, 60);
        RateLimiter::hit($hourlyKey, 3600);

        // Generic message to avoid account enumeration.
        return response()->json([
            'message' => 'Verification code sent to your email.',
        ]);
    }

    public function verifyPasswordResetOtp(Request $request)
    {
        $request->validate([
            'email' => ['required', 'string', 'email:rfc,dns', 'max:255'],
            'otp' => ['required', 'string', 'size:6', 'regex:/^\d{6}$/'],
        ]);

        $email = strtolower(trim((string) $request->input('email')));
        $user = User::where('email', $email)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'otp' => ['Invalid or expired verification code. Request a new code if needed.'],
            ]);
        }

        $key = $this->passwordResetOtpCacheKey($user->id);
        $stored = Cache::get($key);
        $providedHash = hash('sha256', (string) $request->input('otp'));

        if (! $stored || ! hash_equals((string) $stored, $providedHash)) {
            throw ValidationException::withMessages([
                'otp' => ['Invalid or expired verification code. Request a new code if needed.'],
            ]);
        }

        Cache::forget($key);
        Cache::put($this->passwordResetUnlockCacheKey($user->id), true, now()->addMinutes(15));

        Audit::log($user, 'verify_password_reset_otp');

        return response()->json([
            'message' => 'Email verified. You can set a new password.',
        ]);
    }

    public function resetPasswordWithOtp(Request $request)
    {
        $request->validate([
            'email' => ['required', 'string', 'email:rfc,dns', 'max:255'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $email = strtolower(trim((string) $request->input('email')));
        $user = User::where('email', $email)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'new_password' => ['Verify your email with the code we sent before setting a new password.'],
            ]);
        }

        if (! Cache::get($this->passwordResetUnlockCacheKey($user->id))) {
            throw ValidationException::withMessages([
                'new_password' => ['Verify your email with the code we sent before setting a new password.'],
            ]);
        }

        $user->password = Hash::make((string) $request->input('new_password'));
        $user->save();

        Cache::forget($this->passwordResetUnlockCacheKey($user->id));
        Audit::log($user, 'reset_password_with_otp');

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }

    public function updateMe(Request $request)
    {
        $rules = [
            'name' => ['required', 'string', 'min:1', 'max:255'],
        ];

        if ($request->filled('password')) {
            $rules['password'] = ['required', 'string', 'min:8', 'confirmed'];
        }

        $data = $request->validate($rules);

        $user = $request->user();
        $user->name = $data['name'];

        if ($request->filled('password')) {
            if (! Cache::get($this->passwordUnlockCacheKey($user->id))) {
                throw ValidationException::withMessages([
                    'password' => ['Verify your email with the code we sent before setting a new password.'],
                ]);
            }

            $user->password = $data['password'];
            Cache::forget($this->passwordUnlockCacheKey($user->id));
        }

        $user->save();
        Audit::log($user, 'update_profile');

        return response()->json([
            'user' => $this->userPayload($user->fresh()),
        ]);
    }

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
        ]);

        $user = $request->user();
        $old = $user->avatar_path;

        $path = $request->file('avatar')->store('avatars/'.$user->id, 'public');

        if ($old) {
            Storage::disk('public')->delete($old);
        }

        $user->avatar_path = $path;
        $user->save();

        Audit::log($user, 'update_avatar');

        return response()->json([
            'user' => $this->userPayload($user->fresh()),
        ]);
    }

    public function logout(Request $request)
    {
        Audit::log($request->user(), 'logout');
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['ok' => true]);
    }
}

