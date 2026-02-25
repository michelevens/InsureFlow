@extends('emails.layout')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border-radius:50%;line-height:72px;font-size:36px;">&#9993;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">Verify Your Email</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Hi {{ $user->name }}, click the button below to verify your email address.</p>

<div style="text-align:center;margin-bottom:24px;">
    @include('emails.partials.button', ['url' => $verificationUrl, 'text' => 'Verify Email Address'])
</div>

<p style="margin:0 0 8px;color:#94a3b8;font-size:13px;text-align:center;line-height:1.5;">This link expires in 24 hours.</p>
<p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;line-height:1.5;">If you didn't create an account, you can safely ignore this email.</p>
@endsection
