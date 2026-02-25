@extends('emails.layout')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border-radius:50%;line-height:72px;font-size:36px;">&#128340;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">Registration Received</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Hi {{ $user->name }}, we've received your registration as a {{ str_replace('_', ' ', $user->role) }}. Our team is reviewing your account and you'll hear back within 1-2 business days.</p>

<p style="margin:0 0 24px;color:#475569;font-size:15px;text-align:center;line-height:1.6;">In the meantime, you can explore the public areas of Insurons.</p>

@include('emails.partials.button', ['url' => env('FRONTEND_URL', 'https://insurons.com'), 'text' => 'Explore Insurons'])
@endsection
