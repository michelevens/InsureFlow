<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LeadAssignedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $agent,
        public string $leadName,
        public string $leadEmail,
        public string $insuranceType,
        public string $estimatedValue,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Lead Assigned — InsureFlow',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.lead-assigned',
        );
    }
}
