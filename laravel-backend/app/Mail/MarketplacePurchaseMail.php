<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MarketplacePurchaseMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $buyerName,
        public string $insuranceType,
        public string $leadName,
        public string $leadEmail,
        public string $leadPhone,
        public string $state,
        public string $price,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Lead Purchased Successfully — Insurons',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.marketplace-purchase',
        );
    }
}
