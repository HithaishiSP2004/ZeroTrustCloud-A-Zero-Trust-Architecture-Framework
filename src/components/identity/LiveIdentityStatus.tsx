import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Server,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  Radio,
  Key,
  Shield,
  Tag,
  Info,
} from 'lucide-react';
import {
  LiveIdentityWorkloadsResponse,
  LiveIdentityWorkloadPod,
  requestIdentityWorkloads,
  snapshotAgeReason,
} from '../../utils/identityWorkloads';

export const LiveIdentityStatus: React.FC = () => {
  const [snapshot, setSnapshot] = useState<{
    data: LiveIdentityWorkloadsResponse;
    retrievedAt: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);
  const requestId = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);

  const data = snapshot?.data ?? null;
  const staleReason = data
    ? isLoading
      ? 'Refresh pending; showing previous snapshot'
      : error
      ? 'Latest refresh failed; showing previous snapshot'
      : snapshotAgeReason(data.collectedAt, now)
    : null;
  const isStale = Boolean(staleReason);

  const fetchStatus = useCallback(async () => {
    const id = ++requestId.current;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setIsLoading(true);
    setError(null);
    try {
      const result = await requestIdentityWorkloads(controller.signal);
      if (id !== requestId.current || controller.signal.aborted) return;
      const received = Date.now();
      setSnapshot({ data: result, retrievedAt: new Date(received).toISOString() });
      setNow(received);
    } catch (err: unknown) {
      if (id !== requestId.current || controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Unable to retrieve Identity Workloads');
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

  const getPodPhaseBadge = (pod: LiveIdentityWorkloadPod) => {
    if (pod.phase === 'Succeeded') {
      return {
        label: 'Succeeded',
        className: 'phase-succeeded',
        desc: 'Completed batch / verification job',
      };
    }
    if (pod.phase === 'Running') {
      const isAllReady = pod.totalContainers > 0 && pod.readyContainers === pod.totalContainers;
      return {
        label: 'Running',
        className: isAllReady ? 'phase-running-healthy' : 'phase-running-degraded',
        desc: isAllReady ? 'All containers ready' : 'Containers initializing / degraded',
      };
    }
    return {
      label: pod.phase,
      className: 'phase-failed',
      desc: 'Workload in non-running state',
    };
  };

  return (
    <div
      className="live-identity-container"
      role="region"
      aria-label="Verified Live Kubernetes Workloads and Service Accounts"
    >
      {/* 1. Header Bar */}
      <div className="live-k8s-header">
        <div className="live-k8s-title-group">
          <div className="live-k8s-icon-wrap" aria-hidden="true">
            <Radio size={18} className="live-k8s-icon-svg" />
          </div>
          <div>
            <div className="live-k8s-title-row">
              <h2 className="live-k8s-title">Verified Live Kubernetes Workloads & ServiceAccounts</h2>
              {data && !error && !isStale && (
                <span className="live-verified-badge" title="Authenticated live Kubernetes status">
                  <span className="live-pip-beacon" />
                  LIVE KUBERNETES
                </span>
              )}
              {isStale && data && (
                <span className="live-stale-badge" title={staleReason || 'Snapshot is stale'}>
                  <AlertTriangle size={11} />
                  STALE SNAPSHOT
                </span>
              )}
              {error && !data && (
                <span className="live-error-badge" title={error}>
                  <XCircle size={11} />
                  API DISCONNECTED
                </span>
              )}
            </div>
            <div className="live-k8s-meta-row">
              <span className="meta-item">
                Cluster: <strong>{data?.cluster || 'kind-trustmesh-network-lab'}</strong>
              </span>
              <span className="meta-sep">•</span>
              <span className="meta-item">
                Namespace: <strong>{data?.namespace || 'trustmesh-integration-test'}</strong>
              </span>
              <span className="meta-sep">•</span>
              <span className="meta-item">
                <Clock size={11} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                Collected:{' '}
                <strong>
                  {data ? formatTimestamp(data.collectedAt) : isLoading ? 'Querying...' : 'Unavailable'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="live-k8s-actions">
          <button
            type="button"
            className="live-k8s-refresh-btn"
            onClick={() => void fetchStatus()}
            disabled={isLoading}
            aria-label="Refresh live Kubernetes identity workloads"
          >
            <RefreshCw size={13} className={isLoading ? 'spinning' : ''} />
            <span>{isLoading ? 'Querying...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Notice Banners (Stale or Error) */}
      {staleReason && (
        <div className="live-k8s-banner stale" role="status">
          <AlertTriangle size={14} className="banner-icon" />
          <span>{staleReason}</span>
        </div>
      )}

      {error && !data && (
        <div className="live-k8s-banner error" role="alert">
          <XCircle size={14} className="banner-icon" />
          <div className="banner-text-col">
            <strong>Live Identity API Unavailable: {error}</strong>
            <span>
              Unable to query live Pods and ServiceAccounts from Kali. The demonstration inventory below
              remains available for UI inspection.
            </span>
          </div>
        </div>
      )}

      {/* 3. Loading Skeleton */}
      {isLoading && !data && (
        <div className="live-k8s-skeleton" aria-label="Loading identity workloads">
          <div className="skeleton-grid">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
          <div className="skeleton-table" />
        </div>
      )}

      {/* 4. Architectural Boundaries and Attestation Disclaimers */}
      <div className="live-identity-disclaimers">
        <div className="spire-disclaimer-notice">
          <Info size={12} className="disclaimer-icon" />
          <span>
            SPIRE Workload Attestation: Registration defines template mappings. Registration does NOT prove that an issued SVID is currently valid or unexpired.
          </span>
        </div>
        <div className="spire-disclaimer-notice">
          <Info size={12} className="disclaimer-icon" />
          <span>
            Architectural Boundary: SPIRE operates on kind-trustmesh-network-lab as an independent workload identity attestor. SPIRE is NOT configured as Istio&apos;s certificate authority.
          </span>
        </div>
      </div>

      {/* 5. Live Data View */}
      {data && (
        <div className="live-identity-body">
          {/* Top Metric Bar */}
          <div className="live-identity-stats-row">
            <div className="live-stat-chip">
              <Layers size={14} className="text-cyan-400" />
              <span>Live Pods:</span>
              <strong>{data.workloads.length}</strong>
            </div>
            <div className="live-stat-chip">
              <Key size={14} className="text-amber-400" />
              <span>ServiceAccounts:</span>
              <strong>{data.serviceAccounts.length}</strong>
            </div>
            <div className="live-stat-chip">
              <Shield size={14} className={data.spireRegistration.available ? 'text-emerald-400' : 'text-slate-400'} />
              <span>SPIRE Registration:</span>
              <strong>{data.spireRegistration.available ? 'Active' : 'Unavailable'}</strong>
            </div>
            <div className="live-stat-chip">
              <Server size={14} className="text-indigo-400" />
              <span>SPIRE Components:</span>
              <strong>
                {data.spireComponents.filter((c) => c.available).length}/{data.spireComponents.length} Ready
              </strong>
            </div>
          </div>

          {/* Workload Pods & ServiceAccount Bindings Table */}
          <div className="live-integration-workloads-card">
            <div className="workloads-card-header">
              <div className="workloads-title-group">
                <Layers size={15} className="text-cyan-400" />
                <h3 className="workloads-title">Live Workloads & ServiceAccount Bindings</h3>
                <span className="workloads-count-badge">{data.workloads.length} Pods</span>
              </div>
              <span className="workloads-sub">Namespace: {data.namespace}</span>
            </div>

            <div className="live-workloads-table-wrap">
              <table className="live-workloads-table">
                <thead>
                  <tr>
                    <th>Pod Name</th>
                    <th>Phase</th>
                    <th>Container Readiness</th>
                    <th>Assigned ServiceAccount</th>
                    <th>Labels</th>
                  </tr>
                </thead>
                <tbody>
                  {data.workloads.map((pod) => {
                    const phaseInfo = getPodPhaseBadge(pod);
                    const isDefaultSA = pod.serviceAccountName === 'default';
                    return (
                      <tr key={pod.name}>
                        <td className="pod-name-cell">
                          <span className="pod-name-str" title={pod.name}>
                            {pod.name}
                          </span>
                        </td>
                        <td>
                          <span className={`pod-phase-badge ${phaseInfo.className}`}>
                            <span className="pod-phase-dot" />
                            {phaseInfo.label}
                          </span>
                        </td>
                        <td>
                          <div className="pod-containers-box">
                            <span className="containers-ratio-val">
                              {pod.readyContainers}/{pod.totalContainers}
                            </span>
                            <span className="containers-sublabel">
                              {pod.readyContainers === pod.totalContainers && pod.totalContainers > 0
                                ? 'Sidecar & App Ready'
                                : pod.phase === 'Succeeded'
                                ? 'Completed'
                                : 'Containers Ready'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="sa-binding-box">
                            <Key size={12} className={isDefaultSA ? 'text-amber-400' : 'text-emerald-400'} />
                            <span className={`sa-name-str ${isDefaultSA ? 'default-sa' : 'dedicated-sa'}`}>
                              {pod.serviceAccountName}
                            </span>
                            {isDefaultSA ? (
                              <span className="sa-tag default" title="Uses shared default ServiceAccount">
                                Shared Default
                              </span>
                            ) : (
                              <span className="sa-tag dedicated" title="Dedicated ServiceAccount assigned">
                                Dedicated
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="pod-labels-cell">
                            {Object.entries(pod.labels).length > 0 ? (
                              Object.entries(pod.labels).map(([k, v]) => (
                                <span key={k} className="pod-label-pill">
                                  <Tag size={9} />
                                  {k}={v}
                                </span>
                              ))
                            ) : (
                              <span className="no-labels">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Discovered ServiceAccounts List */}
          <div className="live-service-accounts-card">
            <div className="card-mini-header">
              <Key size={14} className="text-amber-400" />
              <h4>Discovered ServiceAccounts in Namespace ({data.serviceAccounts.length})</h4>
            </div>
            <div className="sa-pills-row">
              {data.serviceAccounts.map((sa) => (
                <div key={sa.name} className={`sa-chip ${sa.name === 'default' ? 'default-chip' : 'dedicated-chip'}`}>
                  <span className="sa-chip-dot" />
                  <span className="sa-chip-name">{sa.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SPIRE Registration & Infrastructure Cards Grid */}
          <div className="live-spire-grid">
            {/* Card 1: SPIRE Workload Registration */}
            <div className="spire-card registration">
              <div className="spire-card-header">
                <div className="spire-header-left">
                  <Shield size={15} className="text-emerald-400" />
                  <h4 className="spire-title">SPIRE Workload Registration</h4>
                </div>
                <span className={`spire-status-badge ${data.spireRegistration.available ? 'available' : 'unavailable'}`}>
                  {data.spireRegistration.available ? 'Entry Available' : 'Unavailable'}
                </span>
              </div>

              <div className="spire-card-body">
                {data.spireRegistration.available ? (
                  <div className="spire-details">
                    <div className="spire-kv-row">
                      <span className="spire-kv-key">Resource:</span>
                      <span className="spire-kv-val mono">{data.spireRegistration.name}</span>
                    </div>
                    {data.spireRegistration.spiffeIDTemplate && (
                      <div className="spire-kv-row">
                        <span className="spire-kv-key">SPIFFE ID Template:</span>
                        <span className="spire-kv-val mono template">{data.spireRegistration.spiffeIDTemplate}</span>
                      </div>
                    )}
                    {data.spireRegistration.statistics && (
                      <div className="spire-stats-box">
                        <span className="spire-stats-title">Registration Statistics:</span>
                        <div className="spire-stats-chips">
                          {Object.entries(data.spireRegistration.statistics).map(([k, v]) => (
                            <span key={k} className="spire-stat-pill">
                              {k}: <strong>{v}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="spire-unavailable-msg">
                    <Info size={13} />
                    <span>{data.spireRegistration.error || 'SPIRE workload registration entry not queried'}</span>
                  </div>
                )}

                <div className="spire-disclaimer-notice">
                  <Info size={12} className="disclaimer-icon" />
                  <span>
                    SPIRE registration defines template mappings for workload attestation. Registration does NOT prove that an
                    issued SVID is currently valid or unexpired.
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: SPIRE Control Plane Components */}
            <div className="spire-card components">
              <div className="spire-card-header">
                <div className="spire-header-left">
                  <Server size={15} className="text-indigo-400" />
                  <h4 className="spire-title">SPIRE Control Plane Readiness</h4>
                </div>
                <span className="spire-status-badge neutral">
                  {data.spireComponents.filter((c) => c.available).length}/{data.spireComponents.length} Controllers
                </span>
              </div>

              <div className="spire-card-body">
                <div className="spire-components-list">
                  {data.spireComponents.map((comp) => {
                    const isReady = comp.available && comp.readyReplicas !== null && comp.readyReplicas > 0;
                    return (
                      <div key={comp.name} className="spire-component-row">
                        <div className="comp-info">
                          <span className="comp-name">{comp.name}</span>
                          <span className="comp-kind">{comp.kind}</span>
                        </div>
                        <div className="comp-status">
                          {comp.available ? (
                            <span className={`comp-replica-badge ${isReady ? 'ready' : 'not-ready'}`}>
                              <CheckCircle2 size={11} />
                              {comp.readyReplicas ?? 0}/{comp.desiredReplicas ?? 1} Ready
                            </span>
                          ) : (
                            <span className="comp-replica-badge unavailable" title={comp.error || 'Unavailable'}>
                              <XCircle size={11} />
                              Unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="spire-disclaimer-notice">
                  <Info size={12} className="disclaimer-icon" />
                  <span>
                    Architectural Boundary: SPIRE operates on kind-trustmesh-network-lab as an independent workload identity
                    attestor. SPIRE is NOT configured as Istio&apos;s certificate authority.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
