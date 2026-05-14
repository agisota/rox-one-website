import React from 'react'
import { motion } from 'framer-motion'

export function TerminalWindow({
    title,
    accent = 'accent',
    className = '',
    children,
}: {
    title?: string
    accent?: 'accent' | 'coral' | 'violet' | 'amber'
    className?: string
    children: React.ReactNode
}): JSX.Element {
    const accentBar = {
        accent: 'after:bg-accent',
        coral: 'after:bg-coral',
        violet: 'after:bg-violet',
        amber: 'after:bg-amber',
    }[accent]
    return (
        <div className={`term relative overflow-hidden ${className}`}>
            <div className={`absolute top-0 left-0 h-px w-full after:absolute after:left-1/2 after:top-0 after:h-px after:w-1/3 after:-translate-x-1/2 after:opacity-70 ${accentBar}`} />
            <div className="term-bar">
                <div className="flex gap-1.5">
                    <span className="term-dot bg-dot-red" />
                    <span className="term-dot bg-dot-yellow" />
                    <span className="term-dot bg-dot-green" />
                </div>
                {title && (
                    <div className="ml-3 truncate font-mono text-xs text-fg-muted">
                        <span className="text-fg-subtle">●</span> {title}
                    </div>
                )}
                <div className="ml-auto flex gap-1">
                    <span className="kbd">⌘</span>
                    <span className="kbd">K</span>
                </div>
            </div>
            <div className="term-body">{children}</div>
        </div>
    )
}

export function Prompt({ children, user = '~' }: { children: React.ReactNode; user?: string }): JSX.Element {
    return (
        <div className="flex items-start gap-2 text-fg">
            <span className="select-none text-accent">{user} ›</span>
            <span>{children}</span>
        </div>
    )
}

export function AgentLine({
    label,
    color = 'accent',
    children,
}: {
    label: string
    color?: 'accent' | 'coral' | 'violet' | 'amber'
    children: React.ReactNode
}): JSX.Element {
    const c = { accent: 'text-accent', coral: 'text-coral', violet: 'text-violet', amber: 'text-amber' }[color]
    return (
        <div className="mt-2 flex items-start gap-2">
            <span className={`select-none font-semibold ${c}`}>{label}</span>
            <span className="text-fg-muted">{children}</span>
        </div>
    )
}

export function ToolCall({ name }: { name: string }): JSX.Element {
    return (
        <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="select-none rounded border border-coral/40 bg-coral/10 px-1.5 py-0.5 font-mono text-coral">
                tool
            </span>
            <span className="font-mono text-fg-muted">{name}</span>
        </div>
    )
}

/** Animated typing effect for terminal lines */
export function TypewriterLines({ lines, delay = 0.4 }: { lines: React.ReactNode[]; delay?: number }): JSX.Element {
    return (
        <>
            {lines.map((line, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: delay + i * 0.6, duration: 0.4, ease: 'easeOut' }}
                >
                    {line}
                </motion.div>
            ))}
        </>
    )
}
