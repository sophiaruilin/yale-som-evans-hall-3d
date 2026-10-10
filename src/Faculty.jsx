import { useMemo } from 'react'
import * as THREE from 'three'
import Professor, { PROFESSORS } from './Professor.jsx'
import Zaman from './Zaman.jsx'
import Schott from './Schott.jsx'
import Totoro from './Totoro.jsx'
import ProfAvatar from './ProfAvatar.jsx'
import { AI_PROFS } from './aiProfs.js'
import { PROFESSOR_INFO } from './talk.js'
import { DRUMS, LECTERNS } from './layout.js'

// which professor teaches in which classroom (matches the slide decks).
// MGT 409 really meets in Evans 2200 (course database), so AI-Zaman stands there;
// Snape moved over to 2400.
export const ROOM_PROFESSOR = {
  2200: 'zaman', // MGT 409 AI Foundations for Managers (Evans 2200)
  2210: 'schott', // MGT 407 Statistics (EMBA; no room listed, placed next to Zaman)
  ...Object.fromEntries(Object.entries(AI_PROFS).map(([slug, p]) => [p.room, slug])), // AI course professors
}

function plaqueTex(name) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = '#c9a44a'
  g.fillRect(0, 0, 512, 128)
  g.fillStyle = '#2a1d0c'
  g.fillRect(8, 8, 496, 112)
  g.fillStyle = '#f3dfa8'
  g.font = 'bold 44px Georgia, serif'
  g.textAlign = 'center'
  g.fillText(`Prof. ${name.split(' ').slice(-1)[0]}`, 256, 80)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export default function Faculty() {
  const items = useMemo(
    () =>
      DRUMS.map((d, i) => {
        const who = ROOM_PROFESSOR[d.id]
        const { fc, back, t, half, rot } = d.front
        const lec = LECTERNS[i]
        return {
          who,
          pos: [fc[0] + back[0] * 1.15 - t[0] * half * 0.3, 0, fc[1] + back[1] * 1.15 - t[1] * half * 0.3],
          rot,
          lectern: lec,
          plaque: { p: [lec.x + back[0] * 0.26, 0.85, lec.z + back[1] * 0.26], rot, mat: new THREE.MeshBasicMaterial({ map: plaqueTex((PROFESSORS[who] ?? PROFESSOR_INFO[who]).name) }) },
        }
      }),
    [],
  )
  return (
    <>
      {items.map((it, i) => (
        <group key={i}>
          {it.who === 'zaman' ? (
            <Zaman position={it.pos} rotation={it.rot} />
          ) : AI_PROFS[it.who] ? (
            <ProfAvatar slug={it.who} look={AI_PROFS[it.who].look} position={it.pos} rotation={it.rot} />
          ) : it.who === 'schott' ? (
            <>
              <Schott position={it.pos} rotation={it.rot} />
              <Totoro position={[it.lectern.x, 1.1, it.lectern.z]} rotation={it.rot} />
            </>
          ) : (
            <Professor who={it.who} position={it.pos} rotation={it.rot} phase={i * 1.7} />
          )}
          <mesh position={it.plaque.p} rotation={[0, it.plaque.rot, 0]} material={it.plaque.mat}>
            <planeGeometry args={[0.6, 0.15]} />
          </mesh>
        </group>
      ))}
      {/* Hagrid keeps an eye on the Labubus in the courtyard */}
      <Professor who="hagrid" position={[-10.5, -5, -2]} rotation={Math.PI / 2} />
    </>
  )
}
