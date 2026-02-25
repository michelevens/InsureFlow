@extends('emails.layout')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border-radius:50%;line-height:72px;font-size:36px;">&#128196;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">You've Received an Insurance Quote</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Hi <strong>{{ $consumerName }}</strong>, <strong>{{ $agentName }}</strong> from <strong>{{ $agencyName }}</strong> has prepared a personalized insurance quote for you.</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border:1px solid #99f6e4;border-radius:14px;margin-bottom:24px;">
    <tr>
        <td style="padding:16px;text-align:center;">
            <p style="color:#0d9488;font-size:14px;font-weight:600;margin:0;">{{ $scenarioName }}</p>
        </td>
    </tr>
</table>

<div style="text-align:center;margin-bottom:24px;">
    @include('emails.partials.button', ['url' => $viewUrl, 'text' => 'View Your Quote'])
</div>

<p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;line-height:1.5;">Review the coverage details and accept or decline the quote at your convenience.</p>
@endsection
