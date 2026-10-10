import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { TALK_RANGE, startTalk, talkTargets } from './talk.js'

// Pointer-lock mode has no mouse cursor, so "clicking a professor" means: aim the crosshair
// (screen center) at them within TALK_RANGE and click. Reports who's targeted for the HUD hint.
export default function Interact({ onAim }) {
  const { camera } = useThree()
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const center = useMemo(() => new THREE.Vector2(0, 0), [])
  const aimed = useRef(null)
  const frame = useRef(0)

  const pick = () => {
    ray.setFromCamera(center, camera)
    ray.far = TALK_RANGE
    for (const [slug, obj] of talkTargets) {
      if (obj && ray.intersectObject(obj, true).length) return slug
    }
    return null
  }

  useFrame(() => {
    if (++frame.current % 6) return // ~10 checks a second is plenty
    const slug = document.pointerLockElement ? pick() : null
    if (slug !== aimed.current) {
      aimed.current = slug
      onAim(slug)
    }
  })

  useEffect(() => {
    const down = (e) => {
      if (e.button !== 0 || !document.pointerLockElement) return
      const slug = pick()
      if (slug) startTalk(slug)
    }
    window.addEventListener('mousedown', down)
    return () => window.removeEventListener('mousedown', down)
  })
  return null
}
