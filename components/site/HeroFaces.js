// The block characters sitting in the gaps around the hero headline. They
// share a box with the type so their percentage positions track it as it
// scales. `data-depth` is how far each drifts against the pointer
// (HeroStage); m1–m3 are the three that stay on a phone.
const HOME = [
  { cls: 'm1', depth: 1.2, src: '02', s: { '--k': 0, '--t': '-6%', '--l': '-8%', '--w': 'clamp(40px,6.4vw,108px)', '--r': '-13deg', '--f': '7.5s' } },
  { cls: 'sm m2', depth: 0.8, src: '07', s: { '--k': 1, '--t': '-24%', '--l': '95%', '--w': 'clamp(40px,5.8vw,98px)', '--r': '11deg', '--f': '8.5s', '--dl': '-1.1s' } },
  { cls: 'sm', depth: 1, src: '04', s: { '--k': 2, '--t': '36%', '--l': '-14%', '--w': 'clamp(40px,5.6vw,95px)', '--r': '9deg', '--f': '6.8s', '--dl': '-2s' } },
  { cls: 'm3', depth: 1.35, src: '09', s: { '--k': 3, '--t': '30%', '--l': '98%', '--w': 'clamp(40px,6.2vw,105px)', '--r': '-8deg', '--f': '9s', '--dl': '-.6s' } },
  { cls: 'sm', depth: 0.9, src: '05', s: { '--k': 4, '--t': '76%', '--l': '1%', '--w': 'clamp(40px,5.4vw,92px)', '--r': '14deg', '--f': '8s', '--dl': '-1.6s' } },
  { cls: '', depth: 1.1, src: '10', s: { '--k': 5, '--t': '70%', '--l': '87%', '--w': 'clamp(40px,5.8vw,98px)', '--r': '-7deg', '--f': '7.2s', '--dl': '-2.4s' } },
];
const PAGE = [
  { cls: 'm1', depth: 1.2, src: '02', s: { '--k': 0, '--t': '-6%', '--l': '-8%', '--w': 'clamp(40px,6vw,100px)', '--r': '-13deg', '--f': '7.5s' } },
  { cls: 'm2', depth: 0.8, src: '07', s: { '--k': 1, '--t': '-20%', '--l': '95%', '--w': 'clamp(40px,5.6vw,92px)', '--r': '11deg', '--f': '8.5s', '--dl': '-1.1s' } },
  { cls: 'sm', depth: 1, src: '05', s: { '--k': 2, '--t': '62%', '--l': '-10%', '--w': 'clamp(40px,5.4vw,90px)', '--r': '9deg', '--f': '6.8s', '--dl': '-2s' } },
  { cls: 'm3', depth: 1.35, src: '09', s: { '--k': 3, '--t': '56%', '--l': '98%', '--w': 'clamp(40px,6vw,100px)', '--r': '-8deg', '--f': '9s', '--dl': '-.6s' } },
];

export default function HeroFaces({ variant = 'home' }) {
  const list = variant === 'home' ? HOME : PAGE;
  return (
    <div className="faces" aria-hidden="true">
      {list.map((f) => (
        <span key={f.src} className={`face ${f.cls}`.trim()} data-depth={f.depth} style={f.s}>
          <img src={`/blocks/block-${f.src}.svg`} alt="" draggable={false} />
        </span>
      ))}
    </div>
  );
}
