/*
  De Stagiair: alle beweging op de site, zonder extra libraries.

  - De naam bovenaan rekt zich uit tot de volle breedte en reageert op je vinger.
  - Het rek met covers draait mee als je swipet, en de folie van het nummer glanst.
  - In een artikel slaat de cover open als je scrolt.
  - De route tekent zich, de leveringsbon vinkt zich af en het getal telt door.
  - Tekst blijft altijd gewoon leesbaar: er beweegt alleen wat erbij hoort.
  - Bij het wisselen van pagina vliegt de cover naar zijn nieuwe plek (View Transitions).

  In de preview (één HTML-bestand met <template>'s) wisselt dit script ook zelf van pagina.
*/
;(function () {
  'use strict'

  var d = document
  var html = d.documentElement
  var SPA = !!d.querySelector('template[data-route]')
  if (SPA) html.classList.add('spa')

  function motion() {
    return html.classList.contains('motion')
  }
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v
  }
  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }
  function all(sel, root) {
    return Array.prototype.slice.call((root || d).querySelectorAll(sel))
  }
  function inView(el) {
    var r = el.getBoundingClientRect()
    return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth
  }

  // ---------- één lus voor scrollen en meten ----------
  var frameFns = []
  var measureFns = []
  var cleanups = []
  var raf = 0

  function schedule() {
    if (!raf) raf = requestAnimationFrame(runFrame)
  }
  function runFrame() {
    raf = 0
    for (var i = 0; i < frameFns.length; i++) frameFns[i]()
  }
  function remeasure() {
    for (var i = 0; i < measureFns.length; i++) measureFns[i]()
    schedule()
  }
  function teardown() {
    cleanups.forEach(function (fn) {
      fn()
    })
    cleanups = []
    frameFns = []
    measureFns = []
  }

  addEventListener('scroll', schedule, { passive: true })
  var resizeTimer = 0
  addEventListener('resize', function () {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(remeasure, 80)
  })
  addEventListener('pageshow', remeasure)

  // iets één keer laten gebeuren wanneer het in beeld komt
  function once(els, cb, opts) {
    if (!els.length) return
    if (!('IntersectionObserver' in window)) {
      els.forEach(cb)
      return
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          io.unobserve(e.target)
          cb(e.target)
        }
      })
    }, opts || { rootMargin: '0px 0px -12% 0px', threshold: 0.3 })
    els.forEach(function (el) {
      io.observe(el)
    })
    cleanups.push(function () {
      io.disconnect()
    })
  }

  // ---------- hoe breed is de naam? (zodat hij altijd precies past) ----------
  function measureMast() {
    var src = d.querySelector('.mast-big, .mh-big')
    if (!src) return
    var text = (src.textContent || '').trim()
    if (!text) return
    function probe(split) {
      var p = d.createElement('span')
      p.setAttribute('aria-hidden', 'true')
      p.style.cssText =
        'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;line-height:1;' +
        'font-family:var(--display);font-size:100px;font-weight:900;font-stretch:150%;letter-spacing:-0.01em'
      if (split) {
        text.split('').forEach(function (ch) {
          var s = d.createElement('span')
          s.style.display = 'inline-block'
          s.textContent = ch === ' ' ? ' ' : ch
          p.appendChild(s)
        })
      } else {
        p.textContent = text
      }
      d.body.appendChild(p)
      var k = p.getBoundingClientRect().width / 100
      p.remove()
      return k
    }
    var plain = probe(false)
    var split = probe(true)
    if (plain > 1) html.style.setProperty('--mk', plain.toFixed(4))
    if (split > 1) html.style.setProperty('--mk-l', split.toFixed(4))
  }

  // ---------- de naam op de kiosk ----------
  function masthead(root) {
    var mh = root.querySelector('[data-mh]')
    if (!mh) return
    var big = mh.querySelector('[data-elastic]')
    var letters = all('.l', big)
    if (!motion()) {
      mh.classList.add('is-in', 'is-live')
      return
    }
    var started = false
    function start() {
      if (started) return
      started = true
      requestAnimationFrame(function () {
        mh.classList.add('is-in')
        var t = setTimeout(function () {
          mh.classList.add('is-live')
        }, 1350 + letters.length * 60)
        cleanups.push(function () {
          clearTimeout(t)
        })
      })
    }
    ;(d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve()).then(start)
    var safety = setTimeout(start, 1400)
    cleanups.push(function () {
      clearTimeout(safety)
    })

    // je vinger (of muis) knijpt de letters samen
    var centers = []
    function measure() {
      centers = letters.map(function (l) {
        var r = l.getBoundingClientRect()
        return r.left + r.width / 2
      })
    }
    function squeeze(x) {
      if (!mh.classList.contains('is-live')) return
      if (!centers.length) measure()
      var w = big.getBoundingClientRect().width / Math.max(letters.length, 1)
      letters.forEach(function (l, i) {
        var dx = (x - centers[i]) / (w * 1.2)
        var s = 150 - 94 * Math.exp(-dx * dx)
        l.style.setProperty('--ws', s.toFixed(1) + '%')
      })
    }
    function release() {
      letters.forEach(function (l) {
        l.style.removeProperty('--ws')
      })
      centers = []
    }
    big.addEventListener('pointerdown', function (e) {
      measure()
      squeeze(e.clientX)
    })
    big.addEventListener('pointermove', function (e) {
      squeeze(e.clientX)
    })
    big.addEventListener('pointerleave', release)
    big.addEventListener('pointercancel', release)
    big.addEventListener('pointerup', function (e) {
      if (e.pointerType !== 'mouse') release()
    })
  }

  // ---------- kantelen van de telefoon laat de folie glanzen (waar dat mag) ----------
  var tilt = 0
  var tiltFns = []
  if ('DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    addEventListener('deviceorientation', function (e) {
      if (e.gamma == null || !motion()) return
      tilt = clamp(e.gamma / 35, -1, 1)
      tiltFns.forEach(function (fn) {
        fn()
      })
    })
  }

  // ---------- het rek met covers ----------
  function rack(root) {
    var track = root.querySelector('[data-rack]')
    if (!track) return null
    var items = all('.rack-item', track)
    if (!items.length) return null
    var links = items.map(function (it) {
      return it.firstElementChild
    })
    var covers = links.map(function (a) {
      return a.querySelector('.cv')
    })
    var centersX = []
    var step = 1
    var hover = -1
    // groot scherm met muis: geen draaiend rek, gewoon naast elkaar
    var flatMQ = matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)')
    function flat() {
      return flatMQ.matches
    }

    var btns = root.querySelector('.rack-btns')
    function measure() {
      centersX = items.map(function (it) {
        return it.offsetLeft + it.offsetWidth / 2
      })
      // knoppen alleen tonen als er iets te schuiven valt
      if (btns) btns.hidden = track.scrollWidth <= track.clientWidth + 2
      step = items.length > 1 ? centersX[1] - centersX[0] : items[0].offsetWidth
      if (!step) step = 1
    }

    var rafR = 0
    function frame() {
      rafR = 0
      var mid = track.scrollLeft + track.clientWidth / 2
      items.forEach(function (it, i) {
        var dd = (centersX[i] - mid) / step
        var a = Math.abs(dd)
        var c = clamp(dd, -1, 1)
        var link = links[i]
        if (flat()) {
          if (i !== hover) {
            link.style.removeProperty('--ry')
            link.style.removeProperty('--rx')
            link.style.removeProperty('--tz')
            link.style.removeProperty('--sc')
            if (covers[i]) covers[i].style.setProperty('--fx', (0.5 + tilt * 0.35).toFixed(3))
          }
          it.style.zIndex = ''
          it.classList.add('is-center')
          return
        }
        if (motion() && i !== hover) {
          link.style.setProperty('--ry', (-c * 42).toFixed(2) + 'deg')
          link.style.setProperty('--tz', (-Math.min(a, 2) * 70).toFixed(1) + 'px')
          link.style.setProperty('--sc', (1 - Math.min(a, 1) * 0.1).toFixed(3))
        }
        it.style.zIndex = String(100 - Math.round(a * 10))
        it.classList.toggle('is-center', a < 0.5)
        if (covers[i] && i !== hover) {
          covers[i].style.setProperty('--fx', clamp(0.5 - dd * 0.5 + tilt * 0.35, -0.6, 1.6).toFixed(3))
        }
      })
    }
    function update() {
      if (!rafR) rafR = requestAnimationFrame(frame)
    }

    track.addEventListener('scroll', update, { passive: true })
    if (flatMQ.addEventListener) flatMQ.addEventListener('change', update)
    tiltFns.push(update)
    cleanups.push(function () {
      tiltFns.splice(tiltFns.indexOf(update), 1)
    })
    measureFns.push(function () {
      measure()
      update()
    })
    measure()
    frame()

    function centerIndex() {
      var mid = track.scrollLeft + track.clientWidth / 2
      var best = 0
      var bestD = Infinity
      centersX.forEach(function (c, i) {
        var dist = Math.abs(c - mid)
        if (dist < bestD) {
          bestD = dist
          best = i
        }
      })
      return best
    }
    function goTo(i, smooth) {
      i = clamp(i, 0, items.length - 1)
      track.scrollTo({ left: centersX[i] - track.clientWidth / 2, behavior: smooth && motion() ? 'smooth' : 'auto' })
    }

    // tik op een cover die niet in het midden staat: eerst naar het midden schuiven
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        var mid = track.scrollLeft + track.clientWidth / 2
        if (!flat() && Math.abs(centersX[i] - mid) > step * 0.35) {
          e.preventDefault()
          e.stopPropagation()
          goTo(i, true)
        }
      })
      a.addEventListener('keyup', function (e) {
        if (e.key === 'Tab' && !flat()) goTo(i, true)
      })
    })
    var prev = root.querySelector('[data-rack-prev]')
    var next = root.querySelector('[data-rack-next]')
    if (prev)
      prev.addEventListener('click', function () {
        goTo(centerIndex() - 1, true)
      })
    if (next)
      next.addEventListener('click', function () {
        goTo(centerIndex() + 1, true)
      })

    // met de muis: de cover kantelt en de folie volgt je
    covers.forEach(function (cv, i) {
      if (!cv) return
      cv.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || !items[i].classList.contains('is-center') || !motion()) return
        hover = i
        var r = cv.getBoundingClientRect()
        var x = clamp((e.clientX - r.left) / r.width, 0, 1)
        var y = clamp((e.clientY - r.top) / r.height, 0, 1)
        cv.style.setProperty('--fx', x.toFixed(3))
        cv.style.setProperty('--fy', y.toFixed(3))
        links[i].style.setProperty('--ry', ((x - 0.5) * 16).toFixed(2) + 'deg')
        if (flat()) links[i].style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg')
      })
      cv.addEventListener('pointerleave', function () {
        hover = -1
        cv.style.removeProperty('--fy')
        links[i].style.removeProperty('--rx')
        links[i].style.removeProperty('--ry')
        update()
      })
    })

    return {
      center: function (slug) {
        var i = links.findIndex(function (a) {
          return a.getAttribute('data-slug') === slug
        })
        if (i < 0) return
        measure()
        track.scrollLeft = centersX[i] - track.clientWidth / 2
        frame()
      },
    }
  }

  // ---------- artikel: cover die openslaat, balk en leesvoortgang ----------
  function opener(root) {
    var op = root.querySelector('[data-opener]')
    if (!op) return
    var tb = root.querySelector('.tb')
    var cover = op.querySelector('.op-front .cv')
    var body = root.querySelector('.ft-body')
    var prog = root.querySelector('.prog')
    var top = 0
    var range = 1
    var bodyTop = 0
    var bodyH = 1
    var vh = innerHeight

    function measure() {
      vh = innerHeight
      top = op.getBoundingClientRect().top + scrollY
      range = Math.max(1, op.offsetHeight - vh)
      if (body) {
        var r = body.getBoundingClientRect()
        bodyTop = r.top + scrollY
        bodyH = Math.max(1, r.height)
      }
    }
    function frame() {
      var y = scrollY
      if (motion()) {
        var p = clamp((y - top) / (range * 0.8), 0, 1)
        var e = easeInOut(p)
        op.style.setProperty('--open', e.toFixed(4))
        op.classList.toggle('is-open', e > 0.15)
        // de folie glanst mee terwijl de cover opengaat
        if (cover) cover.style.setProperty('--fx', (0.35 + p * 1.1 + tilt * 0.35).toFixed(3))
      }
      if (tb) tb.classList.toggle('is-solid', !motion() || y > top + range + vh * 0.45 - 52)
      if (prog && body) prog.style.setProperty('--read', clamp((y + vh * 0.6 - bodyTop) / bodyH, 0, 1).toFixed(4))
    }
    measureFns.push(measure)
    frameFns.push(frame)
    measure()
    frame()

    var hint = root.querySelector('[data-open]')
    if (hint)
      hint.addEventListener('click', function (e) {
        e.preventDefault()
        scrollTo({ top: top + range * 0.8, behavior: motion() ? 'smooth' : 'auto' })
      })
  }

  // ---------- <Route>: de lijn loopt mee met je scroll ----------
  function routes(root) {
    all('[data-route]', root).forEach(function (fig) {
      var rail = fig.querySelector('.route-rail')
      var stops = all('.route-stop', fig)
      var offs = []
      var railTop = 0
      var railH = 1
      function measure() {
        var rr = rail.getBoundingClientRect()
        railTop = rr.top + scrollY
        railH = Math.max(1, rr.height)
        offs = stops.map(function (s) {
          var dot = s.querySelector('.route-dot').getBoundingClientRect()
          return dot.top + dot.height / 2 + scrollY - railTop
        })
      }
      function frame() {
        if (!motion()) return
        var p = clamp((scrollY + innerHeight * 0.62 - railTop) / railH, 0, 1)
        fig.style.setProperty('--p', p.toFixed(4))
        var fill = p * railH
        stops.forEach(function (s, i) {
          s.classList.toggle('is-on', offs[i] <= fill + 8)
        })
      }
      measureFns.push(measure)
      frameFns.push(frame)
      measure()
      frame()
    })
  }

  // ---------- <Bon>: afvinken ----------
  function bons(root) {
    if (!motion()) return
    all('[data-bon]', root).forEach(function (bon) {
      var items = all('.bon-item', bon)
      var count = bon.querySelector('[data-bon-count]')
      var done = 0
      if (count) count.textContent = '0'
      once(
        items,
        function (it) {
          it.classList.add('is-on')
          done++
          if (count) count.textContent = String(done)
        },
        { rootMargin: '0px 0px -16% 0px', threshold: 0.85 }
      )
    })
  }

  // ---------- <Getal>: doortellen ----------
  function stats(root) {
    if (!motion()) return
    once(
      all('[data-stat]', root),
      function (el) {
        el.classList.add('is-in')
      },
      { threshold: 0.55 }
    )
  }

  function init(pg) {
    var api = {}
    masthead(pg)
    api.rack = rack(pg)
    opener(pg)
    routes(pg)
    bons(pg)
    stats(pg)
    schedule()
    return api
  }

  // ---------- echte site: welke cover vliegt mee naar de volgende pagina? ----------
  var lastLink = null
  function openerState(scope) {
    var op = scope.querySelector('[data-opener]')
    return op ? parseFloat(op.style.getPropertyValue('--open') || '0') : 1
  }

  if (!SPA) {
    d.addEventListener(
      'click',
      function (e) {
        lastLink = (e.target.closest && e.target.closest('a')) || null
      },
      true
    )
    addEventListener('pageswap', function (e) {
      if (!e.viewTransition) return
      var opCover = d.querySelector('.pg--feature .op-front .cv')
      var linkCover = lastLink && lastLink.querySelector('.cv')
      var named = null
      if (opCover) opCover.style.viewTransitionName = 'none'
      if (linkCover && inView(linkCover)) {
        named = linkCover
      } else if (opCover && inView(opCover) && openerState(d) < 0.5) {
        var to = ''
        try {
          to = new URL(e.activation.entry.url).pathname
        } catch (_) {}
        if (to === '/' || to === '/blog' || to === '/blog/') named = opCover
      }
      if (named) named.style.viewTransitionName = 'cover'
      lastLink = null
    })
  }

  // ---------- preview: één bestand, pagina's wisselen via #week-1, #start, #nummers ----------
  function spa() {
    var app = d.getElementById('app')
    var tpls = {}
    all('template[data-route]').forEach(function (t) {
      tpls[t.getAttribute('data-route')] = t
    })
    var kioskY = 0
    var pendingLink = null

    // '#week-1' -> artikel, '#nummers' -> kiosk bij de covers, '' of '#start' -> kiosk
    function parse(hash) {
      var h = decodeURIComponent((hash || '').replace(/^#/, ''))
      if (!h || h === 'start') return { route: 'start', anchor: '' }
      if (h === 'nummers') return { route: 'start', anchor: 'nummers' }
      if (tpls[h]) return { route: h, anchor: '' }
      return null
    }

    function current() {
      var pg = app.firstElementChild
      return pg ? pg.getAttribute('data-slug') || 'start' : ''
    }

    function show(hash, link, first) {
      var r = parse(hash)
      if (!r) return
      var tpl = tpls[r.route] || tpls.start
      var leaving = app.firstElementChild
      var fromPage = leaving ? leaving.getAttribute('data-page') : ''
      var fromSlug = leaving ? leaving.getAttribute('data-slug') : ''

      // al op de kiosk en alleen naar de covers: gewoon scrollen
      if (!first && fromPage === 'kiosk' && r.route === 'start') {
        var target = r.anchor ? d.getElementById(r.anchor) : null
        if (target) target.scrollIntoView({ behavior: motion() ? 'smooth' : 'auto', block: 'start' })
        else scrollTo({ top: 0, behavior: motion() ? 'smooth' : 'auto' })
        return
      }
      if (fromPage === 'kiosk') kioskY = scrollY

      var out = null
      if (!first && motion() && d.startViewTransition) {
        var lc = link && link.querySelector('.cv')
        if (lc && inView(lc)) out = lc
        else if (fromPage === 'feature' && r.route === 'start' && !r.anchor) {
          var oc = leaving.querySelector('.op-front .cv')
          if (oc && inView(oc) && openerState(leaving) < 0.5) out = oc
        }
      }

      var incoming = null
      function swap() {
        if (out) out.style.viewTransitionName = ''
        teardown()
        app.replaceChildren(tpl.content.cloneNode(true))
        var pg = app.firstElementChild
        var isKiosk = pg.getAttribute('data-page') === 'kiosk'
        var y = 0
        if (isKiosk && r.anchor) {
          var t = d.getElementById(r.anchor)
          y = t ? t.getBoundingClientRect().top + scrollY - 12 : 0
        } else if (isKiosk && fromPage === 'feature' && (!link || link.classList.contains('tb-home'))) {
          y = kioskY
        }
        scrollTo(0, y)
        measureMast()
        var api = init(pg)
        if (out) {
          if (!isKiosk) incoming = pg.querySelector('.op-front .cv')
          else if (fromSlug && api.rack) {
            api.rack.center(fromSlug)
            incoming = pg.querySelector('.rack-link[data-slug="' + fromSlug + '"] .cv')
          }
          if (incoming) incoming.style.viewTransitionName = 'cover'
        }
      }

      if (out) {
        out.style.viewTransitionName = 'cover'
        var vt = d.startViewTransition(swap)
        vt.finished.finally(function () {
          if (incoming) incoming.style.viewTransitionName = ''
        })
      } else if (!first && motion() && d.startViewTransition) {
        d.startViewTransition(swap)
      } else {
        swap()
      }
    }

    d.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      var a = e.target.closest && e.target.closest('a[href]')
      if (!a) return
      var href = a.getAttribute('href') || ''
      if (href.charAt(0) !== '#' || href.length < 2) return
      e.preventDefault()
      var r = parse(href)
      if (r) {
        // naar een andere pagina (of naar de covers op de kiosk)
        if ((r.route === current() && !r.anchor) || href === location.hash) {
          show(href, a, false)
          return
        }
        pendingLink = a
        location.hash = href
        return
      }
      // gewoon een plek op dezelfde pagina
      var t = d.getElementById(decodeURIComponent(href.slice(1)))
      if (t) t.scrollIntoView({ behavior: motion() ? 'smooth' : 'auto', block: 'start' })
    })
    addEventListener('hashchange', function () {
      var l = pendingLink
      pendingLink = null
      if (parse(location.hash)) show(location.hash, l, false)
    })
    show(location.hash, null, true)
  }

  function boot() {
    html.classList.add('mag-ready')
    html.classList.add('js')
    measureMast()
    if (SPA) spa()
    else init(d.getElementById('pg') || d.body)
    if (d.fonts && d.fonts.ready) {
      d.fonts.ready.then(function () {
        measureMast()
        remeasure()
      })
    }
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot)
  else boot()
})()
