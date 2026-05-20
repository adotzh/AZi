import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));

const pages = [
  {
    route: '/',
    file: 'index.html',
    contains: ['Anastasia Ziboedova', 'Member of Technical Staff at OpenAI'],
  },
  {
    route: '/blog',
    file: 'blog/index.html',
    contains: ['Blog', 'System Design of Search Engine'],
  },
  {
    route: '/takes',
    file: 'takes/index.html',
    contains: ['Takes'],
  },
  {
    route: '/posts/system-design-of-search-engine',
    file: 'posts/system-design-of-search-engine/index.html',
    contains: ['Search looks simple', 'ranking'],
  },
  {
    route: '/about-me',
    file: 'about-me/index.html',
    contains: ['This page has moved'],
  },
];

const failures = [];

for (const page of pages) {
  const path = join(dist, page.file);

  if (!existsSync(path)) {
    failures.push(`${page.route}: missing ${page.file}`);
    continue;
  }

  const html = readFileSync(path, 'utf8');
  for (const text of page.contains) {
    if (!html.includes(text)) {
      failures.push(`${page.route}: missing "${text}"`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Checked ${pages.length} generated routes.`);
