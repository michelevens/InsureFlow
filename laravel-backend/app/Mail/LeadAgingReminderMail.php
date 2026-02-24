<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LeadAgingReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $agentName,
        public string $leadName,
        public string $leadEmail,
        public string $insuranceType,
        public int $hoursOld,
        public int $profileId,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Follow-Up Needed: {$this->leadName} — Insurons",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.lead-aging-reminder',
        );
    }
}
