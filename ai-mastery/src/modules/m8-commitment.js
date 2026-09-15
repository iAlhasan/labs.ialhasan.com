import { h, render, announce, icon, triggerDownload } from '../ui.js'
import { store } from '../store.js'
import { COMMITMENT_TASKS } from '../content.js'

const CARD_W = 1200
const CARD_H = 630

/** لفّ النص العربي على عدة أسطر داخل عرض محدد. */
function wrap(ctx, text, maxWidth) {
  const words = text.split(/\s+/)
  const lines = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

async function drawCard(canvas, { name, task, percent, rank }) {
  const ctx = canvas.getContext('2d')
  canvas.width = CARD_W
  canvas.height = CARD_H

  try {
    await document.fonts.ready
  } catch {
    /* يكمل بالخط الاحتياطي */
  }

  ctx.direction = 'rtl'
  ctx.textAlign = 'right'

  // الخلفية
  ctx.fillStyle = '#244C44'
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // زخرفة دوائر من اللون الفاتح
  ctx.strokeStyle = 'rgba(79, 150, 136, 0.35)'
  ctx.lineWidth = 2
  for (const r of [150, 220, 290]) {
    ctx.beginPath()
    ctx.arc(150, CARD_H - 90, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  const right = CARD_W - 80
  const maxWidth = CARD_W - 260

  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.font = '500 26px Tajawal, sans-serif'
  ctx.fillText('التزام عملي · إتقان الذكاء الاصطناعي', right, 110)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '800 62px Tajawal, sans-serif'
  ctx.fillText(name || 'أنا', right, 200)

  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = '400 30px Tajawal, sans-serif'
  ctx.fillText('ألتزم بأن أسلّم هذه المهمة للذكاء الاصطناعي يومياً:', right, 265)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 46px Tajawal, sans-serif'
  const lines = wrap(ctx, task, maxWidth)
  lines.slice(0, 3).forEach((line, i) => ctx.fillText(line, right, 345 + i * 62))

  // الخط الفاصل
  const baseY = 345 + Math.min(lines.length, 3) * 62 + 20
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(right, baseY)
  ctx.lineTo(220, baseY)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.font = '500 28px Tajawal, sans-serif'
  ctx.fillText(`${rank} · أنجزتُ ${percent}% من المسار`, right, baseY + 52)

  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = '400 24px Tajawal, sans-serif'
  ctx.fillText('labs.ialhasan.com', right, CARD_H - 50)

  // ختم صغير بلون العلامة الفاتح
  ctx.fillStyle = '#4F9688'
  ctx.beginPath()
  ctx.arc(120, 120, 34, 0, Math.PI * 2)
  ctx.fill()
}

export function mountCommitment(root) {
  const saved = store.getArtifact('commitment') || {}
  let task = saved.task || ''
  let generated = false

  const nameInput = h('input', {
    type: 'text',
    class: 'field',
    maxlength: 60,
    placeholder: 'اسمك كما تريده على البطاقة',
    'aria-label': 'الاسم',
  })
  nameInput.value = store.state.name || ''

  const customInput = h('input', {
    type: 'text',
    class: 'field mt-2',
    maxlength: 90,
    placeholder: 'أو اكتب مهمتك بنفسك',
    'aria-label': 'مهمة مخصصة',
  })
  if (task && !COMMITMENT_TASKS.includes(task)) customInput.value = task

  const chips = h('div', { class: 'flex flex-wrap gap-2' })
  const canvas = h('canvas', { class: 'w-full rounded-card border border-line', 'aria-label': 'بطاقة الالتزام' })
  const preview = h('div', { class: 'mt-6 hidden' }, canvas)
  const actions = h('div', { class: 'mt-4 hidden flex-wrap gap-2' })

  function drawChips() {
    render(
      chips,
      COMMITMENT_TASKS.map((option) =>
        h(
          'button',
          {
            type: 'button',
            class: `btn btn-sm border ${
              task === option
                ? 'border-brand bg-brand text-white'
                : 'border-line bg-white text-ink hover:border-brand-light hover:text-brand'
            }`,
            'aria-pressed': task === option ? 'true' : 'false',
            onclick: () => {
              task = option
              customInput.value = ''
              drawChips()
            },
          },
          option,
        ),
      ),
    )
  }

  async function generate() {
    const chosen = customInput.value.trim() || task
    if (!chosen) {
      announce('اختر مهمة أو اكتبها أولاً')
      return
    }
    task = chosen
    store.setName(nameInput.value.trim())
    store.markDone('m8')
    store.setArtifact('commitment', { task, name: store.state.name })

    await drawCard(canvas, {
      name: store.state.name,
      task,
      percent: store.percent(),
      rank: store.rank(),
    })

    generated = true
    preview.classList.remove('hidden')
    actions.classList.remove('hidden')
    actions.classList.add('flex')
    announce('تم إنشاء بطاقة الالتزام')
    preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  render(
    actions,
    h(
      'button',
      {
        type: 'button',
        class: 'btn-primary btn-sm',
        onclick: () => {
          if (!generated) return
          triggerDownload('commitment-card.png', canvas.toDataURL('image/png'))
        },
      },
      'تنزيل البطاقة',
    ),
    h('button', { type: 'button', class: 'btn-ghost btn-sm', onclick: generate }, 'أعد الإنشاء بعد التعديل'),
  )

  render(
    root,
    h(
      'div',
      { class: 'rounded-card border border-white/15 bg-white p-5 text-ink sm:p-6' },
      h(
        'div',
        { class: 'mb-4 flex flex-wrap items-center justify-between gap-3' },
        h('h3', { class: 'text-lg' }, 'بطاقة الالتزام'),
        h('span', { class: 'chip' }, 'صورة قابلة للتنزيل'),
      ),
      h(
        'div',
        { class: 'grid gap-4 sm:grid-cols-2' },
        h('div', {}, h('label', { class: 'mb-1.5 block text-sm font-medium' }, 'اسمك'), nameInput),
        h(
          'div',
          {},
          h('label', { class: 'mb-1.5 block text-sm font-medium' }, 'التزامك اليومي'),
          chips,
          customInput,
        ),
      ),
      h(
        'button',
        { type: 'button', class: 'btn-primary mt-5', onclick: generate },
        'أنشئ بطاقتي',
      ),
      preview,
      actions,
      h(
        'p',
        { class: 'mt-5 flex items-start gap-2 text-sm leading-relaxed text-ink-soft' },
        icon('spark', 'mt-1 h-4 w-4 shrink-0 text-brand-light'),
        'علّق البطاقة أمامك. بعد أسبوع واحد من تنفيذ هذه المهمة بالذكاء الاصطناعي، ستكتشف مهمتين أخريين تستحقان التسليم.',
      ),
    ),
  )

  drawChips()
}
