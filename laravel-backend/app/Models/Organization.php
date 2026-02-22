<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'parent_id', 'name', 'slug', 'type', 'level',
        'tax_id', 'phone', 'email', 'website',
        'address', 'city', 'state', 'zip',
        'branding', 'settings', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'branding' => 'array',
            'settings' => 'array',
            'is_active' => 'boolean',
        ];
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($org) {
            if (empty($org->slug)) {
                $org->slug = Str::slug($org->name) . '-' . Str::random(4);
            }
            // Auto-set level from parent
            if ($org->parent_id) {
                $parent = static::find($org->parent_id);
                $org->level = $parent ? $parent->level + 1 : 0;
            }
        });
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function allDescendants()
    {
        return $this->children()->with('allDescendants');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'organization_members')
            ->withPivot(['role', 'permissions', 'is_primary'])
            ->withTimestamps();
    }

    public function memberRecords()
    {
        return $this->hasMany(OrganizationMember::class);
    }

    /**
     * Get all organization IDs in the tree below this org (including self).
     */
    public function descendantIds(): array
    {
        $ids = [$this->id];
        foreach ($this->children as $child) {
            $ids = array_merge($ids, $child->descendantIds());
        }
        return $ids;
    }

    /**
     * Ancestor chain from root to this org.
     */
    public function breadcrumb(): array
    {
        $chain = [$this];
        $current = $this;
        while ($current->parent_id) {
            $current = $current->parent;
            array_unshift($chain, $current);
        }
        return $chain;
    }
}
