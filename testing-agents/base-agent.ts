/**
 * BaseTestAgent — shared HTTP client, auth, logging, and test harness
 * for all role-specific testing agents.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  response?: unknown;
}

export interface AgentReport {
  agent: string;
  role: string;
  email: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
}

interface AuthResponse {
  user: { id: number; name: string; email: string; role: string };
  token: string;
}

// ── Color helpers for terminal output ─────────────────────────────

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// ── Base class ────────────────────────────────────────────────────

export abstract class BaseTestAgent {
  protected apiUrl: string;
  protected token: string | null = null;
  protected userId: number | null = null;
  protected userName: string = '';
  protected results: TestResult[] = [];
  private startTime: number = 0;

  abstract readonly role: string;
  abstract readonly email: string;
  abstract readonly password: string;
  abstract readonly agentName: string;

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || process.env.API_URL || 'https://api.insurons.com/api';
  }

  // ── HTTP helpers ──────────────────────────────────────────────

  protected async request<T = unknown>(
    method: string,
    endpoint: string,
    body?: unknown,
    expectError = false
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const opts: RequestInit = { method, headers };
    if (body && method !== 'GET') {
      opts.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.apiUrl}${endpoint}`, opts);

    if (!response.ok && !expectError) {
      const text = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) as T : {} as T;
  }

  protected get<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  protected post<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>('POST', endpoint, data);
  }

  protected put<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>('PUT', endpoint, data);
  }

  protected del<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }

  // ── Auth ──────────────────────────────────────────────────────

  async login(): Promise<void> {
    const res = await this.post<AuthResponse>('/auth/login', {
      email: this.email,
      password: this.password,
    });
    this.token = res.token;
    this.userId = res.user.id;
    this.userName = res.user.name;
  }

  async logout(): Promise<void> {
    if (this.token) {
      await this.post('/auth/logout').catch(() => {});
      this.token = null;
    }
  }

  // ── Test runner ───────────────────────────────────────────────

  /**
   * Subclasses define their test scenarios here.
   * Each entry is [testName, testFunction].
   */
  abstract defineTests(): Array<[string, () => Promise<void>]>;

  protected async runTest(name: string, fn: () => Promise<void>): Promise<TestResult> {
    const start = Date.now();
    try {
      await fn();
      const result: TestResult = { name, passed: true, duration: Date.now() - start };
      this.results.push(result);
      console.log(`  ${GREEN}✓${RESET} ${name} ${DIM}(${result.duration}ms)${RESET}`);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const result: TestResult = { name, passed: false, duration: Date.now() - start, error: msg };
      this.results.push(result);
      console.log(`  ${RED}✗${RESET} ${name} ${DIM}(${result.duration}ms)${RESET}`);
      console.log(`    ${RED}${msg}${RESET}`);
      return result;
    }
  }

  async run(): Promise<AgentReport> {
    this.results = [];
    this.startTime = Date.now();

    console.log('');
    console.log(`${BOLD}${CYAN}━━━ ${this.agentName} (${this.role}) ━━━${RESET}`);
    console.log(`${DIM}Email: ${this.email}${RESET}`);
    console.log('');

    // Login first
    await this.runTest('Login', async () => {
      await this.login();
      this.assert(!!this.token, 'Expected auth token');
      this.assert(!!this.userId, 'Expected user ID');
    });

    // Only run remaining tests if login succeeded
    if (this.token) {
      const tests = this.defineTests();
      for (const [name, fn] of tests) {
        await this.runTest(name, fn);
      }

      // Logout last
      await this.runTest('Logout', async () => {
        await this.logout();
      });
    }

    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    console.log('');
    console.log(
      `  ${BOLD}Results:${RESET} ` +
      `${GREEN}${passed} passed${RESET}, ` +
      `${failed > 0 ? RED : DIM}${failed} failed${RESET} ` +
      `${DIM}(${totalDuration}ms)${RESET}`
    );

    return {
      agent: this.agentName,
      role: this.role,
      email: this.email,
      totalTests: this.results.length,
      passed,
      failed,
      skipped: 0,
      duration: totalDuration,
      results: this.results,
    };
  }

  // ── Assertions ────────────────────────────────────────────────

  protected assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(`Assertion failed: ${message}`);
  }

  protected assertExists(value: unknown, label: string): void {
    if (value === null || value === undefined) {
      throw new Error(`Expected ${label} to exist, got ${value}`);
    }
  }

  protected assertArray(value: unknown, label: string, minLength = 0): void {
    if (!Array.isArray(value)) {
      throw new Error(`Expected ${label} to be an array, got ${typeof value}`);
    }
    if (value.length < minLength) {
      throw new Error(`Expected ${label} to have at least ${minLength} items, got ${value.length}`);
    }
  }

  protected assertEqual<T>(actual: T, expected: T, label: string): void {
    if (actual !== expected) {
      throw new Error(`Expected ${label} to be ${expected}, got ${actual}`);
    }
  }

  protected assertIncludes(value: string, substr: string, label: string): void {
    if (!value.includes(substr)) {
      throw new Error(`Expected ${label} to include "${substr}", got "${value}"`);
    }
  }

  protected assertGreaterThan(actual: number, minimum: number, label: string): void {
    if (actual <= minimum) {
      throw new Error(`Expected ${label} > ${minimum}, got ${actual}`);
    }
  }

  protected assertOneOf<T>(actual: T, options: T[], label: string): void {
    if (!options.includes(actual)) {
      throw new Error(`Expected ${label} to be one of [${options.join(', ')}], got ${actual}`);
    }
  }
}
