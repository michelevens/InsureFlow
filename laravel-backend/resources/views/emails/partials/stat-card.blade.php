{{-- Reusable stat card partial. Usage: @include('emails.partials.stat-card', ['label' => '...', 'value' => '...']) --}}
<table cellpadding="0" cellspacing="0" style="display:inline-block;vertical-align:top;margin:4px;">
    <tr>
        <td style="background-color:#f1f5f9;border-radius:12px;padding:16px 24px;text-align:center;">
            <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">{{ $label }}</p>
            <p style="margin:0;color:#014d40;font-size:24px;font-weight:800;">{{ $value }}</p>
        </td>
    </tr>
</table>
