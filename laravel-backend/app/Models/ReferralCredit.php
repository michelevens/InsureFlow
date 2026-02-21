<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReferralCredit extends Model
{
    protected $fillable = ['user_id', 'amount', 'type', 'description', 'referral_id'];
    protected function casts(): array { return ['amount' => 'decimal:2']; }
    public function user() { return $this->belongsTo(User::class); }
    public function referral() { return $this->belongsTo(Referral::class); }
}
