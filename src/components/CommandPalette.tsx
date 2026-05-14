import React, { useEffect, useMemo, useRef, useState } from 'react'

interface Command {
    id: string
    label: string
    hint?: string
    keywords?: string
    action: () => void
}

interface Props {
    open: boolean
    onClose: () => void
    commands: Command[]
}

/**
 * Cmd-K / Ctrl-K command palette. Fuzzy substring filter, keyboard nav
 * (↑/↓, Enter, Esc), focus trap, click-outside to close.
 *
 * Why no fuzzy-search lib: substring match against label + keywords is
 * good enough for <20 commands. A real fuzzy ranker would add 4-8KB and
 * marginal UX gain. If the command list ever grows past ~50, swap for fzf.
 */
export default function CommandPalette({ open, onClose, commands }: Props): JSX.Element | null {
    const [query, setQuery] = useState('')
    const [active, setActive] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)

    const filtered = useMemo(() => {
        if (!query.trim()) return commands
        const q = query.toLowerCase().trim()
        return commands.filter((c) => {
            const haystack = (c.label + ' ' + (c.keywords ?? '')).toLowerCase()
            return q.split(/\s+/).every((token) => haystack.includes(token))
        })
    }, [query, commands])

    useEffect(() => {
        if (!open) return
        setQuery('')
        setActive(0)
        // Defer to next frame so the input is mounted before focus call.
        requestAnimationFrame(() => inputRef.current?.focus())
    }, [open])

    useEffect(() => {
        if (active >= filtered.length) setActive(Math.max(0, filtered.length - 1))
    }, [filtered.length, active])

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
                return
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((i) => Math.min(filtered.length - 1, i + 1))
                return
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((i) => Math.max(0, i - 1))
                return
            }
            if (e.key === 'Enter') {
                e.preventDefault()
                const cmd = filtered[active]
                if (cmd) {
                    onClose()
                    cmd.action()
                }
            }
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open, filtered, active, onClose])

    // Auto-scroll active row into view
    useEffect(() => {
        if (!listRef.current) return
        const row = listRef.current.querySelector<HTMLElement>(`[data-cmd-idx="${active}"]`)
        row?.scrollIntoView({ block: 'nearest' })
    }, [active])

    if (!open) return null

    return (
        <div
            className="cmdk-scrim"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
        >
            <div className="cmdk-panel" onClick={(e) => e.stopPropagation()}>
                <div className="cmdk-input-row">
                    <span aria-hidden className="cmdk-prompt">
                        /
                    </span>
                    <input
                        ref={inputRef}
                        className="cmdk-input"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setActive(0)
                        }}
                        placeholder="type a command…"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                    />
                    <kbd className="cmdk-kbd">esc</kbd>
                </div>
                <ul ref={listRef} className="cmdk-list" role="listbox">
                    {filtered.length === 0 && <li className="cmdk-empty">nothing matches</li>}
                    {filtered.map((cmd, i) => (
                        <li
                            key={cmd.id}
                            data-cmd-idx={i}
                            role="option"
                            aria-selected={i === active}
                            className={`cmdk-item${i === active ? ' is-active' : ''}`}
                            onMouseEnter={() => setActive(i)}
                            onClick={() => {
                                onClose()
                                cmd.action()
                            }}
                        >
                            <span className="cmdk-label">{cmd.label}</span>
                            {cmd.hint && <span className="cmdk-hint">{cmd.hint}</span>}
                        </li>
                    ))}
                </ul>
                <div className="cmdk-footer">
                    <span>
                        <kbd className="cmdk-kbd">↑</kbd> <kbd className="cmdk-kbd">↓</kbd> navigate
                    </span>
                    <span>
                        <kbd className="cmdk-kbd">↵</kbd> run
                    </span>
                </div>
            </div>
        </div>
    )
}
