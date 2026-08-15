const fs = require('fs');
const path = require('path');

const domain = 'https://r4realty.in';
const pages = ['/', '/projects', '/blog'];

const projectsDir = path.join(__dirname, '..', 'projects');
if (fs.existsSync(projectsDir)) {
  const files = fs.readdirSync(projectsDir);
  files.forEach(f => {
    if (f.endsWith('.html') && f !== 'index.html' && f !== 'template.html') {
      const cleanName = f.replace('.html', '');
      pages.push('/projects/' + cleanName);
    }
  });
}

const blogDir = path.join(__dirname, '..', 'blog');
if (fs.existsSync(blogDir)) {
  const files = fs.readdirSync(blogDir);
  files.forEach(f => {
    if (f.endsWith('.html') && f !== 'index.html') {
      const cleanName = f.replace('.html', '');
      pages.push('/blog/' + cleanName);
    }
  });
}

const urls = pages.map(p => {
  return `  <url>\n    <loc>${domain}${p}</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n  </url>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

fs.writeFileSync(path.join(__dirname, '..', 'sitemap.xml'), xml);
console.log('sitemap.xml generated with', pages.length, 'entries');
