<?php

namespace App\Mail;

use App\Models\Invite;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AgencyRecruitmentMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Invite $invite,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "You're Invited to Join Insurons — The Insurance Marketplace",
        );
    }

    public function content(): Content
    {
        $apiUrl = rtrim(config('app.url', 'https://api.insurons.com'), '/');
        $token = $this->invite->token;

        // Use tracked click URL (redirects to frontend after recording click)
        $acceptUrl = $apiUrl . '/api/invites/' . $token . '/click';
        // Tracking pixel for email opens
        $pixelUrl = $apiUrl . '/api/invites/' . $token . '/pixel';

        return new Content(
            view: 'emails.agency-recruitment',
            with: [
                'contactName' => $this->invite->contact_name ?? 'there',
                'agencyName' => $this->invite->agency_name ?? 'your agency',
                'customMessage' => $this->invite->custom_message,
                'acceptUrl' => $acceptUrl,
                'pixelUrl' => $pixelUrl,
                'expiresAt' => $this->invite->expires_at->format('F j, Y'),
            ],
        );
    }
}
