import { h, render, icon, downloadText } from '../ui.js'
import { store } from '../store.js'
import { SYSTEM_PROMPT_TEMPLATE } from './m6-system-prompt.js'

export function mountExports(root) {
  /**
   * بطاقة مخرج واحد. الإجراء إما تنزيل مباشر (onDownload)
   * أو رابط إلى الوحدة التي يُولَّد فيها المخرج.
   */
  function card({ title, note, ready, readyLabel, onDownload, href, hrefLabel }) {
    return h(
      'div',
      {
        class: `rounded-card border p-5 ${ready ? 'border-brand-light/50 bg-surface' : 'border-line bg-white'}`,
      },
      h(
        'p',
        { class: 'flex items-center gap-2 font-bold' },
        icon(ready ? 'check' : 'lock', `h-4 w-4 ${ready ? 'text-correct' : 'text-ink-soft'}`),
        title,
      ),
      h('p', { class: 'mt-2 min-h-12 text-sm leading-relaxed text-ink-soft' }, ready ? readyLabel : note),
      ready && onDownload
        ? h(
            'button',
            { type: 'button', class: 'btn-primary btn-sm mt-3', onclick: onDownload },
            'تنزيل',
          )
        : h(
            'a',
            { href, class: `${ready ? 'btn-primary' : 'btn-ghost'} btn-sm mt-3` },
            hrefLabel,
          ),
    )
  }

  function draw() {
    const master = store.getArtifact('masterPrompt')
    const commitment = store.getArtifact('commitment')

    render(
      root,
      h(
        'div',
        { class: 'grid gap-4 md:grid-cols-3' },
        card({
          title: 'برومبت الماستر',
          note: 'أكمل الوحدة 5 لتبني ملف السياق الخاص بك.',
          ready: !!master?.doc,
          readyLabel: `جاهز لدور «${master?.roleLabel || ''}». ارفعه في أي أداة لينتقل سياقك معك.`,
          onDownload: () => downloadText(`master-prompt-${master?.roleId || 'custom'}.md`, master.doc),
          href: '#m5',
          hrefLabel: 'اذهب إلى الوحدة 5',
        }),
        card({
          title: 'قالب برومبت النظام',
          note: 'أكمل الوحدة 6 لفتح القالب الجاهز.',
          ready: store.state.modules.m6.done,
          readyLabel: 'قالب من خمسة أجزاء، الصقه في مشروع أو أداة مخصصة ليعمل على التكرار.',
          onDownload: () => downloadText('system-prompt-template.md', SYSTEM_PROMPT_TEMPLATE),
          href: '#m6',
          hrefLabel: 'اذهب إلى الوحدة 6',
        }),
        card({
          title: 'بطاقة الالتزام',
          note: 'أكمل الوحدة 8 لإنشاء بطاقتك.',
          ready: !!commitment?.task,
          readyLabel: `التزامك: ${commitment?.task || ''}`,
          onDownload: null, // الصورة تُولَّد داخل الوحدة نفسها
          href: '#m8',
          hrefLabel: commitment?.task ? 'أنشئ البطاقة وحمّلها' : 'اذهب إلى الوحدة 8',
        }),
      ),
    )
  }

  store.subscribe(draw)
}
