import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Small forest-spirit plush (Totoro-style) built from primitives. Sits on Prof. Schott's podium.
// Origin is at its feet; default height ~0.3 m. Faces +z.
const mats = new Map()
const m = (color) => {
  if (!mats.has(color)) mats.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.95 }))
  return mats.get(color)
}
const SPH = new THREE.SphereGeometry(1, 24, 16)
const CONE = new THREE.ConeGeometry(1, 1, 16)
const BOX = new THREE.BoxGeometry(1, 1, 1)
const GRAY = '#8d8f8c'
const BELLY = '#efe6cf'
const DARK = '#3d3f3c'

const B = ({ g = SPH, c, p, s, r = [0, 0, 0] }) => <mesh geometry={g} material={m(c)} position={p} scale={s} rotation={r} />

export default function Totoro({ position = [0, 0, 0], rotation = 0, height = 0.3 }) {
  const body = useRef()
  useFrame(({ clock }) => {
    // slow happy wobble
    body.current.rotation.z = Math.sin(clock.elapsedTime * 1.4) * 0.06
  })
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={height}>
      <group ref={body}>
        {/* round body + cream belly with chevrons */}
        <B c={GRAY} p={[0, 0.42, 0]} s={[0.36, 0.42, 0.32]} />
        <B c={BELLY} p={[0, 0.36, 0.13]} s={[0.27, 0.3, 0.21]} />
        {[[-0.08, 0.5], [0, 0.52], [0.08, 0.5], [-0.12, 0.4], [-0.04, 0.42], [0.04, 0.42], [0.12, 0.4]].map(([x, y], i) => (
          <B key={i} g={CONE} c={GRAY} p={[x, y, 0.34]} r={[Math.PI / 2 + 0.2, 0, Math.PI]} s={[0.025, 0.03, 0.012]} />
        ))}
        {/* pointy ears */}
        {[-1, 1].map((sx) => (
          <B key={sx} g={CONE} c={GRAY} p={[0.14 * sx, 0.92, 0]} r={[0, 0, -0.12 * sx]} s={[0.05, 0.2, 0.05]} />
        ))}
        {/* big eyes, nose, grin, whiskers */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <B c="#ffffff" p={[0.11 * sx, 0.68, 0.27]} s={[0.055, 0.055, 0.03]} />
            <B c={DARK} p={[0.11 * sx, 0.68, 0.295]} s={[0.025, 0.025, 0.012]} />
            {[0, 1, 2].map((k) => (
              <B key={k} g={BOX} c={DARK} p={[0.24 * sx, 0.6 + k * 0.03, 0.22]} r={[0, 0.5 * sx, (k - 1) * 0.15 * sx]} s={[0.12, 0.006, 0.006]} />
            ))}
          </group>
        ))}
        <B c={DARK} p={[0, 0.66, 0.31]} s={[0.035, 0.02, 0.015]} />
        <B g={BOX} c={DARK} p={[0, 0.58, 0.3]} s={[0.14, 0.012, 0.01]} />
        {/* little arms + feet */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <B c={GRAY} p={[0.33 * sx, 0.4, 0.04]} r={[0, 0, 0.3 * sx]} s={[0.07, 0.14, 0.07]} />
            <B c={GRAY} p={[0.14 * sx, 0.03, 0.08]} s={[0.1, 0.05, 0.12]} />
          </group>
        ))}
      </group>
    </group>
  )
}
