@extends('emails.layout')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border-radius:50%;line-height:72px;font-size:36px;">&#9997;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">Signature Requested</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Hi <strong>{{ $signerName }}</strong>, <strong>{{ $requesterName }}</strong> has requested your signature on an insurance document.</p>

@if($message)
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-left:3px solid #0d9488;border-radius:0 12px 12px 0;margin-bottom:24px;">
    <tr>
        <td style="padding:16px 20px;">
            <p style="color:#475569;font-size:14px;line-height:1.5;margin:0;font-style:italic;">"{{ $message }}"</p>
        </td>
    </tr>
</table>
@endif

<div style="text-align:center;margin-bottom:24px;">
    @include('emails.partials.button', ['url' => $signUrl, 'text' => 'Review & Sign'])
</div>

<p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;line-height:1.5;">By signing, you confirm that you have reviewed the document and agree to its terms.</p>
@endsection
