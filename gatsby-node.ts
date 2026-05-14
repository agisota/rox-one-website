import type { GatsbyNode } from 'gatsby'
import * as fs from 'fs'
import * as path from 'path'

const RELEASES_API = 'https://api.github.com/repos/agisota/rox-one-terminal/releases/latest'
const RELEASE_CACHE = path.join(__dirname, '.cache/rox-release.json')

interface ReleaseSnapshot {
    tag_name: string
    name: string
    published_at: string
    arm64_dmg_url: string
    arm64_dmg_size: number
    arm64_zip_url: string
    arm64_zip_size: number
}

const FALLBACK: ReleaseSnapshot = {
    tag_name: 'v0.9.2',
    name: 'ROX ONE Terminal 0.9.2',
    published_at: '2026-05-13T18:42:09Z',
    arm64_dmg_url: 'https://github.com/agisota/rox-one-terminal/releases/latest/download/ROX-ONE-arm64.dmg',
    arm64_dmg_size: 320120298,
    arm64_zip_url: 'https://github.com/agisota/rox-one-terminal/releases/latest/download/ROX-ONE-arm64.zip',
    arm64_zip_size: 309366025,
}

export const onPreBootstrap: GatsbyNode['onPreBootstrap'] = async () => {
    try {
        const res = await fetch(RELEASES_API, { headers: { 'User-Agent': 'rox-one-website-build' } })
        if (!res.ok) return
        const release: any = await res.json()
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
        fs.mkdirSync(path.dirname(RELEASE_CACHE), { recursive: true })
        fs.writeFileSync(RELEASE_CACHE, JSON.stringify(snapshot, null, 2))
    } catch {}
}

export const sourceNodes: GatsbyNode['sourceNodes'] = async ({ actions, createNodeId, createContentDigest }) => {
    let data: ReleaseSnapshot
    try { data = JSON.parse(fs.readFileSync(RELEASE_CACHE, 'utf8')) } catch { data = FALLBACK }
    actions.createNode({
        ...data,
        id: createNodeId('rox-release-latest'),
        internal: { type: 'RoxRelease', contentDigest: createContentDigest(data) },
    })
}
