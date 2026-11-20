const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Setup TypeScript transpile hook for server rendering
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
        target: ts.ScriptTarget.ES2020,
      },
    });
    module._compile(compiled.outputText, filename);
  };
}

// Compile utility module in memory
const filename = path.resolve(__dirname, '../src/utils/identityWorkloads.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
new Function('exports', 'require', 'module', compiled)(loaded.exports, require, loaded);
const { validateIdentityWorkloads, snapshotAgeReason, requestIdentityWorkloads } = loaded.exports;

// Synthetic test fixture matching the live backend response
const fixture = () => ({
  source: 'live-kubernetes',
  cluster: 'kind-trustmesh-network-lab',
  namespace: 'trustmesh-integration-test',
  available: true,
  workloads: [
    {
      name: 'trustmesh-integration-authorized-7c9bcd47f-6txvk',
      phase: 'Running',
      serviceAccountName: 'trustmesh-authorized-sa',
      labels: { app: 'authorized-client' },
      readyContainers: 2,
      totalContainers: 2,
    },
    {
      name: 'trustmesh-integration-spiffe-verifier',
      phase: 'Succeeded',
      serviceAccountName: 'default',
      labels: { app: 'spiffe-verifier' },
      readyContainers: 0,
      totalContainers: 1,
    },
  ],
  serviceAccounts: [
    { name: 'default' },
    { name: 'trustmesh-authorized-sa' },
  ],
  spireRegistration: {
    name: 'trustmesh-integration-workload-identity',
    spiffeIDTemplate: 'spiffe://trustmesh.internal/ns/{{ .PodMeta.Namespace }}/sa/{{ .PodSpec.ServiceAccountName }}',
    namespaceSelector: { matchLabels: { 'kubernetes.io/metadata.name': 'trustmesh-integration-test' } },
    podSelector: { matchLabels: { 'spiffe.io/spire-managed-identity': 'true' } },
    statistics: { podsSelected: 3, entriesToSet: 3 },
    available: true,
    error: null,
  },
  spireComponents: [
    {
      name: 'trustmesh-spire-server',
      kind: 'StatefulSet',
      desiredReplicas: 1,
      readyReplicas: 1,
      available: true,
      error: null,
    },
    {
      name: 'trustmesh-spire-agent',
      kind: 'DaemonSet',
      desiredReplicas: 1,
      readyReplicas: 1,
      available: true,
      error: null,
    },
    {
      name: 'trustmesh-spire-spiffe-csi-driver',
      kind: 'DaemonSet',
      desiredReplicas: 1,
      readyReplicas: 1,
      available: true,
      error: null,
    },
  ],
  collectedAt: '2026-11-18T14:30:00Z',
});

test('accepts valid live identity workload responses', () => {
  const result = validateIdentityWorkloads(fixture());
  assert.deepEqual(result, fixture());
  assert.equal(result.workloads.length, 2);
  assert.equal(result.spireRegistration.available, true);
  assert.equal(result.spireComponents.length, 3);
});

test('handles partial SPIRE failure while preserving live workloads', () => {
  const partial = fixture();
  partial.spireRegistration.available = false;
  partial.spireRegistration.error = 'SPIRE registration unavailable';
  partial.spireComponents[0].available = false;
  partial.spireComponents[0].error = 'SPIRE controller status unavailable';

  const result = validateIdentityWorkloads(partial);
  assert.equal(result.available, true);
  assert.equal(result.workloads.length, 2);
  assert.equal(result.spireRegistration.available, false);
  assert.equal(result.spireRegistration.error, 'SPIRE registration unavailable');
  assert.equal(result.spireComponents[0].available, false);
});

test('rejects malformed identity responses', () => {
  const mutations = [
    (v) => { v.source = 'demo'; },
    (v) => { v.collectedAt = 'invalid'; },
    (v) => { v.cluster = ''; },
    (v) => { v.namespace = ''; },
    (v) => { v.workloads = null; },
    (v) => { v.workloads[0].name = ''; },
    (v) => { v.workloads[0].readyContainers = 3; }, // ready > total
    (v) => { v.serviceAccounts = 'invalid'; },
    (v) => { v.spireRegistration = null; },
    (v) => { v.spireComponents = {}; },
  ];
  for (const mutate of mutations) {
    const value = fixture();
    mutate(value);
    assert.throws(() => validateIdentityWorkloads(value), /Invalid Identity Workloads response/);
  }
});

test('freshness evaluator marks stale and future timestamps correctly', () => {
  const collected = fixture().collectedAt;
  const time = Date.parse(collected);
  assert.equal(snapshotAgeReason(collected, time + 30_000), null);
  assert.match(snapshotAgeReason(collected, time + 65_000), /60 seconds/);
  assert.match(snapshotAgeReason(collected, time - 35_000), /future/);
});

test('fetch handles HTTP 503 error responses with API detail', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, '/api/identity/workloads');
    return {
      ok: false,
      status: 503,
      json: async () => ({ error: 'Pod or ServiceAccount inventory unavailable' }),
    };
  });
  await assert.rejects(
    requestIdentityWorkloads(new AbortController().signal),
    /Pod or ServiceAccount inventory unavailable/
  );
  mock.mock.restore();
});

test('IdentityAccessView renders both live Kubernetes status section and demonstration section', () => {
  const { IdentityAccessView } = require('../src/components/identity/IdentityAccessView.tsx');
  const html = renderToStaticMarkup(React.createElement(IdentityAccessView));

  // Must render live container
  assert.match(html, /Verified Live Kubernetes Workloads &amp; ServiceAccounts/);
  assert.match(html, /kind-trustmesh-network-lab/);
  assert.match(html, /trustmesh-integration-test/);

  // Must render demonstration provenance and section divider
  assert.match(html, /DEMONSTRATION DATA/);
  assert.match(html, /DEMONSTRATION SCENARIOS &amp; TRIAGE FIXTURES/);
  assert.match(html, /Demonstration Workload Catalog/);

  // Must contain disclaimers preventing misrepresentation
  assert.match(html, /Registration does NOT prove that an issued SVID is currently valid/);
  assert.match(html, /SPIRE is NOT configured as Istio/);
});
