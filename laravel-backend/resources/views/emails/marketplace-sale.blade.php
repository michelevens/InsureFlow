@extends('emails.layout')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f0fdf4,#bbf7d0);border-radius:50%;line-height:72px;font-size:36px;">&#128176;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">Your Lead Has Been Sold!</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Hi {{ $sellerName }}, great news! A lead you listed on the marketplace has been purchased.</p>

<!-- Sale Details -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border:1px solid #99f6e4;border-radius:14px;margin-bottom:24px;">
    <tr>
        <td style="padding:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Insurance Type</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:700;text-align:right;">{{ $insuranceType }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">State</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:600;text-align:right;">{{ $state }}</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<!-- Earnings Breakdown -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;margin-bottom:24px;">
    <tr>
        <td style="padding:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding:6px 0;color:#64748b;font-size:14px;">Sale Price</td>
                    <td style="padding:6px 0;color:#134e4a;font-size:14px;font-weight:600;text-align:right;">${{ $salePrice }}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0;color:#64748b;font-size:14px;">Platform Fee (15%)</td>
                    <td style="padding:6px 0;color:#dc2626;font-size:14px;font-weight:600;text-align:right;">-${{ $platformFee }}</td>
                </tr>
                <tr>
                    <td style="padding:8px 0 0;color:#134e4a;font-size:16px;font-weight:700;border-top:2px solid #bbf7d0;">Net Earnings</td>
                    <td style="padding:8px 0 0;color:#16a34a;font-size:20px;font-weight:800;text-align:right;border-top:2px solid #bbf7d0;">${{ $netEarnings }}</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<p style="margin:0 0 24px;color:#475569;font-size:15px;text-align:center;line-height:1.6;">View your transaction history and earnings on the Lead Marketplace dashboard.</p>

@include('emails.partials.button', ['url' => env('FRONTEND_URL', 'https://insurons.com') . '/lead-marketplace', 'text' => 'View Marketplace Dashboard'])
@endsection
