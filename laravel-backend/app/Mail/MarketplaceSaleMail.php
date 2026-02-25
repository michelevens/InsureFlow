<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MarketplaceSaleMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $sellerName,
        public string $insuranceType,
        public string $state,
        public string $salePrice,
        public string $platformFee,
        public string $netEarnings,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Lead Has Been Sold — Insurons',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.marketplace-sale',
        );
    }
}
