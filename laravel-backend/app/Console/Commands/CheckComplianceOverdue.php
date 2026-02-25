<?php

namespace App\Console\Commands;

use App\Mail\ComplianceOverdueMail;
use App\Models\CompliancePackItem;
use App\Models\Notification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class CheckComplianceOverdue extends Command
{
    protected $signature = 'compliance:check-overdue';
    protected $description = 'Check for overdue compliance items and notify agents';

    public function handle(): void
    {
        $overdueItems = CompliancePackItem::where('status', '!=', 'completed')
            ->where('status', '!=', 'waived')
            ->whereNotNull('due_date')
            ->where('due_date', '<', now())
            ->with('user')
            ->get()
            ->groupBy('user_id');

        $notifiedCount = 0;

        foreach ($overdueItems as $userId => $items) {
            $user = $items->first()->user;
            if (!$user) continue;

            // Check if we already notified this week
            $recentNotification = Notification::where('user_id', $userId)
                ->where('type', 'compliance_overdue')
                ->where('created_at', '>', now()->subWeek())
                ->exists();
            if ($recentNotification) continue;

            // Create in-app notification
            Notification::create([
                'user_id' => $userId,
                'type' => 'compliance_overdue',
                'title' => 'Compliance Items Overdue',
                'body' => "You have {$items->count()} overdue compliance item(s) that need attention.",
                'data' => ['overdue_count' => $items->count(), 'items' => $items->pluck('id')],
            ]);

            // Send email
            try {
                Mail::to($user->email)->send(new ComplianceOverdueMail(
                    userName: $user->name,
                    overdueItems: $items->map(fn ($i) => [
                        'name' => $i->requirement?->name ?? 'Unknown',
                        'due_date' => $i->due_date?->format('M d, Y'),
                        'category' => $i->requirement?->category ?? 'General',
                    ])->toArray(),
                ));
            } catch (\Exception $e) {
                \Log::warning("Compliance overdue email failed for user {$userId}: " . $e->getMessage());
            }

            $notifiedCount++;
        }

        $this->info("Notified {$notifiedCount} users about overdue compliance items.");
    }
}
