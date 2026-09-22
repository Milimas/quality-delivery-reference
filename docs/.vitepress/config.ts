import { defineConfig } from 'vitepress';

export default defineConfig({
  base: '/quality-delivery-reference/',
  title: 'Quality Delivery Reference',
  description: 'Executable quality gates from development to production.',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Framework', link: '/framework/delivery-path' },
      { text: 'Get started', link: '/guide/getting-started' },
      { text: 'Production', link: '/production/requirements' }
    ],
    sidebar: [
      {
        text: 'Framework',
        items: [
          { text: 'Delivery path', link: '/framework/delivery-path' },
          { text: 'Verification matrix', link: '/framework/verification-matrix' },
          { text: 'Gate catalog', link: '/gates/catalog' }
        ]
      },
      {
        text: 'Implementation',
        items: [
          { text: 'Getting started', link: '/guide/getting-started' },
          { text: 'Local feedback', link: '/implementation/local-feedback' },
          { text: 'CI authority', link: '/implementation/ci' }
        ]
      },
      {
        text: 'Extend',
        items: [
          { text: 'Production requirements', link: '/production/requirements' },
          { text: 'Adopt in an existing repo', link: '/adoption/existing-repository' },
          { text: 'Why native hooks', link: '/decisions/native-git-hooks' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Milimas/quality-delivery-reference' }
    ],
    search: { provider: 'local' },
    footer: { message: 'Evidence before confidence.' }
  }
});
