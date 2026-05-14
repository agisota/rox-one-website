import React from 'react'
import { Link } from 'gatsby'
import { Helmet as HelmetUntyped } from 'react-helmet'

const Helmet = HelmetUntyped as unknown as React.ComponentType<any>

/**
 * 404 page — same atmospheric stack as splash, with a giant
 * font-extralight "404" instead of the wordmark, and a hairline-style
 * "back" link instead of the download CTA. Stays single-screen, no
 * scroll, no extra chrome.
 */
export default function NotFound(): JSX.Element {
    return (
        <>
            <Helmet htmlAttributes={{ lang: 'ru' }}>
                <title>404 — ROX.ONE</title>
                <meta name="theme-color" content="#08090C" />
                <meta name="robots" content="noindex" />
            </Helmet>

            <main className="fixed inset-0 grid place-items-center overflow-hidden">
                {/* Same atmospheric stack as the splash, dimmer */}
                <div aria-hidden className="atmo-base pointer-events-none absolute inset-0" />
                <div aria-hidden className="atmo-key-warm pointer-events-none absolute inset-0 opacity-60 animate-fade-in" />
                <div aria-hidden className="atmo-bloom pointer-events-none absolute inset-0 opacity-50 animate-fade-in [animation-delay:0.2s]" />
                <div aria-hidden className="atmo-shadow pointer-events-none absolute inset-0 animate-fade-in [animation-delay:0.4s]" />
                <div aria-hidden className="atmo-vignette pointer-events-none absolute inset-0" />
                <div aria-hidden className="atmo-grain pointer-events-none absolute inset-0" />

                <div className="relative flex flex-col items-center gap-16 px-6 sm:gap-24">
                    <p
                        className="select-none text-center font-extralight leading-[0.88] tracking-[-0.06em] text-[clamp(5rem,15vw,15rem)] text-fg/35 animate-fade-up [animation-delay:0.1s]"
                        aria-label="404 not found"
                    >
                        404
                    </p>

                    <Link
                        to="/"
                        className="dl-link animate-fade-up [animation-delay:0.5s]"
                        style={{ paddingLeft: 'calc(0.5rem + 0.32em)' }}
                    >
                        ← на главную
                    </Link>
                </div>
            </main>
        </>
    )
}
