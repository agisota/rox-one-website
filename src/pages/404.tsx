import React from 'react'
import { Link } from 'gatsby'
import { Helmet as HelmetUntyped } from 'react-helmet'

const Helmet = HelmetUntyped as unknown as React.ComponentType<any>

export default function NotFound(): JSX.Element {
    return (
        <>
            <Helmet htmlAttributes={{ lang: 'ru' }}>
                <title>ROX.ONE — 404</title>
                <meta name="theme-color" content="#070709" />
            </Helmet>

            <main className="fixed inset-0 grid place-items-center overflow-hidden bg-bg">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-80"
                    style={{
                        background:
                            'radial-gradient(ellipse 50% 35% at 50% 40%, rgba(255,255,255,0.04), transparent 75%)',
                    }}
                />

                <div className="relative flex flex-col items-center gap-16 px-6 sm:gap-20">
                    <p className="select-none text-center font-extralight leading-[0.9] tracking-[-0.05em] text-[clamp(4rem,12vw,12rem)] text-fg/30 animate-fade-up [animation-delay:0.05s]">
                        404
                    </p>

                    <Link
                        to="/"
                        className="
                            group relative inline-flex items-center gap-3
                            rounded-2xl bg-fg px-9 py-4
                            text-[15px] font-medium text-bg
                            shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset,0_30px_60px_-25px_rgba(0,0,0,0.7)]
                            transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                            hover:gap-5 hover:-translate-y-1
                            hover:shadow-[0_1px_0_0_rgba(255,255,255,0.8)_inset,0_40px_80px_-20px_rgba(255,255,255,0.3)]
                            animate-fade-up [animation-delay:0.4s]
                        "
                    >
                        <span
                            aria-hidden
                            className="text-bg/40 transition-all duration-500 group-hover:text-bg group-hover:-translate-x-1"
                        >
                            ←
                        </span>
                        ROX.ONE
                    </Link>
                </div>
            </main>
        </>
    )
}
