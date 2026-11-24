import { useState } from 'react';
import { fixedContexts, technologies, type Technology } from '../utils/labEvidence';

type Station = {id: Technology; u: number; v: number};
const stations: Station[][] = [
  [{id:'policyNodes',u:1,v:1.45},{id:'gatekeeper',u:3,v:1.45}],
  [{id:'networkNodes',u:1,v:.7},{id:'istio',u:3,v:.7},{id:'workloads',u:5,v:1.5},
   {id:'calico',u:1.3,v:2.35},{id:'spire',u:3.4,v:2.35}],
];
const glyphs: Record<Technology,string> = {
  policyNodes:'m0-6 6 3v6l-6 3-6-3v-6Z',networkNodes:'m0-6 6 3v6l-6 3-6-3v-6Z',
  gatekeeper:'M-6 6V-4l6-3 6 3V6M-3 5v-7h6v7',istio:'M-6 5 2-7 6 5ZM2-5V5',
  calico:'M-7-4h5v4h5v4h4M-6 4l4-4',spire:'m0-7 5 7-5 7-5-7ZM0-6v12',
  workloads:'m-7-2 4-3 4 3-4 3Zm7 6 4-3 4 3-4 3Z',
};

// Equal-length plan axes at ±30 degrees; height travels straight up.
function point(u:number,v:number,z:number) { return [(u-v)*26,(u+v)*15-z]; }
function corners(u:number,v:number,w:number,d:number,z:number) {
  return [point(u,v,z),point(u+w,v,z),point(u+w,v+d,z),point(u,v+d,z)];
}
const points = (vertices:number[][]) => vertices.map(p=>p.join(',')).join(' ');
function Solid({u,v,w,d,z,h,part}: {u:number;v:number;w:number;d:number;z:number;h:number;part:string}) {
  const base=corners(u,v,w,d,z), top=corners(u,v,w,d,z+h);
  return <g className={part}><polygon className="face-left" points={points([top[3],top[2],base[2],base[3]])}/>
    <polygon className="face-right" points={points([top[2],top[1],base[1],base[2]])}/>
    <polygon className="face-top" points={points(top)}/></g>;
}

export function LabBoundary({index, selected, onSelect, observation}: {
  index:0|1; selected:Technology; onSelect:(id:Technology)=>void; observation:(id:Technology)=>string;
}) {
  const [focused,setFocused]=useState<Technology|null>(null);
  const w=index===0?4:6, d=3, list=stations[index];
  const surface=points(corners(0,0,w,d,0));
  return <section className={'lab-boundary '+(index?'network-lab':'policy-lab')} aria-labelledby={'lab-name-'+index}>
    <h2 id={'lab-name-'+index}>{index?'Network & Identity Laboratory':'Policy Laboratory'}</h2><code>{fixedContexts[index]}</code>
    <div className="lab-drawing">
      <svg className="lab-deck" viewBox={[-86,-17,(w+d)*26+16,(w+d)*15+37].join(' ')} aria-hidden="true">
        <defs><clipPath id={'deck-clip-'+index}><polygon points={surface}/></clipPath></defs>
        <Solid u={0} v={0} w={w} d={d} z={-11} h={5} part="foundation"/>
        <Solid u={0} v={0} w={w} d={d} z={-6} h={6} part="platform"/>
        <g className="surface-grid" clipPath={'url(#deck-clip-'+index+')'}>
          {Array.from({length:w*2-1},(_,n)=><polyline key={n} points={points([point((n+1)/2,0,0),point((n+1)/2,d,0)])}/>)}
          {Array.from({length:d*2-1},(_,n)=><polyline key={n} points={points([point(0,(n+1)/2,0),point(w,(n+1)/2,0)])}/>)}
        </g>
        {list.slice().sort((a,b)=>a.u+a.v-b.u-b.v).map(({id,u,v})=>{
          const [x,y]=point(u,v,13);
          return <g key={id} className="lab-machine" data-selected={selected===id} data-focus={focused===id} onClick={()=>onSelect(id)}>
            <Solid u={u-.49} v={v-.49} w={.98} d={.98} z={0} h={3} part="socket"/>
            <Solid u={u-.39} v={v-.39} w={.78} d={.78} z={3} h={10} part="instrument"/>
            <path className="machine-glyph" transform={'matrix(.98 .56 -.98 .56 '+x+' '+y+')'} d={glyphs[id]}/>
          </g>;
        })}
      </svg>
      <div className="lab-key">{list.map(({id})=><button type="button" className="lab-station" id={'station-'+id} key={id}
        aria-pressed={selected===id} aria-controls="lab-inspector" aria-describedby={'observation-'+id}
        aria-label={technologies[id].name+' in '+fixedContexts[index]} onFocus={()=>setFocused(id)} onBlur={()=>setFocused(null)} onClick={()=>onSelect(id)}>
        <svg viewBox="-10 -10 20 20" aria-hidden="true"><path d={glyphs[id]}/></svg>
        <span>{technologies[id].name}<small id={'observation-'+id}>{observation(id)}</small></span>
      </button>)}</div>
    </div>
  </section>;
}
