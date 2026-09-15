import { h, render, announce, icon, shuffle } from '../ui.js'
import { store } from '../store.js'
import { PARTS, ANATOMY_CLAUSES, ANATOMY_COMPARISON } from '../content.js'

export function mountAnatomy(root) {
  const clauses = shuffle(ANATOMY_CLAUSES)
  const solved = new Set()
  const wrongAt = new Map()
  const body = h('div', { class: 'flex flex-col gap-3' })
  const reveal = h('div', { class: 'mt-6' })

  function pick(index, partId) {
    if (solved.has(index)) return
    if (clauses[index].answer === partId) {
      solved.add(index)
      wrongAt.delete(index)
      announce('إجابة صحيحة')
      if (solved.size === clauses.length) {
        store.markDone('m2')
        showComparison()
      }
    } else {
      wrongAt.set(index, partId)
      announce('ليست الإجابة الصحيحة، حاول مرة أخرى')
    }
    draw()
  }

  function draw() {
    render(
      body,
      clauses.map((clause, index) => {
        const done = solved.has(index)
        const wrong = wrongAt.get(index)
        return h(
          'div',
          {
            class: `rounded-card border p-4 sm:p-5 transition-colors ${
              done ? 'border-correct/40 bg-correct/5' : 'border-line bg-white'
            }`,
          },
          h('p', { class: 'text-[0.95rem] leading-relaxed' }, clause.text),
          h(
            'div',
            { class: 'mt-3 flex flex-wrap gap-2' },
            PARTS.map((part) => {
              const isAnswer = done && part.id === clause.answer
              const isWrong = !done && wrong === part.id
              return h(
                'button',
                {
                  type: 'button',
                  class: `btn btn-sm ${
                    isAnswer
                      ? 'border border-correct bg-correct text-white'
                      : isWrong
                        ? 'border border-wrong bg-wrong/10 text-wrong'
                        : 'border border-line bg-white text-ink-soft hover:border-brand-light hover:text-brand'
                  }`,
                  disabled: done,
                  'aria-label': `${part.label} — ${part.hint}`,
                  onclick: () => pick(index, part.id),
                },
                isAnswer ? icon('check', 'h-3.5 w-3.5') : isWrong ? icon('cross', 'h-3.5 w-3.5') : null,
                part.label,
              )
            }),
          ),
          done
            ? h(
                'p',
                { class: 'mt-3 border-t border-correct/20 pt-3 text-sm leading-relaxed text-ink-soft fade-in' },
                clause.why,
              )
            : null,
        )
      }),
    )
  }

  function notesList(notes, tone) {
    return h(
      'ul',
      { class: 'mt-3 flex flex-wrap gap-2' },
      notes.map((note) =>
        h(
          'li',
          {
            class: `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
              tone === 'good' ? 'bg-correct/10 text-correct' : 'bg-wrong/10 text-wrong'
            }`,
          },
          icon(tone === 'good' ? 'check' : 'cross', 'h-3 w-3'),
          note,
        ),
      ),
    )
  }

  function showComparison() {
    const strongPrompt = ANATOMY_CLAUSES.map((c) => c.text).join(' ')
    render(
      reveal,
      h(
        'div',
        { class: 'card-soft fade-in' },
        h('h4', { class: 'text-lg' }, 'الفرق كله في المدخل'),
        h(
          'div',
          { class: 'mt-4 grid gap-4 md:grid-cols-2' },
          h(
            'div',
            { class: 'rounded-card border border-wrong/30 bg-white p-4' },
            h('p', { class: 'mb-2 text-sm font-bold text-wrong' }, 'برومبت ضعيف'),
            h('p', { class: 'text-sm leading-relaxed text-ink-soft' }, ANATOMY_COMPARISON.weak),
            notesList(ANATOMY_COMPARISON.weakNotes, 'bad'),
          ),
          h(
            'div',
            { class: 'rounded-card border border-correct/30 bg-white p-4' },
            h('p', { class: 'mb-2 text-sm font-bold text-correct' }, 'برومبت محترف'),
            h('p', { class: 'text-sm leading-relaxed text-ink-soft' }, strongPrompt),
            notesList(ANATOMY_COMPARISON.strongNotes, 'good'),
          ),
        ),
        h(
          'p',
          { class: 'mt-4 text-sm text-ink-soft' },
          'الطلبان يستغرقان دقيقة واحدة في الكتابة. الفرق بينهما هو الفرق بين ثلاثة أسابيع من المحاولات، و12 ثانية من التنفيذ.',
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
        h('h3', { class: 'text-lg' }, 'مُشرّح البرومبت'),
        h('span', { class: 'chip' }, 'صنّف الجمل الأربع'),
      ),
      h(
        'p',
        { class: 'mb-5 text-sm leading-relaxed text-ink-soft' },
        'أمامك برومبت حقيقي مفكّك إلى أربع جمل. حدّد لكل جملة الجزء الذي تنتمي إليه.',
      ),
      body,
      reveal,
    ),
  )

  draw()
}
