<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SignatureRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $requesterName,
        public string $signerName,
        public string $signUrl,
        public ?string $message = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Signature Requested by {$this->requesterName} — Insurons",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.signature-request',
        );
    }
}
