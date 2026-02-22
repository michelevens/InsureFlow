<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class HelpArticle extends Model
{
    protected $fillable = [
        'help_category_id', 'title', 'slug', 'content_markdown', 'excerpt',
        'view_count', 'helpful_count', 'not_helpful_count', 'tags', 'is_published', 'sort_order',
    ];

    protected $casts = [
        'tags' => 'array',
        'is_published' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(HelpCategory::class, 'help_category_id');
    }

    public static function boot(): void
    {
        parent::boot();
        static::creating(function ($article) {
            if (!$article->slug) {
                $article->slug = Str::slug($article->title);
            }
            if (!$article->excerpt && $article->content_markdown) {
                $article->excerpt = Str::limit(strip_tags($article->content_markdown), 200);
            }
        });
    }
}
