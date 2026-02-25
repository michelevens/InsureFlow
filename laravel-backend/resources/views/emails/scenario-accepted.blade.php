@extends('emails.layout')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f0fdf4,#bbf7d0);border-radius:50%;line-height:72px;font-size:36px;">&#9989;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">Quote Accepted!</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Hi <strong>{{ $agentName }}</strong>, great news! <strong>{{ $consumerName }}</strong> has accepted your quote: <strong>{{ $scenarioName }}</strong>.</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;margin-bottom:24px;">
    <tr>
        <td style="padding:16px;text-align:center;">
            <p style="color:#16a34a;font-size:14px;font-weight:600;margin:0;">Next step: Prepare the application for signing.</p>
        </td>
    </tr>
</table>

<p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;line-height:1.5;">Log in to your Insurons dashboard to create and send the application.</p>
@endsection
