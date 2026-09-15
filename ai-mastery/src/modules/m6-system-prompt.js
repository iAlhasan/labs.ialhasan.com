import { h, render, announce, icon, orderList, copyText, downloadText, flashButton } from '../ui.js'
import { store } from '../store.js'
import { RECIPE_STEPS } from '../content.js'

export const SYSTEM_PROMPT_TEMPLATE = `أنت [الدور والخبرة الدقيقة].

المدخلات:
سيعطيك المستخدم في كل مرة [المدخل المتوقع]. إن نقص شيء منها، اسأل عنه قبل أن تبدأ.

الخطوات:
1. [الخطوة الأولى]
2. [الخطوة الثانية]
3. [الخطوة الثالثة]

القيود ومعايير الجودة:
- [ما هو ممنوع]
- [ما الذي يجعل المخرج مقبولاً]

صيغة المخرج:
[القالب النهائي بالضبط، جدول أو قائمة أو نموذج يُحتذى]`

export function mountSystemPrompt(root) {
  let solved = false

  function draw() {
    const list = orderList(RECIPE_STEPS)
    const feedback = h('div', { class: 'mt-4' })

    const check = () => {
      const order = list.getOrder()
      const correct = order.every((value, position) => value === position)
      if (correct) {
        solved = true
        store.markDone('m6')
        announce('ترتيب الوصفة صحيح')
        draw()
        return
      }
      const firstWrong = order.findIndex((value, position) => value !== position)
      announce('الترتيب غير صحيح')
      render(
        feedback,
        h(
          'div',
          { class: 'rounded-card border border-wrong/30 bg-wrong/5 p-4 fade-in' },
          h(
            'p',
            { class: 'flex items-center gap-2 text-sm font-bold text-wrong' },
            icon('cross'),
            'كومة عجين، لا كعكة.',
          ),
          h(
            'p',
            { class: 'mt-1.5 text-sm leading-relaxed text-ink-soft' },
            `المكوّنات صحيحة لكن الترتيب ليس كذلك. ابدأ من الخطأ في الموضع ${firstWrong + 1}: اسأل نفسك ما الذي يجب أن يعرفه النظام قبل أن يبدأ العمل أصلاً؟`,
          ),
        ),
      )
    }

    const solvedPanel = () =>
      h(
        'div',
        { class: 'fade-in' },
        h(
          'p',
          { class: 'flex items-center gap-2 text-sm font-bold text-correct' },
          icon('check'),
          'هذا هو التسلسل الصحيح — والآن صار لديك وصفة تتكرر.',
        ),
        h(
          'ol',
          { class: 'mt-4 flex flex-col gap-2' },
          RECIPE_STEPS.map((step, i) =>
            h(
              'li',
              { class: 'flex items-start gap-3 rounded-xl border border-correct/25 bg-correct/5 p-3' },
              h(
                'span',
                {
                  class:
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white',
                },
                String(i + 1),
              ),
              h('p', { class: 'text-sm leading-relaxed' }, step.text),
            ),
          ),
        ),
        h('h4', { class: 'mt-6 text-base' }, 'قالب جاهز — املأ ما بين الأقواس'),
        h(
          'pre',
          {
            class:
              'mt-2 max-h-72 overflow-auto rounded-card border border-line bg-surface p-4 text-sm leading-relaxed whitespace-pre-wrap',
          },
          SYSTEM_PROMPT_TEMPLATE,
        ),
        h(
          'div',
          { class: 'mt-4 flex flex-wrap gap-2' },
          h(
            'button',
            {
              type: 'button',
              class: 'btn-primary btn-sm',
              onclick: async (event) => {
                const ok = await copyText(SYSTEM_PROMPT_TEMPLATE)
                flashButton(event.currentTarget, ok ? 'تم النسخ' : 'تعذّر النسخ')
              },
            },
            'نسخ القالب',
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'btn-ghost btn-sm',
              onclick: () => downloadText('system-prompt-template.md', SYSTEM_PROMPT_TEMPLATE),
            },
            'تنزيل ملف md',
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'btn-ghost btn-sm',
              onclick: () => {
                solved = false
                draw()
              },
            },
            'أعد التمرين',
          ),
        ),
        h(
          'p',
          { class: 'mt-5 rounded-card bg-surface p-4 text-sm leading-relaxed text-ink' },
          'الخطوة الأخيرة: الصق هذا النص في مشروع أو أداة مخصصة، وصار لديك آلة صغيرة تعمل لك على التكرار. يكفي فريقك بعدها أن يعطيها الموضوع فقط.',
        ),
      )

    render(
      root,
      h(
        'div',
        { class: 'card' },
        h(
          'div',
          { class: 'mb-4 flex flex-wrap items-center justify-between gap-3' },
          h('h3', { class: 'text-lg' }, 'مطبخ برومبت النظام'),
          h('span', { class: 'chip' }, '5 مكوّنات'),
        ),
        solved
          ? solvedPanel()
          : h(
              'div',
              {},
              h(
                'p',
                { class: 'mb-4 text-sm leading-relaxed text-ink-soft' },
                'هذه مكوّنات برومبت النظام الخمسة، لكنها مبعثرة. رتّبها بالتسلسل الذي يجعل النظام يعمل.',
              ),
              list.el,
              h('button', { type: 'button', class: 'btn-primary mt-4', onclick: check }, 'اطبخ الوصفة'),
              feedback,
            ),
      ),
    )
  }

  draw()
}
