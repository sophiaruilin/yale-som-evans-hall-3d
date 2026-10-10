import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useTalkTurn from './useTalkTurn.js'
import { startTalk } from './talk.js'

// AI character inspired by Prof. Peter Schott (MGT 407 Statistics, EMBA).
// From his photo: wavy brown hair, fair sun-kissed skin, blue-gray eyes, light stubble,
// light-blue button-down with an open collar. Khaki chinos + loafers for the SoCal look.
// Figure faces +z. Turns to face you while you chat (useTalkTurn).

const SKIN = '#e3b895'
const HAIR = '#5b3d28'
const SHIRT = '#bcd3ee'
const SHIRT_SHADE = '#a9c3e3'
const CHINOS = '#c8b48c'
const LOAFER = '#5a3621'

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
const TORSO = new THREE.CylinderGeometry(0.2, 0.185, 0.6, 28)

const B = ({ g = SPH, c, p, s, r = [0, 0, 0], o }) => <mesh geometry={g} material={m(c, o)} position={p} scale={s} rotation={r} />

// wavy hair: a cap of overlapping bumps swept up and back
const WAVES = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2
  return [Math.cos(a) * 0.1, 1.83 + Math.sin(a * 3) * 0.012, Math.sin(a) * 0.1 - 0.01]
})

function Arm({ side, armRef }) {
  // long sleeves rolled to just below the elbow, forearm + hand showing
  return (
    <group ref={armRef} position={[0.27 * side, 1.47, 0]} rotation={[0.06, 0, 0.14 * side]}>
      <mesh geometry={CAP} material={m(SHIRT)} position={[0, -0.17, 0]} scale={[0.07, 0.13, 0.07]} />
      <B g={CYL} c={SHIRT_SHADE} p={[0, -0.32, 0]} s={[0.074, 0.05, 0.074]} />
      <mesh geometry={CAP} material={m(SKIN)} position={[0, -0.42, 0]} scale={[0.05, 0.08, 0.05]} />
      <mesh geometry={SPH} material={m(SKIN)} position={[0, -0.55, 0.01]} scale={[0.045, 0.055, 0.04]} />
    </group>
  )
}

export default function Schott({ position = [0, 0, 0], rotation = 0, height = 1.85 }) {
  const s = height / 1.8
  const { root, head, talking } = useTalkTurn('schott', rotation, s)
  const armR = useRef()
  const armL = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // animated explainer: both hands work through a long problem while chatting
    const g = talking.current ? 0.55 + Math.sin(t * 2.8) * 0.3 : 0.12 + Math.max(0, Math.sin(t * 0.7)) * 0.25
    armR.current.rotation.x = -g
    armR.current.rotation.z = -0.14 - g * 0.2
    armL.current.rotation.x = talking.current ? -0.35 - Math.sin(t * 2.8 + 1.5) * 0.2 : 0.06
    head.current.rotation.z = Math.sin(t * 0.9) * 0.05 // easygoing nod
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
        startTalk('schott')
      }}
    >
      {/* loafers */}
      {[-1, 1].map((sx) => (
        <B key={sx} g={BOX} c={LOAFER} p={[0.1 * sx, 0.04, 0.04]} s={[0.11, 0.08, 0.27]} o={{ roughness: 0.5 }} />
      ))}
      {/* khaki chinos + brown belt */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} geometry={CAP} material={m(CHINOS)} position={[0.1 * sx, 0.5, 0]} scale={[0.085, 0.33, 0.09]} />
      ))}
      <B g={CYL} c={CHINOS} p={[0, 0.88, 0]} s={[0.19, 0.12, 0.135]} />
      <B g={CYL} c={LOAFER} p={[0, 0.93, 0]} s={[0.192, 0.03, 0.137]} />
      <B g={BOX} c="#c9a44a" p={[0, 0.93, 0.137]} s={[0.04, 0.03, 0.01]} o={{ metalness: 0.8, roughness: 0.3 }} />

      {/* light-blue button-down, tucked in */}
      <mesh geometry={TORSO} material={m(SHIRT)} position={[0, 1.24, 0]} />
      <B c={SHIRT} p={[0, 1.5, 0]} s={[0.27, 0.09, 0.17]} />
      {/* button placket + buttons */}
      <B g={BOX} c={SHIRT_SHADE} p={[0, 1.2, 0.193]} s={[0.025, 0.5, 0.006]} />
      {[1.33, 1.22, 1.11, 1.0].map((y) => (
        <B key={y} c="#f4f6f8" p={[0, y, 0.198]} s={[0.008, 0.008, 0.004]} />
      ))}
      {/* breast pocket */}
      <B g={BOX} c={SHIRT_SHADE} p={[-0.1, 1.33, 0.19]} s={[0.075, 0.085, 0.006]} />
      {/* open collar: skin V at the neck and two collar points */}
      <B g={BOX} c={SKIN} p={[0, 1.47, 0.16]} r={[0, 0, Math.PI / 4]} s={[0.07, 0.07, 0.01]} />
      {[-1, 1].map((sx) => (
        <B key={sx} g={BOX} c={SHIRT} p={[0.055 * sx, 1.52, 0.155]} r={[-0.35, 0.25 * sx, 0.55 * sx]} s={[0.085, 0.045, 0.012]} />
      ))}
      <B g={CYL} c={SKIN} p={[0, 1.58, 0]} s={[0.052, 0.07, 0.052]} />

      <Arm side={1} armRef={armL} />
      <Arm side={-1} armRef={armR} />

      {/* head pivots at the neck */}
      <group ref={head} position={[0, 1.6, 0]}>
        <group position={[0, -1.6, 0]}>
          <B c={SKIN} p={[0, 1.72, 0]} s={[0.112, 0.14, 0.125]} />
          {/* strong jaw + light stubble */}
          <B c={SKIN} p={[0, 1.64, 0.03]} s={[0.095, 0.06, 0.09]} />
          <B c="#8a6a55" p={[0, 1.635, 0.035]} s={[0.097, 0.058, 0.092]} o={{ transparent: true, opacity: 0.28 }} />
          {[-1, 1].map((sx) => (
            <B key={sx} c={SKIN} p={[0.115 * sx, 1.72, 0]} s={[0.02, 0.035, 0.02]} />
          ))}
          {/* wavy brown hair, swept up and back */}
          <B c={HAIR} p={[0, 1.8, -0.02]} s={[0.12, 0.08, 0.13]} />
          {WAVES.map((p, i) => (
            <B key={i} c={HAIR} p={p} s={[0.05, 0.035, 0.05]} />
          ))}
          <B c={HAIR} p={[0.02, 1.835, 0.07]} r={[0.6, 0, -0.2]} s={[0.08, 0.035, 0.055]} />
          {[-1, 1].map((sx) => (
            <B key={sx} c={HAIR} p={[0.106 * sx, 1.76, -0.025]} s={[0.022, 0.055, 0.085]} />
          ))}
          {/* blue-gray eyes, brows, nose, easy smile */}
          {[-1, 1].map((sx) => (
            <group key={sx}>
              <B c="#ffffff" p={[0.043 * sx, 1.735, 0.108]} s={[0.02, 0.014, 0.01]} />
              <B c="#5f7b8c" p={[0.043 * sx, 1.735, 0.116]} s={[0.01, 0.011, 0.006]} />
              <B g={BOX} c={HAIR} p={[0.045 * sx, 1.765, 0.11]} r={[0, 0, -0.08 * sx]} s={[0.042, 0.01, 0.01]} />
            </group>
          ))}
          <B c="#d6a684" p={[0, 1.7, 0.123]} s={[0.018, 0.03, 0.022]} />
          <B g={BOX} c="#9a5a4a" p={[0, 1.655, 0.113]} r={[0, 0, 0.06]} s={[0.05, 0.007, 0.008]} />
          {[-1, 1].map((sx) => (
            <B key={sx} c="#9a5a4a" p={[0.027 * sx, 1.659, 0.112]} s={[0.006, 0.006, 0.006]} />
          ))}
        </group>
      </group>
    </group>
  )
}
