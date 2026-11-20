import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Server,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  Box,
  Check,
  Radio,
} from 'lucide-react';

import { LiveKubernetesStatusResponse, KubernetesWorkloadPod, requestKubernetesStatus, snapshotAgeReason } from '../utils/kubernetesStatus';
export type { KubernetesNodeStatus, KubernetesClusterStatus, KubernetesWorkloadPod, KubernetesIntegrationStatus, LiveKubernetesStatusResponse } from '../utils/kubernetesStatus';

export const LiveKubernetesStatus: React.FC = () => {
  const [snapshot, setSnapshot] = useState<{ data: LiveKubernetesStatusResponse; retrievedAt: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);
  const requestId = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);
  const data = snapshot?.data ?? null;
  const staleReason = data ? (isLoading ? 'Refresh pending; showing previous snapshot' :
    error ? 'Latest refresh failed; showing previous snapshot' : snapshotAgeReason(data.collectedAt, now)) : null;
  const isStale = Boolean(staleReason);

  const fetchStatus = useCallback(async () => {
    const id = ++requestId.current;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setIsLoading(true);
    setError(null);
    try {
      const result = await requestKubernetesStatus(controller.signal);
      if (id !== requestId.current || controller.signal.aborted) return;
      const received = Date.now();
      setSnapshot({ data: result, retrievedAt: new Date(received).toISOString() });
      setNow(received);
    } catch (err: unknown) {
      if (id !== requestId.current || controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Unable to retrieve Kubernetes status');
    } finally {
      if (id === requestId.current && !controller.signal.aborted) {
        setIsLoading(false);
        activeRequest.current = null;
      }
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      ++requestId.current;
      activeRequest.current?.abort();
      clearInterval(timer);
    };
  }, [fetchStatus]);

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return 'Unknown';
    try {
      const d = new Date(isoString);
      return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    } catch {
      return isoString;
    }
  };

  const getPodStatusInfo = (pod: KubernetesWorkloadPod) => {
    const isSucceeded = pod.phase === 'Succeeded';
    const isRunning = pod.phase === 'Running';
    const isAllReady = pod.totalContainers > 0 && pod.readyContainers === pod.totalContainers;

    if (isSucceeded) {
      return {
        badgeLabel: 'Succeeded',
        phaseClass: 'phase-succeeded',
        isHealthy: true,
        summary: 'Completed',
        description: 'API reports pod phase Succeeded',
        containersLabel: `${pod.readyContainers}/${pod.totalContainers} containers ready at collection`,
      };
    }

    if (isRunning && isAllReady) {
      return {
        badgeLabel: 'Running',
        phaseClass: 'phase-running-healthy',
        isHealthy: true,
        summary: 'Ready',
        description: 'All reported containers ready at collection',
        containersLabel: `${pod.readyContainers}/${pod.totalContainers} containers ready`,
      };
    }

    if (isRunning && !isAllReady) {
      return {
        badgeLabel: 'Running (Degraded)',
        phaseClass: 'phase-running-degraded',
        isHealthy: false,
        summary: 'Not Ready',
        description: 'Not all reported containers are ready; cause not supplied',
        containersLabel: `${pod.readyContainers}/${pod.totalContainers} containers ready`,
      };
    }

    return {
      badgeLabel: pod.phase,
      phaseClass: 'phase-failed',
      isHealthy: false,
      summary: pod.phase,
      description: `Pod status reported as ${pod.phase}`,
      containersLabel: `${pod.readyContainers}/${pod.totalContainers} containers ready`,
    };
  };

  return (
    <div className="live-k8s-panel" role="region" aria-label="Kubernetes API Snapshot">
      {/* 1. Header Bar with Explicit Provenance and Actions */}
      <div className="live-k8s-header">
        <div className="live-k8s-title-group">
          <div className="live-k8s-icon-box" aria-hidden="true">
            <Server size={18} />
          </div>
          <div className="live-k8s-title-text">
            <div className="live-k8s-heading-row">
              <h2 className="live-k8s-heading">Live Kubernetes Status</h2>

              {/* Explicit Provenance Badge: ONLY shown when validated live response is present */}
              {data && !error && !isStale && (
                <span className="live-source-badge validated" title="Schema-checked snapshot from the Kubernetes status API; not security telemetry">
                  <span className="live-pulse-dot" />
                  LIVE SOURCE - SNAPSHOT
                </span>
              )}

              {/* Stale Warning Badge if refresh fails after previous success */}
              {isStale && (
                <span className="live-source-badge stale" title={staleReason ?? undefined}>
                  <AlertTriangle size={12} />
                  STALE SNAPSHOT
                </span>
              )}

              {/* Disconnected / Error Badge if no data can be retrieved */}
              {!data && error && (
                <span className="live-source-badge disconnected" title="No live connection established">
                  <XCircle size={12} />
                  CONNECTION UNAVAILABLE
                </span>
              )}

              {/* Initial Loading Badge */}
              {isLoading && !data && (
                <span className="live-source-badge loading">
                  <RefreshCw size={12} className="spin-icon" />
                  CONNECTING...
                </span>
              )}
            </div>
            <p className="live-k8s-subheading">
              Kubernetes API snapshot from Kali. Refreshed on opening and manually; stale after 60 seconds. No security enforcement is evaluated.
            </p>
          </div>
        </div>

        {/* Right Header Metadata & Manual Refresh Button */}
        <div className="live-k8s-controls">
          {data?.collectedAt && (
            <div className="live-timestamp-box" title={`API collection timestamp: ${data.collectedAt}`}>
              <Clock size={13} className="text-muted" />
              <span className="live-timestamp-label">API collected:</span>
              <span className="live-timestamp-val">{formatTimestamp(data.collectedAt)}</span>
            </div>
          )}

          {snapshot && (
            <div className="live-timestamp-box">
              <span className="live-timestamp-label">Browser retrieved:</span>
              <span className="live-timestamp-val">{formatTimestamp(snapshot.retrievedAt)}</span>
            </div>
          )}
          <button
            className={`live-refresh-btn ${isLoading ? 'loading' : ''}`}
            onClick={fetchStatus}
            disabled={isLoading}
            aria-label="Refresh live Kubernetes status"
            title="Poll GET /api/cluster/status for current cluster state"
          >
            <RefreshCw size={13} className={isLoading ? 'spin-icon' : ''} />
            <span>{isLoading ? 'Polling API...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {isStale && <div className="live-error-banner" role="status">Stale snapshot: {staleReason}. Values below describe the previous collection, not current state.</div>}
      {/* 2. Error Notice Banner (When refresh fails or connection is down) */}
      {error && (
        <div className="live-error-banner" role="alert">
          <AlertTriangle size={16} className="text-amber" />
          <div className="live-error-content">
            <span className="live-error-title">Kubernetes API Communication Notice:</span>
            <span className="live-error-desc">{error}</span>
            {!data && (
              <span className="live-error-fallback-note">
                (Strict Data Integrity: No demonstration values or mock clusters are substituted.)
              </span>
            )}
          </div>
          {!data && (
            <button className="live-retry-btn" onClick={fetchStatus} disabled={isLoading}>
              Retry Connection
            </button>
          )}
        </div>
      )}

      {/* 3. Main Data Body: Rendered ONLY when authentic data is available */}
      {data && (
        <div className="live-k8s-body">
          {/* Dual Cluster Cards Grid */}
          <div className="live-clusters-grid">
            {data.clusters.length === 0 && <p>No clusters reported by the API.</p>}
            {data.clusters.map((cluster) => {
              const isClusterConnected = cluster.connected;
              const allNodesReady = cluster.connected && cluster.nodes.length > 0 && cluster.nodes.every((n) => n.ready);

              return (
                <div
                  key={cluster.name}
                  className={`live-cluster-card ${isClusterConnected ? 'connected' : 'disconnected'}`}
                >
                  <div className="cluster-card-top">
                    <div className="cluster-info-left">
                      <div className="cluster-avatar">
                        <Radio size={15} />
                      </div>
                      <div className="cluster-names-col">
                        <div className="cluster-name-row">
                          <span className="cluster-display-name">Cluster: {cluster.name}</span>
                          <span className={`cluster-state-pill ${isClusterConnected ? 'state-active' : 'state-down'}`}>
                            {isClusterConnected ? (
                              <>
                                <Check size={11} /> Connected
                              </>
                            ) : (
                              <>
                                <XCircle size={11} /> Unreachable
                              </>
                            )}
                          </span>
                        </div>
                        <span className="cluster-context-mono">{cluster.context}</span>
                      </div>
                    </div>

                    <div className="cluster-readiness-chip">
                      <span className={`readiness-dot ${allNodesReady ? 'ready' : 'not-ready'}`} />
                      <span>{!cluster.connected ? 'Readiness unavailable' : cluster.nodes.length === 0 ? 'No nodes reported' : allNodesReady ? 'Nodes Ready' : 'Nodes Not Ready'}</span>
                    </div>
                  </div>

                  {/* Nodes List */}
                  <div className="cluster-nodes-list">
                    <span className="cluster-nodes-caption">Nodes (roles not supplied):</span>
                    {cluster.nodes.length === 0 && <p>No node inventory available.</p>}
                    {cluster.nodes.map((node) => (
                      <div key={node.name} className="node-item-row">
                        <div className="node-item-name">
                          <CpuIcon size={13} className="text-muted" />
                          <span>{node.name}</span>
                        </div>
                        <span className={`node-status-tag ${cluster.connected && node.ready ? 'ready' : 'degraded'}`}>
                          {!cluster.connected ? 'Unknown (cluster unreachable)' : node.ready ? 'Ready' : 'NotReady'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Integration Namespace Workload Inventory */}
          <div className="live-integration-section">
            <div className="integration-section-header">
              <div className="integration-header-left">
                <Layers size={16} className="text-cyan" />
                <div className="integration-header-text">
                  <h3 className="integration-title">Integration Namespace Pods</h3>
                  <span className="integration-namespace-badge">
                    Namespace: <strong>{data.integration.namespace}</strong>
                  </span>
                </div>
              </div>

              <div className="integration-header-right">
                <span className={`integration-avail-badge ${data.integration.available ? 'available' : 'unavailable'}`}>
                  {data.integration.available ? (
                    <>
                      <CheckCircle2 size={13} /> Namespace Available
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={13} /> Namespace Unavailable
                    </>
                  )}
                </span>
                <span className="integration-count-pill">{data.integration.pods.length} Pods</span>
              </div>
            </div>

            <p className="live-k8s-subheading">Inventory scope: the API-reported namespace; the response does not identify its cluster.</p>
            {/* Pods Grid */}
            <div className="live-pods-table-wrap">
              <table className="live-pods-table" aria-label="Integration Pods">
                <thead>
                  <tr>
                    <th scope="col">Workload Pod Name</th>
                    <th scope="col">Phase</th>
                    <th scope="col">Container Readiness</th>
                    <th scope="col">Reported Lifecycle Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.integration.pods.length === 0 && <tr><td colSpan={4}>{data.integration.available ? 'No pods reported in this namespace.' : 'Pod inventory unavailable for this namespace.'}</td></tr>}
                  {data.integration.pods.map((pod) => {
                    const statusInfo = getPodStatusInfo(pod);

                    return (
                      <tr key={pod.name} className={`pod-row ${statusInfo.isHealthy ? 'row-healthy' : 'row-attention'}`}>
                        <td className="pod-name-cell">
                          <div className="pod-name-box">
                            <Box size={14} className="pod-icon" />
                            <span className="pod-name-str" title={pod.name}>
                              {pod.name}
                            </span>
                          </div>
                        </td>
                        <td className="pod-phase-cell">
                          <span className={`pod-phase-badge ${statusInfo.phaseClass}`}>
                            {statusInfo.isHealthy && <span className="pod-phase-dot" />}
                            {statusInfo.badgeLabel}
                          </span>
                        </td>
                        <td className="pod-containers-cell">
                          <div className="pod-containers-box">
                            <span className="containers-ratio-val">
                              {pod.readyContainers}/{pod.totalContainers}
                            </span>
                            <span className="containers-sublabel">{statusInfo.containersLabel}</span>
                          </div>
                        </td>
                        <td className="pod-status-cell">
                          <span className={`pod-summary-tag ${statusInfo.isHealthy ? 'healthy' : 'attention'}`}>
                            {statusInfo.summary}
                          </span>
                          <span className="pod-summary-desc">{statusInfo.description}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Skeleton Loading Placeholder (when initial request is pending) */}
      {isLoading && !data && (
        <div className="live-k8s-skeleton">
          <div className="skeleton-grid">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
          <div className="skeleton-table" />
        </div>
      )}
    </div>
  );
};

// Internal mini icon helper for nodes
const CpuIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M15 2v2" />
    <path d="M15 20v2" />
    <path d="M2 15h2" />
    <path d="M2 9h2" />
    <path d="M20 15h2" />
    <path d="M20 9h2" />
    <path d="M9 2v2" />
    <path d="M9 20v2" />
  </svg>
);
