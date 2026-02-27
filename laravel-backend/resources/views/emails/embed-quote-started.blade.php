@extends('emails.layout')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:50%;line-height:72px;font-size:36px;">&#128200;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">New Quote Started</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">A visitor on your website just started an insurance quote through your Insurons widget.</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border:1px solid #99f6e4;border-radius:14px;margin-bottom:24px;">
    <tr>
        <td style="padding:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Partner</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:700;text-align:right;">{{ $partner->name }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Insurance Type</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:600;text-align:right;">{{ ucfirst($insuranceType) }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Source</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:600;text-align:right;">{{ $sourceDomain }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Session</td>
                    <td style="padding:4px 0;color:#94a3b8;font-size:12px;font-weight:500;text-align:right;">{{ substr($sessionToken, 0, 12) }}...</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<p style="margin:0 0 24px;color:#475569;font-size:15px;text-align:center;line-height:1.6;">The visitor is actively comparing quotes. You'll receive another notification if they share their contact information.</p>

@include('emails.partials.button', ['url' => env('FRONTEND_URL', 'https://insurons.com') . '/embed', 'text' => 'View Partner Dashboard'])
@endsection
