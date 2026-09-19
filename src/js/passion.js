/**
 * Passion interactions: scroll progress, ambient focus glow, refined hover,
 * skills keyword proximity reveal. No custom reticle — keep the system cursor.
 */

const KW_RADIUS = 110

let active = false
let schematic = null
let glow = null
let reduced = false

function resetTilt() {
  if (!schematic) return
  schematic.style.setProperty('--tilt-x', '0deg')
  schematic.style.setProperty('--tilt-y', '0deg')
}

function restartSchematicArt() {
  if (!schematic) return
  resetTilt()
  const movers = schematic.querySelectorAll('.orbit, .orbit-2, .scanline, .core')
  movers.forEach((el) => {
    el.style.animation = 'none'
  })
  // Force reflow so animations restart cleanly after display:none
  void schematic.offsetWidth
  movers.forEach((el) => {
    el.style.removeProperty('animation')
  })
}

function wrapKeywordChars(skillsSection) {
  skillsSection.querySelectorAll('.rail-keywords').forEach((p) => {
    if (p.dataset.kwWrapped === '1') return
    const words = p.querySelectorAll('.kw-word')
    if (words.length) {
      words.forEach((word) => {
        const text = word.textContent ?? ''
        word.textContent = ''
        for (const ch of text) {
          const span = document.createElement('span')
          span.className = 'kw-char'
          span.textContent = ch
          word.appendChild(span)
        }
      })
    } else {
      const text = p.textContent ?? ''
      p.textContent = ''
      for (const ch of text) {
        const span = document.createElement('span')
        span.className = 'kw-char'
        span.textContent = ch
        p.appendChild(span)
      }
    }
    p.dataset.kwWrapped = '1'
  })
}

export function setPassionActive(isActive) {
  active = Boolean(isActive)
  if (!glow) return

  if (!active) {
    glow.classList.remove('is-on')
    resetTilt()
    document.querySelectorAll('.view-passion .kw-char').forEach((el) => {
      el.style.setProperty('--t', '0')
    })
    return
  }

  restartSchematicArt()
}

export function initPassionInteractions() {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

  const host = document.querySelector('.view-passion')
  if (!host) return

  const clip = document.createElement('div')
  clip.className = 'focus-glow-clip'
  clip.setAttribute('aria-hidden', 'true')

  glow = document.createElement('div')
  glow.className = 'focus-glow'
  clip.appendChild(glow)
  host.appendChild(clip)

  let mx = window.innerWidth * 0.6
  let my = window.innerHeight * 0.35
  let gx = mx
  let gy = my

  schematic = host.querySelector('.schematic')

  const skillsSection = host.querySelector('.skills-section')
  let charData = []
  let charsDirty = true
  let keywordsNear = false
  const proximityOn = Boolean(skillsSection) && finePointer && !reduced

  if (proximityOn) {
    wrapKeywordChars(skillsSection)
    skillsSection.classList.add('is-proximity')

    const markDirty = () => {
      charsDirty = true
    }
    window.addEventListener('scroll', markDirty, { passive: true, capture: true })
    window.addEventListener('resize', markDirty, { passive: true })

    charData = [...skillsSection.querySelectorAll('.kw-char')].map((el) => ({
      el,
      x: 0,
      y: 0,
    }))
  }

  function refreshCharCenters() {
    for (const c of charData) {
      const r = c.el.getBoundingClientRect()
      c.x = r.left + r.width * 0.5
      c.y = r.top + r.height * 0.5
    }
    charsDirty = false
  }

  function dimAllKeywords() {
    if (!keywordsNear) return
    for (const c of charData) {
      c.el.style.setProperty('--t', '0')
    }
    keywordsNear = false
  }

  function updateKeywordProximity() {
    if (!proximityOn || !active) return

    const sec = skillsSection.getBoundingClientRect()
    const outside =
      mx < sec.left - KW_RADIUS ||
      mx > sec.right + KW_RADIUS ||
      my < sec.top - KW_RADIUS ||
      my > sec.bottom + KW_RADIUS

    if (outside) {
      dimAllKeywords()
      return
    }

    if (charsDirty) refreshCharCenters()
    keywordsNear = true

    for (const c of charData) {
      const d = Math.hypot(c.x - mx, c.y - my)
      const t = Math.max(0, 1 - d / KW_RADIUS)
      const eased = t * t * (3 - 2 * t)
      c.el.style.setProperty('--t', eased.toFixed(3))
    }
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      if (!active) return

      mx = e.clientX
      my = e.clientY
      glow.classList.add('is-on')

      if (schematic && !reduced) {
        const r = schematic.getBoundingClientRect()
        if (r.width < 8 || r.height < 8) return
        const px = ((e.clientX - r.left) / r.width - 0.5) * 8
        const py = ((e.clientY - r.top) / r.height - 0.5) * 6
        schematic.style.setProperty('--tilt-x', `${py * -1}deg`)
        schematic.style.setProperty('--tilt-y', `${px}deg`)
      }
    },
    { passive: true }
  )

  function resetGlowAndTilt() {
    glow.classList.remove('is-on')
    resetTilt()
    dimAllKeywords()
  }

  document.addEventListener('pointerout', (e) => {
    if (!active) return
    const next = e.relatedTarget
    if (!next || !document.documentElement.contains(next)) {
      resetGlowAndTilt()
    }
  })

  function tickGlow() {
    if (active) {
      if (!reduced) {
        gx += (mx - gx) * 0.07
        gy += (my - gy) * 0.07
      } else {
        gx = mx
        gy = my
      }
      glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -50%)`
      updateKeywordProximity()
    }
    requestAnimationFrame(tickGlow)
  }
  requestAnimationFrame(tickGlow)

  const allItems = [...host.querySelectorAll('.projects li')]
  const scanItems = [...host.querySelectorAll('[data-passion-experience] li')]
  const fill = host.querySelector('.scan-fill')

  function updateScan() {
    if (!fill || !scanItems.length) return
    const n = scanItems.filter((li) => li.classList.contains('scanned')).length
    fill.style.transform = `scaleY(${n / scanItems.length})`
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scanned')
            updateScan()
          }
        })
      },
      { rootMargin: '-15% 0px -35% 0px', threshold: 0.4 }
    )
    scanItems.forEach((li) => io.observe(li))
  }

  allItems.forEach((li) => {
    li.addEventListener('pointerenter', () => {
      if (active) li.classList.add('hot')
    })
    li.addEventListener('pointerleave', () => li.classList.remove('hot'))
    const card = li.querySelector('.card')
    if (card) {
      card.addEventListener('focus', () => {
        if (active) li.classList.add('hot')
      })
      card.addEventListener('blur', () => li.classList.remove('hot'))
    }
  })

  active = true
  restartSchematicArt()
}
