/**
 * Passion interactions: scroll progress, ambient focus glow, refined hover.
 * No custom reticle — keep the system cursor.
 */

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

export function setPassionActive(isActive) {
  active = Boolean(isActive)
  if (!glow) return

  if (!active) {
    glow.classList.remove('is-on')
    resetTilt()
    return
  }

  restartSchematicArt()
}

export function initPassionInteractions() {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
