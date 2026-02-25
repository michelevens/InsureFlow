@extends('emails.layout')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border-radius:50%;line-height:72px;font-size:36px;">&#9997;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">Your Application Is Ready to Sign</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Hi <strong>{{ $consumerName }}</strong>, your agent <strong>{{ $agentName }}</strong> has prepared your <strong>{{ $carrierName }}</strong> insurance application for your signature.</p>

<div style="text-align:center;margin-bottom:24px;">
    @include('emails.partials.button', ['url' => $signUrl, 'text' => 'Review & Sign Application'])
</div>

<p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;line-height:1.5;">By signing, you authorize the submission of this application to the carrier for underwriting.</p>
@endsection
