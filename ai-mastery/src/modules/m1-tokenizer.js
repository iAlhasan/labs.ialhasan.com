import { h, render, announce, icon } from '../ui.js'
import { store } from '../store.js'
import { PHRASES } from '../content.js'

/** تطبيع عربي بسيط للمقارنة: إزالة التشكيل وتوحيد الألف والتاء المربوطة. */
function normalize(text) {
  return text
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
}

const PREFIXES = ['ال', 'وال', 'بال', 'كال', 'فال', 'و', 'ف', 'ب', 'ل', 'ك']
const SUFFIXES = ['ون', 'ين', 'ات', 'ها', 'هم', 'نا', 'كم']

/** تفتيت تعليمي يُظهر أن الكلمة ليست وحدة واحدة عند النموذج. */
function tokenize(text) {
  const tokens = []
  for (const word of text.trim().split(/\s+/).filter(Boolean)) {
    let rest = word
    const prefix = PREFIXES.find((p) => rest.startsWith(p) && rest.length > p.length + 2)
    if (prefix) {
      tokens.push(prefix)
      rest = rest.slice(prefix.length)
    }
    const suffix = SUFFIXES.find((s) => rest.endsWith(s) && rest.length > s.length + 2)
    if (suffix) {
      tokens.push(rest.slice(0, -suffix.length), suffix)
    } else {
      tokens.push(rest)
    }
  }
  return tokens
}

function findPhrase(text) {
  const needle = normalize(text)
  return PHRASES.find((p) => normalize(p.text) === needle)
}

export function mountTokenizer(root) {
  const input = h('input', {
    type: 'text',
    class: 'field',
    placeholder: 'اكتب بداية جملة، أو اختر واحدة من الأمثلة',
    'aria-label': 'نص للتفتيت والتنبؤ',
  })

  const output = h('div', { class: 'mt-6' })

  function run() {
    const text = input.value.trim()
    if (!text) {
      render(output, h('p', { class: 'text-sm text-ink-soft' }, 'اكتب شيئاً أولاً.'))
      return
    }

    const tokens = tokenize(text)
    const phrase = findPhrase(text)

    render(
      output,
      h(
        'div',
        { class: 'fade-in' },
        h('p', { class: 'mb-2 text-sm font-medium text-ink' }, `1 — النص يُفتّت إلى ${tokens.length} رمزاً:`),
        h(
          'div',
          { class: 'flex flex-wrap gap-1.5' },
          tokens.map((t, i) =>
            h(
              'span',
              {
                class:
                  'rounded-lg border border-brand-light/40 bg-brand-light/10 px-2.5 py-1 text-sm text-brand pop-in',
                style: `animation-delay:${i * 45}ms`,
              },
              t,
            ),
          ),
        ),
      ),
      phrase
        ? h(
            'div',
            { class: 'mt-6 fade-in' },
            h('p', { class: 'mb-3 text-sm font-medium text-ink' }, '2 — ثم يُرجّح الرمز التالي:'),
            h(
              'div',
              { class: 'flex flex-col gap-2.5' },
              phrase.predictions.map((pred, i) =>
                h(
                  'div',
                  { class: 'flex items-center gap-3' },
                  h(
                    'span',
                    {
                      class: `w-24 shrink-0 text-sm ${i === 0 ? 'font-bold text-brand' : 'text-ink-soft'}`,
                    },
                    pred.token,
                  ),
                  h(
                    'div',
                    { class: 'meter flex-1' },
                    h('span', {
                      style: `width:${Math.round(pred.p * 100)}%;${i === 0 ? '' : 'background:var(--color-brand-light)'}`,
                    }),
                  ),
                  h(
                    'span',
                    { class: 'w-12 shrink-0 text-start text-sm tabular-nums text-ink-soft' },
                    `${Math.round(pred.p * 100)}%`,
                  ),
                ),
              ),
            ),
            h(
              'p',
              { class: 'mt-4 text-sm leading-relaxed text-ink-soft' },
              'لاحظ أنه لم «يفهم» الجملة. هو فقط رأى هذا النمط ملايين المرات، فرجّح ما يليه عادة. كل ما يفعله الذكاء الاصطناعي هو تكرار هذه الخطوة آلاف المرات.',
            ),
          )
        : h(
            'div',
            { class: 'mt-6 card-soft fade-in' },
            h(
              'p',
              { class: 'text-sm leading-relaxed text-ink-soft' },
              'هذه محاكاة توضيحية تعمل داخل متصفحك بجدول أنماط صغير، ولا تتصل بنموذج حقيقي — ولهذا لا تملك توقّعاً لهذه الجملة تحديداً. جرّب أحد الأمثلة أعلاه لترى خطوة الترجيح كاملة.',
            ),
          ),
    )

    store.markDone('m1')
    announce('تم تفتيت النص إلى رموز')
  }

  render(
    root,
    h(
      'div',
      { class: 'card' },
      h(
        'div',
        { class: 'mb-4 flex flex-wrap items-center justify-between gap-3' },
        h(
          'h3',
          { class: 'flex items-center gap-2 text-lg' },
          icon('spark', 'h-5 w-5 text-brand-light'),
          'مُتنبّئ الرموز',
        ),
        h('span', { class: 'chip' }, 'تمرين الوحدة'),
      ),
      h(
        'div',
        { class: 'mb-4 flex flex-wrap gap-2' },
        PHRASES.map((p) =>
          h(
            'button',
            {
              type: 'button',
              class: 'chip hover:border-brand-light hover:text-brand',
              onclick: () => {
                input.value = p.text
                run()
              },
            },
            p.text,
          ),
        ),
      ),
      h(
        'div',
        { class: 'flex flex-col gap-3 sm:flex-row' },
        input,
        h('button', { type: 'button', class: 'btn-primary shrink-0', onclick: run }, 'فتّت وتنبّأ'),
      ),
      output,
    ),
  )

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') run()
  })
}
