<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApplicationSignedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $agentName,
        public string $consumerName,
        public string $reference,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "{$this->consumerName} signed application {$this->reference} — Insurons",
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.application-signed');
    }
}
