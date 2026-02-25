<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
    @page {
        margin: 140px 50px 100px 50px;
    }

    body {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        color: #1e293b;
        font-size: 11pt;
        line-height: 1.5;
    }

    /* ── Fixed Header (every page) ───────────────── */
    .page-header {
        position: fixed;
        top: -120px;
        left: 0;
        right: 0;
        height: 100px;
    }

    .header-bar {
        width: 100%;
        border-collapse: collapse;
    }

    .header-bar td {
        padding: 20px 30px;
        background-color: #0f766e;
        color: #ffffff;
        vertical-align: middle;
    }

    .header-agency-name {
        font-size: 18pt;
        font-weight: bold;
        letter-spacing: 0.5px;
    }

    .header-agency-sub {
        font-size: 8pt;
        color: #99f6e4;
        margin-top: 4px;
    }

    .header-right {
        text-align: right;
        font-size: 8.5pt;
        color: #ccfbf1;
        line-height: 1.6;
    }

    .header-accent-bar {
        width: 100%;
        height: 4px;
        background-color: #14b8a6;
    }

    /* ── Fixed Footer (every page) ───────────────── */
    .page-footer {
        position: fixed;
        bottom: -80px;
        left: 0;
        right: 0;
        height: 60px;
    }

    .footer-bar {
        width: 100%;
        border-collapse: collapse;
        border-top: 1px solid #e2e8f0;
    }

    .footer-bar td {
        padding: 12px 0;
        font-size: 7.5pt;
        color: #94a3b8;
        vertical-align: middle;
    }

    .footer-left {
        text-align: left;
    }

    .footer-center {
        text-align: center;
    }

    .footer-right {
        text-align: right;
    }

    .footer-brand {
        color: #0f766e;
        font-weight: bold;
    }

    /* ── Cover Section ───────────────────────────── */
    .cover-box {
        margin: 60px 0 40px 0;
        text-align: center;
    }

    .cover-title {
        font-size: 28pt;
        font-weight: bold;
        color: #0f766e;
        margin-bottom: 6px;
        letter-spacing: -0.5px;
    }

    .cover-subtitle {
        font-size: 14pt;
        color: #64748b;
        margin-bottom: 30px;
    }

    .cover-meta-table {
        width: 70%;
        margin: 0 auto;
        border-collapse: collapse;
    }

    .cover-meta-table td {
        padding: 8px 16px;
        font-size: 10pt;
    }

    .cover-meta-label {
        color: #94a3b8;
        text-align: right;
        width: 40%;
        font-weight: 600;
    }

    .cover-meta-value {
        color: #1e293b;
        text-align: left;
        font-weight: 500;
    }

    .divider {
        border: none;
        border-top: 2px solid #e2e8f0;
        margin: 30px 0;
    }

    .divider-accent {
        border: none;
        border-top: 2px solid #14b8a6;
        margin: 30px 0;
    }

    /* ── Section Titles ──────────────────────────── */
    .section-title {
        font-size: 14pt;
        font-weight: bold;
        color: #0f766e;
        margin: 30px 0 12px 0;
        padding-bottom: 6px;
        border-bottom: 2px solid #14b8a6;
    }

    .section-subtitle {
        font-size: 9pt;
        color: #64748b;
        margin: -8px 0 14px 0;
    }

    /* ── Stat Cards (Executive Summary) ──────────── */
    .stats-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 10px 0;
        margin: 0 0 20px 0;
    }

    .stat-card {
        padding: 16px 20px;
        text-align: center;
        border-radius: 8px;
        width: 33%;
        vertical-align: top;
    }

    .stat-card-current {
        background-color: #fef3c7;
        border: 1px solid #fcd34d;
    }

    .stat-card-best {
        background-color: #d1fae5;
        border: 1px solid #6ee7b7;
    }

    .stat-card-savings {
        background-color: #dbeafe;
        border: 1px solid #93c5fd;
    }

    .stat-label {
        font-size: 8pt;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
    }

    .stat-value {
        font-size: 22pt;
        font-weight: bold;
        color: #0f172a;
        margin: 4px 0 2px 0;
    }

    .stat-sub {
        font-size: 8pt;
        color: #94a3b8;
    }

    /* ── Data Tables ─────────────────────────────── */
    .data-table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0 20px 0;
        font-size: 9pt;
    }

    .data-table th {
        background-color: #0f766e;
        color: #ffffff;
        padding: 10px 12px;
        text-align: left;
        font-weight: 600;
        font-size: 8pt;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .data-table th:first-child {
        border-radius: 6px 0 0 0;
    }

    .data-table th:last-child {
        border-radius: 0 6px 0 0;
    }

    .data-table td {
        padding: 9px 12px;
        border-bottom: 1px solid #e2e8f0;
        vertical-align: top;
    }

    .data-table tr:nth-child(even) td {
        background-color: #f8fafc;
    }

    .data-table tr:last-child td {
        border-bottom: 2px solid #0f766e;
    }

    /* ── Carrier Comparison ───────────────────────── */
    .comparison-table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0 20px 0;
        font-size: 9pt;
    }

    .comparison-table th {
        background-color: #0f766e;
        color: #ffffff;
        padding: 10px 12px;
        text-align: center;
        font-weight: 600;
        font-size: 8pt;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .comparison-table th:first-child {
        text-align: left;
        border-radius: 6px 0 0 0;
    }

    .comparison-table th:last-child {
        border-radius: 0 6px 0 0;
    }

    .comparison-table td {
        padding: 8px 12px;
        border-bottom: 1px solid #e2e8f0;
        text-align: center;
        vertical-align: top;
    }

    .comparison-table td:first-child {
        text-align: left;
        font-weight: 600;
        color: #475569;
        background-color: #f8fafc;
    }

    .comparison-table tr:last-child td {
        border-bottom: 2px solid #0f766e;
    }

    .recommended-col {
        background-color: #f0fdfa !important;
        border-left: 2px solid #14b8a6;
        border-right: 2px solid #14b8a6;
    }

    .recommended-header {
        background-color: #14b8a6 !important;
    }

    .badge-recommended {
        display: inline-block;
        padding: 2px 8px;
        font-size: 7pt;
        font-weight: bold;
        color: #ffffff;
        background-color: #14b8a6;
        border-radius: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .badge-declined {
        display: inline-block;
        padding: 2px 8px;
        font-size: 7pt;
        font-weight: bold;
        color: #ffffff;
        background-color: #ef4444;
        border-radius: 10px;
    }

    .badge-pending {
        display: inline-block;
        padding: 2px 8px;
        font-size: 7pt;
        font-weight: bold;
        color: #ffffff;
        background-color: #f59e0b;
        border-radius: 10px;
    }

    .premium-highlight {
        font-size: 13pt;
        font-weight: bold;
        color: #0f766e;
    }

    /* ── Recommended Card ────────────────────────── */
    .recommended-box {
        border: 2px solid #14b8a6;
        border-radius: 8px;
        padding: 20px 24px;
        margin: 20px 0;
        background-color: #f0fdfa;
    }

    .recommended-title {
        font-size: 12pt;
        font-weight: bold;
        color: #0f766e;
        margin-bottom: 10px;
    }

    .recommended-detail {
        font-size: 9pt;
        color: #475569;
        line-height: 1.6;
    }

    .tag-list {
        margin: 4px 0;
    }

    .tag {
        display: inline-block;
        padding: 2px 8px;
        font-size: 7.5pt;
        background-color: #e0f2fe;
        color: #0369a1;
        border-radius: 4px;
        margin: 2px 2px 2px 0;
    }

    .tag-green {
        background-color: #dcfce7;
        color: #166534;
    }

    .tag-amber {
        background-color: #fef3c7;
        color: #92400e;
    }

    /* ── Disclaimers ─────────────────────────────── */
    .disclaimers {
        margin-top: 30px;
        padding: 16px 20px;
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 7.5pt;
        color: #94a3b8;
        line-height: 1.6;
    }

    .disclaimers p {
        margin: 4px 0;
    }

    .text-muted { color: #94a3b8; }
    .text-sm { font-size: 9pt; }
    .text-xs { font-size: 8pt; }
    .text-bold { font-weight: bold; }
    .text-teal { color: #0f766e; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .mt-10 { margin-top: 10px; }
    .mb-10 { margin-bottom: 10px; }
</style>
</head>
<body>

{{-- ══════════════════════════════════════════════ --}}
{{-- FIXED HEADER (repeats on every page)          --}}
{{-- ══════════════════════════════════════════════ --}}
<div class="page-header">
    <table class="header-bar">
        <tr>
            <td style="width: 60%;">
                <div class="header-agency-name">{{ $agency['name'] ?? 'Insurance Agency' }}</div>
                @if(!empty($agency['website']))
                    <div class="header-agency-sub">{{ $agency['website'] }}</div>
                @endif
            </td>
            <td class="header-right">
                @if(!empty($agency['phone'])){{ $agency['phone'] }}<br>@endif
                @if(!empty($agency['email'])){{ $agency['email'] }}<br>@endif
                @if(!empty($agency['address']))
                    {{ $agency['address'] }}@if(!empty($agency['city'])), {{ $agency['city'] }}@endif
                    @if(!empty($agency['state'])) {{ $agency['state'] }}@endif
                    @if(!empty($agency['zip_code'])) {{ $agency['zip_code'] }}@endif
                @endif
            </td>
        </tr>
    </table>
    <div class="header-accent-bar"></div>
</div>

{{-- ══════════════════════════════════════════════ --}}
{{-- FIXED FOOTER (repeats on every page)          --}}
{{-- ══════════════════════════════════════════════ --}}
<div class="page-footer">
    <table class="footer-bar">
        <tr>
            <td class="footer-left" style="width: 33%;">
                <span class="footer-brand">Powered by Insurons</span> &bull; insurons.com
            </td>
            <td class="footer-center" style="width: 34%;">
                Confidential &mdash; Prepared for {{ $client_name ?? 'Valued Client' }}
            </td>
            <td class="footer-right" style="width: 33%;">
                Page <script type="text/php">
                    if (isset($pdf)) {
                        $x = 510;
                        $y = 755;
                        $text = "{PAGE_NUM} of {PAGE_COUNT}";
                        $font = $fontMetrics->get_font("Helvetica", "normal");
                        $size = 7;
                        $pdf->page_text($x, $y, $text, $font, $size, array(0.58, 0.64, 0.70));
                    }
                </script>
            </td>
        </tr>
    </table>
</div>

{{-- ══════════════════════════════════════════════ --}}
{{-- COVER / TITLE AREA                            --}}
{{-- ══════════════════════════════════════════════ --}}
<div class="cover-box">
    <div class="cover-title">Insurance Proposal</div>
    <div class="cover-subtitle">{{ $scenario->scenario_name }}</div>

    <table class="cover-meta-table">
        <tr>
            <td class="cover-meta-label">Prepared For:</td>
            <td class="cover-meta-value">{{ $client_name ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td class="cover-meta-label">Prepared By:</td>
            <td class="cover-meta-value">{{ $agent_name ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td class="cover-meta-label">Product Type:</td>
            <td class="cover-meta-value">{{ ucwords(str_replace('_', ' ', $scenario->product_type)) }}</td>
        </tr>
        <tr>
            <td class="cover-meta-label">Date:</td>
            <td class="cover-meta-value">{{ now()->format('F j, Y') }}</td>
        </tr>
        @if($scenario->effective_date_desired)
        <tr>
            <td class="cover-meta-label">Effective Date:</td>
            <td class="cover-meta-value">{{ \Carbon\Carbon::parse($scenario->effective_date_desired)->format('F j, Y') }}</td>
        </tr>
        @endif
    </table>
</div>

<hr class="divider-accent">

{{-- ══════════════════════════════════════════════ --}}
{{-- EXECUTIVE SUMMARY                             --}}
{{-- ══════════════════════════════════════════════ --}}
<div class="section-title">Executive Summary</div>

@php
    $currentPremium = $scenario->current_premium_monthly;
    $bestPremium = $scenario->best_quoted_premium;
    $savings = ($currentPremium && $bestPremium) ? ($currentPremium - $bestPremium) : null;
@endphp

<table class="stats-table">
    <tr>
        <td class="stat-card stat-card-current">
            <div class="stat-label">Current Premium</div>
            <div class="stat-value">{{ $currentPremium ? '$' . number_format($currentPremium, 2) : 'N/A' }}</div>
            <div class="stat-sub">per month{{ $scenario->current_carrier ? ' &bull; ' . $scenario->current_carrier : '' }}</div>
        </td>
        <td class="stat-card stat-card-best">
            <div class="stat-label">Best Quoted Premium</div>
            <div class="stat-value">{{ $bestPremium ? '$' . number_format($bestPremium, 2) : 'N/A' }}</div>
            <div class="stat-sub">per month &bull; {{ $quotes->where('status', 'quoted')->count() }} quotes received</div>
        </td>
        <td class="stat-card stat-card-savings">
            <div class="stat-label">Potential Savings</div>
            <div class="stat-value">{{ $savings && $savings > 0 ? '$' . number_format($savings, 2) : ($savings !== null && $savings <= 0 ? '$0.00' : 'N/A') }}</div>
            <div class="stat-sub">per month{{ $savings && $savings > 0 ? ' &bull; $' . number_format($savings * 12, 2) . '/year' : '' }}</div>
        </td>
    </tr>
</table>

@if($scenario->risk_factors && count($scenario->risk_factors) > 0)
    <div class="text-xs text-muted mt-10">
        <strong>Risk Factors:</strong>
        @foreach($scenario->risk_factors as $rf)
            <span class="tag tag-amber">{{ $rf }}</span>
        @endforeach
    </div>
@endif

@if($scenario->notes)
    <div class="text-xs text-muted mt-10"><strong>Notes:</strong> {{ $scenario->notes }}</div>
@endif

{{-- ══════════════════════════════════════════════ --}}
{{-- INSURED OBJECTS                               --}}
{{-- ══════════════════════════════════════════════ --}}
@if($insuredObjects->count() > 0)
<div class="section-title">Insured Objects</div>
<div class="section-subtitle">Details of items, persons, and properties covered under this proposal</div>

<table class="data-table">
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Key Details</th>
            <th>Location / Info</th>
        </tr>
    </thead>
    <tbody>
    @foreach($insuredObjects as $obj)
        <tr>
            <td class="text-bold">{{ $obj->name }}</td>
            <td>{{ ucfirst($obj->object_type) }}</td>
            <td>
                @if($obj->object_type === 'person')
                    @if($obj->date_of_birth)DOB: {{ \Carbon\Carbon::parse($obj->date_of_birth)->format('m/d/Y') }}@endif
                    @if($obj->relationship) &bull; {{ $obj->relationship }}@endif
                    @if($obj->occupation)<br>Occupation: {{ $obj->occupation }}@endif
                @elseif($obj->object_type === 'vehicle')
                    {{ $obj->vehicle_year }} {{ $obj->vehicle_make }} {{ $obj->vehicle_model }}
                    @if($obj->vin)<br>VIN: {{ $obj->vin }}@endif
                @elseif($obj->object_type === 'property')
                    @if($obj->year_built)Built {{ $obj->year_built }}@endif
                    @if($obj->square_footage) &bull; {{ number_format($obj->square_footage) }} sq ft@endif
                    @if($obj->construction_type)<br>{{ $obj->construction_type }}@endif
                @elseif($obj->object_type === 'business')
                    @if($obj->naics_code)NAICS: {{ $obj->naics_code }}@endif
                    @if($obj->annual_revenue)<br>Revenue: ${{ number_format($obj->annual_revenue) }}@endif
                    @if($obj->employee_count) &bull; {{ $obj->employee_count }} employees@endif
                @endif
            </td>
            <td>
                @if($obj->address_line1)
                    {{ $obj->address_line1 }}
                    @if($obj->city), {{ $obj->city }}@endif
                    @if($obj->state) {{ $obj->state }}@endif
                    @if($obj->zip) {{ $obj->zip }}@endif
                @else
                    &mdash;
                @endif
            </td>
        </tr>
    @endforeach
    </tbody>
</table>
@endif

{{-- ══════════════════════════════════════════════ --}}
{{-- COVERAGE SUMMARY                              --}}
{{-- ══════════════════════════════════════════════ --}}
@if($coverages->count() > 0)
<div class="section-title">Coverage Summary</div>
<div class="section-subtitle">Requested coverages and limits for this scenario</div>

<table class="data-table">
    <thead>
        <tr>
            <th>Coverage Type</th>
            <th>Category</th>
            <th style="text-align:right;">Limit</th>
            <th style="text-align:right;">Deductible</th>
            <th style="text-align:center;">Included</th>
        </tr>
    </thead>
    <tbody>
    @foreach($coverages as $cov)
        <tr>
            <td class="text-bold">{{ ucwords(str_replace('_', ' ', $cov->coverage_type)) }}</td>
            <td>{{ ucfirst($cov->coverage_category) }}</td>
            <td class="text-right">
                @if($cov->limit_amount) ${{ number_format($cov->limit_amount, 0) }}
                @elseif($cov->per_occurrence_limit) ${{ number_format($cov->per_occurrence_limit, 0) }}/occ
                @elseif($cov->benefit_amount) ${{ number_format($cov->benefit_amount, 0) }}
                @else &mdash;
                @endif
            </td>
            <td class="text-right">
                {{ $cov->deductible_amount ? '$' . number_format($cov->deductible_amount, 0) : '—' }}
            </td>
            <td class="text-center">{{ $cov->is_included ? '✓' : '—' }}</td>
        </tr>
    @endforeach
    </tbody>
</table>
@endif

{{-- ══════════════════════════════════════════════ --}}
{{-- CARRIER COMPARISON  ★  THE STAR SECTION       --}}
{{-- ══════════════════════════════════════════════ --}}
@if($quotes->count() > 0)
<div style="page-break-before: always;"></div>
<div class="section-title">Carrier Comparison</div>
<div class="section-subtitle">Side-by-side comparison of {{ $quotes->count() }} carrier quote{{ $quotes->count() > 1 ? 's' : '' }} received</div>

<table class="comparison-table">
    <thead>
        <tr>
            <th style="width: 22%;">&nbsp;</th>
            @foreach($quotes as $q)
                <th class="{{ $q->is_recommended ? 'recommended-header' : '' }}">
                    {{ $q->carrier_name }}
                    @if($q->is_recommended)<br><span style="font-size:7pt;">★ RECOMMENDED</span>@endif
                </th>
            @endforeach
        </tr>
    </thead>
    <tbody>
        {{-- Status --}}
        <tr>
            <td>Status</td>
            @foreach($quotes as $q)
                <td class="{{ $q->is_recommended ? 'recommended-col' : '' }}">
                    @if($q->status === 'quoted' || $q->status === 'selected')
                        <span style="color: #16a34a; font-weight: bold;">Quoted</span>
                    @elseif($q->status === 'declined')
                        <span class="badge-declined">Declined</span>
                    @elseif($q->status === 'pending')
                        <span class="badge-pending">Pending</span>
                    @else
                        {{ ucfirst($q->status) }}
                    @endif
                </td>
            @endforeach
        </tr>

        {{-- Product --}}
        @if($quotes->pluck('product_name')->filter()->count() > 0)
        <tr>
            <td>Product</td>
            @foreach($quotes as $q)
                <td class="{{ $q->is_recommended ? 'recommended-col' : '' }}">{{ $q->product_name ?? '—' }}</td>
            @endforeach
        </tr>
        @endif

        {{-- AM Best Rating --}}
        <tr>
            <td>AM Best Rating</td>
            @foreach($quotes as $q)
                <td class="{{ $q->is_recommended ? 'recommended-col' : '' }}">
                    <strong>{{ $q->am_best_rating ?? '—' }}</strong>
                    @if($q->financial_strength_score)<br><span class="text-xs text-muted">Score: {{ $q->financial_strength_score }}/10</span>@endif
                </td>
            @endforeach
        </tr>

        {{-- Monthly Premium --}}
        <tr>
            <td>Monthly Premium</td>
            @foreach($quotes as $q)
                <td class="{{ $q->is_recommended ? 'recommended-col' : '' }}">
                    @if($q->premium_monthly)
                        <span class="premium-highlight">${{ number_format($q->premium_monthly, 2) }}</span>
                    @else
                        —
                    @endif
                </td>
            @endforeach
        </tr>

        {{-- Annual Premium --}}
        <tr>
            <td>Annual Premium</td>
            @foreach($quotes as $q)
                <td class="{{ $q->is_recommended ? 'recommended-col' : '' }}">
                    {{ $q->premium_annual ? '$' . number_format($q->premium_annual, 2) : '—' }}
                </td>
            @endforeach
        </tr>

        {{-- Semi-Annual --}}
        @if($quotes->pluck('premium_semi_annual')->filter()->count() > 0)
        <tr>
            <td>Semi-Annual Premium</td>
            @foreach($quotes as $q)
                <td class="{{ $q->is_recommended ? 'recommended-col' : '' }}">
                    {{ $q->premium_semi_annual ? '$' . number_format($q->premium_semi_annual, 2) : '—' }}
                </td>
            @endforeach
        </tr>
        @endif

        {{-- Quarterly --}}
        @if($quotes->pluck('premium_quarterly')->filter()->count() > 0)
        <tr>
            <td>Quarterly Premium</td>
            @foreach($quotes as $q)
                <td class="{{ $q->is_recommended ? 'recommended-col' : '' }}">
                    {{ $q->premium_quarterly ? '$' . number_format($q->premium_quarterly, 2) : '—' }}
                </td>
            @endforeach
        </tr>
        @endif

        {{-- Endorsements --}}
        @if($quotes->pluck('endorsements')->filter()->count() > 0)
        <tr>
            <td>Endorsements</td>
            @foreach($quotes as $q)
                <td class="{{ $q->is_recommended ? 'recommended-col' : '' }}">
                    @if($q->endorsements && count($q->endorsements) > 0)
                        @foreach($q->endorsements as $e)<span class="tag">{{ $e }}</span> @endforeach
                    @else
                        —
                    @endif
                </td>
            @endforeach
        </tr>
        @endif

        {{-- Exclusions --}}
        @if($quotes->pluck('exclusions')->filter()->count() > 0)
        <tr>
            <td>Exclusions</td>
            @foreach($quotes as $q)
                <td class="{{ $q->is_recommended ? 'recommended-col' : '' }}">
                    @if($q->exclusions && count($q->exclusions) > 0)
                        @foreach($q->exclusions as $e)<span class="tag tag-amber">{{ $e }}</span> @endforeach
                    @else
                        None noted
                    @endif
                </td>
            @endforeach
        </tr>
        @endif

        {{-- Discounts --}}
        @if($quotes->pluck('discounts_applied')->filter()->count() > 0)
        <tr>
            <td>Discounts Applied</td>
            @foreach($quotes as $q)
                <td class="{{ $q->is_recommended ? 'recommended-col' : '' }}">
                    @if($q->discounts_applied && count($q->discounts_applied) > 0)
                        @foreach($q->discounts_applied as $d)<span class="tag tag-green">{{ $d }}</span> @endforeach
                    @else
                        —
                    @endif
                </td>
            @endforeach
        </tr>
        @endif

        {{-- Agent Notes --}}
        @if($quotes->pluck('agent_notes')->filter()->count() > 0)
        <tr>
            <td>Agent Notes</td>
            @foreach($quotes as $q)
                <td class="{{ $q->is_recommended ? 'recommended-col' : '' }}" style="font-style: italic; font-size: 8pt;">
                    {{ $q->agent_notes ?? '—' }}
                </td>
            @endforeach
        </tr>
        @endif

        {{-- Decline Reason (if any declined) --}}
        @if($quotes->where('status', 'declined')->count() > 0)
        <tr>
            <td>Decline Reason</td>
            @foreach($quotes as $q)
                <td class="{{ $q->is_recommended ? 'recommended-col' : '' }}">
                    @if($q->status === 'declined')
                        <span style="color: #ef4444; font-size: 8pt;">{{ $q->decline_reason ?? 'Not specified' }}</span>
                    @else
                        —
                    @endif
                </td>
            @endforeach
        </tr>
        @endif
    </tbody>
</table>

{{-- Recommended Option Detail Card --}}
@php $recommended = $quotes->firstWhere('is_recommended', true) ?? $quotes->firstWhere('status', 'selected'); @endphp
@if($recommended)
<div class="recommended-box">
    <div class="recommended-title">★ Recommended: {{ $recommended->carrier_name }}{{ $recommended->product_name ? ' — ' . $recommended->product_name : '' }}</div>
    <div class="recommended-detail">
        <table style="width:100%; border-collapse:collapse;">
            <tr>
                <td style="width:50%; vertical-align:top; padding-right:20px;">
                    <strong>Monthly Premium:</strong> <span class="premium-highlight">${{ number_format($recommended->premium_monthly ?? 0, 2) }}</span><br>
                    @if($recommended->premium_annual)<strong>Annual:</strong> ${{ number_format($recommended->premium_annual, 2) }}<br>@endif
                    @if($recommended->am_best_rating)<strong>AM Best:</strong> {{ $recommended->am_best_rating }}@endif
                </td>
                <td style="width:50%; vertical-align:top;">
                    @if($recommended->discounts_applied && count($recommended->discounts_applied) > 0)
                        <strong>Discounts:</strong><br>
                        @foreach($recommended->discounts_applied as $d)<span class="tag tag-green">{{ $d }}</span> @endforeach
                        <br>
                    @endif
                    @if($recommended->agent_notes)
                        <strong>Agent Notes:</strong><br>
                        <em>{{ $recommended->agent_notes }}</em>
                    @endif
                </td>
            </tr>
        </table>
    </div>
</div>
@endif
@endif

{{-- ══════════════════════════════════════════════ --}}
{{-- DISCLAIMERS                                   --}}
{{-- ══════════════════════════════════════════════ --}}
<div class="disclaimers">
    <p><strong>Disclaimer:</strong> This proposal is provided for informational purposes only and does not constitute a binding contract or guarantee of coverage. All quotes are subject to final underwriting approval by the respective carriers. Premiums, terms, and conditions may change upon completion of the application process.</p>
    <p>Coverage details shown represent a summary and may not include all terms, conditions, and exclusions. Please refer to the actual policy documents for complete coverage information.</p>
    <p>This proposal was generated on {{ now()->format('F j, Y') }} and quotes may expire as indicated by individual carriers. Please contact your agent for the most up-to-date information.</p>
    <p style="margin-top: 8px;">&copy; {{ date('Y') }} {{ $agency['name'] ?? 'Agency' }} &bull; Powered by Insurons &bull; insurons.com</p>
</div>

</body>
</html>
