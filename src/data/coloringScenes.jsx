// Extended Coloring Scenes — 17 additional scenes (compact SVGs)
// Each scene: id, title, desc, color, minParts, parts[], guide{}, SVG component

function mkSVG(shapes) {
  return function SceneSVG({ fills, onFill }) {
    const s = (p) => ({ fill: fills[p] || '#fff', cursor: onFill ? 'pointer' : 'default', transition: 'fill 0.15s' })
    return (
      <svg viewBox="0 0 400 280" className="color-svg" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#1e293b" strokeWidth="3" strokeLinejoin="round">
          {shapes.map(([tag, props, part]) => {
            const Tag = tag
            return <Tag key={part} {...props} style={s(part)} onClick={() => onFill?.(part)} />
          })}
        </g>
      </svg>
    )
  }
}

// Keke Napep (tricycle)
const KekeSVG = mkSVG([
  ['rect', { x: 60, y: 100, width: 180, height: 120, rx: 10 }, 'body'],
  ['polygon', { points: '60,100 150,40 240,100' }, 'roof'],
  ['rect', { x: 80, y: 120, width: 60, height: 50, rx: 4 }, 'window1'],
  ['rect', { x: 160, y: 120, width: 60, height: 50, rx: 4 }, 'window2'],
  ['circle', { cx: 100, cy: 240, r: 22 }, 'wheel1'],
  ['circle', { cx: 200, cy: 240, r: 22 }, 'wheel2'],
  ['rect', { x: 240, y: 140, width: 100, height: 80, rx: 6 }, 'cargo'],
  ['circle', { cx: 320, cy: 240, r: 22 }, 'wheel3'],
])

// Mosque
const MosqueSVG = mkSVG([
  ['rect', { x: 100, y: 120, width: 200, height: 140, rx: 4 }, 'wall'],
  ['path', { d: 'M100,120 L200,40 L300,120 Z' }, 'dome'],
  ['rect', { x: 70, y: 60, width: 30, height: 200, rx: 2 }, 'minaret1'],
  ['rect', { x: 300, y: 60, width: 30, height: 200, rx: 2 }, 'minaret2'],
  ['rect', { x: 175, y: 180, width: 50, height: 80 }, 'door'],
  ['circle', { cx: 200, cy: 80, r: 15 }, 'crescent'],
  ['rect', { x: 0, y: 250, width: 400, height: 30 }, 'ground'],
])

// Church
const ChurchSVG = mkSVG([
  ['rect', { x: 120, y: 100, width: 160, height: 160, rx: 4 }, 'wall'],
  ['polygon', { points: '120,100 200,30 280,100' }, 'roof'],
  ['rect', { x: 180, y: 180, width: 40, height: 80 }, 'door'],
  ['circle', { cx: 160, cy: 140, r: 18 }, 'window1'],
  ['circle', { cx: 240, cy: 140, r: 18 }, 'window2'],
  ['rect', { x: 190, y: 20, width: 20, height: 40 }, 'cross'],
  ['rect', { x: 0, y: 250, width: 400, height: 30 }, 'ground'],
])

// Palm Tree
const PalmSVG = mkSVG([
  ['rect', { x: 180, y: 100, width: 40, height: 160, rx: 8 }, 'trunk'],
  ['ellipse', { cx: 130, cy: 90, rx: 70, ry: 25 }, 'leaf1'],
  ['ellipse', { cx: 270, cy: 90, rx: 70, ry: 25 }, 'leaf2'],
  ['ellipse', { cx: 200, cy: 60, rx: 30, ry: 60 }, 'leaf3'],
  ['circle', { cx: 190, cy: 110, r: 8 }, 'coconut1'],
  ['circle', { cx: 210, cy: 105, r: 8 }, 'coconut2'],
  ['rect', { x: 0, y: 250, width: 400, height: 30 }, 'ground'],
])

// Jollof Rice Pot
const JollofSVG = mkSVG([
  ['ellipse', { cx: 200, cy: 200, rx: 120, ry: 60 }, 'pot'],
  ['rect', { x: 80, y: 120, width: 240, height: 80, rx: 10 }, 'potbody'],
  ['ellipse', { cx: 200, cy: 120, rx: 120, ry: 40 }, 'rice'],
  ['rect', { x: 60, y: 200, width: 280, height: 20, rx: 4 }, 'base'],
  ['rect', { x: 180, y: 70, width: 40, height: 50, rx: 4 }, 'handle'],
  ['ellipse', { cx: 200, cy: 70, rx: 40, ry: 15 }, 'lid'],
  ['path', { d: 'M160,60 Q170,30 180,60' }, 'steam1'],
  ['path', { d: 'M220,55 Q230,25 240,55' }, 'steam2'],
])

// Fishing Boat
const BoatSVG = mkSVG([
  ['path', { d: 'M60,180 Q80,220 200,220 Q320,220 340,180 Z' }, 'hull'],
  ['rect', { x: 190, y: 80, width: 10, height: 100 }, 'mast'],
  ['polygon', { points: '200,80 200,170 280,140' }, 'sail'],
  ['rect', { x: 0, y: 210, width: 400, height: 70 }, 'water'],
  ['rect', { x: 120, y: 160, width: 80, height: 20, rx: 4 }, 'deck'],
  ['circle', { cx: 300, cy: 60, r: 25 }, 'sun'],
])

// Agbada Outfit
const AgbadaSVG = mkSVG([
  ['circle', { cx: 200, cy: 60, r: 30 }, 'head'],
  ['path', { d: 'M120,90 L80,200 L200,260 L320,200 L280,90 Z' }, 'agbada'],
  ['rect', { x: 175, y: 90, width: 50, height: 80, rx: 4 }, 'inner'],
  ['rect', { x: 160, y: 200, width: 30, height: 60 }, 'leg1'],
  ['rect', { x: 210, y: 200, width: 30, height: 60 }, 'leg2'],
  ['ellipse', { cx: 200, cy: 60, rx: 35, ry: 12 }, 'cap'],
])

// Fuel Station
const FuelSVG = mkSVG([
  ['rect', { x: 50, y: 100, width: 300, height: 140, rx: 6 }, 'building'],
  ['rect', { x: 50, y: 80, width: 300, height: 20, rx: 2 }, 'awning'],
  ['rect', { x: 100, y: 140, width: 60, height: 80, rx: 4 }, 'pump1'],
  ['rect', { x: 240, y: 140, width: 60, height: 80, rx: 4 }, 'pump2'],
  ['rect', { x: 0, y: 240, width: 400, height: 40 }, 'ground'],
  ['rect', { x: 170, y: 90, width: 60, height: 30, rx: 4 }, 'sign'],
])

// Suya Stand
const SuyaSVG = mkSVG([
  ['rect', { x: 100, y: 140, width: 200, height: 100, rx: 4 }, 'grill'],
  ['rect', { x: 80, y: 100, width: 240, height: 40 }, 'roof'],
  ['rect', { x: 120, y: 150, width: 160, height: 10 }, 'skewers'],
  ['circle', { cx: 160, cy: 180, r: 12 }, 'meat1'],
  ['circle', { cx: 200, cy: 180, r: 12 }, 'meat2'],
  ['circle', { cx: 240, cy: 180, r: 12 }, 'meat3'],
  ['rect', { x: 0, y: 240, width: 400, height: 40 }, 'ground'],
  ['path', { d: 'M180,130 Q190,100 200,130' }, 'smoke'],
])

// Lagos Skyline
const SkylineSVG = mkSVG([
  ['rect', { x: 30, y: 120, width: 50, height: 140 }, 'bldg1'],
  ['rect', { x: 90, y: 80, width: 40, height: 180 }, 'bldg2'],
  ['rect', { x: 140, y: 60, width: 60, height: 200 }, 'bldg3'],
  ['rect', { x: 210, y: 100, width: 50, height: 160 }, 'bldg4'],
  ['rect', { x: 270, y: 70, width: 45, height: 190 }, 'bldg5'],
  ['rect', { x: 325, y: 130, width: 45, height: 130 }, 'bldg6'],
  ['rect', { x: 0, y: 250, width: 400, height: 30 }, 'ground'],
  ['circle', { cx: 350, cy: 40, r: 20 }, 'sun'],
])

// Okada (motorcycle)
const OkadaSVG = mkSVG([
  ['circle', { cx: 120, cy: 200, r: 30 }, 'fwheel'],
  ['circle', { cx: 280, cy: 200, r: 30 }, 'rwheel'],
  ['path', { d: 'M120,200 L160,140 L240,130 L280,200' }, 'frame'],
  ['rect', { x: 150, y: 110, width: 80, height: 30, rx: 6 }, 'seat'],
  ['rect', { x: 240, y: 90, width: 40, height: 40, rx: 4 }, 'tank'],
  ['rect', { x: 100, y: 150, width: 30, height: 10, rx: 2 }, 'handlebar'],
])

export const EXTRA_SCENES = {
  keke: { id:'keke', title:'🛺 Keke Napep', desc:'Color the Lagos tricycle taxi', color:'#fde047', minParts:3,
    parts:['body','roof','window1','window2','wheel1','wheel2','cargo','wheel3'],
    guide:{body:'#fde047',roof:'#22c55e',window1:'#64748b',window2:'#64748b',wheel1:'#1e293b',wheel2:'#1e293b',cargo:'#f97316',wheel3:'#1e293b'},
    SVG: KekeSVG },
  mosque: { id:'mosque', title:'🕌 Lagos Mosque', desc:'Color a beautiful mosque', color:'#22c55e', minParts:3,
    parts:['wall','dome','minaret1','minaret2','door','crescent','ground'],
    guide:{wall:'#fde047',dome:'#22c55e',minaret1:'#fde047',minaret2:'#fde047',door:'#a16207',crescent:'#fde047',ground:'#64748b'},
    SVG: MosqueSVG },
  church: { id:'church', title:'⛪ Lagos Church', desc:'Paint a classic Nigerian church', color:'#3b82f6', minParts:3,
    parts:['wall','roof','door','window1','window2','cross','ground'],
    guide:{wall:'#ffffff',roof:'#ef4444',door:'#a16207',window1:'#3b82f6',window2:'#3b82f6',cross:'#fde047',ground:'#22c55e'},
    SVG: ChurchSVG },
  palm: { id:'palm', title:'🌴 Palm Tree', desc:'Color a tropical palm tree', color:'#22c55e', minParts:3,
    parts:['trunk','leaf1','leaf2','leaf3','coconut1','coconut2','ground'],
    guide:{trunk:'#a16207',leaf1:'#22c55e',leaf2:'#22c55e',leaf3:'#22c55e',coconut1:'#a16207',coconut2:'#a16207',ground:'#fde047'},
    SVG: PalmSVG },
  jollof: { id:'jollof', title:'🍚 Jollof Rice Pot', desc:'Color the famous jollof pot', color:'#ef4444', minParts:3,
    parts:['pot','potbody','rice','base','handle','lid','steam1','steam2'],
    guide:{pot:'#64748b',potbody:'#64748b',rice:'#ef4444',base:'#1e293b',handle:'#64748b',lid:'#64748b',steam1:'#ffffff',steam2:'#ffffff'},
    SVG: JollofSVG },
  boat: { id:'boat', title:'🚣 Fishing Boat', desc:'Color a Lagos lagoon boat', color:'#0ea5e9', minParts:3,
    parts:['hull','mast','sail','water','deck','sun'],
    guide:{hull:'#a16207',mast:'#a16207',sail:'#ffffff',water:'#3b82f6',deck:'#a16207',sun:'#fde047'},
    SVG: BoatSVG },
  agbada: { id:'agbada', title:'👘 Agbada Outfit', desc:'Design a traditional outfit', color:'#a855f7', minParts:3,
    parts:['head','agbada','inner','leg1','leg2','cap'],
    guide:{head:'#a16207',agbada:'#a855f7',inner:'#ffffff',leg1:'#1e293b',leg2:'#1e293b',cap:'#a855f7'},
    SVG: AgbadaSVG },
  fuel: { id:'fuel', title:'⛽ Fuel Station', desc:'Paint a Lagos petrol station', color:'#ef4444', minParts:3,
    parts:['building','awning','pump1','pump2','ground','sign'],
    guide:{building:'#ffffff',awning:'#ef4444',pump1:'#22c55e',pump2:'#22c55e',ground:'#64748b',sign:'#fde047'},
    SVG: FuelSVG },
  suya: { id:'suya', title:'🥩 Suya Stand', desc:'Color the suya man\'s grill', color:'#f97316', minParts:3,
    parts:['grill','roof','skewers','meat1','meat2','meat3','ground','smoke'],
    guide:{grill:'#64748b',roof:'#a16207',skewers:'#64748b',meat1:'#a16207',meat2:'#a16207',meat3:'#a16207',ground:'#64748b',smoke:'#ffffff'},
    SVG: SuyaSVG },
  skyline: { id:'skyline', title:'🏙️ Lagos Skyline', desc:'Paint the city skyline', color:'#3b82f6', minParts:4,
    parts:['bldg1','bldg2','bldg3','bldg4','bldg5','bldg6','ground','sun'],
    guide:{bldg1:'#64748b',bldg2:'#3b82f6',bldg3:'#0ea5e9',bldg4:'#a855f7',bldg5:'#f97316',bldg6:'#22c55e',ground:'#1e293b',sun:'#fde047'},
    SVG: SkylineSVG },
  okada: { id:'okada', title:'🏍️ Okada Bike', desc:'Color a motorcycle taxi', color:'#ef4444', minParts:3,
    parts:['fwheel','rwheel','frame','seat','tank','handlebar'],
    guide:{fwheel:'#1e293b',rwheel:'#1e293b',frame:'#ef4444',seat:'#1e293b',tank:'#ef4444',handlebar:'#64748b'},
    SVG: OkadaSVG },
}
