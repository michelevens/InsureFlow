<?php

namespace App\Mail;

use App\Models\EmbedPartner;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmbedQuoteStartedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public EmbedPartner $partner,
        public string $insuranceType,
        public string $sourceDomain,
        public string $sessionToken,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Quote Started on Your Widget — Insurons',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.embed-quote-started',
        );
    }
}
