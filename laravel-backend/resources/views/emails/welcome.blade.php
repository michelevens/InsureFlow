<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f0fdfa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdfa;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
                    <!-- Top accent bar -->
                    <tr>
                        <td style="height:6px;background:linear-gradient(90deg,#0f766e,#14b8a6,#0ea5e9);border-radius:12px 12px 0 0;"></td>
                    </tr>
                    <tr>
                        <td>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:0 0 16px 16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                                <!-- Header -->
                                <tr>
                                    <td style="background:linear-gradient(135deg,#0f766e 0%,#0d9488 50%,#0ea5e9 100%);padding:40px 48px;text-align:center;">
                                        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                                            <tr>
                                                <td style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;text-align:center;vertical-align:middle;font-size:20px;color:#ffffff;font-weight:bold;">&#128737;</td>
                                                <td style="padding-left:12px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">Insurons</td>
                                            </tr>
                                        </table>
                                        <p style="margin:12px 0 0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:2px;text-transform:uppercase;">Insurance Marketplace</p>
                                    </td>
                                </tr>

                                <!-- Icon -->
                                <tr>
                                    <td style="text-align:center;padding:32px 48px 0;">
                                        <div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border-radius:50%;line-height:72px;font-size:36px;">&#127881;</div>
                                    </td>
                                </tr>

                                <!-- Body -->
                                <tr>
                                    <td style="padding:24px 48px 40px;">
                                        <h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">Welcome to Insurons!</h1>
                                        <p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Hello {{ $user->name }}, your account has been created successfully.</p>

                                        <!-- Info Card -->
                                        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border:1px solid #99f6e4;border-radius:14px;margin-bottom:24px;">
                                            <tr>
                                                <td style="padding:20px;">
                                                    <table width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td style="padding:4px 0;color:#64748b;font-size:14px;">Role</td>
                                                            <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:700;text-align:right;">{{ ucfirst(str_replace('_', ' ', $user->role)) }}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding:4px 0;color:#64748b;font-size:14px;">Email</td>
                                                            <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:600;text-align:right;">{{ $user->email }}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        @if($user->role === 'consumer')
                                        <p style="margin:0 0 8px;color:#475569;font-size:15px;font-weight:600;">Get started:</p>
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                            <tr><td style="padding:6px 0 6px 16px;color:#475569;font-size:14px;line-height:1.6;">&#9679; &nbsp;Get instant quotes</td></tr>
                                            <tr><td style="padding:6px 0 6px 16px;color:#475569;font-size:14px;line-height:1.6;">&#9679; &nbsp;Compare carriers side by side</td></tr>
                                            <tr><td style="padding:6px 0 6px 16px;color:#475569;font-size:14px;line-height:1.6;">&#9679; &nbsp;Track your policies</td></tr>
                                        </table>
                                        @elseif($user->role === 'agent')
                                        <p style="margin:0 0 8px;color:#475569;font-size:15px;font-weight:600;">Get started:</p>
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                            <tr><td style="padding:6px 0 6px 16px;color:#475569;font-size:14px;line-height:1.6;">&#9679; &nbsp;Set up your profile</td></tr>
                                            <tr><td style="padding:6px 0 6px 16px;color:#475569;font-size:14px;line-height:1.6;">&#9679; &nbsp;Browse leads in your pipeline</td></tr>
                                            <tr><td style="padding:6px 0 6px 16px;color:#475569;font-size:14px;line-height:1.6;">&#9679; &nbsp;Track commissions</td></tr>
                                        </table>
                                        @elseif($user->role === 'agency_owner')
                                        <p style="margin:0 0 8px;color:#475569;font-size:15px;font-weight:600;">Get started:</p>
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                            <tr><td style="padding:6px 0 6px 16px;color:#475569;font-size:14px;line-height:1.6;">&#9679; &nbsp;Set up your agency profile</td></tr>
                                            <tr><td style="padding:6px 0 6px 16px;color:#475569;font-size:14px;line-height:1.6;">&#9679; &nbsp;Invite team members</td></tr>
                                            <tr><td style="padding:6px 0 6px 16px;color:#475569;font-size:14px;line-height:1.6;">&#9679; &nbsp;Manage lead distribution</td></tr>
                                        </table>
                                        @elseif($user->role === 'carrier')
                                        <p style="margin:0 0 8px;color:#475569;font-size:15px;font-weight:600;">Get started:</p>
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                            <tr><td style="padding:6px 0 6px 16px;color:#475569;font-size:14px;line-height:1.6;">&#9679; &nbsp;Add your products</td></tr>
                                            <tr><td style="padding:6px 0 6px 16px;color:#475569;font-size:14px;line-height:1.6;">&#9679; &nbsp;Connect with agents</td></tr>
                                            <tr><td style="padding:6px 0 6px 16px;color:#475569;font-size:14px;line-height:1.6;">&#9679; &nbsp;Monitor production</td></tr>
                                        </table>
                                        @else
                                        <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">You're now part of a platform connecting consumers with insurance carriers and agents for the best coverage options.</p>
                                        @endif

                                        <!-- CTA -->
                                        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                                            <tr>
                                                <td style="background-color:#0f766e;border-radius:12px;">
                                                    <a href="{{ env('FRONTEND_URL', 'https://insurons.com') }}/dashboard" style="display:inline-block;padding:16px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">Go to Dashboard</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="padding:24px 48px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                                        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#64748b;">Insurons</p>
                                        <p style="margin:0;color:#94a3b8;font-size:12px;">Your trusted insurance marketplace</p>
                                        <p style="margin:12px 0 0;color:#cbd5e1;font-size:11px;">&copy; {{ date('Y') }} Insurons. All rights reserved.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
