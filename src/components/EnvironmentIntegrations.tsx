import { useEffect, useRef, useState } from 'react';
import { ArrowUpLeft, Cloud, RefreshCw } from 'lucide-react';
import { useLabSources } from '../hooks/useCommandSources';
import { environmentStatus, labEvidence, type ClusterFeed, type Technology } from '../utils/labEvidence';
import { snapshotAgeReason } from '../utils/securityVerification';
import { LabBoundary } from './LabBoundary';
import { SnapshotTime } from './SnapshotTime';
import { caption } from './verification/verificationDomains';

export function EnvironmentIntegrations({ cluster }: { cluster: ClusterFeed }) {
  const feeds = { cluster, ...useLabSources() };
  const [selected, setSelected] = useState<Technology>('gatekeeper');
  const [now, setNow] = useState(Date.now);
  const heading = useRef<HTMLHeadingElement>(null);
  const item = labEvidence(selected, feeds);
  const verifier = feeds.verification;
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  function inspect(id: Technology) {
    setSelected(id);
    requestAnimationFrame(() => {
      heading.current?.focus({preventScroll:true});
      heading.current?.scrollIntoView({block:'nearest',behavior:'instant'});
    });
  }

  return <section className="shell-integrations">
    <header>
      <div><h1 tabIndex={-1}>Environment &amp; Integrations</h1><p>Select a technology to inspect its Kubernetes resources and verification evidence.</p></div>
      <button type="button" disabled={Object.values(feeds).some(feed => feed.isLoading)}
        onClick={() => Object.values(feeds).forEach(feed => feed.refresh())}><RefreshCw size={15}/> Refresh evidence</button>
    </header>
    <div className="lab-atlas">
      <div className="atlas-caption"><strong>Dual-lab topology</strong><span role="status">{environmentStatus(cluster)}</span></div>
      <div className="lab-boundaries">{([0,1] as const).map(index =>
        <LabBoundary key={index} index={index} selected={selected} onSelect={inspect} observation={id => {
          const evidence = labEvidence(id,feeds);
          return evidence.state === 'Observed' && evidence.headline ? evidence.headline : evidence.state;
        }}/>)}</div>
    </div>
    <section id="lab-inspector" className="lab-inspector" aria-labelledby="lab-detail-title" data-technology={selected}>
      <header className="lab-detail-head">
        <div><p className="lab-caption">Evidence inspector</p>
          <h2 id="lab-detail-title" tabIndex={-1} ref={heading}>{item.name}</h2><code>{item.context}</code></div>
        <button className="return-station" type="button" onClick={() => document.getElementById('station-'+selected)?.focus()}>
          <ArrowUpLeft size={15}/> Return to topology</button>
      </header>
      <div className="lab-evidence-columns">
        <section><h3>Resource observations</h3>
          <p className="lab-freshness">{item.state}{item.state !== item.coverage && item.feed.data && ' · '+item.coverage}
            {item.headline && ' · '+item.headline}</p>
          <p className="lab-origin"><code>{item.endpoint}</code><SnapshotTime value={item.feed.data?.collectedAt} fallback="Collection time unavailable"/></p>
          {(item.feed.staleReason || item.feed.error) && <p>{item.feed.staleReason ?? item.feed.error}</p>}
          {item.inventories.map((group,index) => <div className="lab-inventory" key={group.title+index}>
            <h4>{group.title}</h4>
            {group.entries?.length ? <dl>{group.entries.map(row => <div key={row.resource}><dt>{row.resource}</dt><dd>{row.observation}</dd></div>)}</dl>
              : <p>{group.entries ? 'No matching resources reported.' : group.error || (item.feed.isLoading ? 'Collecting evidence…' : 'Resource observation unavailable.')}</p>}
          </div>)}
        </section>
        <section><h3>Automated verification</h3>
          <p className="lab-origin"><code>/api/security/verification</code><SnapshotTime value={verifier.data?.collectedAt} fallback="Collection time unavailable"/></p>
          {(verifier.staleReason || verifier.error) && <p>{verifier.staleReason ?? verifier.error}</p>}
          {item.checks.map(check => {
            const age = verifier.staleReason || snapshotAgeReason(check.observedAt,now);
            return <details className="lab-check" key={check.id}>
              <summary><span>{caption(check)}</span><strong data-result={age ? 'past' : check.status}>{age ? 'Last known · ' : ''}{check.status}</strong></summary>
              <p>{check.reason}</p><code>{check.source}</code>
              <p><SnapshotTime value={check.observedAt} fallback="Observation time unreported"/>{age && ' · '+age}</p>
            </details>;
          })}
          {!item.checks.length && <p>{verifier.isLoading ? 'Collecting verification…' : verifier.data ?
            'No matching verification checks reported for this technology and context.' : 'Verification evidence unavailable.'}</p>}
          <p className="lab-limit"><strong>Scope</strong> {item.limit}</p>
        </section>
      </div>
    </section>
    <section className="cloud-extensions"><h2>Future cloud extensions</h2>
      <ul>{['AWS EKS','Azure AKS'].map(name => <li key={name}><Cloud size={17} aria-hidden="true"/><strong>{name}</strong><span>Not connected</span></li>)}</ul>
    </section>
  </section>;
}
