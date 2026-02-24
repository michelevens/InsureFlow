<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MarketplaceRequestNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $agentName,
        public string $consumerName,
        public string $insuranceType,
        public string $state,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "New marketplace request: {$this->insuranceType} in {$this->state} — Insurons",
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.marketplace-request-notification');
    }
}
