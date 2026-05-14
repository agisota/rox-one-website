require('dotenv').config({ path: `.env.${process.env.NODE_ENV}.local` })
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

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
