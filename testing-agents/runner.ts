#!/usr/bin/env npx tsx
/**
 * InsureFlow Testing Agent Runner
 *
 * Orchestrates all role-based testing agents against the live API.
 * Each agent logs in as a specific demo user and exercises the endpoints
 * that role would use in a real session.
 *
 * Usage:
 *   npx tsx runner.ts                     # Interactive — pick an agent
 *   npx tsx runner.ts --all               # Run ALL agents sequentially
 *   npx tsx runner.ts --agent consumer    # Run a specific agent
 *   npx tsx runner.ts --agent agent
 *   npx tsx runner.ts --agent agency_owner
 *   npx tsx runner.ts --agent carrier
 *   npx tsx runner.ts --agent admin
 *   npx tsx runner.ts --agent superadmin
 *   npx tsx runner.ts --parallel          # Run ALL agents concurrently
 *
 * Environment:
 *   API_URL=https://api.insurons.com/api  (default)
 */

import { BaseTestAgent, AgentReport } from './base-agent.js';
import {
  ConsumerTestAgent,
  AgentTestAgent,
  AgencyOwnerTestAgent,
  CarrierTestAgent,
  AdminTestAgent,
  SuperadminTestAgent,
} from './agents/index.js';

// ── Colors ──────────────────────────────────────────────────────

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// ── Agent registry ──────────────────────────────────────────────

const AGENT_MAP: Record<string, () => BaseTestAgent> = {
  consumer: () => new ConsumerTestAgent(),
  agent: () => new AgentTestAgent(),
  agency_owner: () => new AgencyOwnerTestAgent(),
  carrier: () => new CarrierTestAgent(),
  admin: () => new AdminTestAgent(),
  superadmin: () => new SuperadminTestAgent(),
};

// ── CLI parsing ─────────────────────────────────────────────────

function parseArgs(): { mode: 'all' | 'parallel' | 'single' | 'interactive'; agentKey?: string } {
  const args = process.argv.slice(2);

  if (args.includes('--all')) return { mode: 'all' };
  if (args.includes('--parallel')) return { mode: 'parallel' };

  const agentIdx = args.indexOf('--agent');
  if (agentIdx !== -1 && args[agentIdx + 1]) {
    const key = args[agentIdx + 1];
    if (!AGENT_MAP[key]) {
      console.error(`${RED}Unknown agent: ${key}${RESET}`);
      console.error(`Available: ${Object.keys(AGENT_MAP).join(', ')}`);
      process.exit(1);
    }
    return { mode: 'single', agentKey: key };
  }

  return { mode: 'interactive' };
}

// ── Summary printer ─────────────────────────────────────────────

function printSummary(reports: AgentReport[]) {
  console.log('');
  console.log(`${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║           INSUREFLOW TEST SUITE SUMMARY              ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${RESET}`);
  console.log('');

  const totalPassed = reports.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = reports.reduce((sum, r) => sum + r.failed, 0);
  const totalTests = reports.reduce((sum, r) => sum + r.totalTests, 0);
  const totalDuration = reports.reduce((sum, r) => sum + r.duration, 0);

  // Per-agent summary
  for (const r of reports) {
    const icon = r.failed === 0 ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    const failStr = r.failed > 0 ? `${RED}${r.failed} failed${RESET}` : `${GREEN}0 failed${RESET}`;
    console.log(
      `  ${icon} ${BOLD}${r.agent}${RESET} ` +
      `${DIM}(${r.role})${RESET}  ` +
      `${GREEN}${r.passed} passed${RESET}, ${failStr}  ` +
      `${DIM}${r.duration}ms${RESET}`
    );

    // Show failed tests
    if (r.failed > 0) {
      for (const t of r.results.filter(t => !t.passed)) {
        console.log(`    ${RED}└─ ${t.name}: ${t.error}${RESET}`);
      }
    }
  }

  console.log('');
  console.log(`${BOLD}  Total: ${totalTests} tests | ${GREEN}${totalPassed} passed${RESET}${BOLD} | ${totalFailed > 0 ? RED : GREEN}${totalFailed} failed${RESET}${BOLD} | ${DIM}${totalDuration}ms${RESET}`);
  console.log('');

  if (totalFailed > 0) {
    console.log(`${YELLOW}⚠  Some tests failed. Review the output above for details.${RESET}`);
  } else {
    console.log(`${GREEN}All tests passed!${RESET}`);
  }
  console.log('');
}

// ── Interactive mode ────────────────────────────────────────────

async function interactiveMode(): Promise<AgentReport[]> {
  /* eslint-disable no-unreachable */
  console.log('');
  console.log(`${BOLD}${CYAN}InsureFlow Testing Agents${RESET}`);
  console.log(`${DIM}Select an agent to run, or choose "all"${RESET}`);
  console.log('');
  console.log('  1. Consumer');
  console.log('  2. Agent');
  console.log('  3. Agency Owner');
  console.log('  4. Carrier');
  console.log('  5. Admin');
  console.log('  6. Superadmin');
  console.log('  7. All (sequential)');
  console.log('  8. All (parallel)');
  console.log('');

  // Read stdin for selection
  const input = await new Promise<string>((resolve) => {
    process.stdout.write('  Enter choice (1-8): ');
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (data: Buffer | string) => resolve(data.toString().trim()));
  });

  const keys = Object.keys(AGENT_MAP);
  const choice = parseInt(input, 10);

  if (choice >= 1 && choice <= 6) {
    const key = keys[choice - 1];
    const agent = AGENT_MAP[key]();
    return [await agent.run()];
  } else if (choice === 7) {
    return runAllSequential();
  } else if (choice === 8) {
    return runAllParallel();
  } else {
    console.error(`${RED}Invalid choice${RESET}`);
    return process.exit(1) as never;
  }
}

// ── Execution modes ─────────────────────────────────────────────

async function runAllSequential(): Promise<AgentReport[]> {
  const reports: AgentReport[] = [];
  for (const key of Object.keys(AGENT_MAP)) {
    const agent = AGENT_MAP[key]();
    reports.push(await agent.run());
  }
  return reports;
}

async function runAllParallel(): Promise<AgentReport[]> {
  console.log(`${DIM}Running all agents in parallel...${RESET}`);
  const promises = Object.keys(AGENT_MAP).map(key => {
    const agent = AGENT_MAP[key]();
    return agent.run();
  });
  return Promise.all(promises);
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  const apiUrl = process.env.API_URL || 'https://api.insurons.com/api';
  console.log(`${DIM}API: ${apiUrl}${RESET}`);

  const { mode, agentKey } = parseArgs();
  let reports: AgentReport[];

  switch (mode) {
    case 'single': {
      const agent = AGENT_MAP[agentKey!]();
      reports = [await agent.run()];
      break;
    }
    case 'all':
      reports = await runAllSequential();
      break;
    case 'parallel':
      reports = await runAllParallel();
      break;
    case 'interactive':
    default:
      reports = await interactiveMode();
      break;
  }

  printSummary(reports);

  const failed = reports.some(r => r.failed > 0);
  process.exit(failed ? 1 : 0);
}

main().catch(err => {
  console.error(`${RED}Fatal error:${RESET}`, err);
  process.exit(1);
});
