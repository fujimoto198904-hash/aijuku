import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';
import Stripe from 'stripe';

type StripeBillingModule = typeof import('../lib/stripe-billing');
type StripeRouteModule = typeof import('../lib/stripe-route');
type StripeWebhookRouteModule =
  typeof import('../app/api/billing/webhook/route');
type BillingDatabaseModule = typeof import('../db/billing');

type TestUser = {
  userId: string;
  isDemo: boolean;
};

type TestMember = {
  status: 'active' | 'suspended' | 'withdrawn';
  currentConsent: boolean;
};

type RouteState = {
  normalUser: TestUser | null;
  billingUser: TestUser | null;
  member: TestMember | null;
};

type WebhookStubs = {
  claims: unknown[];
  claim(
    input: unknown,
  ): Promise<
    | { status: 'claimed'; attemptCount: number }
    | { status: 'processed' }
    | { status: 'busy' }
  >;
  complete(input: unknown): Promise<boolean>;
  process(...input: unknown[]): Promise<'handled' | 'ignored'>;
};

type CheckGlobal = typeof globalThis & {
  __AIJUKU_STRIPE_CHECK_ENV__?: Record<string, unknown>;
  __AIJUKU_STRIPE_ROUTE_STATE__?: RouteState;
  __AIJUKU_STRIPE_WEBHOOK_STUBS__?: WebhookStubs;
};

const checkGlobal = globalThis as CheckGlobal;
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stripeEnvironment: Record<string, unknown> = {};
checkGlobal.__AIJUKU_STRIPE_CHECK_ENV__ = stripeEnvironment;

let bundledModuleSequence = 0;

async function importBundledModule<T>(
  entryPoint: string,
  virtualModules: ReadonlyMap<string, string>,
): Promise<T> {
  const result = await build({
    absWorkingDir: projectRoot,
    bundle: true,
    entryPoints: [entryPoint],
    format: 'esm',
    logLevel: 'silent',
    platform: 'node',
    target: 'node22',
    tsconfig: 'tsconfig.json',
    write: false,
    plugins: [
      {
        name: 'aijuku-stripe-check-virtual-modules',
        setup(builder) {
          builder.onResolve({ filter: /.*/ }, (args) => {
            if (!virtualModules.has(args.path)) return undefined;
            return { path: args.path, namespace: 'aijuku-stripe-check' };
          });
          builder.onLoad(
            { filter: /.*/, namespace: 'aijuku-stripe-check' },
            (args) => ({
              contents: virtualModules.get(args.path) ?? '',
              loader: 'ts',
            }),
          );
        },
      },
    ],
  });
  const source = result.outputFiles[0]?.text;
  assert.ok(source, `failed to bundle ${entryPoint}`);
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${bundledModuleSequence++}`;
  return (await import(moduleUrl)) as T;
}

function replaceStripeEnvironment(next: Record<string, unknown>): void {
  for (const key of Object.keys(stripeEnvironment)) {
    delete stripeEnvironment[key];
  }
  Object.assign(stripeEnvironment, next);
}

function configurationReason(
  billing: StripeBillingModule,
  action: () => unknown,
  expectedReason:
    | 'disabled'
    | 'invalid-secret-key'
    | 'missing-account-id'
    | 'missing-webhook-secret',
): void {
  assert.throws(
    action,
    (error: unknown) =>
      error instanceof billing.StripeBillingConfigurationError &&
      error.reason === expectedReason,
  );
}

const cloudflareEnvironmentModule = `
  export const env = globalThis.__AIJUKU_STRIPE_CHECK_ENV__;
`;
const commonVirtualModules = new Map([
  ['cloudflare:workers', cloudflareEnvironmentModule],
]);
const billing = await importBundledModule<StripeBillingModule>(
  'lib/stripe-billing.ts',
  commonVirtualModules,
);

const testSecretKey = ['sk', 'test', 'billingcheck'].join('_');
const secondTestSecretKey = ['rk', 'test', 'billingcheck'].join('_');
const liveSecretKey = ['sk', 'live', 'billingcheck'].join('_');
const liveRestrictedKey = ['rk', 'live', 'billingcheck'].join('_');
const webhookSecret = ['whsec', 'billingcheck'].join('_');
const stripeAccountId = ['acct', 'billingcheck123'].join('_');
const portalConfigurationId = 'bpc_1UBbJVD8iUMy4IW9MrhzJJpZ';

replaceStripeEnvironment({});
configurationReason(
  billing,
  () => billing.getStripeBillingRuntime(),
  'disabled',
);
replaceStripeEnvironment({
  STRIPE_BILLING_MODE: 'live',
  STRIPE_SECRET_KEY: testSecretKey,
  STRIPE_ACCOUNT_ID: stripeAccountId,
});
configurationReason(
  billing,
  () => billing.getStripeBillingRuntime(),
  'disabled',
);
for (const forbiddenKey of [liveSecretKey, liveRestrictedKey]) {
  replaceStripeEnvironment({
    STRIPE_BILLING_MODE: 'test',
    STRIPE_SECRET_KEY: forbiddenKey,
    STRIPE_ACCOUNT_ID: stripeAccountId,
  });
  configurationReason(
    billing,
    () => billing.getStripeBillingRuntime(),
    'invalid-secret-key',
  );
}
replaceStripeEnvironment({
  STRIPE_BILLING_MODE: 'test',
  STRIPE_SECRET_KEY: testSecretKey,
  STRIPE_ACCOUNT_ID: stripeAccountId,
});
configurationReason(
  billing,
  () => billing.getStripeBillingRuntime({ requireWebhookSecret: true }),
  'missing-webhook-secret',
);
replaceStripeEnvironment({
  STRIPE_BILLING_MODE: 'test',
  STRIPE_SECRET_KEY: secondTestSecretKey,
  STRIPE_ACCOUNT_ID: stripeAccountId,
  STRIPE_WEBHOOK_SECRET: webhookSecret,
});
const testRuntime = billing.getStripeBillingRuntime({
  requireWebhookSecret: true,
});
assert.equal(testRuntime.accountId, stripeAccountId);
assert.equal(testRuntime.livemode, false);
assert.equal(testRuntime.webhookSecret, webhookSecret);
assert.equal(billing.stripeApiVersion, '2026-08-26.dahlia');
assert.equal(Stripe.API_VERSION, billing.stripeApiVersion);
assert.equal(Stripe.PACKAGE_VERSION, '22.6.1');
assert.equal(billing.stripeBillingPortalConfigurationId, portalConfigurationId);

for (const serviceType of [
  'in-person-tutor',
  'online-tutor',
  'self-study',
] as const) {
  const plan = billing.getStripeBillingPlan(serviceType);
  const price = {
    active: true,
    billing_scheme: 'per_unit',
    currency: plan.currency,
    custom_unit_amount: null,
    livemode: false,
    product: { active: true, id: plan.productId, object: 'product' },
    recurring:
      plan.recurringInterval === null
        ? null
        : {
            interval: plan.recurringInterval,
            interval_count: 1,
            usage_type: 'licensed',
          },
    type: plan.recurringInterval === null ? 'one_time' : 'recurring',
    unit_amount: plan.amount,
  } as unknown as Stripe.Price;
  const priceClient = {
    prices: { list: async () => ({ data: [price] }) },
  } as unknown as Stripe;
  assert.equal(
    await billing.resolveVerifiedStripePrice(priceClient, plan),
    price,
  );
  const mismatchedClient = {
    prices: {
      list: async () => ({
        data: [{ ...price, unit_amount: plan.amount + 1 }],
      }),
    },
  } as unknown as Stripe;
  await assert.rejects(
    billing.resolveVerifiedStripePrice(mismatchedClient, plan),
    billing.StripeCatalogConfigurationError,
  );
}

const idempotencyInput = {
  accountId: stripeAccountId,
  scope: 'application:billing-check',
  generation: 'initial',
};
const checkoutKey =
  await billing.createStripeCheckoutIdempotencyKey(idempotencyInput);
assert.equal(
  checkoutKey,
  await billing.createStripeCheckoutIdempotencyKey(idempotencyInput),
);
assert.notEqual(
  checkoutKey,
  await billing.createStripeCheckoutIdempotencyKey({
    ...idempotencyInput,
    generation: 'cs_test_nextgeneration',
  }),
);
assert.notEqual(
  checkoutKey,
  await billing.createStripeCheckoutIdempotencyKey({
    ...idempotencyInput,
    scope: 'application:other',
  }),
);
assert.match(checkoutKey, /^aijuku-checkout-v1:acct_[^:]+:[0-9a-f]{64}$/);
assert.ok(checkoutKey.length <= 255);
const attemptId = await billing.createStripeCheckoutAttemptId(idempotencyInput);
assert.match(attemptId, /^aijuku-attempt-v1:[0-9a-f]{64}$/);
assert.equal(
  billing.createStripeIntegrationIdentifier(checkoutKey),
  billing.createStripeIntegrationIdentifier(checkoutKey),
);
assert.match(
  billing.createStripeIntegrationIdentifier(checkoutKey),
  /^aijuku_[a-z]{8}$/,
);

assert.equal(
  billing.isStripeHostedUrl(
    'https://checkout.stripe.com/c/pay/cs_test_example',
    'checkout',
  ),
  true,
);
assert.equal(
  billing.isStripeHostedUrl(
    'https://billing.stripe.com/p/session/example',
    'portal',
  ),
  true,
);
for (const unsafeUrl of [
  'http://checkout.stripe.com/c/pay/example',
  'https://checkout.stripe.com.evil.example/c/pay/example',
  'https://user:password@checkout.stripe.com/c/pay/example',
  'https://billing.stripe.com.evil.example/p/session/example',
]) {
  assert.equal(
    billing.isStripeHostedUrl(
      unsafeUrl,
      unsafeUrl.includes('billing') ? 'portal' : 'checkout',
    ),
    false,
  );
}

const portalRouteSource = await readFile(
  join(projectRoot, 'app/api/billing/portal/route.ts'),
  'utf8',
);
assert.match(
  portalRouteSource,
  /configuration:\s*stripeBillingPortalConfigurationId/,
  'Customer Portal sessions must use the reviewed sandbox configuration',
);

const routeState: RouteState = {
  normalUser: null,
  billingUser: null,
  member: null,
};
checkGlobal.__AIJUKU_STRIPE_ROUTE_STATE__ = routeState;
const routeVirtualModules = new Map(commonVirtualModules);
routeVirtualModules.set(
  '@/app/chatgpt-auth',
  `
    export async function getChatGPTUser() {
      return globalThis.__AIJUKU_STRIPE_ROUTE_STATE__.normalUser;
    }
    export async function getBillingAuthenticatedUser() {
      return globalThis.__AIJUKU_STRIPE_ROUTE_STATE__.billingUser;
    }
  `,
);
routeVirtualModules.set(
  '@/db/membership',
  `
    export async function getMember() {
      return globalThis.__AIJUKU_STRIPE_ROUTE_STATE__.member;
    }
    export function hasCurrentMembershipConsent(member) {
      return member.currentConsent;
    }
  `,
);
const stripeRoute = await importBundledModule<StripeRouteModule>(
  'lib/stripe-route.ts',
  routeVirtualModules,
);

function billingRequest(origin = 'https://school.example'): Request {
  return new Request('https://school.example/api/billing/checkout', {
    method: 'POST',
    headers: { origin, 'sec-fetch-site': 'same-origin' },
  });
}

async function assertBillingResponseStatus(
  result: Awaited<ReturnType<StripeRouteModule['requireBillingMember']>>,
  expectedStatus: number,
): Promise<void> {
  assert.ok('response' in result, `expected HTTP ${expectedStatus}`);
  assert.equal(result.response.status, expectedStatus);
}

const originalVercel = process.env.VERCEL;
try {
  process.env.VERCEL = '1';
  await assertBillingResponseStatus(
    await stripeRoute.requireBillingMember(billingRequest()),
    503,
  );
  delete process.env.VERCEL;

  await assertBillingResponseStatus(
    await stripeRoute.requireBillingMember(
      billingRequest('https://cross-origin.example'),
    ),
    403,
  );
  await assertBillingResponseStatus(
    await stripeRoute.requireBillingMember(billingRequest()),
    401,
  );

  routeState.normalUser = { userId: 'demo-member', isDemo: true };
  await assertBillingResponseStatus(
    await stripeRoute.requireBillingMember(billingRequest()),
    403,
  );

  routeState.normalUser = { userId: 'member-1', isDemo: false };
  routeState.member = null;
  await assertBillingResponseStatus(
    await stripeRoute.requireBillingMember(billingRequest()),
    403,
  );

  routeState.member = { status: 'suspended', currentConsent: true };
  await assertBillingResponseStatus(
    await stripeRoute.requireBillingMember(billingRequest()),
    403,
  );

  routeState.member = { status: 'active', currentConsent: false };
  await assertBillingResponseStatus(
    await stripeRoute.requireBillingMember(billingRequest()),
    403,
  );

  routeState.member = { status: 'active', currentConsent: true };
  const activeCheckout =
    await stripeRoute.requireBillingMember(billingRequest());
  assert.ok(!('response' in activeCheckout));

  routeState.normalUser = null;
  routeState.billingUser = { userId: 'member-1', isDemo: false };
  routeState.member = { status: 'withdrawn', currentConsent: false };
  const inactivePortal =
    await stripeRoute.requireBillingPortalMember(billingRequest());
  assert.ok(!('response' in inactivePortal));
} finally {
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
}

const webhookStubs: WebhookStubs = {
  claims: [],
  async claim(input) {
    this.claims.push(input);
    return { status: 'processed' };
  },
  async complete() {
    throw new Error('completed webhook events must not be processed again');
  },
  async process() {
    throw new Error('completed webhook events must not be processed again');
  },
};
checkGlobal.__AIJUKU_STRIPE_WEBHOOK_STUBS__ = webhookStubs;
const webhookVirtualModules = new Map(routeVirtualModules);
webhookVirtualModules.set(
  '@/db/billing',
  `
    export async function claimStripeWebhookEvent(input) {
      return globalThis.__AIJUKU_STRIPE_WEBHOOK_STUBS__.claim(input);
    }
    export async function completeStripeWebhookEvent(input) {
      return globalThis.__AIJUKU_STRIPE_WEBHOOK_STUBS__.complete(input);
    }
  `,
);
webhookVirtualModules.set(
  '@/lib/stripe-webhook',
  `
    export class StripeWebhookDataError extends Error {}
    export class StripeWebhookObjectBusyError extends Error {}
    export async function processStripeBillingEvent(...input) {
      return globalThis.__AIJUKU_STRIPE_WEBHOOK_STUBS__.process(...input);
    }
  `,
);
const webhookRoute = await importBundledModule<StripeWebhookRouteModule>(
  'app/api/billing/webhook/route.ts',
  webhookVirtualModules,
);

function webhookEvent(overrides: Partial<Stripe.Event> = {}): Stripe.Event {
  return {
    account: stripeAccountId,
    api_version: billing.stripeApiVersion,
    created: Math.floor(Date.now() / 1_000),
    data: { object: { id: 'cus_billingcheck', object: 'customer' } },
    id: 'evt_billingcheck',
    livemode: false,
    object: 'event',
    pending_webhooks: 1,
    request: null,
    type: 'customer.deleted',
    ...overrides,
  } as Stripe.Event;
}

async function signedWebhookRequest(event: Stripe.Event): Promise<Request> {
  const payload = JSON.stringify(event);
  const signature = await Stripe.webhooks.generateTestHeaderStringAsync({
    payload,
    secret: webhookSecret,
  });
  return new Request('https://school.example/api/billing/webhook', {
    body: payload,
    headers: { 'stripe-signature': signature },
    method: 'POST',
  });
}

async function responseError(response: Response): Promise<string> {
  const body = (await response.json()) as { error?: unknown };
  return typeof body.error === 'string' ? body.error : '';
}

const originalFetch = globalThis.fetch;
let stripeApiCalls = 0;
globalThis.fetch = (async (input: RequestInfo | URL) => {
  stripeApiCalls += 1;
  const url =
    typeof input === 'string'
      ? new URL(input)
      : input instanceof URL
        ? input
        : new URL(input.url);
  assert.equal(url.origin, 'https://api.stripe.com');
  assert.equal(url.pathname, '/v1/account');
  return new Response(
    JSON.stringify({ id: stripeAccountId, object: 'account' }),
    {
      headers: {
        'content-type': 'application/json',
        'request-id': 'req_billingcheck',
      },
      status: 200,
    },
  );
}) as typeof fetch;
try {
  replaceStripeEnvironment({});
  let webhookResponse = await webhookRoute.POST(
    new Request('https://school.example/api/billing/webhook', {
      method: 'POST',
    }),
  );
  assert.equal(webhookResponse.status, 503);

  replaceStripeEnvironment({
    STRIPE_BILLING_MODE: 'test',
    STRIPE_SECRET_KEY: testSecretKey,
    STRIPE_ACCOUNT_ID: stripeAccountId,
    STRIPE_WEBHOOK_SECRET: webhookSecret,
  });
  webhookResponse = await webhookRoute.POST(
    new Request('https://school.example/api/billing/webhook', {
      method: 'POST',
    }),
  );
  assert.equal(webhookResponse.status, 400);
  assert.match(await responseError(webhookResponse), /signature/i);

  webhookResponse = await webhookRoute.POST(
    new Request('https://school.example/api/billing/webhook', {
      body: JSON.stringify(webhookEvent()),
      headers: { 'stripe-signature': 'invalid' },
      method: 'POST',
    }),
  );
  assert.equal(webhookResponse.status, 400);
  assert.match(await responseError(webhookResponse), /invalid/i);

  for (const invalidEnvelope of [
    webhookEvent({ api_version: '2025-01-01.test' }),
    webhookEvent({ livemode: true }),
    webhookEvent({ account: 'acct_otherbilling123' }),
  ]) {
    webhookResponse = await webhookRoute.POST(
      await signedWebhookRequest(invalidEnvelope),
    );
    assert.equal(webhookResponse.status, 400);
    assert.match(await responseError(webhookResponse), /mode or account/i);
  }
  assert.equal(stripeApiCalls, 0);
  assert.equal(webhookStubs.claims.length, 0);

  webhookResponse = await webhookRoute.POST(
    await signedWebhookRequest(webhookEvent()),
  );
  assert.equal(webhookResponse.status, 200);
  assert.deepEqual(await webhookResponse.json(), {
    duplicate: true,
    received: true,
  });
  assert.equal(stripeApiCalls, 1);
  assert.equal(webhookStubs.claims.length, 1);
} finally {
  globalThis.fetch = originalFetch;
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') {
    assert.ok(Number.isFinite(value));
    return String(value);
  }
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value !== 'string') {
    throw new TypeError('unsupported SQLite test binding');
  }
  return `'${value.replaceAll("'", "''")}'`;
}

function bindSql(query: string, bindings: readonly unknown[]): string {
  let index = 0;
  const bound = query.replaceAll('?', () => {
    assert.ok(index < bindings.length, 'missing SQLite test binding');
    return sqlLiteral(bindings[index++]);
  });
  assert.equal(index, bindings.length, 'unused SQLite test binding');
  return bound;
}

function executeSql(databasePath: string, sql: string): string {
  return execFileSync('sqlite3', ['-batch', databasePath], {
    encoding: 'utf8',
    input: `PRAGMA foreign_keys = ON;\n${sql}`,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function querySql(
  databasePath: string,
  sql: string,
): Record<string, unknown>[] {
  const output = execFileSync('sqlite3', ['-batch', '-json', databasePath], {
    encoding: 'utf8',
    input: `PRAGMA foreign_keys = ON;\n${sql}`,
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
  if (!output) return [];
  return JSON.parse(output) as Record<string, unknown>[];
}

class SQLiteD1PreparedStatement {
  private bindings: unknown[] = [];

  constructor(
    private readonly databasePath: string,
    private readonly query: string,
  ) {}

  bind(...bindings: unknown[]): this {
    this.bindings = bindings;
    return this;
  }

  async first<T>(): Promise<T | null> {
    const rows = querySql(
      this.databasePath,
      bindSql(this.query, this.bindings),
    );
    return (rows[0] as T | undefined) ?? null;
  }

  async all<T>(): Promise<{ results: T[]; success: true }> {
    return {
      results: querySql(
        this.databasePath,
        bindSql(this.query, this.bindings),
      ) as T[],
      success: true,
    };
  }

  async run(): Promise<{ meta: { changes: number }; success: true }> {
    const rows = querySql(
      this.databasePath,
      `${bindSql(this.query, this.bindings)}; SELECT changes() AS changes;`,
    );
    return {
      meta: { changes: Number(rows.at(-1)?.changes ?? 0) },
      success: true,
    };
  }
}

class SQLiteD1Database {
  constructor(private readonly databasePath: string) {}

  prepare(query: string): SQLiteD1PreparedStatement {
    return new SQLiteD1PreparedStatement(this.databasePath, query);
  }
}

function assertSqlFails(
  databasePath: string,
  sql: string,
  message: string,
): void {
  let failed = false;
  try {
    executeSql(databasePath, sql);
  } catch {
    failed = true;
  }
  assert.equal(failed, true, message);
}

const temporaryDirectory = await mkdtemp(
  join(tmpdir(), 'aijuku-billing-check-'),
);
try {
  const databasePath = join(temporaryDirectory, 'billing.sqlite');
  const journal = JSON.parse(
    await readFile(join(projectRoot, 'drizzle/meta/_journal.json'), 'utf8'),
  ) as { entries: { tag: string }[] };
  assert.ok(
    journal.entries.some((entry) => entry.tag === '0010_bored_shadowcat'),
    'Stripe migration must remain in the Drizzle journal',
  );
  for (const entry of journal.entries) {
    executeSql(
      databasePath,
      await readFile(join(projectRoot, 'drizzle', `${entry.tag}.sql`), 'utf8'),
    );
  }

  const stripeTables = querySql(
    databasePath,
    `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name IN (
          'billing_customers',
          'billing_checkout_sessions',
          'billing_subscriptions',
          'stripe_webhook_events',
          'stripe_object_sync_locks'
        )
      ORDER BY name;
    `,
  ).map((row) => row.name);
  assert.deepEqual(stripeTables, [
    'billing_checkout_sessions',
    'billing_customers',
    'billing_subscriptions',
    'stripe_object_sync_locks',
    'stripe_webhook_events',
  ]);
  assert.deepEqual(querySql(databasePath, 'PRAGMA foreign_key_check;'), []);

  executeSql(
    databasePath,
    `
      INSERT INTO members (
        id, email, display_name, status,
        terms_version, terms_accepted_at,
        privacy_version, privacy_accepted_at,
        created_at, updated_at
      ) VALUES (
        'member-billing-check', 'member@example.invalid', 'Billing Check',
        'active', 'terms-v1', 1, 'privacy-v1', 1, 1, 1
      );
      INSERT INTO applications (
        id, member_id, client_request_id, service_type, status,
        goal, preferred_schedule, participants, created_at, updated_at
      ) VALUES (
        'application-billing-check', 'member-billing-check', 'request-1',
        'in-person-tutor', 'confirmed', 'test', 'test', 1, 1, 1
      );
      INSERT INTO billing_checkout_sessions (
        stripe_checkout_session_id, member_id, application_id,
        checkout_attempt_id, stripe_idempotency_key, stripe_account_id,
        livemode, service_type, mode, status, payment_status,
        state_observed_at, created_at, updated_at
      ) VALUES (
        'cs_test_billingcheck1', 'member-billing-check',
        'application-billing-check', 'attempt-1', 'idempotency-1',
        '${stripeAccountId}', 0, 'in-person-tutor', 'payment', 'open',
        'unpaid', 1, 1, 1
      );
    `,
  );
  assertSqlFails(
    databasePath,
    `
      INSERT INTO billing_checkout_sessions (
        stripe_checkout_session_id, member_id, application_id,
        checkout_attempt_id, stripe_idempotency_key, stripe_account_id,
        livemode, service_type, mode, status, payment_status,
        state_observed_at, created_at, updated_at
      ) VALUES (
        'cs_test_billingcheck2', 'member-billing-check',
        'application-billing-check', 'attempt-1', 'idempotency-2',
        '${stripeAccountId}', 0, 'in-person-tutor', 'payment', 'open',
        'unpaid', 2, 2, 2
      );
    `,
    'checkout attempts must be unique per account and mode',
  );
  assertSqlFails(
    databasePath,
    `
      INSERT INTO billing_checkout_sessions (
        stripe_checkout_session_id, member_id, application_id,
        checkout_attempt_id, stripe_idempotency_key, stripe_account_id,
        livemode, service_type, mode, status, payment_status,
        state_observed_at, created_at, updated_at
      ) VALUES (
        'cs_test_billingcheck4', 'member-billing-check',
        'application-billing-check', 'attempt-4', 'idempotency-1',
        '${stripeAccountId}', 0, 'in-person-tutor', 'payment', 'open',
        'unpaid', 4, 4, 4
      );
    `,
    'Stripe idempotency keys must be unique per account and mode',
  );
  assertSqlFails(
    databasePath,
    `
      INSERT INTO billing_checkout_sessions (
        stripe_checkout_session_id, member_id, application_id,
        checkout_attempt_id, stripe_idempotency_key, stripe_account_id,
        livemode, service_type, mode, status, payment_status,
        state_observed_at, created_at, updated_at
      ) VALUES (
        'cs_test_billingcheck3', 'member-billing-check', NULL,
        'attempt-3', 'idempotency-3', '${stripeAccountId}', 0,
        'in-person-tutor', 'payment', 'open', 'unpaid', 3, 3, 3
      );
    `,
    'one-time checkout rows must retain their application foreign key',
  );
  assertSqlFails(
    databasePath,
    `
      INSERT INTO billing_subscriptions (
        stripe_subscription_id, member_id, application_id,
        stripe_account_id, livemode, stripe_customer_id, service_type,
        stripe_price_id, status, state_observed_at,
        cancel_at_period_end, created_at, updated_at
      ) VALUES (
        'sub_billingcheck', 'member-billing-check',
        'application-billing-check', '${stripeAccountId}', 0,
        'cus_billingcheck', 'self-study', 'price_billingcheck', 'active',
        1, 0, 1, 1
      );
    `,
    'service-wide subscriptions must not be attached to one application',
  );

  stripeEnvironment.DB = new SQLiteD1Database(databasePath);
  const billingDatabase = await importBundledModule<BillingDatabaseModule>(
    'db/billing.ts',
    commonVirtualModules,
  );
  const objectLock = {
    stripeAccountId,
    livemode: false,
    stripeObjectType: 'checkout_session' as const,
    stripeObjectId: 'cs_test_lockcheck',
  };
  assert.equal(
    await billingDatabase.claimStripeObjectSyncLock({
      ...objectLock,
      leaseOwner: 'evt_lock:1',
    }),
    true,
  );
  assert.equal(
    await billingDatabase.claimStripeObjectSyncLock({
      ...objectLock,
      leaseOwner: 'evt_lock:2',
    }),
    false,
  );
  executeSql(
    databasePath,
    `UPDATE stripe_object_sync_locks SET lease_expires_at = 0;`,
  );
  assert.equal(
    await billingDatabase.claimStripeObjectSyncLock({
      ...objectLock,
      leaseOwner: 'evt_lock:2',
    }),
    true,
  );
  assert.equal(
    await billingDatabase.releaseStripeObjectSyncLock({
      ...objectLock,
      leaseOwner: 'evt_lock:1',
    }),
    false,
  );
  assert.equal(
    await billingDatabase.releaseStripeObjectSyncLock({
      ...objectLock,
      leaseOwner: 'evt_lock:2',
    }),
    true,
  );

  const eventClaim = {
    stripeEventId: 'evt_claimcheck',
    stripeAccountId,
    livemode: false,
    eventType: 'checkout.session.completed',
    apiVersion: billing.stripeApiVersion,
    stripeCreatedAt: 1,
  };
  assert.deepEqual(await billingDatabase.claimStripeWebhookEvent(eventClaim), {
    status: 'claimed',
    attemptCount: 1,
  });
  assert.deepEqual(await billingDatabase.claimStripeWebhookEvent(eventClaim), {
    status: 'busy',
  });
  executeSql(
    databasePath,
    `UPDATE stripe_webhook_events SET processing_started_at = 0 WHERE stripe_event_id = 'evt_claimcheck';`,
  );
  assert.deepEqual(await billingDatabase.claimStripeWebhookEvent(eventClaim), {
    status: 'claimed',
    attemptCount: 2,
  });
  assert.equal(
    await billingDatabase.completeStripeWebhookEvent({
      ...eventClaim,
      attemptCount: 1,
      succeeded: true,
    }),
    false,
  );
  assert.equal(
    await billingDatabase.completeStripeWebhookEvent({
      ...eventClaim,
      attemptCount: 2,
      succeeded: true,
    }),
    true,
  );
  assert.deepEqual(await billingDatabase.claimStripeWebhookEvent(eventClaim), {
    status: 'processed',
  });
  assert.deepEqual(querySql(databasePath, 'PRAGMA foreign_key_check;'), []);
} finally {
  delete stripeEnvironment.DB;
  await rm(temporaryDirectory, { force: true, recursive: true });
}

console.log('Stripe課金検査: OK（テスト専用・認可・署名・D1冪等性）');
