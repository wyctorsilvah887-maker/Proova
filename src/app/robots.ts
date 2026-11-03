import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dash', '/admin', '/widgetconfig', '/ppeditor', '/private'],
    },
    sitemap: 'https://useproova.online/sitemap.xml',
  }
}
