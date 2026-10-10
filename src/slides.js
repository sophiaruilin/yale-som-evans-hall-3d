import * as THREE from 'three'

// Lecture slides drawn on canvas, one deck per course (Yale SOM Fall 2026 MBA courses).
// kind: 'title' | 'chart' | 'content'
export const COURSES = {
  mgt409: { code: 'MGT 409', name: 'AI Foundations for Managers', prof: 'Tauhid Zaman' },
  mgt404: { code: 'MGT 404', name: 'Basics of Economics', prof: 'Minerva McGonagall' },
  mgt403: { code: 'MGT 403', name: 'Probability Modeling & Statistics', prof: 'Sybill Trelawney' },
  mgt887: { code: 'MGT 887', name: 'Negotiations', prof: 'Horace Slughorn' },
  mgt402: { code: 'MGT 402', name: 'Basics of Accounting', prof: 'Severus Snape' },
  mgt538: { code: 'MGT 538', name: 'Mastering Influence & Persuasion', prof: 'Gilderoy Lockhart' },
  mgt407: { code: 'MGT 407', name: 'Statistics (EMBA)', prof: 'Peter Schott' },
  mgt802: { code: 'MGT 802', name: 'Large Language Models', prof: 'Kyle Jensen' },
  mgt927: { code: 'MGT 927', name: 'Financial Econometrics & ML', prof: 'Bryan Kelly' },
  mgt860: { code: 'MGT 860', name: 'Generative AI for Managers', prof: 'K. Sudhir' },
  mgt695: { code: 'MGT 695', name: 'Introduction to AI Applications', prof: 'Xiuye Chen' },
  mgt809: { code: 'MGT 809', name: 'Analytics in the Age of AI', prof: 'Zhen Lian' },
  mgt634: { code: 'MGT 634', name: 'Empirical Strategy with AI', prof: 'Kevin Williams' },
  mgt800: { code: 'MGT 800', name: 'Crisis Management in Tech', prof: 'Alastor Moody' },
  mgt541: { code: 'MGT 541', name: 'Corporate Finance', prof: 'Filius Flitwick' },
}
export const COURSE_KEYS = Object.keys(COURSES)
export const SLIDE_KINDS = ['title', 'chart', 'content']

const BLUE = '#00356b'
const INK = '#1d2433'
const PINK = '#ff4fa3'
const W = 1280
const Hh = 720

const DECKS = {
  mgt409: {
    title: ['Vibe Coding with Agents', 'Say it in plain words. Let the agent build.'],
    content: ['How a vibe coder ships', ['Say what you want in plain words', 'Let the agent plan, then build', 'Run it, look at it, fix it', 'Pick the cheapest model that works']],
    chart: 'models',
  },
  mgt404: {
    title: ['Supply & Demand', 'Where the curves meet'],
    content: ['Price elasticity of demand', ['ε = (%ΔQ) / (%ΔP)', '|ε| > 1 → elastic: raise price, lose revenue', '|ε| < 1 → inelastic: raise price, gain revenue', 'Substitutes make demand more elastic']],
    chart: 'supplydemand',
  },
  mgt403: {
    title: ['The Normal Distribution', 'Predicting the future, responsibly'],
    content: ["Bayes' Rule", ['P(A | B) = P(B | A) · P(A) / P(B)', 'Prior → evidence → posterior', 'Base rates matter more than you think', 'A crystal ball is not a confidence interval']],
    chart: 'normal',
  },
  mgt887: {
    title: ['Negotiation as a Game', 'BATNA, ZOPA, and the Prisoner’s Dilemma'],
    content: ['Before you sit down', ['Know your BATNA — and estimate theirs', 'Find the ZOPA: where both say yes', 'Trade on differences in what you value', 'Repeated games reward cooperation']],
    chart: 'payoff',
  },
  mgt402: {
    title: ['The Balance Sheet', 'Assets = Liabilities + Equity'],
    content: ['Reading an income statement', ['Revenue − COGS = Gross profit', 'Gross profit − OpEx = Operating income', 'Accrual ≠ cash: watch working capital', 'Every debit has a credit. Turn to page 394.']],
    chart: 'balance',
  },
  mgt538: {
    title: ['The Science of Yes', 'Influence without magic'],
    content: ["Cialdini's six principles", ['Reciprocity · Commitment · Social proof', 'Liking · Authority · Scarcity', 'Ethical influence builds trust', 'Signed photos are not a strategy']],
    chart: 'funnel',
  },
  mgt407: {
    title: ['Regression, Dude', 'Correlation is not causation (but it is a start)'],
    content: ['Reading a regression', ['ŷ = β₀ + β₁x: the slope is the story', 'Standard error → confidence interval', 'p < 0.05 is evidence, not proof', 'Natural experiments find causes']],
    chart: 'regression',
  },
  mgt802: {
    title: ['Inside a Language Model', 'From neurons to next-token prediction'],
    content: ['How an LLM writes', ['Text → tokens → embeddings', 'Attention: every token looks at the others', 'Predict the next token, repeat', 'Training data shapes what it knows']],
    chart: 'models',
  },
  mgt927: {
    title: ['Machine Learning for Returns', 'Prediction meets asset pricing'],
    content: ['Why ML in finance', ['Many signals, few clear rules', 'Regularize: shrink to avoid overfitting', 'Out-of-sample or it did not happen', 'Economic value > R² alone']],
    chart: 'regression',
  },
  mgt860: {
    title: ['Generative AI for Managers', 'Where GenAI creates value'],
    content: ['A manager’s GenAI playbook', ['Start with the customer problem', 'Augment people before replacing tasks', 'Measure quality, cost, and risk', 'Govern data and keep humans in the loop']],
    chart: 'funnel',
    labels: ['Problem', 'Pilot', 'Measure', 'Scale'],
  },
  mgt695: {
    title: ['AI Applications 101', 'From models to products'],
    content: ['Building with AI', ['Pick a task with clear success metrics', 'Classical ML vs. deep learning vs. LLMs', 'Data quality beats model size', 'Ship, evaluate, iterate']],
    chart: 'models',
  },
  mgt809: {
    title: ['Analytics in the Age of AI', 'Knowing why, not just how'],
    content: ['From prediction to decision', ['Predictions are inputs, not answers', 'Optimize the decision, not the metric', 'Watch for bias and feedback loops', 'Experiment to learn causal effects']],
    chart: 'timeline',
    labels: [['1', 'Data'], ['2', 'Predict'], ['3', 'Optimize'], ['4', 'Decide'], ['5', 'Learn']],
  },
  mgt634: {
    title: ['Empirical Strategy with AI', 'Finding causes in messy data'],
    content: ['Identification first', ['What variation identifies the effect?', 'Natural experiments and diff-in-diff', 'AI speeds up the work, not the thinking', 'Check robustness before you believe it']],
    chart: 'regression',
  },
  mgt800: {
    title: ['Constant Vigilance', 'Running the first 72 hours of a tech crisis'],
    content: ['The incident playbook', ['Detect: alerts, not tweets', 'Contain first, explain second', 'One voice, one channel, regular updates', 'Blameless post-mortem within a week']],
    chart: 'timeline',
  },
  mgt541: {
    title: ['Valuation by DCF', 'A dollar today beats a dollar tomorrow'],
    content: ['NPV and the cost of capital', ['NPV = Σ CFₜ / (1 + r)ᵗ − I₀', 'Take projects with NPV > 0', 'r = WACC, set by risk, not by hope', 'Terminal value often dominates — check it']],
    chart: 'dcf',
  },
}

function frame(g, course, title) {
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, W, Hh)
  g.fillStyle = BLUE
  g.fillRect(0, 0, W, 120)
  g.fillStyle = '#ffffff'
  g.font = 'bold 54px Georgia, serif'
  g.fillText(title, 56, 80)
  g.fillStyle = '#e9edf3'
  g.fillRect(0, Hh - 56, W, 56)
  g.fillStyle = '#5a6475'
  g.font = '24px Georgia, serif'
  g.fillText(`Yale SOM · ${COURSES[course].code}`, 56, Hh - 20)
  g.fillStyle = PINK
  g.fillRect(W - 140, Hh - 40, 84, 24)
}

// labels: optional per-deck labels for the funnel / timeline charts
function drawChart(g, which, labels) {
  g.strokeStyle = INK
  g.lineWidth = 4
  const ox = 180
  const oy = 600
  const axes = () => {
    g.beginPath()
    g.moveTo(ox, 170)
    g.lineTo(ox, oy)
    g.lineTo(1150, oy)
    g.stroke()
  }
  g.font = '30px Georgia, serif'
  if (which === 'models') {
    axes()
    const bars = [['luna', 1, PINK], ['terra', 3, '#8aa4c8'], ['sol', 6, '#5a7bb0'], ['astra', 10, BLUE]]
    bars.forEach(([n, v, c], i) => {
      const x = ox + 60 + i * 230
      const h = v * 38
      g.fillStyle = c
      g.fillRect(x, oy - h, 150, h)
      g.fillStyle = INK
      g.fillText(n, x + 40, oy + 40)
    })
    g.fillText('relative cost per task', ox + 20, 200)
  } else if (which === 'supplydemand') {
    axes()
    g.lineWidth = 6
    g.strokeStyle = BLUE
    g.beginPath()
    g.moveTo(ox + 60, 210)
    g.lineTo(1080, 560)
    g.stroke()
    g.strokeStyle = PINK
    g.beginPath()
    g.moveTo(ox + 60, 560)
    g.lineTo(1080, 210)
    g.stroke()
    g.fillStyle = INK
    g.beginPath()
    g.arc(630, 385, 14, 0, Math.PI * 2)
    g.fill()
    g.fillText('Demand', 980, 600 - 10)
    g.fillText('Supply', 980, 200)
    g.fillText('P*, Q*', 655, 375)
    g.fillText('Q', 1120, 640)
    g.fillText('P', 140, 190)
  } else if (which === 'normal') {
    axes()
    const mx = 665
    const sx = 140
    const y = (x) => oy - 380 * Math.exp(-(((x - mx) / sx) ** 2) / 2)
    g.fillStyle = 'rgba(255,79,163,0.3)'
    g.beginPath()
    g.moveTo(mx - sx, oy)
    for (let x = mx - sx; x <= mx + sx; x += 4) g.lineTo(x, y(x))
    g.lineTo(mx + sx, oy)
    g.fill()
    g.strokeStyle = BLUE
    g.lineWidth = 6
    g.beginPath()
    for (let x = ox + 20; x < 1140; x += 4) (x === ox + 20 ? g.moveTo : g.lineTo).call(g, x, y(x))
    g.stroke()
    g.fillStyle = INK
    g.fillText('68% within ±1σ', mx - 105, 470)
    g.fillText('μ', mx - 8, oy + 40)
  } else if (which === 'payoff') {
    const x0 = 360
    const y0 = 200
    const c = 260
    g.font = 'bold 30px Georgia, serif'
    g.fillStyle = INK
    g.fillText('Cooperate', x0 + 50, y0 - 20)
    g.fillText('Defect', x0 + c + 80, y0 - 20)
    g.fillText('Cooperate', x0 - 190, y0 + 135)
    g.fillText('Defect', x0 - 140, y0 + c + 135)
    const cells = [['3 , 3', '0 , 5'], ['5 , 0', '1 , 1']]
    for (let r = 0; r < 2; r++)
      for (let k = 0; k < 2; k++) {
        g.fillStyle = r === 1 && k === 1 ? 'rgba(255,79,163,0.25)' : '#f3f6fa'
        g.fillRect(x0 + k * c, y0 + r * c, c - 8, c - 8)
        g.fillStyle = INK
        g.font = 'bold 48px Georgia, serif'
        g.fillText(cells[r][k], x0 + k * c + 70, y0 + r * c + 145)
      }
    g.font = '28px Georgia, serif'
    g.fillText('Nash eq.', x0 + c + 75, y0 + 2 * c + 20)
  } else if (which === 'funnel') {
    const steps = (labels ?? ['Attention', 'Interest', 'Trust', 'Yes']).map((l, i) => [l, 900 - i * 200])
    steps.forEach(([label, w], i) => {
      g.fillStyle = [BLUE, '#3d5f93', '#8aa4c8', PINK][i]
      g.fillRect(640 - w / 2, 170 + i * 105, w, 88)
      g.fillStyle = i === 2 ? INK : '#ffffff'
      g.font = 'bold 36px Georgia, serif'
      g.fillText(label, 640 - g.measureText(label).width / 2, 226 + i * 105)
    })
  } else if (which === 'timeline') {
    g.strokeStyle = BLUE
    g.lineWidth = 8
    g.beginPath()
    g.moveTo(120, 400)
    g.lineTo(1160, 400)
    g.stroke()
    const marks = labels ?? [['0h', 'Detect'], ['1h', 'Contain'], ['4h', 'Update'], ['24h', 'Fix'], ['72h', 'Post-mortem']]
    marks.forEach(([tm, lab], i) => {
      const x = 160 + i * 240
      g.fillStyle = i === 1 ? PINK : BLUE
      g.beginPath()
      g.arc(x, 400, 22, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = INK
      g.font = 'bold 34px Georgia, serif'
      g.fillText(tm, x - 24, 340)
      g.font = '30px Georgia, serif'
      g.fillText(lab, x - g.measureText(lab).width / 2, 470)
    })
  } else if (which === 'regression') {
    axes()
    // scatter around a fitted line (fixed pseudo-random noise so every frame matches)
    for (let i = 0; i < 26; i++) {
      const x = ox + 50 + i * 36
      const noise = Math.sin(i * 12.9898) * 43758.5453
      const y = oy - 60 - i * 14 + ((noise - Math.floor(noise)) - 0.5) * 140
      g.fillStyle = i % 5 === 0 ? PINK : '#5a7bb0'
      g.beginPath()
      g.arc(x, y, 9, 0, Math.PI * 2)
      g.fill()
    }
    g.strokeStyle = BLUE
    g.lineWidth = 6
    g.beginPath()
    g.moveTo(ox + 30, oy - 50)
    g.lineTo(ox + 990, oy - 430)
    g.stroke()
    g.fillStyle = INK
    g.fillText('ŷ = β₀ + β₁x', ox + 640, oy - 470)
  } else if (which === 'dcf') {
    axes()
    for (let i = 0; i < 6; i++) {
      const raw = 300
      const pv = raw / Math.pow(1.18, i)
      const x = ox + 50 + i * 155
      g.fillStyle = '#d5dde9'
      g.fillRect(x, oy - raw, 110, raw)
      g.fillStyle = i === 0 ? PINK : BLUE
      g.fillRect(x, oy - pv, 110, pv)
      g.fillStyle = INK
      g.fillText(`t=${i}`, x + 25, oy + 40)
    }
    g.fillText('cash flow vs. present value (r = 18%)', ox + 20, 200)
  } else {
    axes()
    g.fillStyle = BLUE
    g.fillRect(330, 220, 240, 380)
    g.fillStyle = '#8aa4c8'
    g.fillRect(700, 400, 240, 200)
    g.fillStyle = PINK
    g.fillRect(700, 220, 240, 180)
    g.fillStyle = INK
    g.fillText('Assets', 390, 640)
    g.fillText('Liabilities + Equity', 690, 640)
    g.fillStyle = '#ffffff'
    g.fillText('Equity', 760, 320)
    g.fillText('Liabilities', 740, 510)
  }
}

const cache = new Map()
export function slideTex(course, kind) {
  const key = `${course}-${kind}`
  if (cache.has(key)) return cache.get(key)
  const c = document.createElement('canvas')
  c.width = W
  c.height = Hh
  const g = c.getContext('2d')
  const deck = DECKS[course]
  if (kind === 'title') {
    const info = COURSES[course]
    g.fillStyle = BLUE
    g.fillRect(0, 0, W, Hh)
    g.fillStyle = PINK
    g.font = 'bold 34px Georgia, serif'
    g.fillText(`${info.code} · ${info.name}`, 80, 150)
    g.fillRect(80, 330, 140, 10)
    g.fillStyle = '#ffffff'
    g.font = 'bold 76px Georgia, serif'
    g.fillText(deck.title[0], 80, 290)
    g.font = '38px Georgia, serif'
    g.fillText(deck.title[1], 80, 410)
    g.font = 'italic 34px Georgia, serif'
    g.fillStyle = '#c9d6ea'
    g.fillText(`Prof. ${info.prof} · Yale SOM · Fall 2026`, 80, 620)
  } else if (kind === 'content') {
    frame(g, course, deck.content[0])
    g.fillStyle = INK
    g.font = '42px Georgia, serif'
    deck.content[1].forEach((line, i) => {
      g.fillStyle = PINK
      g.fillRect(80, 205 + i * 100, 18, 18)
      g.fillStyle = INK
      g.fillText(line, 125, 228 + i * 100)
    })
  } else {
    frame(g, course, deck.title[0])
    drawChart(g, deck.chart, deck.labels)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  cache.set(key, t)
  return t
}
