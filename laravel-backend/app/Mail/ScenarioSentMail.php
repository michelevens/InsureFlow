<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ScenarioSentMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $consumerName,
        public string $agentName,
        public string $agencyName,
        public string $scenarioName,
        public string $viewUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "You've received an insurance quote from {$this->agencyName} — Insurons",
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.scenario-sent');
    }
}
