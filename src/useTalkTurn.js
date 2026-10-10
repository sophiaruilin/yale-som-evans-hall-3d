import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { talkState, talkTargets } from './talk.js'

// Shared behavior for chat-able professors: register for crosshair clicks, idle-scan the
// room, and when you're chatting with them, turn the body toward you and tilt the head
// to your eye level. Returns { root, head, talking } refs for the avatar to attach.
const shortest = (a) => Math.atan2(Math.sin(a), Math.cos(a))
const tmp = new THREE.Vector3()

export default function useTalkTurn(slug, rotation, scale, headHeight = 1.62) {
  const root = useRef()
  const head = useRef()
  const talking = useRef(false)
  const yaw = useRef(rotation)
  const { camera } = useThree()

  useEffect(() => {
    talkTargets.set(slug, root.current)
    return () => talkTargets.delete(slug)
  }, [slug])

  useFrame(({ clock }, rawDt) => {
    if (!root.current) return
    const dt = Math.min(rawDt, 0.05)
    const t = clock.elapsedTime
    talking.current = talkState.with === slug
    let target = rotation + Math.sin(t * 0.35) * 0.3 // idle: scanning the room
    let pitch = 0
    if (talking.current) {
      root.current.getWorldPosition(tmp)
      const dx = camera.position.x - tmp.x
      const dz = camera.position.z - tmp.z
      target = Math.atan2(dx, dz)
      const headY = tmp.y + headHeight * scale
      pitch = THREE.MathUtils.clamp(-Math.atan2(camera.position.y - headY, Math.hypot(dx, dz)), -0.35, 0.35)
    }
    yaw.current += shortest(target - yaw.current) * Math.min(1, dt * (talking.current ? 5 : 1.5))
    root.current.rotation.y = yaw.current
    if (head.current) head.current.rotation.x += (pitch - head.current.rotation.x) * Math.min(1, dt * 5)
  })

  return { root, head, talking }
}
