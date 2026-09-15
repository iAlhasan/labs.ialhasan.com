import './style.css'
import { h, qs, qsa, render, icon, announce } from './ui.js'
import { store, MODULES } from './store.js'

import { mountTokenizer } from './modules/m1-tokenizer.js'
import { mountAnatomy } from './modules/m2-anatomy.js'
import { mountToolMatcher } from './modules/m3-tool-matcher.js'
import { mountQuiz } from './modules/m4-quiz.js'
import { mountMasterPrompt } from './modules/m5-master-prompt.js'
import { mountSystemPrompt } from './modules/m6-system-prompt.js'
import { mountPillars } from './modules/m7-pillars.js'
import { mountCommitment } from './modules/m8-commitment.js'
import { mountExports } from './modules/exports.js'

const MOUNTS = {
  tokenizer: mountTokenizer,
  anatomy: mountAnatomy,
  'tool-matcher': mountToolMatcher,
  quiz: mountQuiz,
  'master-prompt': mountMasterPrompt,
  'system-prompt': mountSystemPrompt,
  pillars: mountPillars,
  commitment: mountCommitment,
  exports: mountExports,
}

/* ------------------------------ تركيب التمارين ----------------------------- */
for (const node of qsa('[data-mount]')) {
  const mount = MOUNTS[node.dataset.mount]
  if (mount) mount(node)
}

/* ------------------------------ خريطة المسار ------------------------------ */
const mapList = qs('[data-map]')

function drawMap(state) {
  render(
    mapList,
    MODULES.map((module) => {
      const status = state.modules[module.id]
      return h(
        'li',
        {},
        h(
          'a',
          {
            href: `#${module.id}`,
            class: `flex h-full flex-col rounded-card border p-4 transition-colors ${
              status.done
                ? 'border-brand-light/60 bg-white'
                : 'border-line bg-white hover:border-brand-light'
            }`,
          },
          h(
            'span',
            { class: 'flex items-center justify-between' },
            h('span', { class: 'text-sm font-bold text-brand' }, `الوحدة ${module.n}`),
            status.done
              ? icon('check', 'h-4 w-4 text-correct')
              : h('span', { class: 'text-xs text-ink-soft' }, `${module.weight}%`),
          ),
          h('span', { class: 'mt-1.5 font-bold leading-snug' }, module.title),
          h('span', { class: 'mt-1 text-sm text-ink-soft' }, module.task),
        ),
      )
    }),
  )
}

/* ------------------------------ متتبع التقدم ------------------------------ */
const railList = qs('[data-rail]')

function drawRail(state) {
  render(
    railList,
    MODULES.map((module) => {
      const status = state.modules[module.id]
      const dot = status.done
        ? 'bg-brand border-brand text-white'
        : status.read
          ? 'bg-white border-brand-light'
          : 'bg-white border-line'
      return h(
        'li',
        {},
        h(
          'a',
          {
            href: `#${module.id}`,
            class: 'group flex items-center justify-end gap-2 py-1',
            title: `الوحدة ${module.n} — ${module.title}`,
          },
          h(
            'span',
            {
              class:
                'pointer-events-none max-w-0 overflow-hidden rounded-lg bg-brand-dark px-0 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:max-w-56 group-hover:px-2.5 group-hover:opacity-100 group-focus-visible:max-w-56 group-focus-visible:px-2.5 group-focus-visible:opacity-100',
            },
            `${module.n}. ${module.title}`,
          ),
          h(
            'span',
            {
              class: `flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${dot}`,
            },
            status.done ? icon('check', 'h-3 w-3') : null,
          ),
        ),
      )
    }),
  )
}

/* --------------------------- الرأس والنسبة المئوية -------------------------- */
const progressLabel = qs('[data-progress-label]')
const progressBar = qs('[data-progress-bar]')
let lastRank = null

function drawProgress() {
  const percent = store.percent()
  const rank = store.rank(percent)
  progressLabel.textContent = `${percent}% · ${rank}`
  progressBar.style.width = `${percent}%`

  if (lastRank !== null && rank !== lastRank) showRankToast(rank)
  lastRank = rank
}

function showRankToast(rank) {
  const toast = h(
    'div',
    {
      class:
        'no-print fixed bottom-5 left-5 z-50 flex items-center gap-2.5 rounded-card bg-brand-dark px-4 py-3 text-sm text-white shadow-lg pop-in',
      role: 'status',
    },
    icon('spark', 'h-4 w-4 text-brand-light'),
    `ترقّيت: ${rank}`,
  )
  document.body.append(toast)
  announce(`ترقّيت إلى ${rank}`)
  window.setTimeout(() => toast.remove(), 3600)
}

store.subscribe((state) => {
  drawMap(state)
  drawRail(state)
  drawProgress()
})

/* ------------------- احتساب «القراءة» عند تجاوز 70% من الوحدة ------------------ */
const sections = qsa('[data-module]')
let ticking = false

function checkRead() {
  ticking = false
  const viewportBottom = window.scrollY + window.innerHeight
  for (const section of sections) {
    const id = section.dataset.module
    if (store.state.modules[id]?.read) continue
    const top = section.offsetTop
    if (viewportBottom > top + section.offsetHeight * 0.7) store.markRead(id)
  }
}

window.addEventListener(
  'scroll',
  () => {
    if (ticking) return
    ticking = true
    window.requestAnimationFrame(checkRead)
  },
  { passive: true },
)
window.addEventListener('resize', checkRead, { passive: true })
checkRead()

/* -------------------------------- إجراءات -------------------------------- */
qs('[data-start-journey]')?.addEventListener('click', () => {
  qs('#m1').scrollIntoView({ behavior: 'smooth' })
})

qs('[data-reset-progress]')?.addEventListener('click', () => {
  const confirmed = window.confirm(
    'سيُمسح تقدّمك وكل ما بنيته في هذا المسار من متصفحك. هل تريد المتابعة؟',
  )
  if (!confirmed) return
  store.reset()
  lastRank = store.rank()
  window.location.reload()
})
