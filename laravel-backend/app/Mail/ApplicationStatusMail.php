<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApplicationStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $applicationId,
        public string $status,
        public string $insuranceType,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Application Update — InsureFlow',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.application-status',
        );
    }
}
