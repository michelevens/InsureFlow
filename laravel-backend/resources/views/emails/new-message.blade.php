@extends('emails.layout')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border-radius:50%;line-height:72px;font-size:36px;">&#128172;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">New Message</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;"><strong>{{ $senderName }}</strong> sent you a message:</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;margin-bottom:24px;">
    <tr>
        <td style="padding:16px 20px;">
            <p style="color:#475569;font-size:14px;line-height:1.5;margin:0;font-style:italic;">"{{ $messagePreview }}{{ strlen($messagePreview) >= 100 ? '...' : '' }}"</p>
        </td>
    </tr>
</table>

@include('emails.partials.button', ['url' => $conversationUrl, 'text' => 'View Conversation'])
@endsection
