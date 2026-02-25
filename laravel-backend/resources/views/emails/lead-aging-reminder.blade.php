@extends('emails.layout')

@section('accent_gradient', 'linear-gradient(90deg,#fbbf24,#f59e0b,#d97706)')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:50%;line-height:72px;font-size:36px;">&#9200;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">Follow-Up Needed</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Hi {{ $agentName }}, a lead assigned to you is waiting for contact.</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #fde68a;border-radius:14px;margin-bottom:24px;">
    <tr>
        <td style="padding:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Lead</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:700;text-align:right;">{{ $leadName }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Email</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:600;text-align:right;">{{ $leadEmail }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Type</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:600;text-align:right;">{{ $insuranceType }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Waiting</td>
                    <td style="padding:4px 0;color:#d97706;font-size:14px;font-weight:700;text-align:right;">{{ $hoursOld }} hours</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<p style="margin:0 0 24px;color:#475569;font-size:15px;text-align:center;line-height:1.6;">Leads contacted within 24 hours convert <strong>3x better</strong>. Reach out now!</p>

<table cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
        <td style="background-color:#d97706;border-radius:14px;">
            <a href="{{ env('FRONTEND_URL', 'https://insurons.com') }}/crm/leads" style="display:inline-block;padding:14px 36px;min-height:48px;line-height:20px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;text-align:center;box-sizing:border-box;">Contact Lead Now</a>
        </td>
    </tr>
</table>
@endsection
