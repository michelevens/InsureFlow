@extends('emails.layout')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border-radius:50%;line-height:72px;font-size:36px;">&#9989;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">Request Received!</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Hi {{ $firstName }}, thank you for your insurance inquiry.</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border:1px solid #99f6e4;border-radius:14px;margin-bottom:24px;">
    <tr>
        <td style="padding:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Insurance Type</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:700;text-align:right;">{{ $insuranceType }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Agency</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:600;text-align:right;">{{ $agencyName }}</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<p style="margin:0 0 8px;color:#475569;font-size:15px;text-align:center;line-height:1.6;">A licensed agent from <strong>{{ $agencyName }}</strong> will review your request and reach out to you shortly.</p>
<p style="margin:16px 0 24px;color:#475569;font-size:14px;text-align:center;line-height:1.6;">In the meantime, you can compare instant quotes from multiple carriers on our platform.</p>

@include('emails.partials.button', ['url' => env('FRONTEND_URL', 'https://insurons.com') . '/calculator', 'text' => 'Compare Quotes Now'])
@endsection
