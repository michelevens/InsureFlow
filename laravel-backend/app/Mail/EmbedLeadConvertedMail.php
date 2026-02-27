<?php

namespace App\Mail;

use App\Models\EmbedPartner;
use App\Models\EmbedSession;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmbedLeadConvertedMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $contactName;
    public string $contactEmail;
    public string $contactPhone;
    public string $insuranceType;
    public string $zipCode;
    public string $coverageLevel;
    public string $sourceDomain;

    public function __construct(
        public EmbedPartner $partner,
        public EmbedSession $session,
    ) {
        $qr = $session->quoteRequest;
        $this->contactName = trim(($qr->first_name ?? '') . ' ' . ($qr->last_name ?? '')) ?: 'Unknown';
        $this->contactEmail = $qr->email ?? 'N/A';
        $this->contactPhone = $qr->phone ?? 'N/A';
        $this->insuranceType = ucfirst($qr->insurance_type ?? $session->insurance_type ?? 'N/A');
        $this->zipCode = $qr->zip_code ?? 'N/A';
        $this->coverageLevel = ucfirst($qr->coverage_level ?? 'N/A');
        $this->sourceDomain = $session->source_domain ?? 'N/A';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Lead From Your Widget — ' . $this->contactName . ' — Insurons',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.embed-lead-converted',
        );
    }
}
