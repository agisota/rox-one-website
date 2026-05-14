import React from 'react'
import { Link, graphql } from 'gatsby'
import { Helmet as HelmetUntyped } from 'react-helmet'

const Helmet = HelmetUntyped as unknown as React.ComponentType<any>

interface ReleaseNode {
    tag_name: string
    name: string
    published_at: string
    html_url: string
    body: string
}

interface PageData {
    allRoxReleaseEntry: { nodes: ReleaseNode[] }
}

function formatDate(iso: string): string {
    try {
        const d = new Date(iso)
        // 13 May 2026
        return d.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    } catch {
        return iso.slice(0, 10)
    }
}

export default function Changelog({ data }: { data: PageData }): JSX.Element {
    const releases = data.allRoxReleaseEntry.nodes

    return (
        <>
            <Helmet htmlAttributes={{ lang: 'ru' }}>
                <title>Changelog — ROX.ONE</title>
                <meta name="theme-color" content="#08090C" />
                <meta name="description" content="Release history for ROX.ONE Terminal." />
                <meta name="robots" content="index, follow" />
                <link rel="icon" type="image/svg+xml" href="/icon.svg" />
            </Helmet>

            <a href="#changelog-list" className="skip-link">
                Skip to content
            </a>

            <div className="changelog-page">
                {/* Atmosphere — dimmer, no aurora, no ground shadow */}
                <div aria-hidden className="atmo-base pointer-events-none fixed inset-0" />
                <div aria-hidden className="atmo-key-warm pointer-events-none fixed inset-0 opacity-60" />
                <div aria-hidden className="atmo-bloom pointer-events-none fixed inset-0 opacity-40" />
                <div aria-hidden className="atmo-vignette pointer-events-none fixed inset-0" />
                <div aria-hidden className="atmo-grain pointer-events-none fixed inset-0" />

                <header className="changelog-header">
                    <Link to="/" className="changelog-back" aria-label="Back to ROX.ONE">
                        <span aria-hidden>←</span> ROXONE
                    </Link>
                    <span className="changelog-title">changelog</span>
                </header>

                <ol id="changelog-list" className="changelog-list">
                    {releases.length === 0 && (
                        <li className="changelog-empty">
                            no releases yet. check{' '}
                            <a
                                href="https://github.com/agisota/rox-one-terminal/releases"
                                target="_blank"
                                rel="noreferrer"
                            >
                                GitHub releases
                            </a>
                        </li>
                    )}
                    {releases.map((r) => (
                        <li key={r.tag_name} className="changelog-entry">
                            <div className="changelog-meta">
                                <span className="changelog-version">{r.tag_name}</span>
                                <time
                                    className="changelog-date"
                                    dateTime={r.published_at}
                                >
                                    {formatDate(r.published_at)}
                                </time>
                            </div>
                            <h2 className="changelog-name">{r.name}</h2>
                            {r.body && <p className="changelog-body">{r.body}</p>}
                            <a
                                href={r.html_url}
                                target="_blank"
                                rel="noreferrer"
                                className="changelog-link"
                            >
                                view on github <span aria-hidden>↗</span>
                            </a>
                        </li>
                    ))}
                </ol>
            </div>
        </>
    )
}

export const query = graphql`
    query {
        allRoxReleaseEntry(sort: { fields: published_at, order: DESC }) {
            nodes {
                tag_name
                name
                published_at
                html_url
                body
            }
        }
    }
`
