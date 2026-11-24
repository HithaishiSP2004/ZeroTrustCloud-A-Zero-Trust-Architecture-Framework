interface TrustMeshMarkProps {
  size?: number;
  monochrome?: boolean;
}

export function TrustMeshMark({ size = 32, monochrome = false }: TrustMeshMarkProps) {
  return <svg viewBox="0 0 32 32" width={size} height={size} fill="currentColor"
    className="trustmesh-mark" aria-hidden="true" focusable="false">
    <path d="M20 1H10L1 10v12l9 9h12l9-9V11.5l-4.5 2.7v6L20.2 26.5h-8.4l-6.3-6.3v-8.4l6.3-6.3h5.5Z"/>
    {!monochrome && <path d="m1 22 9 9h12l9-9-4.5-1.8-6.3 6.3h-8.4l-6.3-6.3Z" fill="var(--bridge-facet, #587e98)"/>}
    <path d="m15.6 7.2 8.6 8.8-8.6 9-8.5-9Z"/>
    {!monochrome && <path d="m15.6 7.2 8.6 8.8-8.6 9 1.9-9Z" fill="var(--bridge-facet, #587e98)"/>}
    {!monochrome && size >= 24 && <path d="m5.6 20.1 6.3 6.2h8.2" fill="none"
      stroke="var(--bridge-edge, #c1dce6)" strokeWidth=".8"/>}
    <path className="trustmesh-mark-key" d="m24 1 7 7-4.2 2.3-5.3-5.4Z" fill={monochrome ? 'currentColor' : 'var(--bridge-key, currentColor)'}/>
  </svg>;
}
