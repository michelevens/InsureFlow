<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReferralCode extends Model
{
    protected $fillable = ['user_id', 'code', 'uses', 'max_uses', 'is_active'];
    protected function casts(): array { return ['is_active' => 'boolean']; }
    public function user() { return $this->belongsTo(User::class); }

    public function isUsable(): bool
    {
        return $this->is_active && ($this->max_uses === null || $this->uses < $this->max_uses);
    }

    public static function generateCode(User $user): string
    {
        $base = strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $user->name), 0, 4));
        $suffix = strtoupper(substr(md5($user->id . $user->email), 0, 4));
        return $base . $suffix;
    }
}
