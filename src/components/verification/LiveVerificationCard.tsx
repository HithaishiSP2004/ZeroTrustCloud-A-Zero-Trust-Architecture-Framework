import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  LiveSecurityVerificationResponse,
  VerificationCheck,
  requestSecurityVerification,
  snapshotAgeReason,
} from '../../utils/securityVerification';

export const LiveVerificationCard: React.FC = () => {
  const [snapshot, setSnapshot] = useState<{
    data: LiveSecurityVerificationResponse;
    retrievedAt: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [now, setNow] = useState(Date.now);
  const requestId = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);

  const data = snapshot?.data ?? null;
  const checks = data?.checks ?? [];

  const passCount = checks.filter((c) => c.status === 'PASS').length;
  const failCount = checks.filter((c) => c.status === 'FAIL').length;
  const unknownCount = checks.filter((c) => c.status === 'UNKNOWN').length;

  const staleReason = data
    ? isLoading
      ? 'Refresh pending; showing previous snapshot'
      : error
      ? 'Latest refresh failed; showing previous snapshot'
      : snapshotAgeReason(data.collectedAt, now)
    : null;
  const isStale = Boolean(staleReason);

  const fetchVerification = useCallback(async () => {
    const id = ++requestId.current;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setIsLoading(true);
    setError(null);
    try {
      const result = await requestSecurityVerification(controller.signal);
      if (id !== requestId.current || controller.signal.aborted) return;
      const received = Date.now();
      setSnapshot({ data: result, retrievedAt: new Date(received).toISOString() });
      setNow(received);
    } catch (err: unknown) {
      if (id !== requestId.current || controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Unable to retrieve automated verification');
    } finally {
      if (id === requestId.current && !controller.signal.aborted) {
        setIsLoading(false);
        activeRequest.current = null;
      }
    }
  }, []);

  useEffect(() => {
    void fetchVerification();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      ++requestId.current;
      activeRequest.current?.abort();
      clearInterval(timer);
    };
  }, [fetchVerification]);

  const formatTimestamp = (isoString?: string | null) => {
    if (!isoString) return 'Not reported';
    try {
      const d = new Date(isoString);
      return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className="live-verification-card-compact"
      role="region"
      aria-label="Automated Zero Trust Security Verification"
    >
      <div className="compact-card-header">
        <div className="header-left">
          <div className="title-row">
            <span className="live-source-pill verification">
              <ShieldCheck size={12} />
              <span>AUTOMATED VERIFICATION</span>
            </span>
            <span className="card-heading">Zero Trust Control Assurances</span>
          </div>
          <div className="timestamp-row">
            <Clock size={11} className="text-muted" />
            <span className="timestamp-text">
              Collected: <strong>{formatTimestamp(data?.collectedAt)}</strong>
            </span>
            {isStale && (
              <span className="stale-chip-inline" title={staleReason || undefined}>
                <AlertTriangle size={11} />
                <span>{staleReason}</span>
              </span>
            )}
          </div>
        </div>

        <div className="header-actions">
          <button
            className="compact-refresh-btn"
            onClick={() => void fetchVerification()}
            disabled={isLoading}
            title="Re-run read-only verification across Kubernetes clusters"
            aria-label="Refresh automated verification"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Verifying…' : 'Re-verify'}</span>
          </button>
        </div>
      </div>

      {error && !data && (
        <div className="compact-error-box">
          <XCircle size={14} />
          <span>{error}</span>
          <button onClick={() => void fetchVerification()} className="compact-retry-btn">
            Retry
          </button>
        </div>
      )}

      {isLoading && !data && (
        <div className="compact-loading-box">
          <RefreshCw size={16} className="animate-spin text-cyan-400" />
          <span>Executing automated control checks across KinD clusters…</span>
        </div>
      )}

      {data && (
        <div className="compact-card-body">
          <div className="outcomes-summary-row">
            <div className="outcome-chip pass">
              <CheckCircle2 size={13} />
              <span>{passCount} PASS</span>
            </div>
            <div className="outcome-chip fail">
              <XCircle size={13} />
              <span>{failCount} FAIL</span>
            </div>
            <div className="outcome-chip unknown">
              <HelpCircle size={13} />
              <span>{unknownCount} UNKNOWN</span>
            </div>
            <div className="total-checks-note">
              <span>{checks.length} Controls Evaluated (No Synthetic Score)</span>
            </div>
            <button
              className="toggle-expand-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
            >
              <span>{isExpanded ? 'Hide Checks' : 'View Checks'}</span>
              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          {isExpanded && (
            <div className="compact-checks-list animate-fade-in">
              {checks.map((chk: VerificationCheck) => (
                <div key={chk.id} className={`compact-check-item ${chk.status.toLowerCase()}`}>
                  <div className="item-status-icon">
                    {chk.status === 'PASS' && <CheckCircle2 size={13} className="text-emerald-400" />}
                    {chk.status === 'FAIL' && <XCircle size={13} className="text-rose-400" />}
                    {chk.status === 'UNKNOWN' && <HelpCircle size={13} className="text-amber-400" />}
                  </div>
                  <div className="item-text-group">
                    <div className="item-header-line">
                      <span className="item-control-name">{chk.control}</span>
                      <span className={`item-status-pill ${chk.status.toLowerCase()}`}>{chk.status}</span>
                    </div>
                    <div className="item-reason-line">{chk.reason}</div>
                    <div className="item-source-line">
                      Source: <code>{chk.source}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
