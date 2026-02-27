<?php

namespace App\Mail;

use App\Models\Agency;
use App\Models\EmbedPartner;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmbedTeamSignupMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public EmbedPartner $partner,
        public Agency $agency,
        public User $agent,
        public string $sourceDomain,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Agent Application — ' . $this->agent->name,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.embed-team-signup',
        );
    }
}
