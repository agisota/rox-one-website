import React from 'react'
import { Helmet as HelmetUntyped } from 'react-helmet'
import { Link } from 'gatsby'

const Helmet = HelmetUntyped as unknown as React.ComponentType<any>

export function Logo({ className = '' }: { className?: string }): JSX.Element {
    return (
        <Link to="/" className={`group inline-flex items-center gap-2.5 ${className}`}>
            <span className="relative grid h-8 w-8 place-items-center rounded-md border border-border-bright bg-bg-elevated font-mono text-base font-bold text-accent transition-all duration-200 group-hover:border-accent/60 group-hover:shadow-glow-accent">
                R
                <span className="absolute -right-1 -bottom-1 h-2 w-2 rounded-full bg-accent shadow-glow-accent animate-glow" />
            </span>
            <span className="font-mono text-base font-semibold tracking-tight text-fg">
                ROX <span className="font-normal text-fg-muted">ONE</span>
            </span>
        </Link>
    )
}

function Header(): JSX.Element {
    return (
        <header className="sticky top-0 z-50 border-b border-border-subtle bg-bg/75 backdrop-blur-xl">
            <div className="container-page flex h-16 items-center justify-between gap-4">
                <Logo />
                <nav className="flex items-center gap-1 sm:gap-2 text-sm">
                    <a
                        href="#features"
                        className="hidden rounded-md px-3 py-2 text-fg-muted transition hover:text-fg sm:inline"
                    >
                        Возможности
                    </a>
                    <Link
                        to="/docs/"
                        className="hidden rounded-md px-3 py-2 text-fg-muted transition hover:text-fg sm:inline"
                    >
                        Документация
                    </Link>
                    <a
                        href="https://github.com/agisota/rox-one-terminal"
                        target="_blank"
                        rel="noreferrer"
                        className="hidden rounded-md px-3 py-2 text-fg-muted transition hover:text-fg sm:inline"
                    >
                        GitHub
                    </a>
                    <Link to="/download/" className="btn-primary py-2 px-4 text-sm">
                        Скачать <span aria-hidden>↓</span>
                    </Link>
                </nav>
            </div>
        </header>
    )
}

function Footer(): JSX.Element {
    return (
        <footer className="relative mt-32 border-t border-border-subtle">
            <div className="grid-bg-light pointer-events-none absolute inset-0 opacity-50" aria-hidden />
            <div className="container-page relative py-16">
                <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:col-span-2">
                        <Logo />
                        <p className="mt-4 max-w-sm text-sm text-fg-muted">
                            Десктоп-терминал для агент-нативной работы с LLM. Свои ключи, свои сессии, ноль вендор-лока.
                        </p>
                        <p className="mt-4 font-mono text-xs text-fg-subtle">
                            macOS · Apple Silicon · Apache 2.0
                        </p>
                    </div>
                    <div>
                        <p className="mb-4 font-mono text-eyebrow uppercase text-fg-subtle">Продукт</p>
                        <ul className="space-y-2.5 text-sm">
                            <li><Link to="/download/" className="text-fg-muted transition hover:text-fg">Скачать</Link></li>
                            <li><Link to="/docs/" className="text-fg-muted transition hover:text-fg">Документация</Link></li>
                            <li><a href="https://github.com/agisota/rox-one-terminal/releases" target="_blank" rel="noreferrer" className="text-fg-muted transition hover:text-fg">Релизы</a></li>
                        </ul>
                    </div>
                    <div>
                        <p className="mb-4 font-mono text-eyebrow uppercase text-fg-subtle">Открытый код</p>
                        <ul className="space-y-2.5 text-sm">
                            <li><a href="https://github.com/agisota/rox-one-terminal" target="_blank" rel="noreferrer" className="text-fg-muted transition hover:text-fg">GitHub</a></li>
                            <li><a href="https://github.com/agisota/rox-one-terminal/issues" target="_blank" rel="noreferrer" className="text-fg-muted transition hover:text-fg">Issues</a></li>
                            <li><a href="https://github.com/agisota/rox-one-terminal/blob/main/LICENSE" target="_blank" rel="noreferrer" className="text-fg-muted transition hover:text-fg">Apache 2.0</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-border-subtle pt-6 text-xs text-fg-subtle sm:flex-row sm:items-center">
                    <p>© 2026 ROX ONE</p>
                    <p className="font-mono">site: MIT · app: Apache 2.0</p>
                </div>
            </div>
        </footer>
    )
}

export default function Layout({
    title,
    description,
    children,
}: {
    title?: string
    description?: string
    children: React.ReactNode
}): JSX.Element {
    const fullTitle = title ? `${title} — ROX ONE` : 'ROX ONE — терминал для агентов и LLM'
    return (
        <>
            <Helmet htmlAttributes={{ lang: 'ru' }}>
                <title>{fullTitle}</title>
                {description && <meta name="description" content={description} />}
                <meta property="og:title" content={fullTitle} />
                {description && <meta property="og:description" content={description} />}
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="ROX ONE" />
                <meta name="twitter:card" content="summary_large_image" />
                <link rel="icon" type="image/svg+xml" href="/icon.svg" />
            </Helmet>
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
            </div>
        </>
    )
}
