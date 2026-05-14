import type { GatsbyNode } from 'gatsby'
import * as fs from 'fs'
import * as path from 'path'

const REPO = 'agisota/rox-one-terminal'
const LATEST_API = `https://api.github.com/repos/${REPO}/releases/latest`
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases?per_page=10`
const REPO_API = `https://api.github.com/repos/${REPO}`

const RELEASE_CACHE = path.join(__dirname, '.cache/rox-release.json')
const RELEASES_CACHE = path.join(__dirname, '.cache/rox-releases.json')
const REPO_CACHE = path.join(__dirname, '.cache/rox-repo.json')

interface ReleaseSnapshot {
    tag_name: string
    name: string
    published_at: string
    arm64_dmg_url: string
    arm64_dmg_size: number
    arm64_zip_url: string
    arm64_zip_size: number
}

interface ReleaseEntry {
    tag_name: string
    name: string
    published_at: string
    html_url: string
    body: string
}

const FALLBACK: ReleaseSnapshot = {
    tag_name: 'v0.9.2',
    name: 'ROX ONE Terminal 0.9.2',
    published_at: '2026-05-13T18:42:09Z',
    arm64_dmg_url: `https://github.com/${REPO}/releases/latest/download/ROX-ONE-arm64.dmg`,
    arm64_dmg_size: 320120298,
    arm64_zip_url: `https://github.com/${REPO}/releases/latest/download/ROX-ONE-arm64.zip`,
    arm64_zip_size: 309366025,
}

function stripMarkdown(s: string, limit = 320): string {
    if (!s) return ''
    const cleaned = s
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        .replace(/^#+\s+/gm, '')
        .replace(/^[*+-]\s+/gm, '· ')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    return cleaned.length > limit ? cleaned.slice(0, limit).trimEnd() + '…' : cleaned
}

function escapeXml(s: string): string {
    return (s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

async function fetchJson(url: string): Promise<any | null> {
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'rox-one-website-build' } })
        return res.ok ? await res.json() : null
    } catch {
        return null
    }
}

export const onPreBootstrap: GatsbyNode['onPreBootstrap'] = async () => {
    fs.mkdirSync(path.dirname(RELEASE_CACHE), { recursive: true })

    // Latest release snapshot for download links.
    const release = await fetchJson(LATEST_API)
    if (release) {
        const dmg = release.assets?.find((a: any) => a.name === 'ROX-ONE-arm64.dmg')
        const zip = release.assets?.find((a: any) => a.name === 'ROX-ONE-arm64.zip')
        const snapshot: ReleaseSnapshot = {
            tag_name: release.tag_name,
            name: release.name,
            published_at: release.published_at,
            arm64_dmg_url: dmg?.browser_download_url ?? FALLBACK.arm64_dmg_url,
            arm64_dmg_size: dmg?.size ?? FALLBACK.arm64_dmg_size,
            arm64_zip_url: zip?.browser_download_url ?? FALLBACK.arm64_zip_url,
            arm64_zip_size: zip?.size ?? FALLBACK.arm64_zip_size,
        }
        fs.writeFileSync(RELEASE_CACHE, JSON.stringify(snapshot, null, 2))
    }

    // Releases list for /changelog and RSS.
    const releases = await fetchJson(RELEASES_API)
    if (Array.isArray(releases)) {
        const list: ReleaseEntry[] = releases.map((r: any) => ({
            tag_name: r.tag_name,
            name: r.name || r.tag_name,
            published_at: r.published_at,
            html_url: r.html_url,
            body: stripMarkdown(r.body || ''),
        }))
        fs.writeFileSync(RELEASES_CACHE, JSON.stringify(list, null, 2))
    }

    // Repo metadata for the star count.
    const repo = await fetchJson(REPO_API)
    if (repo && typeof repo.stargazers_count === 'number') {
        fs.writeFileSync(
            REPO_CACHE,
            JSON.stringify(
                {
                    stars: repo.stargazers_count,
                    forks: repo.forks_count ?? 0,
                    description: repo.description ?? '',
                    html_url: repo.html_url,
                },
                null,
                2,
            ),
        )
    }
}

export const sourceNodes: GatsbyNode['sourceNodes'] = async ({
    actions,
    createNodeId,
    createContentDigest,
}) => {
    let latest: ReleaseSnapshot
    try {
        latest = JSON.parse(fs.readFileSync(RELEASE_CACHE, 'utf8'))
    } catch {
        latest = FALLBACK
    }
    actions.createNode({
        ...latest,
        id: createNodeId('rox-release-latest'),
        internal: { type: 'RoxRelease', contentDigest: createContentDigest(latest) },
    })

    let list: ReleaseEntry[] = []
    try {
        list = JSON.parse(fs.readFileSync(RELEASES_CACHE, 'utf8'))
    } catch {
        list = [
            {
                tag_name: latest.tag_name,
                name: latest.name,
                published_at: latest.published_at,
                html_url: `https://github.com/${REPO}/releases/tag/${latest.tag_name}`,
                body: '',
            },
        ]
    }
    list.forEach((r, i) => {
        actions.createNode({
            ...r,
            order: i,
            id: createNodeId(`rox-release-entry-${r.tag_name}`),
            internal: {
                type: 'RoxReleaseEntry',
                contentDigest: createContentDigest({ ...r, order: i }),
            },
        })
    })
}

/**
 * Generate /feed.xml after the build completes. Reads the cached releases
 * list, emits a standard RSS 2.0 channel. Devs can subscribe in any RSS
 * reader and get a notification when a new ROX release lands.
 */
export const onPostBuild: GatsbyNode['onPostBuild'] = async () => {
    let list: ReleaseEntry[] = []
    try {
        list = JSON.parse(fs.readFileSync(RELEASES_CACHE, 'utf8'))
    } catch {
        return
    }

    const items = list
        .slice(0, 20)
        .map(
            (r) => `    <item>
      <title>${escapeXml(r.name)}</title>
      <link>${escapeXml(r.html_url)}</link>
      <guid isPermaLink="false">rox-${escapeXml(r.tag_name)}</guid>
      <pubDate>${new Date(r.published_at).toUTCString()}</pubDate>
      <description><![CDATA[${r.body}]]></description>
    </item>`,
        )
        .join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ROX.ONE — releases</title>
    <link>https://rox.one</link>
    <description>Release feed for ROX.ONE Terminal — agent-native terminal for the most powerful LLMs.</description>
    <language>en</language>
    <atom:link href="https://rox.one/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`
    fs.writeFileSync(path.join(__dirname, 'public', 'feed.xml'), xml)
}
