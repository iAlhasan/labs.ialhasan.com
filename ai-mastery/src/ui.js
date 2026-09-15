/** أدوات مساعدة صغيرة لبناء الواجهة دون أي مكتبة خارجية. */

/**
 * منشئ عناصر مختصر: h('button', { class: 'btn-primary', onclick }, 'نص')
 * الأصناف تُمرَّر دائماً عبر خاصية class حتى تعمل أصناف مثل p-1.5 بلا لبس.
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag)

  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue
    if (key === 'class') el.className = value
    else if (key === 'style') el.setAttribute('style', value)
    else if (key === 'html') el.innerHTML = value
    else if (key === 'dataset') Object.assign(el.dataset, value)
    else if (key.startsWith('on') && typeof value === 'function')
      el.addEventListener(key.slice(2).toLowerCase(), value)
    else if (key in el && typeof value !== 'object') el[key] = value
    else el.setAttribute(key, value === true ? '' : value)
  }

  append(el, children)
  return el
}

function append(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)))
  }
}

/** يستبدل محتوى الحاوية بعناصر جديدة. */
export function render(container, ...children) {
  container.replaceChildren()
  append(container, children)
  return container
}

export const qs = (sel, root = document) => root.querySelector(sel)
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)]

/** إعلان للقارئات الشاشية. */
export function announce(message) {
  const live = qs('[data-live]')
  if (!live) return
  live.textContent = ''
  // إعادة الضبط تضمن نطق الرسالة حتى لو تكرّر نصها
  window.setTimeout(() => {
    live.textContent = message
  }, 50)
}

const SVG_NS = 'http://www.w3.org/2000/svg'

/** نفس فكرة h لكن داخل فضاء أسماء SVG. */
export function svg(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag)
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue
    el.setAttribute(key, value === true ? '' : String(value))
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue
    el.append(child)
  }
  return el
}

const ICON_PATHS = {
  check: 'M20 6 9 17l-5-5',
  cross: 'M18 6 6 18M6 6l12 12',
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
  arrowDown: 'M12 5v14M19 12l-7 7-7-7',
  download: 'M12 3v12M7 10l5 5 5-5M4 21h16',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  lock: 'M6 11h12v9H6zM9 11V7a3 3 0 0 1 6 0v4',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18',
}

/** أيقونة خطّية — الشكل يحمل المعنى، لا اللون وحده. */
export function icon(name, cls = 'h-4 w-4') {
  return svg(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      class: cls,
    },
    svg('path', { d: ICON_PATHS[name] || ICON_PATHS.check }),
  )
}

/** تنزيل نص كملف. */
export function downloadText(filename, text, type = 'text/markdown;charset=utf-8') {
  const blob = new Blob(['﻿' + text], { type })
  triggerDownload(filename, URL.createObjectURL(blob), true)
}

export function triggerDownload(filename, url, revoke = false) {
  const a = h('a', { href: url, download: filename })
  document.body.append(a)
  a.click()
  a.remove()
  if (revoke) window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** نسخ إلى الحافظة مع بديل يعمل في السياقات غير الآمنة. */
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* يسقط إلى البديل أدناه */
  }
  try {
    const ta = h('textarea', { class: 'fixed -top-96 opacity-0' })
    ta.value = text
    document.body.append(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch {
    return false
  }
}

/** يومض نص الزر مؤقتاً لتأكيد الإجراء. */
export function flashButton(button, message) {
  if (button.dataset.flashing === '1') return
  const original = button.textContent
  button.dataset.flashing = '1'
  button.textContent = message
  window.setTimeout(() => {
    button.textContent = original
    delete button.dataset.flashing
  }, 1600)
}

/** خلط مصفوفة (نسخة جديدة). */
export function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * قائمة قابلة لإعادة الترتيب بأزرار — تعمل باللمس وبلوحة المفاتيح معاً،
 * وهي أوثق من السحب والإفلات على الشاشات الصغيرة.
 */
export function orderList(items, { onChange } = {}) {
  let order = shuffle(items.map((_, i) => i))
  // ضمان ألا يبدأ التمرين مرتّباً بالصدفة
  if (items.length > 1 && order.every((v, i) => v === i)) order.reverse()

  const list = h('ol', { class: 'flex flex-col gap-2' })
  let locked = false

  function move(from, to) {
    if (locked || to < 0 || to >= order.length) return
    const [item] = order.splice(from, 1)
    order.splice(to, 0, item)
    draw()
    onChange?.([...order])
    list.children[to]?.querySelector('button')?.focus()
  }

  function draw() {
    render(
      list,
      order.map((itemIndex, pos) => {
        const item = items[itemIndex]
        const label = item.text.slice(0, 30)
        return h(
          'li',
          { class: 'flex items-center gap-3 rounded-xl border border-line bg-white p-3 sm:p-4' },
          h(
            'span',
            {
              class:
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-bold text-brand',
            },
            String(pos + 1),
          ),
          h('p', { class: 'flex-1 text-[0.95rem] leading-relaxed' }, item.text),
          h(
            'div',
            { class: 'flex shrink-0 flex-col gap-1' },
            h(
              'button',
              {
                type: 'button',
                class:
                  'rounded-lg border border-line p-1.5 text-brand hover:bg-surface disabled:opacity-30',
                disabled: locked || pos === 0,
                'aria-label': `حرّك «${label}» للأعلى`,
                onclick: () => move(pos, pos - 1),
              },
              icon('arrowUp'),
            ),
            h(
              'button',
              {
                type: 'button',
                class:
                  'rounded-lg border border-line p-1.5 text-brand hover:bg-surface disabled:opacity-30',
                disabled: locked || pos === order.length - 1,
                'aria-label': `حرّك «${label}» للأسفل`,
                onclick: () => move(pos, pos + 1),
              },
              icon('arrowDown'),
            ),
          ),
        )
      }),
    )
  }

  draw()

  return {
    el: list,
    getOrder: () => [...order],
    lock() {
      locked = true
      draw()
    },
  }
}
