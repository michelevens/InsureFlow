@extends('emails.layout')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border-radius:50%;line-height:72px;font-size:36px;">&#127881;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">Welcome to the Team!</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Hi {{ $agentName }}, your account has been created at <strong style="color:#134e4a;">{{ $agencyName }}</strong> on Insurons.</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;margin:0 0 24px;">
    <tr>
        <td style="padding:20px 24px;">
            <p style="margin:0 0 12px;color:#134e4a;font-size:14px;font-weight:700;">Your Login Credentials</p>
            <table cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;width:100px;">Email:</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:600;">{{ $email }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Password:</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:600;font-family:monospace;background:#e0f2fe;padding:4px 8px;border-radius:4px;">{{ $temporaryPassword }}</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<p style="margin:0 0 24px;color:#ef4444;font-size:13px;text-align:center;font-weight:600;">Please change your password after your first login.</p>

@include('emails.partials.button', ['url' => $loginUrl, 'text' => 'Log In Now'])
@endsection
