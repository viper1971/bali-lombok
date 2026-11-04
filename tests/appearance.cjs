/* Appearance rollback must preserve saved trip choices and all non-appearance URL state. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('assets/js/068-magazine-layout.js', 'utf8');
function load({ preference, search = '', blocked = false } = {}) {
  const savedTrip = '{"level":"pohodove","c":{"ubMonkey":true}}';
  const savedCash = '{"people":8,"view":"fam","buf":10}';
  const state = new Map([['trip_extras_v2', savedTrip], ['cash_plan_v1', savedCash], ['selectedHotels', 'original-selections']]);
  if (preference) state.set('bali_magazine_appearance_v1', preference);
  const attributes = {}, listeners = {}, domListeners = {}, invalidations = [];
  const button = { setAttribute() {} };
  const location = { href: 'https://example.test/bali/?flight=turkish&plan=custom' + search + '#f-konfig' };
  const context = {
    URL, Event: class { constructor(type) { this.type = type; } }, location,
    localStorage: {
      getItem(k) { if (blocked) throw Error('disabled'); return state.get(k) || null; },
      setItem(k, v) { if (blocked) throw Error('disabled'); state.set(k, v); }
    },
    history: { replaceState(a, b, url) { location.href = url; } },
    document: {
      documentElement: { setAttribute(k, v) { attributes[k] = v; }, getAttribute(k) { return attributes[k]; } },
      querySelectorAll: () => [button], readyState: 'loading',
      addEventListener(k, fn) { (domListeners[k] ||= []).push(fn); }
    },
    window: {
      requestAnimationFrame(fn) { fn(); }, dispatchEvent(e) { listeners[e.type] = true; },
      __luxMaps: [{ invalidateSize() { invalidations.push(true); } }]
    }
  };
  vm.runInNewContext(source, context);
  return { context, attributes, state, savedTrip, savedCash, button, domListeners, invalidations, location };
}
const fresh = load();
assert.equal(fresh.attributes['data-magazine'], 'on');
assert.equal(fresh.context.window.baliMagazine.setMode('classic'), 'classic');
assert.equal(fresh.attributes['data-magazine'], 'off');
assert.equal(fresh.button.textContent, 'Časopisový vzhled');
assert.equal(fresh.state.get('trip_extras_v2'), fresh.savedTrip);
assert.equal(fresh.state.get('cash_plan_v1'), fresh.savedCash);
assert.equal(fresh.state.get('selectedHotels'), 'original-selections');
assert.equal(fresh.invalidations.length, 1);
assert.equal(load({ preference: fresh.state.get('bali_magazine_appearance_v1') }).attributes['data-magazine'], 'off');
fresh.context.window.baliMagazine.setMode('magazine');
assert.equal(fresh.attributes['data-magazine'], 'on');
assert.equal(fresh.state.get('trip_extras_v2'), fresh.savedTrip);
assert.equal(new URL(fresh.location.href).searchParams.get('flight'), 'turkish');
assert.equal(new URL(fresh.location.href).searchParams.get('plan'), 'custom');
assert.equal(new URL(fresh.location.href).hash, '#f-konfig');
const emergency = load({ search: '&vzhled=puvodni' });
assert.equal(emergency.attributes['data-magazine'], 'off');
emergency.context.window.baliMagazine.setMode('magazine');
assert.equal(new URL(emergency.location.href).searchParams.has('vzhled'), false);
assert.equal(new URL(emergency.location.href).searchParams.get('plan'), 'custom');
const noStorage = load({ blocked: true });
assert.equal(noStorage.attributes['data-magazine'], 'on');
assert.doesNotThrow(() => noStorage.context.window.baliMagazine.setMode('classic'));
assert.equal(noStorage.attributes['data-magazine'], 'off');
console.log('PASS: appearance rollback, persistence, blocked storage, map resizing and preserved trip/URL state');
