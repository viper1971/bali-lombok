#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Stáhne obrázky z internetu (Unsplash, flagcdn) do složky img/ vedle stránky a přepíše odkazy v HTML na lokální soubory.
Stránka pak nezávisí na cizích serverech: obrázky se nikdy nerozbijí, načítají se rychleji a fungují i offline.

Použití (stačí Python 3, nic se neinstaluje):
    python3 localize_images.py Index2.html --base https://viper1971.site.je/

Co udělá:
  1. zazálohuje původní soubor jako Index2.html.bak
  2. stáhne každý jedinečný obrázek do img/ (už stažené přeskočí)
  3. přepíše odkazy v HTML (včetně CSS url(...) a og:image)
  4. og:image dostane absolutní adresu podle --base (sdílecí náhled ve WhatsAppu ji potřebuje)
Po skončení nahraj na web Index2.html i celou složku img/.
"""
import argparse, hashlib, os, re, shutil, sys, time, urllib.request, urllib.parse

HOSTS_DEFAULT = ['images.unsplash.com', 'flagcdn.com']
EXT = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg', 'image/avif': '.avif'}

def fetch(url, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (localize_images)'})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read(), (r.headers.get('Content-Type') or '').split(';')[0].strip().lower()
        except Exception as e:
            last = e; time.sleep(1.5 * (i + 1))
    raise last

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('html'); ap.add_argument('--img-dir', default='img'); ap.add_argument('--base', default='', help='veřejná adresa stránky, např. https://viper1971.site.je/')
    ap.add_argument('--hosts', default=','.join(HOSTS_DEFAULT), help='servery, ze kterých se stahuje (oddělené čárkou)')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    hosts = [h.strip() for h in a.hosts.split(',') if h.strip()]
    html = open(a.html, encoding='utf-8').read()
    host_re = '|'.join(re.escape(h) for h in hosts)
    # adresa končí u uvozovky, mezery, závorky nebo <
    pat = re.compile(r'https?://(?:%s)/[^\s\'")<>]+' % host_re)
    found = sorted(set(m.group(0) for m in pat.finditer(html)))
    # v HTML atributech bývá & zapsané jako &amp; – sjednotíme
    uniq = {}
    for u in found:
        raw = u.replace('&amp;', '&'); uniq.setdefault(raw, set()).add(u)
    print('Nalezeno %d jedinečných obrázků.' % len(uniq))
    if a.dry_run:
        for u in uniq: print('  ', u)
        return
    os.makedirs(a.img_dir, exist_ok=True)
    mapping, fail = {}, []
    for n, raw in enumerate(sorted(uniq), 1):
        pr = urllib.parse.urlparse(raw)
        digest = hashlib.sha1(raw.encode()).hexdigest()[:10]
        stem = re.sub(r'[^a-z0-9]+', '-', (pr.netloc.split('.')[0] + '-' + os.path.basename(pr.path)).lower()).strip('-')[:40]
        existing = [f for f in os.listdir(a.img_dir) if f.startswith('%s-%s.' % (stem, digest))]
        if existing:
            mapping[raw] = '%s/%s' % (a.img_dir, existing[0]); print('[%d/%d] hotovo už dřív: %s' % (n, len(uniq), existing[0])); continue
        try:
            data, ctype = fetch(raw)
            if not data or len(data) < 200: raise ValueError('prázdná odpověď')
            ext = EXT.get(ctype) or os.path.splitext(pr.path)[1] or '.jpg'
            name = '%s-%s%s' % (stem, digest, ext)
            with open(os.path.join(a.img_dir, name), 'wb') as f: f.write(data)
            mapping[raw] = '%s/%s' % (a.img_dir, name)
            print('[%d/%d] OK  %s (%d kB)' % (n, len(uniq), name, len(data) // 1024))
        except Exception as e:
            fail.append((raw, e)); print('[%d/%d] CHYBA %s: %s' % (n, len(uniq), raw[:70], e))
    if fail:
        print('\nNepodařilo se stáhnout %d obrázků, ty zůstanou jako odkazy na internet. Spusť skript znovu.' % len(fail))
    shutil.copyfile(a.html, a.html + '.bak')
    out = html
    base = a.base.rstrip('/') + '/' if a.base else ''
    # nejdřív og:image / twitter:image (absolutní adresa), pak ostatní
    def meta_sub(m):
        u = m.group(2).replace('&amp;', '&')
        return m.group(1) + ((base + mapping[u]) if (u in mapping and base) else m.group(2)) + m.group(3)
    out = re.sub(r'(<meta[^>]+(?:og:image|twitter:image)["\'][^>]*content=["\'])([^"\']+)(["\'])', meta_sub, out)
    for raw, variants in mapping.items():
        for v in set([raw]) | set(x for x in uniq[raw]) | set([raw.replace('&', '&amp;')]):
            out = out.replace(v, mapping[raw])
    if not base:
        print('\nUpozornění: bez --base zůstal og:image (náhled odkazu) odkazem na původní server. Doplň --base https://tvoje-adresa/')
    open(a.html, 'w', encoding='utf-8').write(out)
    print('\nHotovo. Přepsáno %d obrázků v %s (záloha: %s.bak). Nahraj na web i složku %s/.' % (len(mapping), a.html, a.html, a.img_dir))

if __name__ == '__main__':
    main()
