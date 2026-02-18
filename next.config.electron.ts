/**
 * Next.js configuration for Electron
 * More information: https://nextjs.org/docs/api-reference/next.config.js/introduction
 */

const { withElectron } = require('next-electron');

module.exports = withElectron({
  reactStrictMode: true,
  images: {
    domains: ['example.com'], // Add your domains here
  },
});
