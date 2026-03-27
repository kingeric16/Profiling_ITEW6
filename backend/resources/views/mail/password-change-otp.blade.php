<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Verification code</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;-webkit-font-smoothing:antialiased;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f5;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                    <tr>
                        <td style="background-color:#ea580c;background:linear-gradient(135deg, #fdba74 0%, #f97316 42%, #ea580c 72%, #c2410c 100%);padding:28px 32px;text-align:center;">
                            <p style="margin:0;font-family:Segoe UI,system-ui,-apple-system,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.82);">Security verification</p>
                            <p style="margin:8px 0 0;font-family:Segoe UI,system-ui,-apple-system,sans-serif;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">{{ config('mail.from.name') }}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 32px 8px;font-family:Segoe UI,system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#18181b;">
                            <p style="margin:0 0 16px;">Hello <strong>{{ $userName }}</strong>,</p>
                            <p style="margin:0 0 24px;color:#3f3f46;">We received a request to change the password for your account. Use the verification code below to confirm that it was you.</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:8px 32px 28px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0;">
                                <tr>
                                    <td style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:20px 32px;text-align:center;">
                                        <p style="margin:0 0 8px;font-family:ui-monospace,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:0.35em;color:#c2410c;">{{ $otp }}</p>
                                        <p style="margin:0;font-family:Segoe UI,system-ui,-apple-system,sans-serif;font-size:12px;color:#78716c;">Enter this code in the app to continue.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 32px 28px;font-family:Segoe UI,system-ui,-apple-system,sans-serif;font-size:13px;line-height:1.55;color:#71717a;">
                            <p style="margin:0 0 12px;">This code expires in <strong style="color:#52525b;">10 minutes</strong>. If you did not request a password change, you can safely ignore this message — your password will stay the same.</p>
                            <p style="margin:0;border-top:1px solid #e4e4e7;padding-top:20px;font-size:12px;color:#a1a1aa;">This is an automated message. Please do not reply to this email.</p>
                        </td>
                    </tr>
                </table>
                <p style="margin:20px 0 0;font-family:Segoe UI,system-ui,-apple-system,sans-serif;font-size:11px;color:#a1a1aa;text-align:center;">&copy; {{ date('Y') }} {{ config('mail.from.name') }}</p>
            </td>
        </tr>
    </table>
</body>
</html>
