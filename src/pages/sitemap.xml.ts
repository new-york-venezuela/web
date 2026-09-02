import productosRaw from '../data/productos.json';
import { getCollection } from 'astro:content';

export async function GET() {
  const baseUrl = 'https://www.alimentosnewyork.com';
  const productosData = productosRaw.productos;

  const staticRoutes = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/catalogo/', priority: '0.9', changefreq: 'weekly' },
    { url: '/blog/', priority: '0.8', changefreq: 'daily' },
    { url: '/sobre-nosotros/', priority: '0.7', changefreq: 'monthly' },
    { url: '/contacto/', priority: '0.8', changefreq: 'monthly' },
    { url: '/solicitar-llamada/', priority: '0.7', changefreq: 'monthly' },
  ];

  const productRoutes = productosData.map((producto) => ({
    url: `/productos/${producto.id}/`,
    priority: '0.8',
    changefreq: 'monthly',
    lastmod: undefined as string | undefined,
  }));

  const blogPosts = await getCollection('blog', ({ data }) => !data.draft);
  const blogRoutes = blogPosts.map((post) => ({
    url: `/blog/${post.id}/`,
    priority: '0.7',
    changefreq: 'monthly',
    lastmod: post.data.pubDate.toISOString().split('T')[0],
  }));

  const allRoutes = [...staticRoutes, ...productRoutes, ...blogRoutes];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route.url}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>${
      'lastmod' in route && route.lastmod
        ? `\n    <lastmod>${route.lastmod}</lastmod>`
        : ''
    }
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
