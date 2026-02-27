@extends('emails.layout')

@section('accent_gradient', 'linear-gradient(90deg,#16a34a,#22c55e,#4ade80)')
@endsection

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:50%;line-height:72px;font-size:36px;">&#127881;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">New Lead Captured!</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">A visitor on your widget just shared their contact information. Here are the details:</p>

<!-- Contact card -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #86efac;border-radius:14px;margin-bottom:20px;">
    <tr>
        <td style="padding:20px;">
            <p style="margin:0 0 12px;color:#16a34a;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Contact Information</p>
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Name</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:700;text-align:right;">{{ $contactName }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Email</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:600;text-align:right;">{{ $contactEmail }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Phone</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:600;text-align:right;">{{ $contactPhone }}</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<!-- Quote details card -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border:1px solid #99f6e4;border-radius:14px;margin-bottom:24px;">
    <tr>
        <td style="padding:20px;">
            <p style="margin:0 0 12px;color:#0f766e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Quote Details</p>
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Insurance Type</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:600;text-align:right;">{{ $insuranceType }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">ZIP Code</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:600;text-align:right;">{{ $zipCode }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Coverage Level</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:600;text-align:right;">{{ $coverageLevel }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Source</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:600;text-align:right;">{{ $sourceDomain }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Partner</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:700;text-align:right;">{{ $partner->name }}</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<p style="margin:0 0 24px;color:#475569;font-size:15px;text-align:center;line-height:1.6;"><strong>Act fast!</strong> Leads contacted within 5 minutes have a 21x higher conversion rate.</p>

@include('emails.partials.button', ['url' => env('FRONTEND_URL', 'https://insurons.com') . '/embed', 'text' => 'View in Dashboard'])
@endsection
