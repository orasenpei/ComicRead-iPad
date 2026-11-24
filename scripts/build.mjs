import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
export function decode(script) {
  const start = script.indexOf('const libCodeMap = ');
  const end = script.indexOf('//#region src/userscript/import.ts', start);
  assert.ok(start >= 0 && end > start, 'Expected pinned upstream module map');
  return { start, end, modules: new Function(script.slice(start, end) + '; return libCodeMap;')() };
}

export function build() {
  const config = JSON.parse(read('release.config.json'));
  assert.match(config.repository, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, 'Set a GitHub owner/repository');
  assert.match(config.branch, /^[A-Za-z0-9_.-]+$/);
  assert.match(config.version, /^\d+(?:\.\d+)+$/);
  const original = read('upstream/ComicRead.user.js');
  const { start, end, modules } = decode(original);
  modules['components/Manga'] = read('ipad-src/Manga.js');
  modules['site/ehentai'] = read('ipad-src/ehentai.js');
  const quote = (code) => '`' + code.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
  let output = original.slice(0, start) + 'const libCodeMap = {\n' +
    Object.entries(modules).map(([name, code]) => '\t' + JSON.stringify(name) + ': ' + quote(code)).join(',\n') +
    '\n};\n//#endregion\n' + original.slice(end);
  const raw = `https://raw.githubusercontent.com/${config.repository}/${config.branch}/ComicRead.user.js`;
  const metadata = {
    version: config.version,
    supportURL: `https://github.com/${config.repository}`,
    updateURL: raw,
    downloadURL: raw,
  };
  for (const [key, value] of Object.entries(metadata)) {
    const pattern = new RegExp('^(// @' + key + '\\s+).+$', 'm');
    assert.ok(pattern.test(output), `Missing @${key}`);
    output = output.replace(pattern, (_, prefix) => prefix + value);
  }
  output = output.replace(/^(\/\/ @description\s+)(.*)$/m, (_, prefix, value) => prefix + '[iPad 版本] ' + value);
  output = output.replace(/^(\/\/ @description:en\s+)(.*)$/m, (_, prefix, value) => prefix + '[iPad edition] ' + value);
  output = output.replace('// ==/UserScript==', [
    `// iPad 连续滚动沉浸版 ${config.version}：单个速度输入框，单位 px/10ms，支持小数。`,
    '// 例如 0.25、0.5、0.625、1；数值越大滚动越快。点击播放进入纵向连续滚动。',
    '// 旧版 ms/px 设置自动换算显示，保持原来速度。已包含快速收藏修复。',
    '// 沉浸模式：播放时隐藏工具栏；轻点屏幕显示/隐藏控件，不暂停。',
    '// 暂停方法：轻点屏幕，点击方形停止按钮。主动拖动/缩放仍会暂停。',
    '// ==/UserScript==',
  ].join('\n'));
  new Function(output);
  const roundTrip = decode(output).modules;
  assert.equal(Object.keys(roundTrip).length, 50);
  for (const [name, code] of Object.entries(modules)) {
    new Function(code);
    assert.equal(roundTrip[name], code, `Module serialization altered ${name}`);
  }
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const output = build();
  for (const file of ['ComicRead.user.js', 'ComicRead-iPad.txt']) fs.writeFileSync(path.join(root, file), output);
  console.log('Built identical userscript and TXT; all 50 embedded modules parsed and round-tripped.');
}
