@extends('emails.layout')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border-radius:50%;line-height:72px;font-size:36px;">&#128196;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">Your Quotes Are Ready!</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Hi {{ $firstName }}, we found {{ $quoteCount }} quotes for you.</p>

<!-- Info Card -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border:1px solid #99f6e4;border-radius:14px;margin-bottom:24px;">
    <tr>
        <td style="padding:24px;text-align:center;">
            <p style="margin:0 0 4px;color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Starting from</p>
            <p style="margin:0;color:#0f766e;font-size:32px;font-weight:800;">${{ $lowestPremium }}<span style="font-size:16px;font-weight:600;color:#64748b;">/month</span></p>
        </td>
    </tr>
</table>

<div style="text-align:center;margin-bottom:24px;">
    @include('emails.partials.button', ['url' => env('FRONTEND_URL', 'https://insurons.com') . '/calculator', 'text' => 'View Your Quotes'])
</div>

<p style="margin:0 0 16px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Create a free account to save your quotes and track applications.</p>

<!-- Secondary CTA -->
<table cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
        <td style="border:2px solid #14b8a6;border-radius:14px;">
            <a href="{{ env('FRONTEND_URL', 'https://insurons.com') }}/register" style="display:inline-block;padding:12px 28px;color:#0f766e;text-decoration:none;font-size:14px;font-weight:600;">Create Free Account</a>
        </td>
    </tr>
</table>
@endsection
