import { h, render, announce, icon, copyText, downloadText, flashButton } from '../ui.js'
import { store } from '../store.js'
import { ROLES, INTERVIEW, INTERVIEW_EXTRA } from '../content.js'

/** مقياس «جودة المدخل»: يكافئ التفصيل والأرقام والأسماء الحقيقية. */
function answerQuality(text = '') {
  const value = text.trim()
  if (!value) return 0
  const words = value.split(/\s+/).length
  let score = Math.min(1, value.length / 140) * 0.8
  if (words >= 15) score += 0.1
  if (/\d/.test(value)) score += 0.1
  return Math.min(1, score)
}

function buildDoc(roleLabel, questions, answers) {
  const lines = [
    `# برومبت الماستر — ${roleLabel}`,
    '',
    'هذا ملف سياق ثابت عني. ألصقه في بداية أي محادثة جديدة، أو ارفعه في أي أداة تنتقل إليها.',
    '',
  ]
  for (const q of questions) {
    const answer = (answers[q.key] || '').trim()
    if (!answer) continue
    lines.push(`## ${q.heading}`, answer, '')
  }
  lines.push(
    '## كيف تستخدم هذا الملف',
    'اعتمد كل ما سبق سياقاً ثابتاً عني في كل إجابة. وإن نقصك شيء قبل أن تجيب، اسألني بدل أن تفترض.',
    '',
  )
  return lines.join('\n')
}

export function mountMasterPrompt(root) {
  const saved = store.getArtifact('masterPrompt')

  let roleId = saved?.roleId || null
  let roleLabel = saved?.roleLabel || ''
  let answers = { ...(saved?.answers || {}) }
  let questions = saved?.extra ? [...INTERVIEW, ...INTERVIEW_EXTRA] : [...INTERVIEW]
  let extra = !!saved?.extra
  let index = saved ? questions.length : 0
  let stage = saved ? 'done' : 'role' // role | interview | done
  let resumeOffered = !!saved

  function persist() {
    store.setArtifact('masterPrompt', {
      roleId,
      roleLabel,
      answers,
      extra,
      doc: buildDoc(roleLabel, questions, answers),
      savedAt: Date.now(),
    })
  }

  function reset() {
    roleId = null
    roleLabel = ''
    answers = {}
    extra = false
    questions = [...INTERVIEW]
    index = 0
    stage = 'role'
    resumeOffered = false
    draw()
  }

  /* --------------------------- اختيار الدور --------------------------- */
  function drawRolePicker() {
    const customInput = h('input', {
      type: 'text',
      class: 'field mt-3 hidden',
      placeholder: 'اكتب اسم الدور، مثل: مدير مشاريع',
      'aria-label': 'دور مخصص',
    })

    const start = (label) => {
      if (!label.trim()) return
      roleLabel = label.trim()
      stage = 'interview'
      index = 0
      draw()
    }

    return h(
      'div',
      { class: 'fade-in' },
      h('p', { class: 'mb-4 text-sm text-ink-soft' }, 'لأي دور في حياتك تريد أن تبني هذا الملف؟'),
      h(
        'div',
        { class: 'flex flex-wrap gap-2' },
        ROLES.map((role) =>
          h(
            'button',
            {
              type: 'button',
              class: 'btn btn-sm border border-line bg-white text-ink hover:border-brand-light hover:text-brand',
              onclick: () => {
                roleId = role.id
                if (role.id === 'custom') {
                  customInput.classList.remove('hidden')
                  customInput.focus()
                } else {
                  start(role.label)
                }
              },
            },
            role.label,
          ),
        ),
      ),
      customInput,
      h(
        'button',
        {
          type: 'button',
          class: 'btn-primary mt-3',
          onclick: () => start(customInput.value),
        },
        'ابدأ المقابلة',
      ),
    )
  }

  /* ----------------------------- المقابلة ----------------------------- */
  function drawInterview() {
    const question = questions[index]
    const textarea = h('textarea', {
      class: 'field min-h-32 leading-relaxed',
      rows: 4,
      placeholder: question.placeholder,
      'aria-label': question.q,
    })
    textarea.value = answers[question.key] || ''

    const submit = () => {
      answers[question.key] = textarea.value.trim()
      persist()
      if (index < questions.length - 1) {
        index += 1
      } else {
        stage = 'done'
        store.markDone('m5')
        announce('اكتمل برومبت الماستر')
      }
      draw()
    }

    const answeredBefore = questions.slice(0, index).filter((q) => answers[q.key])

    return h(
      'div',
      { class: 'fade-in' },
      h(
        'div',
        { class: 'mb-4 flex items-center gap-3' },
        h('div', { class: 'meter max-w-40' }, h('span', { style: `width:${(index / questions.length) * 100}%` })),
        h('span', { class: 'shrink-0 text-sm tabular-nums text-ink-soft' }, `${index + 1} / ${questions.length}`),
      ),

      // ما سبق من إجابات، كفقاعات محادثة
      answeredBefore.length
        ? h(
            'div',
            { class: 'mb-5 flex flex-col gap-3' },
            answeredBefore.map((q) =>
              h(
                'div',
                { class: 'flex flex-col gap-1' },
                h('p', { class: 'text-xs font-medium text-brand' }, q.heading),
                h(
                  'div',
                  { class: 'flex items-start justify-between gap-3 rounded-card bg-surface px-4 py-2.5' },
                  h('p', { class: 'text-sm leading-relaxed text-ink-soft' }, answers[q.key]),
                  h(
                    'button',
                    {
                      type: 'button',
                      class: 'shrink-0 text-xs text-brand underline underline-offset-2',
                      onclick: () => {
                        index = questions.indexOf(q)
                        draw()
                      },
                    },
                    'تعديل',
                  ),
                ),
              ),
            ),
          )
        : null,

      h(
        'div',
        { class: 'rounded-card border-r-4 border-brand bg-surface p-4' },
        h('p', { class: 'text-xs font-medium text-brand' }, question.heading),
        h('p', { class: 'mt-1 text-[1.05rem] font-bold leading-relaxed' }, question.q),
      ),

      textarea,
      h(
        'div',
        { class: 'mt-3 flex flex-wrap items-center justify-between gap-3' },
        h(
          'p',
          { class: 'text-xs text-ink-soft' },
          'كلما زادت التفاصيل والأرقام والأسماء الحقيقية، كان الملف أنفع.',
        ),
        h(
          'button',
          { type: 'button', class: 'btn-primary', onclick: submit },
          index === questions.length - 1 ? 'أنشئ الملف' : 'التالي',
        ),
      ),
    )
  }

  /* ------------------------------ النتيجة ------------------------------ */
  function drawDoc() {
    const doc = buildDoc(roleLabel, questions, answers)
    const answered = questions.filter((q) => (answers[q.key] || '').trim())
    const quality = answered.length
      ? Math.round(
          (answered.reduce((sum, q) => sum + answerQuality(answers[q.key]), 0) / questions.length) * 100,
        )
      : 0

    const addExtra = () => {
      if (extra) return
      extra = true
      questions = [...INTERVIEW, ...INTERVIEW_EXTRA]
      index = INTERVIEW.length
      stage = 'interview'
      persist()
      draw()
    }

    return h(
      'div',
      { class: 'fade-in grid gap-6 lg:grid-cols-[1fr_1.1fr]' },

      // لوحة المعلومات والإجراءات
      h(
        'div',
        {},
        h(
          'p',
          { class: 'flex items-center gap-2 text-sm font-bold text-correct' },
          icon('check'),
          `اكتمل برومبت الماستر لدور: ${roleLabel}`,
        ),

        h(
          'div',
          { class: 'mt-5' },
          h(
            'div',
            { class: 'mb-1.5 flex items-center justify-between text-sm' },
            h('span', { class: 'font-medium' }, 'جودة المدخل'),
            h('span', { class: 'tabular-nums text-ink-soft' }, `${quality}%`),
          ),
          h(
            'div',
            { class: 'meter' },
            h('span', {
              style: `width:${quality}%;${quality < 55 ? 'background:var(--color-warn)' : ''}`,
            }),
          ),
          h(
            'p',
            { class: 'mt-2 text-xs leading-relaxed text-ink-soft' },
            quality >= 75
              ? 'ملف غني بالسياق. هذا ما ينقل الذكاء الاصطناعي من غريب إلى مستشار يعرفك.'
              : quality >= 55
                ? 'جيد. أضف أرقاماً وأسماء حقيقية إلى الإجابات القصيرة ليصبح أدق.'
                : 'الإجابات مختصرة. عُد وأضف تفاصيل — جودة المخرج لن تتجاوز جودة المدخل.',
          ),
        ),

        h(
          'div',
          { class: 'mt-5 flex flex-wrap gap-2' },
          h(
            'button',
            {
              type: 'button',
              class: 'btn-primary btn-sm',
              onclick: async (event) => {
                const ok = await copyText(doc)
                flashButton(event.currentTarget, ok ? 'تم النسخ' : 'تعذّر النسخ')
              },
            },
            'نسخ الملف',
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'btn-ghost btn-sm',
              onclick: () => downloadText(`master-prompt-${roleId || 'custom'}.md`, doc),
            },
            'تنزيل ملف md',
          ),
          h(
            'button',
            { type: 'button', class: 'btn-ghost btn-sm', onclick: addExtra, disabled: extra },
            extra ? 'أُضيفت الأسئلة العميقة' : 'اطلب أسئلة أعمق',
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'btn-ghost btn-sm',
              onclick: () => {
                index = 0
                stage = 'interview'
                draw()
              },
            },
            'تعديل الإجابات',
          ),
          h('button', { type: 'button', class: 'btn-ghost btn-sm', onclick: reset }, 'دور جديد'),
        ),
      ),

      // المعاينة الحية
      h(
        'div',
        {
          class:
            'max-h-[30rem] overflow-auto rounded-card border border-line bg-white p-5 text-sm leading-relaxed',
        },
        questions
          .filter((q) => (answers[q.key] || '').trim())
          .map((q) =>
            h(
              'div',
              { class: 'mb-4' },
              h('p', { class: 'mb-1 text-xs font-bold tracking-wide text-brand' }, q.heading),
              h('p', { class: 'whitespace-pre-line text-ink-soft' }, answers[q.key]),
            ),
          ),
        h(
          'p',
          { class: 'mt-4 border-t border-line pt-4 text-xs leading-relaxed text-ink-soft' },
          'اعتمد كل ما سبق سياقاً ثابتاً عني في كل إجابة. وإن نقصك شيء قبل أن تجيب، اسألني بدل أن تفترض.',
        ),
      ),
    )
  }

  /* ------------------------------- الإطار ------------------------------- */
  function draw() {
    render(
      root,
      h(
        'div',
        { class: 'card' },
        h(
          'div',
          { class: 'mb-4 flex flex-wrap items-center justify-between gap-3' },
          h('h3', { class: 'text-lg' }, 'مُنشئ برومبت الماستر'),
          h('span', { class: 'chip' }, 'يُحفظ في متصفحك'),
        ),
        resumeOffered && stage === 'done'
          ? h(
              'p',
              { class: 'mb-4 rounded-card bg-surface p-3 text-sm text-ink-soft' },
              `لديك ملف محفوظ لدور «${roleLabel}». يمكنك تعديله أو البدء بدور جديد.`,
            )
          : null,
        stage === 'role' ? drawRolePicker() : stage === 'interview' ? drawInterview() : drawDoc(),
      ),
    )
  }

  draw()
}
