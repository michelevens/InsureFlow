@extends('emails.layout')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border-radius:50%;line-height:72px;font-size:36px;">&#128274;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">Reset Your Password</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Hi {{ $user->name }}, we received a request to reset your password.</p>

<div style="text-align:center;margin-bottom:24px;">
    @include('emails.partials.button', ['url' => $resetUrl, 'text' => 'Reset Password'])
</div>

<p style="margin:0 0 8px;color:#94a3b8;font-size:13px;text-align:center;line-height:1.5;">This link expires in 60 minutes.</p>
<p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;line-height:1.5;">If you didn't request this, you can safely ignore this email.</p>
@endsection
