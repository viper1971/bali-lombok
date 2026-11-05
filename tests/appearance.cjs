/* Current magazine appearance is deliberately always enabled.
   Test that initialization preserves travel selections and registers its
   DOM setup without trying to restore the removed classic-mode toggle. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('assets/js/068-magazine-layout.js', 'utf8');

function load(blockStorage = false) {
  const savedTrip = '{"level":"pohodove","c":{"ubMonkey":true}}';
  const savedCash = '{"people":8,"view":"fam","buf":10}';
  const storage = new Map([
    ['trip_extras_v2', savedTrip],
    ['cash_plan_v1', savedCash],
    ['selectedHotels', 'original-selections'],
    ['bali_magazine_appearance_v1', 'classic']
  ]);
  const attrs = {};
  const events = {};
  const context = {
    URL, console,
    location: {href:'https://example.test/bali/?flight=turkish&plan=custom#f-konfig'},
    localStorage: {
      getItem(key) {if (blockStorage) throw Error('disabled');return storage.get(key) || null;},
      setItem(key,val) {if (blockStorage) throw Error('disabled');storage.set(key, String(val));},
      removeItem(key) {if (blockStorage) throw Error('disabled');storage.delete(key);}
    },
    document: {
      documentElement:{setAttribute(key,val){attrs[key]=val;}},
      readyState:'loading',
      addEventListener(name,fn){events[name]=fn;}
    },
    window:{}
  };
  vm.runInNewContext(source, context);
  assert.equal(attrs['data-magazine'],'on');
  assert.equal(typeof events.DOMContentLoaded,'function');
  assert.equal(storage.get('trip_extras_v2'),savedTrip);
  assert.equal(storage.get('cash_plan_v1'),savedCash);
  assert.equal(storage.get('selectedHotels'),'original-selections');
  assert.equal(new URL(context.location.href).searchParams.get('flight'),'turkish');
  assert.equal(new URL(context.location.href).searchParams.get('plan'),'custom');
  assert.equal(new URL(context.location.href).hash,'#f-konfig');
  if (!blockStorage) assert(!storage.has('bali_magazine_appearance_v1'));
  return {context,attrs};
}
load();
assert.doesNotThrow(()=>load(true));
console.log('PASS: mandatory magazine layout, trip state, URL and blocked-storage fallback');
