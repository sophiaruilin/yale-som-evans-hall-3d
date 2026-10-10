import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Labubu from './Labubu.jsx'
import { startTalk, talkState, talkTargets } from './talk.js'

// AI character inspired by Prof. Tauhid Zaman (MGT 409), shown with his OK.
// Black hoodie with BLACKPINK-pink accents, jeans, sneakers, glasses, and a pink Labubu
// keychain swinging from his belt loop. Built from primitives like the other professors.
// Figure faces +z. When you chat with him he turns his body and head to look at you.

const SKIN = '#c68e64' // light brown
const HAIR = '#141010'
const HOODIE = '#151518'
const PINK = '#f7a7c6' // BLACKPINK pink
const HOT = '#ff4fa3'
const JEANS = '#2e3d5c'

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

const B = ({ g = SPH, c, p, s, r = [0, 0, 0], o, mat }) => (
  <mesh geometry={g} material={mat ?? m(c, o)} position={p} scale={s} rotation={r} />
)

// "BP" chest patch: pink letters on a black circle (no official logo)
function patchMat() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = HOODIE
  g.fillRect(0, 0, 256, 256)
  g.fillStyle = PINK
  g.beginPath()
  g.arc(128, 128, 118, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = HOODIE
  g.beginPath()
  g.arc(128, 128, 104, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = PINK
  g.font = 'bold 120px Arial, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('BP', 128, 136)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, transparent: true })
}

const shortest = (a) => Math.atan2(Math.sin(a), Math.cos(a))
const tmp = new THREE.Vector3()

export default function Zaman({ position = [0, 0, 0], rotation = 0, height = 1.75 }) {
  const s = height / 1.8
  const root = useRef()
  const head = useRef()
  const armR = useRef() // his right arm (at -x) gestures while explaining
  const keychain = useRef()
  const yaw = useRef(rotation)
  const patch = useMemo(patchMat, [])
  const { camera } = useThree()

  useEffect(() => {
    talkTargets.set('zaman', root.current)
    return () => talkTargets.delete('zaman')
  }, [])

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const t = clock.elapsedTime
    const talking = talkState.with === 'zaman'
    let target = rotation + Math.sin(t * 0.35) * 0.3 // idle: scanning the room
    let pitch = 0
    if (talking) {
      // face the player: yaw toward the camera, then tilt the head toward eye level
      root.current.getWorldPosition(tmp)
      const dx = camera.position.x - tmp.x
      const dz = camera.position.z - tmp.z
      target = Math.atan2(dx, dz)
      const headY = tmp.y + 1.62 * s
      pitch = THREE.MathUtils.clamp(-Math.atan2(camera.position.y - headY, Math.hypot(dx, dz)), -0.35, 0.35)
    }
    yaw.current += shortest(target - yaw.current) * Math.min(1, dt * (talking ? 5 : 1.5))
    root.current.rotation.y = yaw.current
    head.current.rotation.x += (pitch - head.current.rotation.x) * Math.min(1, dt * 5)
    head.current.rotation.z = Math.sin(t * 1.1) * 0.04 // easygoing head bob

    // explaining hand: bigger gestures while chatting
    const g = talking ? 0.6 + Math.sin(t * 3.2) * 0.35 : 0.15 + Math.max(0, Math.sin(t * 0.9)) * 0.3
    armR.current.rotation.x = -g
    armR.current.rotation.z = -0.15 - g * 0.25

    // keychain swings like a pendulum
    keychain.current.rotation.z = Math.sin(t * 2.6) * 0.22
    keychain.current.rotation.x = Math.sin(t * 1.7) * 0.1
  })

  const hoodie = m(HOODIE)
  const skin = m(SKIN)
  return (
    <group
      ref={root}
      position={position}
      rotation={[0, rotation, 0]}
      scale={s}
      onClick={(e) => {
        // touch mode (no pointer lock): tap him to chat. Pointer-lock clicks go through Interact.
        if (document.pointerLockElement) return
        e.stopPropagation()
        startTalk('zaman')
      }}
    >
      {/* sneakers */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B g={BOX} c="#f4f4f2" p={[0.1 * sx, 0.05, 0.04]} s={[0.12, 0.1, 0.28]} />
          <B g={BOX} c={HOT} p={[0.1 * sx, 0.012, 0.04]} s={[0.125, 0.025, 0.285]} />
        </group>
      ))}
      {/* jeans */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} geometry={CAP} material={m(JEANS)} position={[0.1 * sx, 0.5, 0]} scale={[0.085, 0.33, 0.09]} />
      ))}
      <B g={CYL} c={JEANS} p={[0, 0.88, 0]} s={[0.19, 0.12, 0.13]} />
      {/* belt + belt loop on his left hip (+x) */}
      <B g={CYL} c="#1a1410" p={[0, 0.93, 0]} s={[0.192, 0.03, 0.132]} />
      <B g={BOX} c={JEANS} p={[0.17, 0.92, 0.07]} s={[0.025, 0.06, 0.015]} />

      {/* Labubu keychain: gold ring + chain, swinging from the belt loop */}
      <group ref={keychain} position={[0.175, 0.9, 0.085]}>
        <B g={TORUS} c="#d9b35a" o={{ metalness: 0.85, roughness: 0.25 }} p={[0, 0, 0]} r={[0, Math.PI / 2, 0]} s={[0.018, 0.018, 0.018]} />
        <B g={CYL} c="#c9c9cf" o={{ metalness: 0.9, roughness: 0.3 }} p={[0, -0.04, 0]} s={[0.003, 0.06, 0.003]} />
        <Labubu fur="#ff8fc7" expression="grin" height={0.13} position={[0, -0.205, 0]} anim="idle" phase={2} />
      </group>

      {/* hoodie body */}
      <mesh geometry={new THREE.CylinderGeometry(0.21, 0.205, 0.62, 28)} material={hoodie} position={[0, 1.2, 0]} />
      <B g={CYL} c={HOODIE} p={[0, 0.9, 0]} s={[0.205, 0.08, 0.15]} />
      <B c={HOODIE} p={[0, 1.5, 0]} s={[0.28, 0.1, 0.17]} />
      {/* kangaroo pocket with pink trim */}
      <B g={BOX} c="#1d1d22" p={[0, 1.02, 0.19]} s={[0.24, 0.12, 0.02]} />
      <B g={BOX} c={PINK} p={[0, 1.085, 0.2]} s={[0.24, 0.008, 0.012]} />
      {/* BP chest patch */}
      <mesh position={[-0.09, 1.33, 0.206]} material={patch}>
        <circleGeometry args={[0.045, 32]} />
      </mesh>
      {/* pink drawstrings */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B g={CYL} c={PINK} p={[0.045 * sx, 1.42, 0.218]} r={[0.08, 0, 0]} s={[0.007, 0.15, 0.007]} />
          <B g={CYL} c={HOT} p={[0.045 * sx, 1.34, 0.224]} s={[0.01, 0.022, 0.01]} />
        </group>
      ))}
      {/* hood bunched behind the neck */}
      <B c={HOODIE} p={[0, 1.55, -0.09]} s={[0.17, 0.09, 0.11]} />
      <B g={TORUS} c={PINK} p={[0, 1.555, 0.02]} r={[Math.PI / 2, 0, 0]} s={[0.11, 0.1, 0.11]} />
      <B g={CYL} c={SKIN} p={[0, 1.58, 0]} s={[0.05, 0.06, 0.05]} />

      {/* left arm relaxed */}
      <group position={[0.27, 1.47, 0]} rotation={[0.08, 0, 0.16]}>
        <mesh geometry={CAP} material={hoodie} position={[0, -0.24, 0]} scale={[0.07, 0.2, 0.07]} />
        <B g={CYL} c={PINK} p={[0, -0.47, 0]} s={[0.066, 0.03, 0.066]} />
        <mesh geometry={SPH} material={skin} position={[0, -0.53, 0.01]} scale={[0.045, 0.055, 0.04]} />
      </group>
      {/* right arm explains things */}
      <group ref={armR} position={[-0.27, 1.47, 0]}>
        <mesh geometry={CAP} material={hoodie} position={[0, -0.24, 0]} scale={[0.07, 0.2, 0.07]} />
        <B g={CYL} c={PINK} p={[0, -0.47, 0]} s={[0.066, 0.03, 0.066]} />
        <mesh geometry={SPH} material={skin} position={[0, -0.53, 0.01]} scale={[0.045, 0.055, 0.04]} />
      </group>

      {/* head pivots at the neck so it can look up/down at you */}
      <group ref={head} position={[0, 1.6, 0]}>
        <group position={[0, -1.6, 0]}>
          <B c={SKIN} p={[0, 1.72, 0]} s={[0.115, 0.135, 0.125]} />
          {[-1, 1].map((sx) => (
            <B key={sx} c={SKIN} p={[0.118 * sx, 1.72, 0]} s={[0.02, 0.035, 0.02]} />
          ))}
          {/* short black hair with a little quiff */}
          <B c={HAIR} p={[0, 1.79, -0.015]} s={[0.122, 0.085, 0.13]} />
          <B c={HAIR} p={[0, 1.84, 0.055]} r={[0.5, 0, 0]} s={[0.085, 0.04, 0.06]} />
          {[-1, 1].map((sx) => (
            <B key={sx} c={HAIR} p={[0.108 * sx, 1.75, -0.02]} s={[0.025, 0.06, 0.09]} />
          ))}
          {/* eyes, brows, nose, smile */}
          {[-1, 1].map((sx) => (
            <group key={sx}>
              <B c="#ffffff" p={[0.043 * sx, 1.735, 0.108]} s={[0.02, 0.016, 0.01]} />
              <B c="#2a1a12" p={[0.043 * sx, 1.735, 0.116]} s={[0.011, 0.012, 0.006]} />
              <B g={BOX} c={HAIR} p={[0.045 * sx, 1.77, 0.11]} r={[0, 0, -0.12 * sx]} s={[0.04, 0.009, 0.01]} />
            </group>
          ))}
          <B c="#b57d55" p={[0, 1.7, 0.122]} s={[0.018, 0.026, 0.02]} />
          <B g={BOX} c="#ffffff" p={[0, 1.655, 0.113]} s={[0.05, 0.014, 0.008]} />
          <B g={BOX} c="#7a3e32" p={[0, 1.646, 0.112]} s={[0.054, 0.006, 0.008]} />
          {/* nerd glasses */}
          {[-1, 1].map((sx) => (
            <B key={sx} g={TORUS} c="#111111" p={[0.045 * sx, 1.735, 0.122]} s={[0.032, 0.026, 0.02]} />
          ))}
          <B g={BOX} c="#111111" p={[0, 1.738, 0.124]} s={[0.025, 0.006, 0.006]} />
          {[-1, 1].map((sx) => (
            <B key={sx} g={BOX} c="#111111" p={[0.095 * sx, 1.738, 0.06]} s={[0.006, 0.006, 0.12]} />
          ))}
        </group>
      </group>
    </group>
  )
}
