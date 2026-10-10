// AI professor characters drawn with ProfAvatar (stylized from public photos; not likenesses).
// Each needs a matching backend/personas/<slug>.md. Room ids match layout.js DRUMS.
// Zaman (2200) and Schott (2210) have hand-built avatars and are registered in talk.js.

export const AI_PROFS = {
  jensen: {
    room: '2400',
    name: 'Kyle Jensen',
    short: 'Prof. Jensen',
    course: 'MGT 802 · Large Language Models',
    greeting: "Hi! Welcome to MGT 802. Want to peek inside how large language models actually work?",
    look: {
      // bald, big smile, light-blue oxford button-down with a navy layer at the collar
      height: 1.82,
      skin: '#e8b49a',
      smile: 'big',
      hair: { color: '#c79a80', style: 'bald' },
      beard: null,
      glasses: null,
      top: { type: 'shirt', color: '#a9bedc' },
      pants: '#2b3446',
      shoes: '#2a2a2a',
    },
  },
  kelly: {
    room: '2410',
    name: 'Bryan Kelly',
    short: 'Prof. Kelly',
    course: 'MGT 927 · Financial Econometrics & ML',
    greeting: 'Hi there! Curious how machine learning predicts asset returns? Ask away.',
    look: {
      // short dark-brown hair going gray at the temples, navy suit, white shirt, burgundy tie
      height: 1.83,
      skin: '#e8bfa5',
      hair: { color: '#4a3526', style: 'short', temples: '#9a958f' },
      beard: null,
      glasses: null,
      top: { type: 'blazer', color: '#1f2a4d', inner: '#ffffff', tie: '#8b1e2b' },
      pants: '#1f2a4d',
      shoes: '#1a1a1a',
    },
  },
  sudhir: {
    room: '2420',
    name: 'K. Sudhir',
    short: 'Prof. Sudhir',
    course: 'MGT 860 · Generative AI for Managers (EMBA)',
    greeting: 'Welcome! Let’s talk about where generative AI really creates value for managers.',
    look: {
      // short black side-parted hair, thin rectangular gunmetal glasses,
      // charcoal blazer over a light-blue check shirt, open collar
      height: 1.75,
      skin: '#8d5a3c',
      hair: { color: '#1a1716', style: 'side' },
      beard: null,
      glasses: { style: 'rect', color: '#7a7f86' },
      top: { type: 'blazer', color: '#2b2b2e', inner: '#a9c4ee' },
      pants: '#2b2b2e',
      shoes: '#1a1a1a',
    },
  },
  chen: {
    room: '2430',
    name: 'Xiuye Chen',
    short: 'Dr. Chen',
    course: 'MGT 695 · Introduction to AI Applications',
    greeting: 'Hello! Ready to explore what modern AI applications can do?',
    look: {
      // long sleek black hair swept to one side, warm smile,
      // charcoal knit cardigan over a cream blouse
      height: 1.66,
      skin: '#e6c1a3',
      smile: 'big',
      hair: { color: '#141110', style: 'long' },
      beard: null,
      glasses: null,
      top: { type: 'cardigan', color: '#3a3a3c', inner: '#f3eee3' },
      pants: '#2b2b30',
      shoes: '#1f1f1f',
    },
  },
  lian: {
    room: '2220',
    name: 'Zhen Lian',
    short: 'Prof. Lian',
    course: 'MGT 809 · Analytics in the Age of AI',
    greeting: 'Hi! Let’s talk about turning predictions into better decisions.',
    look: {
      // long straight dark-brown hair, big friendly smile, dark top
      height: 1.65,
      skin: '#ebc8ae',
      smile: 'big',
      hair: { color: '#2a1f19', style: 'long' },
      beard: null,
      glasses: null,
      top: { type: 'sweater', color: '#2e2e33', inner: '#2e2e33' },
      pants: '#34373f',
      shoes: '#1f1f1f',
    },
  },
  williams: {
    room: '2230',
    name: 'Kevin Williams',
    short: 'Prof. Williams',
    course: 'MGT 634 · Empirical Strategy with AI',
    greeting: 'Hey! Want to figure out what actually causes what in your data?',
    look: {
      // short dark-brown hair swept up, light stubble, dark rectangular glasses,
      // charcoal blazer over a blue-and-white gingham shirt, no tie
      height: 1.8,
      skin: '#e6c2a4',
      hair: { color: '#3e2c20', style: 'side' },
      beard: { color: '#3e2c20', style: 'stubble' },
      glasses: { style: 'rect', color: '#1f1a17' },
      top: { type: 'blazer', color: '#4a4d54', inner: '#c9d8ef' },
      pants: '#3a3d44',
      shoes: '#1f1f1f',
    },
  },
}
