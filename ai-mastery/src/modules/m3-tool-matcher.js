import { h, render, announce } from '../ui.js'
import { store } from '../store.js'
import { MATCHER_QUESTIONS, TOOLS } from '../content.js'

export function mountToolMatcher(root) {
  let step = 0
  let scores = { claude: 0, gemini: 0, chatgpt: 0 }

  function choose(option) {
    for (const [tool, points] of Object.entries(option.scores)) scores[tool] += points
    step += 1
    draw()
  }

  function restart() {
    step = 0
    scores = { claude: 0, gemini: 0, chatgpt: 0 }
    draw()
  }

  function winner() {
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]
  }

  function drawResult() {
    const best = winner()
    const tool = TOOLS[best]
    const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1

    store.markDone('m3')
    announce(`الأداة المقترحة لك: ${tool.name}`)

    return h(
      'div',
      { class: 'fade-in' },
      h('p', { class: 'text-sm text-ink-soft' }, 'الأداة التي أنصحك بالتعمّق فيها أولاً:'),
      h('p', { class: 'mt-1 text-3xl font-extrabold text-brand' }, h('span', { class: 'ltr' }, tool.name)),
      h('p', { class: 'mt-1 text-sm font-medium text-brand-ink' }, tool.tag),
      h('p', { class: 'mt-3 max-w-[58ch] text-[0.95rem] leading-relaxed text-ink-soft' }, tool.why),

      h(
        'div',
        { class: 'mt-6 flex flex-col gap-2' },
        Object.entries(scores)
          .sort((a, b) => b[1] - a[1])
          .map(([id, value]) =>
            h(
              'div',
              { class: 'flex items-center gap-3' },
              h(
                'span',
                { class: `w-24 shrink-0 text-sm ${id === best ? 'font-bold text-brand' : 'text-ink-soft'}` },
                h('span', { class: 'ltr' }, TOOLS[id].name),
              ),
              h(
                'div',
                { class: 'meter flex-1' },
                h('span', {
                  style: `width:${Math.round((value / total) * 100)}%;${
                    id === best ? '' : 'background:var(--color-brand-light)'
                  }`,
                }),
              ),
            ),
          ),
      ),

      h(
        'p',
        { class: 'mt-6 rounded-card bg-surface p-4 text-sm leading-relaxed text-ink' },
        'الأهم من النتيجة: التزم بها 90 يوماً على الأقل قبل أن تجرّب غيرها. المتقنون يتعمّقون قبل أن يتوسّعوا، ومن يقفز بين الأدوات كل أسبوع لا يتعلّم بل يؤجّل.',
      ),

      h(
        'button',
        { type: 'button', class: 'btn-ghost btn-sm mt-4', onclick: restart },
        'أعد الاختيار',
      ),
    )
  }

  function drawQuestion() {
    const question = MATCHER_QUESTIONS[step]
    return h(
      'div',
      { class: 'fade-in' },
      h(
        'div',
        { class: 'mb-4 flex items-center gap-3' },
        h('div', { class: 'meter max-w-40' }, h('span', { style: `width:${(step / MATCHER_QUESTIONS.length) * 100}%` })),
        h(
          'span',
          { class: 'shrink-0 text-sm tabular-nums text-ink-soft' },
          `${step + 1} / ${MATCHER_QUESTIONS.length}`,
        ),
      ),
      h('p', { class: 'text-lg font-bold' }, question.q),
      h(
        'div',
        { class: 'mt-4 flex flex-col gap-2' },
        question.options.map((option) =>
          h('button', { type: 'button', class: 'choice', onclick: () => choose(option) }, option.label),
        ),
      ),
    )
  }

  function draw() {
    render(
      root,
      h(
        'div',
        { class: 'card' },
        h(
          'div',
          { class: 'mb-4 flex flex-wrap items-center justify-between gap-3' },
          h('h3', { class: 'text-lg' }, 'مطابِق الأدوات'),
          h('span', { class: 'chip' }, '4 أسئلة'),
        ),
        step >= MATCHER_QUESTIONS.length ? drawResult() : drawQuestion(),
      ),
    )
  }

  draw()
}
