import { h, render, announce, icon } from '../ui.js'
import { store } from '../store.js'
import { PILLARS } from '../content.js'

const SCALE = [
  { value: 1, label: 'أبداً' },
  { value: 2, label: 'نادراً' },
  { value: 3, label: 'أحياناً' },
  { value: 4, label: 'غالباً' },
  { value: 5, label: 'دائماً' },
]

export function mountPillars(root) {
  // المفتاح: `${pillarId}:${statementIndex}`
  const ratings = new Map()
  const total = PILLARS.reduce((sum, p) => sum + p.statements.length, 0)
  const body = h('div', { class: 'flex flex-col gap-6' })
  const result = h('div', { class: 'mt-6' })

  function rate(key, value) {
    ratings.set(key, value)
    draw()
    if (ratings.size === total) {
      store.markDone('m7')
      announce('اكتمل التشخيص')
      drawResult()
    }
  }

  function pillarScore(pillar) {
    const values = pillar.statements.map((_, i) => ratings.get(`${pillar.id}:${i}`) || 0)
    const sum = values.reduce((a, b) => a + b, 0)
    return Math.round((sum / (pillar.statements.length * 5)) * 100)
  }

  function draw() {
    render(
      body,
      PILLARS.map((pillar) =>
        h(
          'div',
          {},
          h(
            'h4',
            { class: 'mb-3 flex items-center gap-2 text-base' },
            h('span', { class: 'h-2.5 w-2.5 rounded-full bg-brand-light' }),
            pillar.label,
          ),
          h(
            'div',
            { class: 'flex flex-col gap-3' },
            pillar.statements.map((statement, i) => {
              const key = `${pillar.id}:${i}`
              const current = ratings.get(key)
              return h(
                'div',
                { class: 'rounded-card border border-line bg-white p-4' },
                h('p', { class: 'text-[0.95rem] leading-relaxed' }, statement),
                h(
                  'div',
                  { class: 'mt-3 flex flex-wrap gap-1.5', role: 'group', 'aria-label': statement },
                  SCALE.map((option) =>
                    h(
                      'button',
                      {
                        type: 'button',
                        class: `btn btn-sm border ${
                          current === option.value
                            ? 'border-brand bg-brand text-white'
                            : 'border-line bg-white text-ink-soft hover:border-brand-light hover:text-brand'
                        }`,
                        'aria-pressed': current === option.value ? 'true' : 'false',
                        onclick: () => rate(key, option.value),
                      },
                      option.label,
                    ),
                  ),
                ),
              )
            }),
          ),
        ),
      ),
    )
  }

  function drawResult() {
    const scored = PILLARS.map((pillar) => ({ pillar, score: pillarScore(pillar) }))
    const weakest = scored.reduce((min, item) => (item.score < min.score ? item : min), scored[0])

    render(
      result,
      h(
        'div',
        { class: 'card-soft fade-in' },
        h(
          'h4',
          { class: 'flex items-center gap-2 text-lg' },
          icon('check', 'h-5 w-5 text-correct'),
          'نتيجة التشخيص',
        ),
        h(
          'div',
          { class: 'mt-4 flex flex-col gap-3' },
          scored.map(({ pillar, score }) =>
            h(
              'div',
              {},
              h(
                'div',
                { class: 'mb-1 flex items-center justify-between text-sm' },
                h(
                  'span',
                  { class: `font-medium ${pillar.id === weakest.pillar.id ? 'text-wrong' : 'text-ink'}` },
                  pillar.label,
                ),
                h('span', { class: 'tabular-nums text-ink-soft' }, `${score}%`),
              ),
              h(
                'div',
                { class: 'meter' },
                h('span', {
                  style: `width:${score}%;${
                    pillar.id === weakest.pillar.id ? 'background:var(--color-warn)' : ''
                  }`,
                }),
              ),
            ),
          ),
        ),
        h(
          'div',
          { class: 'mt-5 rounded-card border-r-4 border-brand bg-white p-4' },
          h('p', { class: 'text-sm font-bold text-brand' }, `ابدأ من هنا: ${weakest.pillar.label}`),
          h('p', { class: 'mt-1.5 text-sm leading-relaxed text-ink-soft' }, weakest.pillar.habit),
        ),
        h(
          'p',
          { class: 'mt-4 text-sm leading-relaxed text-ink-soft' },
          'الآلات تحسّن ما هو موجود، أما أنت فتتخيّل ما ليس موجوداً بعد. هذه الركائز الثلاث هي ما يجعل الذكاء الاصطناعي سلاحاً في يدك بدل أن يكون بديلاً عنك.',
        ),
      ),
    )
  }

  render(
    root,
    h(
      'div',
      { class: 'card' },
      h(
        'div',
        { class: 'mb-4 flex flex-wrap items-center justify-between gap-3' },
        h('h3', { class: 'text-lg' }, 'تشخيص الركائز الثلاث'),
        h('span', { class: 'chip' }, `${total} عبارات`),
      ),
      h(
        'p',
        { class: 'mb-5 text-sm leading-relaxed text-ink-soft' },
        'قيّم نفسك بصدق. الهدف ليس الدرجة، بل معرفة الركيزة التي تحتاج عملاً هذا الشهر.',
      ),
      body,
      result,
    ),
  )

  draw()
}
