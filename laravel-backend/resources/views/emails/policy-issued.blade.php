@extends('emails.layout')

@section('icon')
<div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f0fdf4,#bbf7d0);border-radius:50%;line-height:72px;font-size:36px;">&#127881;</div>
@endsection

@section('content')
<h1 style="margin:0 0 8px;color:#134e4a;font-size:24px;font-weight:700;text-align:center;">Your Policy Has Been Issued</h1>
<p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.5;">Hi <strong>{{ $consumerName }}</strong>, congratulations! Your <strong>{{ $insuranceType }}</strong> policy with <strong>{{ $carrierName }}</strong> has been issued.</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;margin-bottom:24px;">
    <tr>
        <td style="padding:16px;text-align:center;">
            <p style="color:#64748b;font-size:13px;margin:0 0 4px;">Policy Number</p>
            <p style="color:#16a34a;font-size:18px;font-weight:700;margin:0;">{{ $policyNumber }}</p>
        </td>
    </tr>
</table>

<p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;line-height:1.5;">You can view your policy details and documents in your Insurons account.</p>
@endsection
