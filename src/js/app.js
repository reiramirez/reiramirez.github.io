import { escapeHtml, getSiteContent, withBase } from './render-site.js'
import { initPassionInteractions, setPassionActive } from './passion.js'

const VIEWS = ['gate', 'peace', 'passion']
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const FADE_MS = 300

const root = document.documentElement
const body = document.body
const panels = Object.fromEntries(
  VIEWS.map((id) => [id, document.querySelector(`[data-view-panel="${id}"]`)])
)

let current = null
let passionReady = false
let busy = false

root.classList.add('js')

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function normalizeView(name) {
  if (name === 'gate' || name === 'peace' || name === 'passion') return name
  return 'gate'
}

/** Map location.hash → view. Empty hash = gate (JS). In-page Passion anchors stay on passion. */
function hashToView() {
  const raw = (location.hash || '').replace(/^#/, '').split('?')[0]
  if (raw === 'projects' || raw === 'work' || raw === 'experience' || raw === 'skills') {
    return 'passion'
  }
  if (!raw) return 'gate'
  return normalizeView(raw)
}

function setDestinationTheme(view) {
  body.className = `theme-${view}`
  root.classList.remove('theme-peace', 'theme-gate', 'theme-passion')
  root.classList.add(`theme-${view}`)
}

function applyView(view) {
  current = view
  setDestinationTheme(view)

  for (const [id, el] of Object.entries(panels)) {
    if (!el) continue
    const on = id === view
    el.classList.toggle('is-active', on)
    if (on) el.removeAttribute('hidden')
    else el.setAttribute('hidden', '')
  }

  const passionHashes = new Set(['#projects', '#work', '#experience', '#skills'])
  const passionAnchor = passionHashes.has(location.hash) ? location.hash : null
  const next =
    view === 'gate' ? '' : view === 'passion' && passionAnchor ? passionAnchor : `#${view}`
  const url = `${location.pathname}${location.search}${next}`
  if (`${location.pathname}${location.search}${location.hash}` !== url) {
    history.replaceState(null, '', url)
  }

  if (view === 'passion') {
    if (!passionReady) {
      initPassionInteractions()
      passionReady = true
    } else {
      setPassionActive(true)
    }
  } else if (passionReady) {
    setPassionActive(false)
  }

  if (view !== 'passion' || !passionAnchor) {
    window.scrollTo(0, 0)
  }
}

async function showView(view) {
  view = normalizeView(view)
  if (view === current || busy) return
  busy = true

  try {
    // Paint destination canvas first so the fade reveals the right tones
    setDestinationTheme(view)

    if (current && !REDUCED) {
      root.classList.add('is-leaving')
      await wait(FADE_MS)
    }
    applyView(view)
    root.classList.remove('is-leaving')
  } finally {
    busy = false
  }
}

function fillContent() {
  const c = getSiteContent()
  const resumeUrl = withBase(c.resumeUrl)

  for (const el of document.querySelectorAll('[data-resume]')) {
    el.href = resumeUrl
  }

  const gateName = document.querySelector('[data-gate-name]')
  if (gateName) gateName.textContent = c.name

  const peaceName = document.querySelector('[data-peace-name]')
  if (peaceName) {
    const parts = c.name.trim().split(/\s+/)
    if (parts.length >= 2) {
      peaceName.innerHTML = `${escapeHtml(parts[0])} <span>${escapeHtml(parts.slice(1).join(' '))}</span>`
    } else {
      peaceName.textContent = c.name
    }
  }

  const peaceBio = document.querySelector('[data-peace-bio]')
  if (peaceBio) peaceBio.textContent = c.bio

  const linkIcon =
    '<span class="link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="0.85em" height="0.85em" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span>'

  function fillPeaceList(selector, items) {
    const el = document.querySelector(selector)
    if (!el) return
    el.innerHTML = items
      .map((item) => {
        const mark = item.url ? linkIcon : ''
        const name = item.url
          ? `<a class="name" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}${mark}</a>`
          : `<span class="name">${escapeHtml(item.title)}</span>`
        return `<li>
          ${name}
          <span class="year">${escapeHtml(item.year)}</span>
          <span class="note">${escapeHtml(item.note)}</span>
        </li>`
      })
      .join('')
  }

  fillPeaceList('[data-peace-projects]', c.projects)
  fillPeaceList('[data-peace-experience]', c.workExperience)

  const passionName = document.querySelector('[data-passion-name]')
  if (passionName) {
    const parts = c.name.trim().split(/\s+/)
    if (parts.length >= 2) {
      passionName.innerHTML = `${escapeHtml(parts[0])} <em>${escapeHtml(parts.slice(1).join(' '))}</em>`
    } else {
      passionName.textContent = c.name
    }
  }

  const passionEyebrow = document.querySelector('[data-passion-eyebrow]')
  if (passionEyebrow && c.headline) {
    passionEyebrow.textContent = c.headline
  }

  const passionLede = document.querySelector('[data-passion-lede]')
  if (passionLede) {
    passionLede.textContent = c.bio
  }

  function fillPassionList(selector, items, { slot = false } = {}) {
    const el = document.querySelector(selector)
    if (!el) return
    el.innerHTML = items
      .map((item) => {
        const mark = item.url ? linkIcon : ''
        const body = `
            <div class="row">
              <span class="title">${escapeHtml(item.title)}${mark}</span>
              <span class="year">${escapeHtml(item.year)}</span>
            </div>
            <p class="blurb">${escapeHtml(item.note)}</p>
            <p class="detail">${escapeHtml(item.detail || '')}</p>`
        const card = item.url
          ? `<a class="card" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${body}
          </a>`
          : `<article class="card" tabindex="0">${body}
          </article>`
        return slot ? `<li><div class="card-slot">${card}</div></li>` : `<li>${card}</li>`
      })
      .join('')
  }

  fillPassionList('[data-passion-projects]', c.projects, { slot: true })
  fillPassionList('[data-passion-experience]', c.workExperience)

  const skills = c.skills ?? []
  const skillsRails = document.querySelector('[data-passion-skills]')
  if (skillsRails) {
    skillsRails.innerHTML = skills
      .map(
        (s) => {
          const keywords = (s.keywords ?? [])
            .map((k) => `<span class="kw-word">${escapeHtml(k)}</span>`)
            .join('<span class="kw-sep"> · </span>')
          return `<li class="skill-rail">
          <span class="rail-name">${escapeHtml(s.name)}</span>
          <p class="rail-keywords">${keywords}</p>
        </li>`
        }
      )
      .join('')
  }
}

document.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-nav]')
  if (!nav) return
  const view = nav.getAttribute('data-nav')
  if (!VIEWS.includes(view)) return
  event.preventDefault()
  showView(view)
})

window.addEventListener('hashchange', () => {
  const view = hashToView()
  if (view !== current) showView(view)
})

fillContent()
applyView(hashToView())
