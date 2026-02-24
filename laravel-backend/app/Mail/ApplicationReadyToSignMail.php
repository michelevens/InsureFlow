<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApplicationReadyToSignMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $consumerName,
        public string $agentName,
        public string $carrierName,
        public string $signUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your insurance application is ready to sign — Insurons",
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.application-ready-to-sign');
    }
}
