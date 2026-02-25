@extends('emails.layout')

@section('accent_gradient', 'linear-gradient(90deg,#dc2626,#f59e0b,#0ea5e9)')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#fef2f2,#fecaca);border-radius:50%;line-height:72px;font-size:36px;">&#9888;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">Lead Escalation</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Hi {{ $ownerName }}, a lead has gone <strong>{{ $hoursOld }}+ hours</strong> without contact.</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fef2f2,#fee2e2);border:1px solid #fecaca;border-radius:14px;margin-bottom:24px;">
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
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Assigned To</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:600;text-align:right;">{{ $agentName }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Waiting</td>
                    <td style="padding:4px 0;color:#dc2626;font-size:14px;font-weight:700;text-align:right;">{{ $hoursOld }} hours</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<p style="margin:0 0 24px;color:#475569;font-size:15px;text-align:center;line-height:1.6;">This lead has exceeded the 48-hour SLA. Consider reassigning or contacting the lead directly.</p>

<table cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
        <td style="background-color:#dc2626;border-radius:14px;">
            <a href="{{ env('FRONTEND_URL', 'https://insurons.com') }}/crm/leads" style="display:inline-block;padding:14px 36px;min-height:48px;line-height:20px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;text-align:center;box-sizing:border-box;">Review Lead</a>
        </td>
    </tr>
</table>
@endsection
