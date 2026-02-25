{{-- Reusable status badge partial. Usage: @include('emails.partials.status-badge', ['status' => '...', 'color' => '#hex']) --}}
@php
    $badgeColor = $color ?? '#0d9488';
@endphp
<span style="display:inline-block;padding:4px 14px;background-color:{{ $badgeColor }};color:#ffffff;font-size:13px;font-weight:700;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;">{{ $status }}</span>
