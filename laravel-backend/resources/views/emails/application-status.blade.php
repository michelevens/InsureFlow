@extends('emails.layout')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border-radius:50%;line-height:72px;font-size:36px;">&#128203;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">Application Update</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Hi {{ $user->name }}, here's an update on your insurance application.</p>

<!-- Info Card -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border:1px solid #99f6e4;border-radius:14px;margin-bottom:24px;">
    <tr>
        <td style="padding:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Application</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:700;text-align:right;">#{{ $applicationId }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Type</td>
                    <td style="padding:4px 0;color:#134e4a;font-size:14px;font-weight:600;text-align:right;">{{ $insuranceType }}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;color:#64748b;font-size:14px;">Status</td>
                    <td style="padding:4px 0;font-size:14px;font-weight:700;text-align:right;
                        @if($status === 'approved') color:#059669;
                        @elseif($status === 'declined') color:#dc2626;
                        @else color:#0f766e;
                        @endif
                    ">{{ ucfirst(str_replace('_', ' ', $status)) }}</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

@if($status === 'submitted')
<p style="margin:0 0 24px;color:#475569;font-size:15px;text-align:center;line-height:1.6;">Your application has been submitted and is being reviewed.</p>
@elseif($status === 'under_review')
<p style="margin:0 0 24px;color:#475569;font-size:15px;text-align:center;line-height:1.6;">Your application is currently under review by the carrier.</p>
@elseif($status === 'approved')
<p style="margin:0 0 24px;color:#059669;font-size:15px;text-align:center;line-height:1.6;font-weight:600;">Congratulations! Your application has been approved.</p>
@elseif($status === 'declined')
<p style="margin:0 0 24px;color:#dc2626;font-size:15px;text-align:center;line-height:1.6;">Unfortunately, your application was not approved at this time.</p>
@endif

@include('emails.partials.button', ['url' => env('FRONTEND_URL', 'https://insurons.com') . '/portal/applications', 'text' => 'View Application'])
@endsection
