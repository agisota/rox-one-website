/**
 * Keyboard handlers: info overlay (i/?), Escape close, Konami invert,
 * type-"rox" accent halo, Cmd-K command palette.
 *
 * Vanilla DOM. Uses `[hidden]` attribute for show/hide so screen readers
 * pick up state changes correctly via the role="dialog" + aria-modal.
 */

const KONAMI = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a',
] as const

const infoOverlay = document.getElementById('info-overlay')
const cmdkScrim = document.getElementById('cmdk-scrim')
const cmdkInput = document.getElementById('cmdk-input') as HTMLInputElement | null
const cmdkList = document.getElementById('cmdk-list') as HTMLUListElement | null

let konamiBuf: string[] = []
let typeBuf: string[] = []
let konamiTimer: ReturnType<typeof setTimeout> | null = null
let roxFlashTimer: ReturnType<typeof setTimeout> | null = null

function toggleInfo(open?: boolean) {
    if (!infoOverlay) return
    const wantOpen = typeof open === 'boolean' ? open : infoOverlay.hidden
    infoOverlay.hidden = !wantOpen
}

function togglePalette(open?: boolean) {
    if (!cmdkScrim || !cmdkInput || !cmdkList) return
    const wantOpen = typeof open === 'boolean' ? open : cmdkScrim.hidden
    cmdkScrim.hidden = !wantOpen
    if (wantOpen) {
        cmdkInput.value = ''
        renderCommands('')
        setTimeout(() => cmdkInput.focus(), 0)
    }
}

// ── Command palette ──────────────────────────────────────────────────────────
interface Command {
    id: string
    label: string
    hint?: string
    keywords: string
    action: () => void
}

const commands: Command[] = [
    {
        id: 'download',
        label: 'Скачать ROX.ONE',
        hint: 'macOS arm64 .dmg',
        keywords: 'download dmg mac install скачать',
        action: () => {
            window.location.href =
                'https://github.com/agisota/rox-one-terminal/releases/latest/download/ROX-ONE-arm64.dmg'
        },
    },
    {
        id: 'github',
        label: 'GitHub — rox-one-terminal',
        hint: 'product source',
        keywords: 'github source repo',
        action: () =>
            window.open('https://github.com/agisota/rox-one-terminal', '_blank', 'noopener'),
    },
    {
        id: 'changelog',
        label: 'Changelog',
        hint: 'release history',
        keywords: 'changelog releases versions',
        action: () => (window.location.href = '/changelog/'),
    },
    {
        id: 'feed',
        label: 'RSS feed',
        hint: '/feed.xml',
        keywords: 'rss atom feed subscribe',
        action: () => (window.location.href = '/feed.xml'),
    },
    {
        id: 'info',
        label: 'About this site',
        hint: 'info overlay',
        keywords: 'info about',
        action: () => {
            togglePalette(false)
            toggleInfo(true)
        },
    },
    {
        id: 'humans',
        label: 'humans.txt',
        hint: 'credits',
        keywords: 'humans credits team',
        action: () => (window.location.href = '/humans.txt'),
    },
]

let activeIdx = 0
let filtered: Command[] = commands.slice()

function renderCommands(query: string) {
    if (!cmdkList) return
    const q = query.trim().toLowerCase()
    filtered = q
        ? commands.filter(
              (c) =>
                  c.label.toLowerCase().includes(q) ||
                  c.keywords.toLowerCase().includes(q),
          )
        : commands.slice()
    activeIdx = 0

    // Safe DOM construction — textContent, not innerHTML. Labels and hints
    // are static strings from the commands[] table above; even so, going
    // through createElement keeps the pattern injection-proof against
    // future maintainers who might wire user input in.
    while (cmdkList.firstChild) cmdkList.removeChild(cmdkList.firstChild)
    for (let i = 0; i < filtered.length; i++) {
        const c = filtered[i]
        const li = document.createElement('li')
        li.className = i === activeIdx ? 'cmdk-row cmdk-row-active' : 'cmdk-row'
        li.setAttribute('role', 'option')
        li.dataset.idx = String(i)

        const label = document.createElement('span')
        label.className = 'cmdk-label'
        label.textContent = c.label
        li.appendChild(label)

        if (c.hint) {
            const hint = document.createElement('span')
            hint.className = 'cmdk-hint'
            hint.textContent = c.hint
            li.appendChild(hint)
        }

        li.addEventListener('click', () => {
            togglePalette(false)
            c.action()
        })
        cmdkList.appendChild(li)
    }
}

function moveActive(delta: number) {
    if (!cmdkList || filtered.length === 0) return
    activeIdx = (activeIdx + delta + filtered.length) % filtered.length
    cmdkList.querySelectorAll('.cmdk-row').forEach((el, i) => {
        el.classList.toggle('cmdk-row-active', i === activeIdx)
    })
}

cmdkInput?.addEventListener('input', () => renderCommands(cmdkInput.value))
cmdkInput?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
        e.preventDefault()
        moveActive(1)
    } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        moveActive(-1)
    } else if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = filtered[activeIdx]
        if (cmd) {
            togglePalette(false)
            cmd.action()
        }
    } else if (e.key === 'Escape') {
        togglePalette(false)
    }
})

cmdkScrim?.addEventListener('click', (e) => {
    if (e.target === cmdkScrim) togglePalette(false)
})

// ── Info overlay click-outside-to-close ─────────────────────────────────────
infoOverlay?.addEventListener('click', (e) => {
    if (e.target === infoOverlay) toggleInfo(false)
})

// ── Document-level keyboard ─────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement | null
    const inField =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
    if (inField) return

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        togglePalette()
        return
    }
    if (e.key === 'i' || e.key === 'I' || e.key === '?') {
        toggleInfo()
        return
    }
    if (e.key === 'Escape') {
        toggleInfo(false)
        togglePalette(false)
    }

    const k = e.key
    konamiBuf.push(k)
    if (konamiBuf.length > KONAMI.length) konamiBuf.shift()
    const matches =
        konamiBuf.length === KONAMI.length &&
        konamiBuf.every(
            (x, i) => x === KONAMI[i] || x.toLowerCase() === KONAMI[i].toLowerCase(),
        )
    if (matches) {
        konamiBuf = []
        document.documentElement.classList.add('konami-invert')
        if (konamiTimer) clearTimeout(konamiTimer)
        konamiTimer = setTimeout(
            () => document.documentElement.classList.remove('konami-invert'),
            5000,
        )
    }

    if (k.length === 1 && /^[a-zа-я]$/i.test(k)) {
        typeBuf.push(k.toLowerCase())
        if (typeBuf.length > 3) typeBuf.shift()
        if (typeBuf.join('') === 'rox') {
            typeBuf = []
            document.documentElement.classList.add('rox-flash')
            if (roxFlashTimer) clearTimeout(roxFlashTimer)
            roxFlashTimer = setTimeout(
                () => document.documentElement.classList.remove('rox-flash'),
                1400,
            )
        }
    }
})
