{{-- Reusable CTA button partial. Usage: @include('emails.partials.button', ['url' => '...', 'text' => '...']) --}}
<table cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
        <td style="background-color:#014d40;border-radius:14px;">
            <a href="{{ $url }}" style="display:inline-block;padding:14px 36px;min-height:48px;line-height:20px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;text-align:center;box-sizing:border-box;">{{ $text }}</a>
        </td>
    </tr>
</table>
