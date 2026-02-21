<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuoteReceivedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ?User $user,
        public string $firstName,
        public string $email,
        public int $quoteCount,
        public string $lowestPremium,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Insurance Quotes — InsureFlow',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.quote-received',
        );
    }
}
