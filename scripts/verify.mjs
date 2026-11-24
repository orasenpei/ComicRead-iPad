import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { build, decode, root } from './build.mjs';

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const expected = build();
assert.equal(read('ComicRead.user.js'), expected);
assert.equal(read('ComicRead-iPad.txt'), expected);
const modules = decode(expected).modules;
const original = decode(read('upstream/ComicRead.user.js')).modules;
for (const [name, code] of Object.entries(original)) {
  if (name !== 'components/Manga' && name !== 'site/ehentai') assert.equal(modules[name], code);
}
const code = modules['components/Manga'];
const store = { option: { autoScroll: { interval: 16, distance: 1 } } };
let saves = 0;
const context = {
  store,
  setOption: (fn) => { fn(store.option); saves++; },
  helper: { t: (value) => value },
  SettingsItemSwitch: 'switch', SettingsItemNumber: 'number', bindOption: () => ({}),
  solid_js_web: {
    createComponent: (type, props) => ({ type, props }),
    mergeProps: (...args) => Object.assign({}, ...args.map((value) => typeof value === 'function' ? value() : value)),
  },
};
const a = code.indexOf('const autoScrollSpeed = ');
const b = code.indexOf('const autoScroll = new class', a);
const c = code.indexOf('\t[helper.t("button.auto_scroll"), () => [');
const d = code.indexOf('\t[helper.t("setting.option.img_recognition"),', c);
assert.ok(a >= 0 && b > a && c >= 0 && d > c);
const controls = vm.runInNewContext(code.slice(a, b) + ';(' + code.slice(c, d).trim().replace(/,$/, '') + ')[1]();', context);
assert.equal(controls.length, 3);
const input = controls[1].props;
assert.equal(input.name, '滚动速度');
assert.equal(input.suffix, 'px/10ms');
assert.equal(input.value, 0.625);
input.onChange(input.value);
assert.equal(saves, 0);
for (const speed of [0.25, 0.5, 0.625, 1, 0.05, 0.001]) {
  input.onChange(speed);
  assert.equal(input.value, speed);
  assert.equal(store.option.autoScroll.distance / store.option.autoScroll.interval, speed / 10);
}
const valid = JSON.stringify(store);
for (const invalid of [NaN, Infinity, 0, -1]) input.onChange(invalid);
assert.equal(JSON.stringify(store), valid);
for (const saved of [{ interval: 60000, distance: 1 }, { interval: 1, distance: 9999 }]) {
  store.option.autoScroll = saved;
  const snapshot = JSON.stringify(store);
  input.onChange(input.value);
  assert.equal(JSON.stringify(store), snapshot);
}
assert.ok(code.includes('var _el$ = _tmpl$$2(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild;'));
assert.ok(modules['site/ehentai'].includes('data: formData.toString()'));
console.log('PASS: reproducible outputs, 48 unchanged modules, decimal speed/persistence, toolbar template and quick-favorite fix.');
