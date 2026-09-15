import { h, svg, render, announce, icon, shuffle, orderList } from '../ui.js'
import { store } from '../store.js'
import { QUIZ_ITEMS, CONVERSION_ITEMS } from '../content.js'

const PASS_MARK = 4

export function mountQuiz(root) {
  let items = shuffle(QUIZ_ITEMS)
  let index = 0
  let score = 0
  let answered = null // 'push' | 'pull' | null
  let stage = 'quiz' // quiz | conversion | summary

  function restart() {
    items = shuffle(QUIZ_ITEMS)
    index = 0
    score = 0
    answered = null
    stage = 'quiz'
    draw()
  }

  function answer(choice) {
    if (answered) return
    answered = choice
    const correct = items[index].answer === choice
    if (correct) score += 1
    announce(correct ? 'إجابة صحيحة' : 'إجابة خاطئة')
    draw()
  }

  function next() {
    answered = null
    index += 1
    if (index >= items.length) stage = 'conversion'
    draw()
  }

  /* ------------------------------ المرحلة الأولى ----------------------------- */
  function drawQuiz() {
    const item = items[index]
    const correct = answered && item.answer === answered

    const button = (value, label, sub) => {
      const isPicked = answered === value
      const isAnswer = answered && item.answer === value
      let cls = 'choice flex-col items-start gap-0.5 sm:flex-1'
      if (isAnswer) cls += ' is-correct'
      else if (isPicked) cls += ' is-wrong'
      return h(
        'button',
        { type: 'button', class: cls, disabled: !!answered, onclick: () => answer(value) },
        h(
          'span',
          { class: 'flex items-center gap-2 text-base font-bold' },
          isAnswer ? icon('check') : isPicked ? icon('cross') : null,
          label,
        ),
        h('span', { class: 'text-sm font-normal opacity-70' }, sub),
      )
    }

    return h(
      'div',
      { class: 'fade-in' },
      h(
        'div',
        { class: 'mb-5 flex items-center gap-3' },
        h('div', { class: 'meter max-w-40' }, h('span', { style: `width:${(index / items.length) * 100}%` })),
        h('span', { class: 'shrink-0 text-sm tabular-nums text-ink-soft' }, `${index + 1} / ${items.length}`),
        h('span', { class: 'shrink-0 text-sm tabular-nums text-ink-soft' }, `· ${score} صحيحة`),
      ),

      h(
        'div',
        { class: 'rounded-card border-r-4 border-brand-light bg-surface p-4 sm:p-5' },
        h('p', { class: 'text-[0.95rem] leading-relaxed' }, item.prompt),
      ),

      h(
        'div',
        { class: 'mt-4 flex flex-col gap-2 sm:flex-row' },
        button('push', 'دفع', 'يملي الطريقة'),
        button('pull', 'سحب', 'يبدأ من النتيجة'),
      ),

      answered
        ? h(
            'div',
            { class: 'mt-4 fade-in' },
            h(
              'div',
              {
                class: `rounded-card border p-4 ${
                  correct ? 'border-correct/30 bg-correct/5' : 'border-wrong/30 bg-wrong/5'
                }`,
              },
              h(
                'p',
                { class: `mb-1.5 flex items-center gap-2 text-sm font-bold ${correct ? 'text-correct' : 'text-wrong'}` },
                icon(correct ? 'check' : 'cross'),
                correct ? 'إجابة صحيحة' : `الإجابة الصحيحة: ${item.answer === 'pull' ? 'سحب' : 'دفع'}`,
              ),
              h('p', { class: 'text-sm leading-relaxed text-ink-soft' }, item.why),
            ),
            h(
              'button',
              { type: 'button', class: 'btn-primary mt-4', onclick: next },
              index === items.length - 1 ? 'إلى تحدي التحويل' : 'السؤال التالي',
            ),
          )
        : null,
    )
  }

  /* ------------------------------ تحدي التحويل ------------------------------ */
  function drawConversion() {
    const list = orderList(CONVERSION_ITEMS)
    const feedback = h('div', { class: 'mt-4' })

    const check = () => {
      const order = list.getOrder()
      const correct = order.every((value, position) => value === position)
      if (correct) {
        list.lock()
        stage = 'summary'
        if (score >= PASS_MARK) store.markDone('m4')
        announce('ترتيب صحيح')
        draw()
        return
      }
      announce('الترتيب غير صحيح')
      render(
        feedback,
        h(
          'p',
          { class: 'rounded-card border border-wrong/30 bg-wrong/5 p-3 text-sm text-wrong fade-in' },
          'ليس بعد. تذكّر تسلسل السحب: من أنت وما وضعك أولاً، ثم الوجهة التي تريد الوصول إليها، وأخيراً تسليم القيادة له بطلب الأسئلة وتحديد الصيغة.',
        ),
      )
    }

    return h(
      'div',
      { class: 'fade-in' },
      h('h4', { class: 'text-lg' }, 'تحدي التحويل'),
      h(
        'p',
        { class: 'mt-1 mb-4 text-sm leading-relaxed text-ink-soft' },
        'هذه أجزاء برومبت سحب صحيح لكنها مبعثرة. رتّبها بالتسلسل الصحيح.',
      ),
      list.el,
      h('button', { type: 'button', class: 'btn-primary mt-4', onclick: check }, 'تحقّق من الترتيب'),
      feedback,
    )
  }

  /* -------------------------------- الخلاصة -------------------------------- */
  function drawSummary() {
    const passed = score >= PASS_MARK
    const pct = Math.round((score / items.length) * 100)

    return h(
      'div',
      { class: 'fade-in text-center' },
      h(
        'div',
        { class: 'relative mx-auto h-32 w-32' },
        svg(
          'svg',
          { class: 'h-32 w-32 -rotate-90', viewBox: '0 0 120 120', 'aria-hidden': 'true' },
          circle('#E3EDEB', 100),
          circle(passed ? '#3F6E67' : '#B4553F', pct),
        ),
        h(
          'div',
          { class: 'absolute inset-0 flex flex-col items-center justify-center' },
          h('span', { class: 'text-3xl font-extrabold tabular-nums text-ink' }, `${score}/${items.length}`),
          h('span', { class: 'text-xs text-ink-soft' }, 'إجابات صحيحة'),
        ),
      ),
      h(
        'p',
        { class: `mt-4 text-lg font-bold ${passed ? 'text-correct' : 'text-wrong'}` },
        passed ? 'أتقنت الفرق. هذه نقلة حقيقية.' : 'قريب — أعد المحاولة لتُحتسب الوحدة.',
      ),
      h(
        'p',
        { class: 'mx-auto mt-2 max-w-[54ch] text-sm leading-relaxed text-ink-soft' },
        passed
          ? 'من الآن فصاعداً، قبل أن ترسل أي طلب، اسأل نفسك: هل أصف الطريق أم أعطي الوجهة؟ ثم أضف الجملة السحرية: «اسألني كل الأسئلة التي تحتاجها».'
          : `تحتاج ${PASS_MARK} إجابات صحيحة من ${items.length}. راجع القاعدة: الدفع يملي الطريقة، والسحب يعطي الوجهة ويطلب الأسئلة.`,
      ),
      h('button', { type: 'button', class: 'btn-ghost mt-5', onclick: restart }, 'أعد الاختبار'),
    )
  }

  function circle(color, percent) {
    const radius = 52
    const circumference = 2 * Math.PI * radius
    return svg('circle', {
      cx: 60,
      cy: 60,
      r: radius,
      fill: 'none',
      stroke: color,
      'stroke-width': 10,
      'stroke-linecap': 'round',
      'stroke-dasharray': circumference,
      'stroke-dashoffset': circumference * (1 - percent / 100),
    })
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
          h('h3', { class: 'text-lg' }, 'اختبار: دفع أم سحب؟'),
          h('span', { class: 'chip' }, `${QUIZ_ITEMS.length} أسئلة + تحدي`),
        ),
        stage === 'quiz' ? drawQuiz() : stage === 'conversion' ? drawConversion() : drawSummary(),
      ),
    )
  }

  draw()
}
