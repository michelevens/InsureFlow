<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use LazilyRefreshDatabase;

    protected function createUser(array $attrs = []): User
    {
        return User::factory()->create($attrs);
    }

    protected function createAgent(array $attrs = []): User
    {
        return User::factory()->create(array_merge(['role' => 'agent'], $attrs));
    }

    protected function createAdmin(array $attrs = []): User
    {
        return User::factory()->create(array_merge(['role' => 'admin'], $attrs));
    }
}
