<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PolicyIssuedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $consumerName,
        public string $policyNumber,
        public string $carrierName,
        public string $insuranceType,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your {$this->insuranceType} policy has been issued — Insurons",
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.policy-issued');
    }
}
