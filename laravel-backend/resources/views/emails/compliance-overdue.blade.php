@extends('emails.layout')

@section('accent_gradient', 'linear-gradient(90deg,#dc2626,#ef4444,#f87171)')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#fef2f2,#fecaca);border-radius:50%;line-height:72px;font-size:36px;">&#9888;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">Compliance Items Overdue</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Hi {{ $userName }}, you have <strong style="color:#dc2626;">{{ count($overdueItems) }} overdue compliance item(s)</strong> that require your immediate attention.</p>

<!-- Overdue Items Table -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fef2f2,#fee2e2);border:1px solid #fecaca;border-radius:14px;margin-bottom:24px;">
    <tr>
        <td style="padding:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding:6px 0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #fecaca;">Item</td>
                    <td style="padding:6px 0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:center;border-bottom:1px solid #fecaca;">Category</td>
                    <td style="padding:6px 0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:right;border-bottom:1px solid #fecaca;">Due Date</td>
                </tr>
                @foreach($overdueItems as $item)
                <tr>
                    <td style="padding:8px 0;color:#134e4a;font-size:14px;font-weight:600;border-bottom:1px solid rgba(254,202,202,0.5);">{{ $item['name'] }}</td>
                    <td style="padding:8px 0;color:#64748b;font-size:13px;text-align:center;border-bottom:1px solid rgba(254,202,202,0.5);">{{ $item['category'] }}</td>
                    <td style="padding:8px 0;color:#dc2626;font-size:13px;font-weight:700;text-align:right;border-bottom:1px solid rgba(254,202,202,0.5);">{{ $item['due_date'] }}</td>
                </tr>
                @endforeach
            </table>
        </td>
    </tr>
</table>

<p style="margin:0 0 24px;color:#475569;font-size:15px;text-align:center;line-height:1.6;">Keeping your compliance items current protects your license and reputation. Please address these items as soon as possible.</p>

<table cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
        <td style="background-color:#dc2626;border-radius:14px;">
            <a href="{{ env('FRONTEND_URL', 'https://insurons.com') }}/compliance" style="display:inline-block;padding:14px 36px;min-height:48px;line-height:20px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;text-align:center;box-sizing:border-box;">Review Compliance Items</a>
        </td>
    </tr>
</table>
@endsection
