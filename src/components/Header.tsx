import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown, Layers, Moon, Sun } from 'lucide-react';
import { SnapshotTime } from './SnapshotTime';
import { TrustMeshMark } from './TrustMeshMark';
import { fixedContexts } from '../utils/labEvidence';

interface HeaderProps {
  collectedAt?: string;
  lastKnown: boolean;
  theme: 'dark' | 'light';
  environmentStatus: string;
  onHome: () => void;
  onToggleTheme: () => void;
  onIntegrations: () => void;
}

export function Header({ collectedAt, lastKnown, theme, environmentStatus, onHome, onToggleTheme, onIntegrations }: HeaderProps) {
  const [reveal, setReveal] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [open, setOpen] = useState(false);
  const environment = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!environment.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);

  useEffect(() => {
    if (!reveal) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stop = () => { if (preference.matches) setReveal(false); };
    preference.addEventListener('change', stop);
    return () => preference.removeEventListener('change', stop);
  }, [reveal]);

  return <header className="shell-header" data-reveal={reveal} onAnimationEnd={event => {
    if (event.animationName === 'bridge-line') setReveal(false);
  }}>
    <button className="shell-brand" aria-label="TrustMesh home" onClick={onHome}>
      <TrustMeshMark/>
      <span><strong>TrustMesh</strong><small>ZeroTrustCloud</small></span>
    </button>
    <span className="bridge-spine" aria-hidden="true"/>
    <div className="shell-controls">
      <div className="shell-environment" ref={environment} onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }} onKeyDown={event => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}>
        <button ref={trigger} className="shell-environment-toggle" aria-label="Local Kubernetes environment"
          aria-expanded={open} aria-controls={open ? 'shell-environment' : undefined} onClick={() => setOpen(!open)}>
          <Layers size={15} aria-hidden="true"/><span>Local Kubernetes</span><ChevronDown size={13} aria-hidden="true"/>
        </button>
        {open && <section id="shell-environment" className="shell-popover" aria-label="Environment information">
          <strong>Local Kubernetes</strong>
          <p role="status">{environmentStatus}</p>
          {collectedAt && <p className="shell-collected">{lastKnown ? 'Last known' : 'Collected'} · <SnapshotTime value={collectedAt}/></p>}
          <h2>Fixed Kubernetes contexts</h2>
          <ul>{fixedContexts.map(context => <li key={context}><code>{context}</code></li>)}</ul>
          <button onClick={() => { setOpen(false); onIntegrations(); }}>Open Environment &amp; Integrations <ArrowUpRight size={15} aria-hidden="true"/></button>
        </section>}
      </div>
      <button className="shell-icon" onClick={onToggleTheme} aria-label="Toggle visual theme" aria-pressed={theme === 'light'}
        title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
        {theme === 'dark' ? <Moon size={17}/> : <Sun size={17}/>}
      </button>
      <span className="shell-project" title="Hithaishi S. P. · MCA final-year project">PRJ-34</span>
    </div>
  </header>;
}
