<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LeadIntakeConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $firstName,
        public string $agencyName,
        public string $insuranceType,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'We Received Your Insurance Request — Insurons',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.lead-intake-confirmation',
        );
    }
}
