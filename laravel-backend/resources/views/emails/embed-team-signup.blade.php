@extends('emails.layout')

@section('accent_gradient', 'linear-gradient(90deg,#2563eb,#3b82f6,#60a5fa)')
@endsection

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:50%;line-height:72px;font-size:36px;">&#128101;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">New Agent Application!</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Someone applied to join <strong>{{ $agency->name }}</strong> through your website widget.</p>

<!-- Applicant card -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #93c5fd;border-radius:14px;margin-bottom:20px;">
    <tr>
        <td style="padding:20px;">
            <p style="margin:0 0 12px;color:#2563eb;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Applicant Details</p>
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Name</td>
                    <td style="padding:4px 0;color:#1e3a5f;font-size:14px;font-weight:700;text-align:right;">{{ $agent->name }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Email</td>
                    <td style="padding:4px 0;color:#1e3a5f;font-size:14px;font-weight:600;text-align:right;">{{ $agent->email }}</td>
                </tr>
                @if($agent->phone)
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Phone</td>
                    <td style="padding:4px 0;color:#1e3a5f;font-size:14px;font-weight:600;text-align:right;">{{ $agent->phone }}</td>
                </tr>
                @endif
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Source</td>
                    <td style="padding:4px 0;color:#1e3a5f;font-size:14px;font-weight:600;text-align:right;">{{ $sourceDomain }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Status</td>
                    <td style="padding:4px 0;text-align:right;">
                        <span style="display:inline-block;padding:2px 10px;background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;border-radius:12px;">Pending Approval</span>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<p style="margin:0 0 24px;color:#475569;font-size:15px;text-align:center;line-height:1.6;">Log in to your dashboard to review and <strong>activate</strong> this agent's account.</p>

@include('emails.partials.button', ['url' => env('FRONTEND_URL', 'https://insurons.com') . '/admin/users', 'text' => 'Review Applications'])
@endsection
