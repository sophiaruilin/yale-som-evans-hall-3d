// Tiny shared state for talking to professors.
// Avatars register their root object so the crosshair can raycast them, and read
// talkState.with in useFrame to know when to turn toward the player.

export const TALK_RANGE = 7 // meters: how close you need to be to start a chat

export const talkTargets = new Map() // slug -> THREE.Object3D
export const talkState = { with: null } // slug of the professor you're chatting with

export const PROFESSOR_INFO = {
  zaman: { name: 'Tauhid Zaman', short: 'Prof. Zaman', course: 'MGT 409 · AI Foundations for Managers' },
}

export function startTalk(slug) {
  window.dispatchEvent(new CustomEvent('talk', { detail: { slug } }))
}
