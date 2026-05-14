require('dotenv').config({ path: `.env.${process.env.NODE_ENV}.local` })
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

const fs = require('fs')
const path = require('path')

// Pull the release tag baked by the previous build's onPreBootstrap (or fall
// back to a hardcoded version if no cache exists yet). This way JSON-LD,
// meta tags, and any siteMetadata consumer get the version at build time.
let buildTimeVersion = 'v0.9.2'
try {
    const cache = JSON.parse(
        fs.readFileSync(path.join(__dirname, '.cache', 'rox-release.json'), 'utf8'),
    )
    if (cache.tag_name) buildTimeVersion = cache.tag_name
} catch {
    /* first build — fall back to literal */
}

module.exports = {
    flags: { DEV_SSR: false },
    siteMetadata: {
        title: 'ROX.ONE',
        titleTemplate: '%s — ROX.ONE',
        description:
            'Agent-native terminal for the most powerful LLMs. Anthropic, OpenAI, Google, GitHub Copilot — your keys, your machine.',
        url: 'https://rox.one',
        image: '/og/default.png',
        twitterUsername: '@rox_one',
        siteUrl: 'https://rox.one',
        version: buildTimeVersion,
    },
    trailingSlash: 'always',
    plugins: [
        'gatsby-plugin-react-helmet',
        'gatsby-plugin-postcss',
        {
            resolve: 'gatsby-plugin-sitemap',
            options: { excludes: [] },
        },
        {
            resolve: 'gatsby-plugin-react-svg',
            options: { rule: { include: /svgs/ } },
        },
    ],
}
