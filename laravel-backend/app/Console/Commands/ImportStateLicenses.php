<?php

namespace App\Console\Commands;

use App\Models\AgentProfile;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ImportStateLicenses extends Command
{
    protected $signature = 'import:state-licenses
        {file? : Path to the state DOI CSV/TSV file}
        {state? : 2-letter state abbreviation (e.g. FL, TX, CA)}
        {--chunk=1000 : Number of records to process per batch}
        {--limit=0 : Limit total records (0 = unlimited)}
        {--delimiter=, : CSV delimiter (, or | or tab)}
        {--dry-run : Preview without inserting}
        {--update : Update existing records instead of skipping duplicates}
        {--list-states : List all supported states and exit}';

    protected $description = 'Import state DOI individual license data as unclaimed agent profiles (supports all 50 states + DC)';

    /**
     * Comprehensive header detection patterns covering formats from all state DOIs.
     */
    private array $headerPatterns = [
        'licensee_name' => [
            'licensee_name', 'name', 'full_name', 'licensee', 'agent_name',
            'producer_name', 'individual_name', 'last,_first', 'last_first',
            'applicant_name', 'insured_name', 'person_name', 'entity_name',
            'dba_name', 'legal_name', 'business_name',
        ],
        'first_name' => [
            'first_name', 'fname', 'first', 'given_name',
        ],
        'last_name' => [
            'last_name', 'lname', 'last', 'surname', 'family_name',
        ],
        'middle_name' => [
            'middle_name', 'mname', 'middle', 'middle_initial', 'mi',
        ],
        'license_number' => [
            'license_number', 'license_no', 'lic_number', 'license_num', 'lic_no',
            'lic_#', 'license_#', 'license_id', 'producer_license',
            'certificate_number', 'cert_number', 'cert_no', 'id_number',
            'state_license_number', 'sl_number',
        ],
        'npn' => [
            'npn', 'national_producer_number', 'naic_number', 'producer_number',
            'national_producer_no', 'naic_#', 'naic_no', 'naic_id',
            'nipr_number', 'npn_number',
        ],
        'license_type' => [
            'license_type', 'lic_type', 'type', 'license_class', 'class',
            'license_category', 'category', 'producer_type', 'agent_type',
            'qualification', 'license_kind', 'appointment_type',
        ],
        'status' => [
            'status', 'license_status', 'lic_status', 'current_status',
            'active_status', 'producer_status', 'agent_status',
        ],
        'effective_date' => [
            'effective_date', 'issue_date', 'eff_date', 'start_date',
            'original_issue_date', 'date_issued', 'issued_date',
            'original_date', 'appointment_date', 'begin_date',
            'license_date', 'lic_date', 'date_licensed',
        ],
        'expiration_date' => [
            'expiration_date', 'exp_date', 'expire_date', 'expiry_date',
            'renewal_date', 'end_date', 'termination_date', 'expiry',
            'date_expires', 'expires', 'renewal_due_date',
        ],
        'county' => [
            'county', 'county_name', 'county_code', 'parish',
        ],
        'address' => [
            'address', 'street', 'street_address', 'address_1', 'mailing_address',
            'address_line_1', 'addr1', 'business_address', 'residence_address',
        ],
        'city' => [
            'city', 'city_name', 'mailing_city', 'business_city', 'residence_city',
        ],
        'state_col' => [
            'state', 'state_code', 'resident_state', 'mailing_state',
            'business_state', 'residence_state', 'st',
        ],
        'zip' => [
            'zip', 'zip_code', 'zipcode', 'postal_code', 'zip5',
            'mailing_zip', 'business_zip', 'residence_zip',
        ],
        'email' => [
            'email', 'email_address', 'contact_email', 'e-mail', 'e_mail',
        ],
        'phone' => [
            'phone', 'phone_number', 'telephone', 'contact_phone',
            'phone_no', 'tel', 'business_phone',
        ],
        'loa' => [
            'line_of_authority', 'lines_of_authority', 'loa', 'authority',
            'line_of_insurance', 'loi', 'product_line', 'coverage_type',
        ],
    ];

    public function handle(): int
    {
        // --list-states flag
        if ($this->option('list-states')) {
            return $this->listStates();
        }

        $filePath = $this->argument('file');
        $stateCode = $this->argument('state');

        if (!$filePath || !$stateCode) {
            $this->error("Both <file> and <state> arguments are required.");
            $this->line("Usage: php artisan import:state-licenses <file> <STATE>");
            $this->line("       php artisan import:state-licenses --list-states");
            return 1;
        }

        $stateCode = strtoupper($stateCode);
        $chunkSize = (int) $this->option('chunk');
        $limit = (int) $this->option('limit');
        $delimiter = $this->option('delimiter');
        $dryRun = $this->option('dry-run');
        $update = $this->option('update');

        // Validate state
        $stateConfig = StateLicenseSources::get($stateCode);
        if (!$stateConfig) {
            $this->error("Unknown state: {$stateCode}. Use --list-states to see all supported states.");
            return 1;
        }

        // Handle tab delimiter
        if (in_array($delimiter, ['tab', '\t', 'TAB'])) {
            $delimiter = "\t";
        }

        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return 1;
        }

        $this->info("Importing {$stateConfig['name']} ({$stateCode}) license data...");
        $this->info("Source key: {$stateConfig['source_key']}");
        $this->info("File: {$filePath}");

        $handle = fopen($filePath, 'r');
        if (!$handle) {
            $this->error("Cannot open file.");
            return 1;
        }

        // Read header row
        $headers = fgetcsv($handle, 0, $delimiter);
        if (!$headers) {
            $this->error("Cannot read CSV headers.");
            fclose($handle);
            return 1;
        }

        // Normalize headers
        $headers = array_map(function ($h) {
            $h = strtolower(trim($h));
            $h = preg_replace('/[^a-z0-9_]/', '_', $h);
            $h = preg_replace('/_+/', '_', $h);
            return trim($h, '_');
        }, $headers);

        $this->info("Found " . count($headers) . " columns:");
        foreach (array_chunk($headers, 6) as $chunk) {
            $this->line("  " . implode(', ', $chunk));
        }

        // Auto-detect column mapping
        $mapping = $this->detectColumns($headers, $stateConfig);
        if (!$mapping['npn'] && !$mapping['license_number'] && !$mapping['licensee_name']) {
            $this->error("Could not detect key columns (NPN, license number, or name).");
            $this->error("Headers: " . implode(', ', $headers));
            fclose($handle);
            return 1;
        }

        $this->newLine();
        $this->info("Column mapping:");
        foreach ($mapping as $field => $idx) {
            if ($idx !== null) {
                $this->line("  <info>{$field}</info> → col {$idx} (<comment>{$headers[$idx]}</comment>)");
            }
        }

        $unmapped = array_keys(array_filter($mapping, fn($v) => $v === null));
        if (!empty($unmapped)) {
            $this->warn("Unmapped fields: " . implode(', ', $unmapped));
        }

        if ($dryRun) {
            $this->newLine();
            $this->warn("DRY RUN — no data will be inserted.");
        }

        $this->newLine();

        $processed = 0;
        $imported = 0;
        $updated = 0;
        $skipped = 0;
        $duplicates = 0;
        $batch = [];

        $bar = $this->output->createProgressBar();
        $bar->start();

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            $processed++;

            if ($limit > 0 && $processed > $limit) {
                break;
            }

            $record = $this->mapRow($row, $mapping, $stateCode, $stateConfig);
            if (!$record) {
                $skipped++;
                $bar->advance();
                continue;
            }

            $batch[] = $record;

            if (count($batch) >= $chunkSize) {
                if (!$dryRun) {
                    $result = $this->insertBatch($batch, $stateConfig['source_key'], $update);
                    $imported += $result['inserted'];
                    $updated += $result['updated'];
                    $duplicates += $result['duplicates'];
                }
                $batch = [];
            }

            $bar->advance();
        }

        // Remaining batch
        if (!empty($batch) && !$dryRun) {
            $result = $this->insertBatch($batch, $stateConfig['source_key'], $update);
            $imported += $result['inserted'];
            $updated += $result['updated'];
            $duplicates += $result['duplicates'];
        }

        $bar->finish();
        fclose($handle);

        $this->newLine(2);
        $this->info("═══ Import Complete: {$stateConfig['name']} ═══");
        $this->table(
            ['Metric', 'Count'],
            [
                ['Processed', number_format($processed)],
                ['Imported (new)', number_format($imported)],
                ['Updated', number_format($updated)],
                ['Duplicates (skipped)', number_format($duplicates)],
                ['Skipped (invalid/inactive)', number_format($skipped)],
            ]
        );

        if ($dryRun) {
            $this->warn("DRY RUN — would have imported ~" . number_format($processed - $skipped) . " records.");
        }

        return 0;
    }

    /**
     * List all supported states.
     */
    private function listStates(): int
    {
        $states = StateLicenseSources::all();

        $rows = [];
        foreach ($states as $abbr => $config) {
            $rows[] = [$abbr, $config['name'], $config['source_key'], $config['format'], $config['bulk_url']];
        }

        $this->table(
            ['State', 'Department', 'Source Key', 'Format', 'Bulk Download URL'],
            $rows
        );

        $this->info("Total: " . count($states) . " states + DC");
        $this->newLine();
        $this->line("Usage: php artisan import:state-licenses <file> <STATE>");
        $this->line("Example: php artisan import:state-licenses ./fl_licenses.csv FL");
        $this->line("Example: php artisan import:state-licenses ./tx_producers.csv TX --dry-run");

        return 0;
    }

    /**
     * Auto-detect CSV columns by matching header names.
     * Merges global patterns with state-specific column_hints.
     */
    private function detectColumns(array $headers, array $stateConfig): array
    {
        $fields = array_keys($this->headerPatterns);
        $mapping = array_fill_keys($fields, null);

        // Merge state-specific hints into patterns
        $patterns = $this->headerPatterns;
        if (!empty($stateConfig['column_hints'])) {
            foreach ($stateConfig['column_hints'] as $field => $hints) {
                if (isset($patterns[$field])) {
                    $patterns[$field] = array_merge($hints, $patterns[$field]);
                }
            }
        }

        foreach ($patterns as $field => $candidates) {
            foreach ($headers as $idx => $header) {
                if (in_array($header, $candidates)) {
                    $mapping[$field] = $idx;
                    break;
                }
            }
        }

        // Fuzzy fallback: partial matching for unmatched fields
        foreach ($patterns as $field => $candidates) {
            if ($mapping[$field] !== null) continue;
            foreach ($headers as $idx => $header) {
                foreach ($candidates as $candidate) {
                    if (str_contains($header, $candidate) || str_contains($candidate, $header)) {
                        $mapping[$field] = $idx;
                        break 2;
                    }
                }
            }
        }

        return $mapping;
    }

    /**
     * Map a CSV row to an agent_profiles record.
     */
    private function mapRow(array $row, array $mapping, string $stateCode, array $stateConfig): ?array
    {
        $get = fn($field) => isset($mapping[$field]) && $mapping[$field] !== null && isset($row[$mapping[$field]])
            ? trim($row[$mapping[$field]])
            : null;

        // Build full name from parts if no single name column
        $name = $get('licensee_name');
        if (!$name) {
            $first = $get('first_name');
            $last = $get('last_name');
            $middle = $get('middle_name');
            if ($first && $last) {
                $name = $middle ? "{$first} {$middle} {$last}" : "{$first} {$last}";
            } elseif ($last) {
                $name = $last;
            }
        }

        $licenseNumber = $get('license_number');
        $npn = $get('npn');
        $status = $get('status');

        // Must have at least a name or license number
        if (!$name && !$licenseNumber) {
            return null;
        }

        // Skip inactive licenses
        $statusLower = strtolower($status ?? '');
        $inactiveStatuses = [
            'revoked', 'suspended', 'surrendered', 'expired',
            'cancelled', 'canceled', 'terminated', 'denied',
            'inactive', 'void', 'withdrawn', 'deceased',
        ];
        if (in_array($statusLower, $inactiveStatuses)) {
            return null;
        }

        $effectiveDate = $this->parseDate($get('effective_date'));
        $expirationDate = $this->parseDate($get('expiration_date'));

        // Build lines of authority if available
        $loa = $get('loa');
        $loaArray = [];
        if ($loa) {
            $loaArray = array_map('trim', preg_split('/[;,|]/', $loa));
            $loaArray = array_filter($loaArray);
        }

        // Build license lookup URL
        $lookupUrl = null;
        if ($licenseNumber) {
            $lookupUrl = StateLicenseSources::lookupUrl($stateCode, $licenseNumber);
        }

        return [
            'user_id' => null,
            'full_name' => $name,
            'license_number' => $licenseNumber,
            'npn' => $npn ?: null,
            'npn_verified' => $npn ? 'verified' : 'unverified',
            'license_type' => $get('license_type'),
            'license_status' => $status,
            'license_issue_date' => $effectiveDate,
            'license_expiration_date' => $expirationDate,
            'license_states' => json_encode([$stateCode]),
            'lines_of_authority' => !empty($loaArray) ? json_encode($loaArray) : json_encode([]),
            'county' => $get('county'),
            'city' => $get('city'),
            'state' => $get('state_col') ?: $stateCode,
            'license_lookup_url' => $lookupUrl,
            'is_claimed' => false,
            'source' => $stateConfig['source_key'],
            'source_id' => $licenseNumber ?: $npn,
            'specialties' => json_encode([]),
            'carriers' => json_encode([]),
            'years_experience' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * Insert a batch, skipping or updating duplicates.
     */
    private function insertBatch(array $batch, string $sourceKey, bool $update): array
    {
        $inserted = 0;
        $updated = 0;
        $duplicates = 0;

        foreach ($batch as $record) {
            try {
                $existing = AgentProfile::where(function ($q) use ($record, $sourceKey) {
                    if ($record['npn']) {
                        $q->where('npn', $record['npn']);
                    }
                    if ($record['license_number']) {
                        $q->orWhere(function ($q2) use ($record, $sourceKey) {
                            $q2->where('license_number', $record['license_number'])
                               ->where('source', $sourceKey);
                        });
                    }
                })->first();

                if ($existing) {
                    if ($update && !$existing->is_claimed) {
                        // Update unclaimed profiles with fresh data
                        $existing->update([
                            'full_name' => $record['full_name'] ?: $existing->full_name,
                            'license_status' => $record['license_status'] ?: $existing->license_status,
                            'license_expiration_date' => $record['license_expiration_date'] ?: $existing->license_expiration_date,
                            'license_type' => $record['license_type'] ?: $existing->license_type,
                            'city' => $record['city'] ?: $existing->city,
                            'county' => $record['county'] ?: $existing->county,
                            'lines_of_authority' => $record['lines_of_authority'] !== json_encode([]) ? $record['lines_of_authority'] : $existing->lines_of_authority,
                            'updated_at' => now(),
                        ]);
                        $updated++;
                    } else {
                        $duplicates++;
                    }
                    continue;
                }

                AgentProfile::create($record);
                $inserted++;
            } catch (\Exception $e) {
                Log::warning("State license import skip [{$sourceKey}]: " . $e->getMessage(), [
                    'npn' => $record['npn'],
                    'license' => $record['license_number'],
                ]);
                $duplicates++;
            }
        }

        return ['inserted' => $inserted, 'updated' => $updated, 'duplicates' => $duplicates];
    }

    /**
     * Parse date from various formats.
     */
    private function parseDate(?string $date): ?string
    {
        if (!$date) return null;
        $date = trim($date);
        if ($date === '' || $date === '0' || $date === '0000-00-00') return null;

        try {
            return \Carbon\Carbon::parse($date)->format('Y-m-d');
        } catch (\Exception) {
            // Try common US formats explicitly
            foreach (['m/d/Y', 'n/j/Y', 'm-d-Y', 'Y/m/d', 'Ymd'] as $fmt) {
                try {
                    $parsed = \Carbon\Carbon::createFromFormat($fmt, $date);
                    if ($parsed) return $parsed->format('Y-m-d');
                } catch (\Exception) {
                    continue;
                }
            }
            return null;
        }
    }
}
