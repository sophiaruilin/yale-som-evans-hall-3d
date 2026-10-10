import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useTalkTurn from './useTalkTurn.js'
import { startTalk } from './talk.js'

// Stylized professor built from a "look" spec (see aiProfs.js), so adding a professor is
// data, not a new component. Cartoon, not a likeness: general features from public photos.
// Figure faces +z, origin at the feet. Clicks/turning come from useTalkTurn.
//
// look = {
//   height, skin, eyes,
//   hair: { color, style: 'short' | 'side' | 'wavy' | 'curly' | 'buzz' | 'bald' | 'receding' | 'long' | 'bob' | 'bun', temples? },
//   smile: 'big' (shows teeth) | undefined,
//   beard: null | { color, style: 'stubble' | 'short' | 'full' | 'goatee' | 'mustache' },
//   glasses: null | { color, style: 'round' | 'rect' },
//   top: { type: 'blazer' | 'shirt' | 'sweater' | 'cardigan' | 'polo' | 'blouse', color, inner?, tie? },
//   pants, shoes,
// }

const mats = new Map()
const m = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o }))
  return mats.get(k)
}
const SPH = new THREE.SphereGeometry(1, 24, 16)
const CYL = new THREE.CylinderGeometry(1, 1, 1, 20)
const BOX = new THREE.BoxGeometry(1, 1, 1)
const CAP = new THREE.CapsuleGeometry(1, 1, 6, 12)
const TORUS = new THREE.TorusGeometry(1, 0.18, 8, 24)
const TORSO = new THREE.CylinderGeometry(0.2, 0.185, 0.6, 28)
const SKIRTISH = new THREE.CylinderGeometry(0.205, 0.215, 0.14, 28)

const B = ({ g = SPH, c, p, s, r = [0, 0, 0], o }) => <mesh geometry={g} material={m(c, o)} position={p} scale={s} rotation={r} />

const shade = (hex, k) => {
  const c = new THREE.Color(hex)
  c.multiplyScalar(k)
  return `#${c.getHexString()}`
}

function Hair({ hair }) {
  const c = hair.color
  switch (hair.style) {
    case 'bald':
      return null
    case 'buzz':
      return <B c={c} p={[0, 1.775, -0.01]} s={[0.117, 0.11, 0.128]} o={{ roughness: 1 }} />
    case 'receding':
      return (
        <>
          <B c={c} p={[0, 1.76, -0.05]} s={[0.118, 0.1, 0.1]} />
          {[-1, 1].map((sx) => (
            <B key={sx} c={c} p={[0.105 * sx, 1.74, -0.02]} s={[0.025, 0.06, 0.09]} />
          ))}
        </>
      )
    case 'wavy':
    case 'curly': {
      const n = hair.style === 'curly' ? 22 : 14
      const r = hair.style === 'curly' ? 0.045 : 0.05
      return (
        <>
          <B c={c} p={[0, 1.8, -0.02]} s={[0.12, 0.08, 0.13]} />
          {Array.from({ length: n }, (_, i) => {
            const a = (i / n) * Math.PI * 2
            return <B key={i} c={c} p={[Math.cos(a) * 0.1, 1.83 + Math.sin(a * 3) * 0.015, Math.sin(a) * 0.1 - 0.01]} s={[r, r * 0.8, r]} />
          })}
          {[-1, 1].map((sx) => (
            <B key={sx} c={c} p={[0.106 * sx, 1.76, -0.025]} s={[0.022, 0.055, 0.085]} />
          ))}
        </>
      )
    }
    case 'long':
    case 'bob':
    case 'bun': {
      const len = hair.style === 'long' ? 0.24 : 0.13
      return (
        <>
          <B c={c} p={[0, 1.79, -0.015]} s={[0.125, 0.09, 0.135]} />
          <B c={c} p={[0, 1.79 - len / 2, -0.07]} s={[0.13, len, 0.08]} />
          {[-1, 1].map((sx) => (
            <B key={sx} c={c} p={[0.11 * sx, 1.77 - len / 3, -0.01]} s={[0.03, len * 0.7, 0.1]} />
          ))}
          <B c={c} p={[-0.03, 1.835, 0.075]} r={[0.7, 0, 0.3]} s={[0.09, 0.03, 0.05]} />
          {hair.style === 'bun' && <B c={c} p={[0, 1.86, -0.12]} s={[0.06, 0.06, 0.06]} />}
        </>
      )
    }
    case 'side':
    case 'short':
    default:
      return (
        <>
          <B c={c} p={[0, 1.79, -0.015]} s={[0.12, 0.085, 0.13]} />
          <B c={c} p={[hair.style === 'side' ? 0.03 : 0, 1.83, 0.06]} r={[0.5, 0, hair.style === 'side' ? -0.35 : 0]} s={[0.085, 0.035, 0.055]} />
          {[-1, 1].map((sx) => (
            <B key={sx} c={hair.temples ?? c} p={[0.106 * sx, 1.755, -0.02]} s={[0.022, 0.055, 0.09]} />
          ))}
        </>
      )
  }
}

function Beard({ beard, skin }) {
  if (!beard) return null
  const c = beard.color
  switch (beard.style) {
    case 'stubble':
      return <B c={c} p={[0, 1.635, 0.035]} s={[0.097, 0.058, 0.092]} o={{ transparent: true, opacity: 0.3 }} />
    case 'mustache':
      return <B g={BOX} c={c} p={[0, 1.672, 0.118]} s={[0.055, 0.012, 0.01]} />
    case 'goatee':
      return (
        <>
          <B g={BOX} c={c} p={[0, 1.672, 0.118]} s={[0.05, 0.011, 0.01]} />
          <B c={c} p={[0, 1.615, 0.1]} s={[0.035, 0.03, 0.03]} />
        </>
      )
    case 'full':
    case 'short':
    default:
      return (
        <>
          <B c={c} p={[0, 1.64, 0.035]} s={[0.1, beard.style === 'full' ? 0.075 : 0.062, 0.095]} />
          <B g={BOX} c={c} p={[0, 1.672, 0.118]} s={[0.055, 0.012, 0.012]} />
          <B g={BOX} c={skin} p={[0, 1.652, 0.123]} s={[0.04, 0.008, 0.008]} />
        </>
      )
  }
}

function Glasses({ glasses }) {
  if (!glasses) return null
  const c = glasses.color ?? '#1a1a1a'
  const lens = glasses.style === 'round' ? [0.03, 0.03, 0.02] : [0.034, 0.024, 0.02]
  return (
    <>
      {[-1, 1].map((sx) =>
        glasses.style === 'round' ? (
          <B key={sx} g={TORUS} c={c} p={[0.045 * sx, 1.735, 0.122]} s={lens} />
        ) : (
          <group key={sx}>
            <B g={BOX} c={c} p={[0.045 * sx, 1.759, 0.122]} s={[0.07, 0.008, 0.008]} />
            <B g={BOX} c={c} p={[0.045 * sx, 1.712, 0.122]} s={[0.07, 0.006, 0.006]} />
            <B g={BOX} c={c} p={[0.045 * sx + 0.034 * sx, 1.735, 0.122]} s={[0.006, 0.05, 0.006]} />
            <B g={BOX} c={c} p={[0.045 * sx - 0.034 * sx, 1.735, 0.122]} s={[0.006, 0.05, 0.006]} />
          </group>
        ),
      )}
      <B g={BOX} c={c} p={[0, 1.74, 0.124]} s={[0.022, 0.006, 0.006]} />
      {[-1, 1].map((sx) => (
        <B key={sx} g={BOX} c={c} p={[0.095 * sx, 1.74, 0.06]} s={[0.006, 0.006, 0.12]} />
      ))}
    </>
  )
}

function Top({ top, skin }) {
  const { type, color } = top
  const inner = top.inner ?? '#f4f5f7'
  const dark = shade(color, 0.85)
  return (
    <>
      <mesh geometry={TORSO} material={m(color)} position={[0, 1.24, 0]} />
      <B c={color} p={[0, 1.5, 0]} s={[0.27, 0.09, 0.17]} />
      {type === 'blazer' && (
        <>
          {/* shirt + optional tie in the V, lapels, buttons, hem flare */}
          <B g={BOX} c={inner} p={[0, 1.36, 0.17]} r={[0, 0, Math.PI / 4]} s={[0.15, 0.15, 0.02]} />
          {top.tie && <B g={BOX} c={top.tie} p={[0, 1.33, 0.19]} s={[0.03, 0.22, 0.008]} />}
          {[-1, 1].map((sx) => (
            <B key={sx} g={BOX} c={dark} p={[0.06 * sx, 1.37, 0.185]} r={[0, 0, 0.42 * sx]} s={[0.035, 0.24, 0.012]} />
          ))}
          {[1.16, 1.06].map((y) => (
            <B key={y} c={shade(color, 0.6)} p={[0.015, y, 0.2]} s={[0.009, 0.009, 0.005]} />
          ))}
          <mesh geometry={SKIRTISH} material={m(color)} position={[0, 0.92, 0]} />
        </>
      )}
      {(type === 'shirt' || type === 'blouse' || type === 'polo') && (
        <>
          <B g={BOX} c={dark} p={[0, type === 'polo' ? 1.42 : 1.2, 0.193]} s={[0.022, type === 'polo' ? 0.14 : 0.5, 0.006]} />
          <B g={BOX} c={skin} p={[0, 1.47, 0.16]} r={[0, 0, Math.PI / 4]} s={[0.06, 0.06, 0.01]} />
          {[-1, 1].map((sx) => (
            <B key={sx} g={BOX} c={color} p={[0.055 * sx, 1.52, 0.155]} r={[-0.35, 0.25 * sx, 0.55 * sx]} s={[0.085, 0.045, 0.012]} />
          ))}
        </>
      )}
      {type === 'sweater' && (
        <>
          <B g={BOX} c={inner} p={[0, 1.47, 0.165]} r={[0, 0, Math.PI / 4]} s={[0.07, 0.07, 0.01]} />
          <B g={CYL} c={dark} p={[0, 0.96, 0]} s={[0.192, 0.05, 0.14]} />
        </>
      )}
      {type === 'cardigan' && (
        <>
          {/* open front: blouse shows down the middle */}
          <B g={BOX} c={inner} p={[0, 1.24, 0.19]} s={[0.1, 0.58, 0.012]} />
          <B g={BOX} c={inner} p={[0, 1.47, 0.165]} r={[0, 0, Math.PI / 4]} s={[0.08, 0.08, 0.01]} />
          {[1.36, 1.24, 1.12].map((y) => (
            <B key={y} c={shade(inner, 0.8)} p={[0, y, 0.198]} s={[0.008, 0.008, 0.004]} />
          ))}
          <B g={CYL} c={dark} p={[0, 0.96, 0]} s={[0.192, 0.05, 0.14]} />
        </>
      )}
    </>
  )
}

function Arm({ side, armRef, top, skin }) {
  const sleeve = top.color
  return (
    <group ref={armRef} position={[0.27 * side, 1.47, 0]} rotation={[0.06, 0, 0.14 * side]}>
      <mesh geometry={CAP} material={m(sleeve)} position={[0, -0.24, 0]} scale={[0.07, 0.2, 0.07]} />
      {top.type === 'blazer' && <B g={CYL} c={top.inner ?? '#f4f5f7'} p={[0, -0.47, 0]} s={[0.058, 0.03, 0.058]} />}
      <mesh geometry={SPH} material={m(skin)} position={[0, -0.53, 0.01]} scale={[0.045, 0.055, 0.04]} />
    </group>
  )
}

export default function ProfAvatar({ slug, look, position = [0, 0, 0], rotation = 0 }) {
  const height = look.height ?? 1.8
  const s = height / 1.8
  const { root, head, talking } = useTalkTurn(slug, rotation, s)
  const armR = useRef()
  const armL = useRef()
  const phase = useMemo(() => [...slug].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 7, [slug])
  const { skin, top } = look
  const tucked = !['blazer', 'sweater', 'cardigan'].includes(top.type)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase
    const g = talking.current ? 0.55 + Math.sin(t * 2.6) * 0.3 : 0.1 + Math.max(0, Math.sin(t * 0.7)) * 0.22
    armR.current.rotation.x = -g
    armR.current.rotation.z = -0.14 - g * 0.2
    armL.current.rotation.x = talking.current ? -0.25 - Math.sin(t * 2.6 + 1.5) * 0.15 : 0.06
    head.current.rotation.z = Math.sin(t * 0.9) * 0.04
  })

  return (
    <group
      ref={root}
      position={position}
      rotation={[0, rotation, 0]}
      scale={s}
      onClick={(e) => {
        if (document.pointerLockElement) return // pointer-lock clicks go through Interact
        e.stopPropagation()
        startTalk(slug)
      }}
    >
      {[-1, 1].map((sx) => (
        <B key={sx} g={BOX} c={look.shoes ?? '#2a2a2a'} p={[0.1 * sx, 0.04, 0.04]} s={[0.11, 0.08, 0.27]} o={{ roughness: 0.5 }} />
      ))}
      {[-1, 1].map((sx) => (
        <mesh key={sx} geometry={CAP} material={m(look.pants ?? '#2f3440')} position={[0.1 * sx, 0.5, 0]} scale={[0.085, 0.33, 0.09]} />
      ))}
      <B g={CYL} c={look.pants ?? '#2f3440'} p={[0, 0.88, 0]} s={[0.19, 0.12, 0.135]} />
      {tucked && <B g={CYL} c="#3a2a1e" p={[0, 0.93, 0]} s={[0.192, 0.03, 0.137]} />}

      <Top top={top} skin={skin} />
      <B g={CYL} c={skin} p={[0, 1.58, 0]} s={[0.052, 0.07, 0.052]} />
      <Arm side={1} armRef={armL} top={top} skin={skin} />
      <Arm side={-1} armRef={armR} top={top} skin={skin} />

      <group ref={head} position={[0, 1.6, 0]}>
        <group position={[0, -1.6, 0]}>
          <B c={skin} p={[0, 1.72, 0]} s={[0.112, 0.138, 0.125]} />
          <B c={skin} p={[0, 1.645, 0.03]} s={[0.09, 0.055, 0.085]} />
          {[-1, 1].map((sx) => (
            <B key={sx} c={skin} p={[0.115 * sx, 1.72, 0]} s={[0.02, 0.035, 0.02]} />
          ))}
          <Hair hair={look.hair} />
          <Beard beard={look.beard} skin={skin} />
          {[-1, 1].map((sx) => (
            <group key={sx}>
              <B c="#ffffff" p={[0.043 * sx, 1.735, 0.108]} s={[0.02, 0.014, 0.01]} />
              <B c={look.eyes ?? '#3b2a20'} p={[0.043 * sx, 1.735, 0.116]} s={[0.01, 0.011, 0.006]} />
              <B g={BOX} c={look.hair.style === 'bald' ? shade(skin, 0.6) : look.hair.color} p={[0.045 * sx, 1.765, 0.11]} r={[0, 0, -0.08 * sx]} s={[0.042, 0.009, 0.01]} />
            </group>
          ))}
          <B c={shade(skin, 0.93)} p={[0, 1.7, 0.123]} s={[0.017, 0.028, 0.021]} />
          {look.smile === 'big' ? (
            <>
              <B g={BOX} c="#ffffff" p={[0, 1.655, 0.114]} s={[0.052, 0.016, 0.008]} />
              <B g={BOX} c="#8a4a3c" p={[0, 1.645, 0.113]} s={[0.056, 0.006, 0.008]} />
            </>
          ) : (
            <B g={BOX} c="#8a4a3c" p={[0, 1.655, 0.113]} s={[0.046, 0.007, 0.008]} />
          )}
          <Glasses glasses={look.glasses} />
        </group>
      </group>
    </group>
  )
}
