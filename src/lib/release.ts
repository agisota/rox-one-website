/**
 * Build-time GitHub Releases fetch. Replaces Gatsby's onPreBootstrap +
 * .cache/rox-release.json shuffle with a single top-level-await module
 * that imports cleanly anywhere — pages, endpoints, OG image generator.
 *
 * Network failures fall back to hardcoded defaults so a transient GitHub
 * outage cannot kill a deploy.
 */

export interface ReleaseSummary {
    version: string
    stars: number
    releases: ReleaseEntry[]
}

export interface ReleaseEntry {
    id: number
    tag: string
    name: string
    publishedAt: string
    bodyMarkdown: string
    bodyText: string
    htmlUrl: string
}

const FALLBACK_VERSION = 'v0.9.2'

function stripMarkdown(md: string, limit = 320): string {
    return md
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^[#>*\-+]\s+/gm, '')
        .replace(/[*_~]+/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, limit)
}

async function safeJson<T>(url: string): Promise<T | null> {
    try {
        const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
        return res.ok ? ((await res.json()) as T) : null
    } catch {
        return null
    }
}

let cached: ReleaseSummary | null = null

export async function getReleaseSummary(): Promise<ReleaseSummary> {
    if (cached) return cached
    if (!import.meta.env.PROD) {
        // Dev mode — don't hammer GitHub; serve fallback data.
        cached = { version: FALLBACK_VERSION, stars: 0, releases: [] }
        return cached
    }

    interface RawRelease {
        id: number
        tag_name?: string
        name?: string | null
        published_at?: string
        body?: string | null
        html_url?: string
    }
    interface RawRepo {
        stargazers_count?: number
    }

    const [latest, repo, list] = await Promise.all([
        safeJson<RawRelease>(
            'https://api.github.com/repos/agisota/rox-one-terminal/releases/latest',
        ),
        safeJson<RawRepo>('https://api.github.com/repos/agisota/rox-one-terminal'),
        safeJson<RawRelease[]>(
            'https://api.github.com/repos/agisota/rox-one-terminal/releases?per_page=10',
        ),
    ])

    const releases = (list ?? []).map((r): ReleaseEntry => {
        const body = r.body ?? ''
        return {
            id: r.id,
            tag: r.tag_name ?? '',
            name: r.name?.trim() || r.tag_name || '',
            publishedAt: r.published_at ?? '',
            bodyMarkdown: body,
            bodyText: stripMarkdown(body),
            htmlUrl: r.html_url ?? '',
        }
    })

    cached = {
        version: latest?.tag_name ?? FALLBACK_VERSION,
        stars: typeof repo?.stargazers_count === 'number' ? repo.stargazers_count : 0,
        releases,
    }
    return cached
}

/**
 * Download URLs for each platform's binary. GitHub Releases'
 * `…/releases/latest/download/<asset-name>` always redirects to the most
 * recent release's asset of that name, so these don't need updating per
 * release. Linux and Windows binaries 404 until product ships them
 * (coordinated separately in `agisota/rox-one-terminal`).
 */
export const URLS = {
    mac: 'https://github.com/agisota/rox-one-terminal/releases/latest/download/ROX-ONE-arm64.dmg',
    linux: 'https://github.com/agisota/rox-one-terminal/releases/latest/download/ROX-ONE-linux-x64.AppImage',
    windows: 'https://github.com/agisota/rox-one-terminal/releases/latest/download/ROX-ONE-win-x64.exe',
} as const

/**
 * Top-level GitHub releases page — used by JSON-LD downloadUrl since
 * the product is multi-platform; pointing at one binary would mislead
 * structured-data consumers.
 */
export const RELEASES_PAGE = 'https://github.com/agisota/rox-one-terminal/releases/latest' as const
