<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ComplianceOverdueMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $userName,
        public array $overdueItems,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Action Required: Compliance Items Overdue',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.compliance-overdue',
        );
    }
}
