<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Fix emails: @insurons.com → @gmail.com
        DB::table('leads')
            ->where('email', 'like', 'michelevens+client%@insurons.com')
            ->update([
                'email' => DB::raw("REPLACE(email, '@insurons.com', '@gmail.com')"),
            ]);

        // Redistribute demo leads evenly across ALL agencies
        $agencies = DB::table('agencies')->pluck('id')->toArray();
        if (empty($agencies)) {
            return;
        }

        $leads = DB::table('leads')
            ->where('email', 'like', 'michelevens+client%@gmail.com')
            ->orderBy('id')
            ->pluck('id')
            ->toArray();

        if (empty($leads)) {
            return;
        }

        // Also get agents per agency for proper agent_id assignment
        $agentsByAgency = [];
        foreach ($agencies as $agencyId) {
            $agents = DB::table('users')
                ->where('agency_id', $agencyId)
                ->whereIn('role', ['agent', 'agency_owner'])
                ->pluck('id')
                ->toArray();
            if (!empty($agents)) {
                $agentsByAgency[$agencyId] = $agents;
            }
        }

        // Fallback: if some agencies have no agents, use any user
        $fallbackAgent = DB::table('users')->first()?->id ?? 1;

        // Round-robin assignment
        $agencyCount = count($agencies);
        foreach ($leads as $index => $leadId) {
            $agencyId = $agencies[$index % $agencyCount];
            $agents = $agentsByAgency[$agencyId] ?? [$fallbackAgent];
            $agentId = $agents[array_rand($agents)];

            DB::table('leads')
                ->where('id', $leadId)
                ->update([
                    'agency_id' => $agencyId,
                    'agent_id' => $agentId,
                ]);
        }
    }

    public function down(): void
    {
        // No rollback needed — demo data
    }
};
