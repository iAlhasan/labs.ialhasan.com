/**
 * حالة المتعلّم: التقدم، الاسم، والمخرجات المولّدة.
 * كل شيء محفوظ في localStorage داخل متصفح المستخدم — لا خادم ولا حساب.
 */

const KEY = 'aiMastery:v1'

export const MODULES = [
  { id: 'm1', n: 1, title: 'كيف يعمل الذكاء الاصطناعي', weight: 10, task: 'شغّل مُتنبّئ الرموز' },
  { id: 'm2', n: 2, title: 'تشريح البرومبت الرباعي', weight: 15, task: 'صنّف الأجزاء الأربعة' },
  { id: 'm3', n: 3, title: 'اختر أداة واحدة وأتقنها', weight: 10, task: 'أكمل مطابِق الأدوات' },
  { id: 'm4', n: 4, title: 'الدفع مقابل السحب', weight: 15, task: 'اجتز الاختبار' },
  { id: 'm5', n: 5, title: 'برومبت الماستر', weight: 20, task: 'ابنِ برومبت الماستر' },
  { id: 'm6', n: 6, title: 'برومبت النظام', weight: 15, task: 'رتّب وصفة النظام' },
  { id: 'm7', n: 7, title: 'الذوق والرؤية والاهتمام', weight: 10, task: 'أكمل التشخيص' },
  { id: 'm8', n: 8, title: 'عشر دقائق من الفعل', weight: 5, task: 'سجّل التزامك' },
]

export const RANKS = [
  { min: 0, label: 'متعلّم مبتدئ' },
  { min: 40, label: 'ضمن أفضل 10%' },
  { min: 80, label: 'ضمن أفضل 1%' },
]

function blank() {
  const modules = {}
  for (const m of MODULES) modules[m.id] = { read: false, done: false }
  return { version: 1, name: '', modules, artifacts: {} }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return blank()
    const saved = JSON.parse(raw)
    if (saved?.version !== 1) return blank()
    // الدمج مع الهيكل الفارغ حتى لا تنكسر الحالة عند إضافة وحدات مستقبلاً
    const base = blank()
    base.name = typeof saved.name === 'string' ? saved.name : ''
    base.artifacts = saved.artifacts && typeof saved.artifacts === 'object' ? saved.artifacts : {}
    for (const m of MODULES) {
      const s = saved.modules?.[m.id]
      if (s) base.modules[m.id] = { read: !!s.read, done: !!s.done }
    }
    return base
  } catch {
    return blank()
  }
}

const listeners = new Set()
let state = load()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* وضع التصفح الخاص أو مساحة ممتلئة — التجربة تستمر بلا حفظ */
  }
}

function emit() {
  for (const fn of listeners) fn(state)
}

export const store = {
  get state() {
    return state
  },

  subscribe(fn) {
    listeners.add(fn)
    fn(state)
    return () => listeners.delete(fn)
  },

  markRead(id) {
    if (!state.modules[id] || state.modules[id].read) return
    state.modules[id].read = true
    persist()
    emit()
  },

  markDone(id) {
    if (!state.modules[id] || state.modules[id].done) return
    state.modules[id].read = true
    state.modules[id].done = true
    persist()
    emit()
  },

  setName(name) {
    state.name = (name || '').slice(0, 60)
    persist()
    emit()
  },

  setArtifact(key, value) {
    state.artifacts[key] = value
    persist()
    emit()
  },

  getArtifact(key) {
    return state.artifacts[key]
  },

  reset() {
    state = blank()
    persist()
    emit()
  },

  /** نسبة الإنجاز: نصف وزن الوحدة للقراءة، ونصفه للتطبيق. */
  percent() {
    let score = 0
    for (const m of MODULES) {
      const s = state.modules[m.id]
      if (s.read) score += m.weight / 2
      if (s.done) score += m.weight / 2
    }
    return Math.round(score)
  },

  rank(percent = store.percent()) {
    let label = RANKS[0].label
    for (const r of RANKS) if (percent >= r.min) label = r.label
    return label
  },
}
