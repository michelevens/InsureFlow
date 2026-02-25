@extends('emails.layout')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border-radius:50%;line-height:72px;font-size:36px;">&#127881;</div>
@endsection

@section('content')
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

@include('emails.partials.button', ['url' => env('FRONTEND_URL', 'https://insurons.com') . '/dashboard', 'text' => 'Go to Dashboard'])
@endsection
