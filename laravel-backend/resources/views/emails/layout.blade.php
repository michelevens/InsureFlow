<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#014d40 0%,#0d9488 100%);padding:36px 48px;text-align:center;border-radius:12px 12px 0 0;">
                            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                                <tr>
                                    <td style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">Insurons</td>
                                </tr>
                            </table>
                            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:2px;text-transform:uppercase;">Insurance Made Simple</p>
                        </td>
                    </tr>

                    <!-- Body (white card) -->
                    <tr>
                        <td style="background-color:#ffffff;padding:0;">
                            @yield('content')
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f8fafc;padding:24px 48px;border-top:1px solid #e2e8f0;text-align:center;border-radius:0 0 12px 12px;">
                            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#64748b;">Powered by Insurons &middot; <a href="https://insurons.com" style="color:#0d9488;text-decoration:none;">insurons.com</a></p>
                            <p style="margin:8px 0 0;color:#cbd5e1;font-size:11px;">&copy; 2026 Insurons. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
