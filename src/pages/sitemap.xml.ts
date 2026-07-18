import productosData from '../data/productos.json';

export async function GET() {
  const baseUrl = 'https://alimentosnewyork.com';

  // Static routes
  const staticRoutes = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/catalogo/', priority: '0.9', changefreq: 'weekly' },
    { url: '/sobre-nosotros/', priority: '0.7', changefreq: 'monthly' },
    { url: '/contacto/', priority: '0.8', changefreq: 'monthly' },
    { url: '/solicitar-llamada/', priority: '0.7', changefreq: 'monthly' }
  ];

  // Dynamic product routes from JSON
  const productRoutes = productosData.productos.map(producto => ({
    url: `/productos/${producto.id}/`,
    priority: '0.8',
    changefreq: 'monthly'
  }));

  const allRoutes = [...staticRoutes, ...productRoutes];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes.map(route => `
  <url>
    <loc>${baseUrl}${route.url}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
  `).join('')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' }
  });
}
