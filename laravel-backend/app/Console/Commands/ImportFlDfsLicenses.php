<?php

namespace App\Console\Commands;

use App\Models\AgentProfile;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ImportFlDfsLicenses extends Command
{
    protected $signature = 'import:fl-dfs
        {file : Path to the FL DFS "All Valid Licenses - Individual" CSV file}
        {--chunk=1000 : Number of records to process per batch}
        {--limit=0 : Limit total records (0 = unlimited)}
        {--dry-run : Preview without inserting}';

    protected $description = 'Import Florida DFS individual license data as unclaimed agent profiles';

    /**
     * Expected CSV columns from FL DFS bulk download.
     * Actual column names may vary; we map by position and common names.
     */
    private array $columnMap = [
        'licensee_name' => null,
        'license_number' => null,
        'npn' => null,
        'license_type' => null,
        'status' => null,
        'effective_date' => null,
        'expiration_date' => null,
        'county' => null,
        'address' => null,
        'city' => null,
        'state' => null,
        'zip' => null,
        'email' => null,
        'phone' => null,
    ];

    public function handle(): int
    {
        $filePath = $this->argument('file');
        $chunkSize = (int) $this->option('chunk');
        $limit = (int) $this->option('limit');
        $dryRun = $this->option('dry-run');

        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return 1;
        }

        $this->info("Opening {$filePath}...");
        $handle = fopen($filePath, 'r');
        if (!$handle) {
            $this->error("Cannot open file.");
            return 1;
        }

        // Read header row
        $headers = fgetcsv($handle);
        if (!$headers) {
            $this->error("Cannot read CSV headers.");
            fclose($handle);
            return 1;
        }

        // Normalize headers
        $headers = array_map(fn($h) => strtolower(trim(str_replace(['"', ' '], ['', '_'], $h))), $headers);
        $this->info("Found " . count($headers) . " columns: " . implode(', ', array_slice($headers, 0, 15)) . '...');

        // Auto-detect column mapping
        $mapping = $this->detectColumns($headers);
        if (!$mapping['npn'] && !$mapping['license_number']) {
            $this->error("Could not detect NPN or License Number column. Headers: " . implode(', ', $headers));
            fclose($handle);
            return 1;
        }

        $this->info("Column mapping:");
        foreach ($mapping as $field => $idx) {
            if ($idx !== null) {
                $this->line("  {$field} → column {$idx} ({$headers[$idx]})");
            }
        }

        if ($dryRun) {
            $this->warn("DRY RUN — no data will be inserted.");
        }

        $processed = 0;
        $imported = 0;
        $skipped = 0;
        $duplicates = 0;
        $batch = [];

        $bar = $this->output->createProgressBar();
        $bar->start();

        while (($row = fgetcsv($handle)) !== false) {
            $processed++;

            if ($limit > 0 && $processed > $limit) {
                break;
            }

            $record = $this->mapRow($row, $mapping);
            if (!$record) {
                $skipped++;
                $bar->advance();
                continue;
            }

            $batch[] = $record;

            if (count($batch) >= $chunkSize) {
                if (!$dryRun) {
                    $result = $this->insertBatch($batch);
                    $imported += $result['inserted'];
                    $duplicates += $result['duplicates'];
                }
                $batch = [];
            }

            $bar->advance();
        }

        // Process remaining batch
        if (!empty($batch) && !$dryRun) {
            $result = $this->insertBatch($batch);
            $imported += $result['inserted'];
            $duplicates += $result['duplicates'];
        }

        $bar->finish();
        fclose($handle);

        $this->newLine(2);
        $this->info("Import complete:");
        $this->line("  Processed: {$processed}");
        $this->line("  Imported:  {$imported}");
        $this->line("  Duplicates: {$duplicates}");
        $this->line("  Skipped:   {$skipped}");

        if ($dryRun) {
            $this->warn("DRY RUN — would have imported ~" . ($processed - $skipped) . " records.");
        }

        return 0;
    }

    /**
     * Auto-detect CSV columns by matching common header names.
     */
    private function detectColumns(array $headers): array
    {
        $mapping = array_fill_keys(array_keys($this->columnMap), null);

        $patterns = [
            'licensee_name' => ['licensee_name', 'name', 'full_name', 'licensee', 'agent_name'],
            'license_number' => ['license_number', 'license_no', 'lic_number', 'license_num', 'lic_no'],
            'npn' => ['npn', 'national_producer_number', 'naic_number', 'producer_number'],
            'license_type' => ['license_type', 'lic_type', 'type', 'license_class', 'class'],
            'status' => ['status', 'license_status', 'lic_status'],
            'effective_date' => ['effective_date', 'issue_date', 'eff_date', 'start_date', 'original_issue_date'],
            'expiration_date' => ['expiration_date', 'exp_date', 'expire_date', 'expiry_date'],
            'county' => ['county', 'county_name'],
            'address' => ['address', 'street', 'street_address', 'address_1', 'mailing_address'],
            'city' => ['city', 'city_name'],
            'state' => ['state', 'state_code', 'resident_state'],
            'zip' => ['zip', 'zip_code', 'zipcode', 'postal_code'],
            'email' => ['email', 'email_address', 'contact_email'],
            'phone' => ['phone', 'phone_number', 'telephone', 'contact_phone'],
        ];

        foreach ($patterns as $field => $candidates) {
            foreach ($headers as $idx => $header) {
                if (in_array($header, $candidates)) {
                    $mapping[$field] = $idx;
                    break;
                }
            }
        }

        return $mapping;
    }

    /**
     * Map a CSV row to an agent_profiles record.
     */
    private function mapRow(array $row, array $mapping): ?array
    {
        $get = fn($field) => isset($mapping[$field]) && isset($row[$mapping[$field]])
            ? trim($row[$mapping[$field]])
            : null;

        $name = $get('licensee_name');
        $licenseNumber = $get('license_number');
        $npn = $get('npn');
        $status = $get('status');

        // Skip rows without a name or license number
        if (!$name && !$licenseNumber) {
            return null;
        }

        // Skip inactive/revoked licenses
        $statusLower = strtolower($status ?? '');
        if (in_array($statusLower, ['revoked', 'suspended', 'surrendered', 'expired'])) {
            return null;
        }

        $effectiveDate = $this->parseDate($get('effective_date'));
        $expirationDate = $this->parseDate($get('expiration_date'));

        return [
            'user_id' => null, // unclaimed
            'full_name' => $name,
            'license_number' => $licenseNumber,
            'npn' => $npn ?: null,
            'npn_verified' => $npn ? 'verified' : 'unverified', // Verified — direct from state DOI
            'license_type' => $get('license_type'),
            'license_status' => $status,
            'license_issue_date' => $effectiveDate,
            'license_expiration_date' => $expirationDate,
            'license_states' => json_encode(['FL']),
            'county' => $get('county'),
            'city' => $get('city'),
            'state' => $get('state') ?: 'FL',
            'license_lookup_url' => $licenseNumber
                ? "https://licenseesearch.fldfs.com/Licensee/{$licenseNumber}"
                : null,
            'is_claimed' => false,
            'source' => 'fl_dfs',
            'source_id' => $licenseNumber,
            'specialties' => json_encode([]),
            'carriers' => json_encode([]),
            'years_experience' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * Insert a batch, skipping duplicates by NPN or license_number + source.
     */
    private function insertBatch(array $batch): array
    {
        $inserted = 0;
        $duplicates = 0;

        foreach ($batch as $record) {
            try {
                // Check for existing profile by NPN or license_number from same source
                $exists = AgentProfile::where(function ($q) use ($record) {
                    if ($record['npn']) {
                        $q->where('npn', $record['npn']);
                    }
                    if ($record['license_number']) {
                        $q->orWhere(function ($q2) use ($record) {
                            $q2->where('license_number', $record['license_number'])
                               ->where('source', 'fl_dfs');
                        });
                    }
                })->exists();

                if ($exists) {
                    $duplicates++;
                    continue;
                }

                AgentProfile::create($record);
                $inserted++;
            } catch (\Exception $e) {
                Log::warning("FL DFS import skip: " . $e->getMessage(), [
                    'npn' => $record['npn'],
                    'license' => $record['license_number'],
                ]);
                $duplicates++;
            }
        }

        return ['inserted' => $inserted, 'duplicates' => $duplicates];
    }

    /**
     * Parse date from various formats.
     */
    private function parseDate(?string $date): ?string
    {
        if (!$date) return null;
        try {
            return \Carbon\Carbon::parse($date)->format('Y-m-d');
        } catch (\Exception) {
            return null;
        }
    }
}
