@extends('emails.layout')

@section('accent_gradient', 'linear-gradient(90deg,#2563eb,#1e40af,#7c3aed)')

@section('icon')
<div style="display:inline-block;width:80px;height:80px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:50%;line-height:80px;font-size:40px;">&#127942;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#1e3a5f;font-size:26px;font-weight:800;text-align:center;letter-spacing:-0.5px;">
    You're Invited to Join Insurons
</h1>
<p style="margin:0 0 28px;color:#64748b;font-size:15px;text-align:center;line-height:1.6;">
    The next-generation insurance marketplace trusted by agencies nationwide
</p>

{{-- Personal greeting --}}
<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
    Hi {{ $contactName }},
</p>

@if($customMessage)
<div style="background:#f8fafc;border-left:4px solid #2563eb;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 24px;">
    <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;font-style:italic;">
        "{{ $customMessage }}"
    </p>
    <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">— Insurons Team</p>
</div>
@endif

<p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
    We'd love to welcome <strong style="color:#1e40af;">{{ $agencyName }}</strong> to the Insurons marketplace.
    Here's what joining means for your agency:
</p>

{{-- Benefits Grid --}}
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
    <tr>
        <td width="50%" style="padding:0 8px 12px 0;vertical-align:top;">
            <div style="background:linear-gradient(135deg,#eff6ff,#f8fafc);border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
                <div style="font-size:28px;margin-bottom:8px;">&#127758;</div>
                <p style="margin:0 0 4px;color:#1e3a5f;font-size:14px;font-weight:700;">Expand Your Reach</p>
                <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">Access thousands of active insurance shoppers looking for coverage right now.</p>
            </div>
        </td>
        <td width="50%" style="padding:0 0 12px 8px;vertical-align:top;">
            <div style="background:linear-gradient(135deg,#f0fdf4,#f8fafc);border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
                <div style="font-size:28px;margin-bottom:8px;">&#9889;</div>
                <p style="margin:0 0 4px;color:#1e3a5f;font-size:14px;font-weight:700;">Powerful Tools</p>
                <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">CRM, lead management, team collaboration, and analytics — all in one platform.</p>
            </div>
        </td>
    </tr>
    <tr>
        <td width="50%" style="padding:0 8px 0 0;vertical-align:top;">
            <div style="background:linear-gradient(135deg,#fefce8,#f8fafc);border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
                <div style="font-size:28px;margin-bottom:8px;">&#128176;</div>
                <p style="margin:0 0 4px;color:#1e3a5f;font-size:14px;font-weight:700;">Competitive Marketplace</p>
                <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">Bid on qualified leads in real-time. Pay only for leads that match your products.</p>
            </div>
        </td>
        <td width="50%" style="padding:0 0 0 8px;vertical-align:top;">
            <div style="background:linear-gradient(135deg,#fdf4ff,#f8fafc);border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
                <div style="font-size:28px;margin-bottom:8px;">&#128200;</div>
                <p style="margin:0 0 4px;color:#1e3a5f;font-size:14px;font-weight:700;">Analytics & Insights</p>
                <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">Track performance, optimize conversions, and grow your book of business.</p>
            </div>
        </td>
    </tr>
</table>

{{-- Social Proof --}}
<div style="text-align:center;margin:0 0 32px;padding:20px;background:#f8fafc;border-radius:12px;">
    <p style="margin:0 0 4px;color:#1e40af;font-size:22px;font-weight:800;">20+</p>
    <p style="margin:0;color:#64748b;font-size:13px;">agencies already growing with Insurons</p>
</div>

{{-- CTA --}}
<div style="text-align:center;margin-bottom:24px;">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#1e40af);border-radius:14px;box-shadow:0 4px 14px rgba(37,99,235,0.3);">
                <a href="{{ $acceptUrl }}" style="display:inline-block;padding:16px 48px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;letter-spacing:0.3px;">Accept Invitation & Get Started</a>
            </td>
        </tr>
    </table>
</div>

<p style="margin:0 0 8px;color:#94a3b8;font-size:13px;text-align:center;">
    This invitation expires on {{ $expiresAt }}.
</p>
<p style="margin:0;color:#cbd5e1;font-size:12px;text-align:center;">
    Questions? Contact us at <a href="mailto:support@insurons.com" style="color:#2563eb;text-decoration:none;">support@insurons.com</a>
</p>

{{-- Tracking pixel --}}
<img src="{{ $pixelUrl }}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />
@endsection
