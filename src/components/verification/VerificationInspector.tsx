import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { VerificationCheck } from '../../utils/securityVerification';
import { SnapshotTime } from '../SnapshotTime';
import { domainOf, scopeNotes } from './verificationDomains';

function evidenceFacts(evidence: Record<string, unknown>) {
  const facts: [string,string][] = [];
  function visit(path:string, value:unknown) {
    if (facts.length >= 8) return;
    if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
      facts.push([path,value.length ? value.join(', ') : '[]']);
    } else if (value !== null && typeof value === 'object') {
      const entries = Object.entries(value);
      if (!entries.length) facts.push([path,'{}']);
      for (const [key,child] of entries) visit(path ? path+'.'+key : key,child);
    } else facts.push([path,String(value)]);
  }
  for (const [key,value] of Object.entries(evidence)) visit(key,value);
  return facts;
}
export function VerificationInspector({check,previous,next,close,headingRef,lastKnown}: {
  check: VerificationCheck; previous?:()=>void; next?:()=>void; close:()=>void;
  headingRef:React.RefObject<HTMLHeadingElement>; lastKnown:boolean;
}) {
  const facts=evidenceFacts(check.evidence);
  const note=scopeNotes[domainOf(check.id)];
  return <aside className="vs-inspector" id="vs-inspector" aria-labelledby="vs-control-title">
    <div className="vs-inspector-bar"><strong>Selected evidence</strong><div>
      <button aria-label="Previous check" disabled={!previous} onClick={previous}><ChevronLeft/></button>
      <button aria-label="Next check" disabled={!next} onClick={next}><ChevronRight/></button>
      <button aria-label="Close evidence inspector" onClick={close}><X/></button></div></div>
    <h3 id="vs-control-title" ref={headingRef} tabIndex={-1}>{check.control}</h3>
    <code>{check.id}</code>
    <p className="vs-result" data-result={lastKnown?'past':check.status}>{lastKnown?'Last known · ':''}{check.status}</p>
    <p className="vs-reason">{check.reason}</p>
    {facts.length>0 ? <dl className="vs-facts">{facts.map(([key,value])=>
      <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl> : <p>No evidence fields reported.</p>}
    <div className="vs-provenance"><small>Kubernetes source</small><code>{check.source}</code>
      <small>Observed</small><SnapshotTime value={check.observedAt}/></div>
    {note && <p className="vs-scope">{note}</p>}
    <details key={check.id}><summary>Raw evidence <ChevronDown size={14}/></summary>
      <pre>{JSON.stringify(check.evidence,null,2)}</pre></details>
  </aside>;
}
