import React from 'react'
import { Link } from 'gatsby'
import { Helmet as HelmetUntyped } from 'react-helmet'

const Helmet = HelmetUntyped as unknown as React.ComponentType<any>

export default function NotFoundEn(): JSX.Element {
    return (
        <>
            <Helmet htmlAttributes={{ lang: 'en' }} bodyAttributes={{ class: 'splash-locked' }}>
                <title>404 — ROX.ONE</title>
                <meta name="theme-color" content="#08090C" />
                <meta name="robots" content="noindex" />
                <link rel="alternate" hrefLang="ru" href="https://rox.one/" />
                <link rel="alternate" hrefLang="en" href="https://rox.one/en/" />
            </Helmet>
            <main className="fixed inset-0 grid place-items-center overflow-hidden">
                <div aria-hidden className="atmo-base pointer-events-none absolute inset-0" />
                <div aria-hidden className="atmo-key-cool pointer-events-none absolute inset-0" />
                <div aria-hidden className="atmo-vignette pointer-events-none absolute inset-0" />
                <div className="relative flex flex-col items-center gap-10 px-6 text-center">
                    <h1 className="select-none text-[clamp(4rem,14vw,12rem)] leading-none tracking-[-0.05em] text-fg/90">
                        404
                    </h1>
                    <p className="max-w-md text-sm text-fg-muted">
                        the page you were looking for didn't survive the agent loop.
                    </p>
                    <Link to="/en/" className="dl-link">
                        ← back home
                    </Link>
                </div>
            </main>
        </>
    )
}
