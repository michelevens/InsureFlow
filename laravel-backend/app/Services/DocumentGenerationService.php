<?php

namespace App\Services;

use App\Models\GeneratedDocument;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentGenerationService
{
    protected array $templateMap = [
        'quote_comparison' => 'documents.quote-comparison',
        'proposal' => 'documents.proposal',
        'binder_letter' => 'documents.binder-letter',
        'certificate_of_insurance' => 'documents.certificate-of-insurance',
        'dec_page' => 'documents.dec-page',
        'endorsement' => 'documents.endorsement',
        'cancellation_notice' => 'documents.cancellation-notice',
        'renewal_offer' => 'documents.renewal-offer',
        'invoice' => 'documents.invoice',
    ];

    public function generate(string $templateType, $entity, array $extraData = [], ?int $userId = null): GeneratedDocument
    {
        $viewName = $this->templateMap[$templateType] ?? null;
        if (!$viewName) {
            throw new \InvalidArgumentException("Unknown template type: {$templateType}");
        }

        // Build data for the template
        $data = array_merge([
            'entity' => $entity,
            'generated_at' => now(),
            'company' => [
                'name' => config('app.name', 'Insurons'),
                'logo' => config('app.logo_url'),
                'address' => config('app.company_address'),
                'phone' => config('app.company_phone'),
            ],
        ], $extraData);

        // Render HTML from Blade template
        $html = view($viewName, $data)->render();

        // Generate PDF using DomPDF (if installed) or save as HTML
        $fileName = Str::slug($templateType) . '-' . $entity->id . '-' . now()->format('Ymd-His') . '.pdf';
        $filePath = 'generated-documents/' . date('Y/m') . '/' . $fileName;

        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('letter');
            Storage::disk('local')->put($filePath, $pdf->output());
        } else {
            // Fallback: store as HTML
            $filePath = str_replace('.pdf', '.html', $filePath);
            $fileName = str_replace('.pdf', '.html', $fileName);
            Storage::disk('local')->put($filePath, $html);
        }

        $fileSize = Storage::disk('local')->size($filePath);

        return GeneratedDocument::create([
            'documentable_type' => get_class($entity),
            'documentable_id' => $entity->id,
            'template_type' => $templateType,
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_size' => $fileSize,
            'metadata' => $extraData,
            'generated_by' => $userId,
        ]);
    }

    public function availableTemplates(): array
    {
        return [
            'quote_comparison' => 'Quote Comparison Sheet',
            'proposal' => 'Insurance Proposal',
            'binder_letter' => 'Binder Letter',
            'certificate_of_insurance' => 'Certificate of Insurance (COI)',
            'dec_page' => 'Declarations Page',
            'endorsement' => 'Endorsement',
            'cancellation_notice' => 'Cancellation Notice',
            'renewal_offer' => 'Renewal Offer',
            'invoice' => 'Invoice',
        ];
    }
}
