import { expect, test } from 'bun:test';
import { runInNewContext } from 'node:vm';
import { parse, type HTMLElement } from 'node-html-parser';
import { DOSSIER_PAGES } from './outils/html';

const page = await Bun.file(`${DOSSIER_PAGES}/index.html`).text();
const source = await Bun.file(new URL('../src/components/SiteNavScript.astro', import.meta.url)).text();
const script = source.match(/<script is:inline>([\s\S]*?)<\/script>/)![1]!;

// Exécuter le vrai script sur le HTML construit, avec une horloge déterministe.
// Seules les API d'événements, de focus et de média manquant au parseur sont simulées.
function navigation(desktop = true, souris = true) {
  const document = parse(page) as HTMLElement & { activeElement: HTMLElement | null };
  const listeners = new Map<object, Map<string, Function[]>>();
  const listen = (target: object, type: string, callback: Function) => {
    if (!listeners.has(target)) listeners.set(target, new Map());
    const events = listeners.get(target)!;
    events.set(type, [...(events.get(type) ?? []), callback]);
  };
  const event = (target: object, type: string, data: object = {}) => {
    for (const callback of listeners.get(target)?.get(type) ?? []) callback({ target, ...data });
  };
  const bubble = (target: HTMLElement, type: string, data: object = {}) => {
    for (let node: HTMLElement | null = target; node; node = node.parentNode) event(node, type, { target, ...data });
  };
  const focus = (target: HTMLElement) => {
    const previous = document.activeElement;
    document.activeElement = target;
    if (previous) bubble(previous, 'focusout', { relatedTarget: target });
    bubble(target, 'focusin', { relatedTarget: previous });
  };
  document.activeElement = document.querySelector('body');
  for (const node of [document, ...document.querySelectorAll('*')]) {
    Object.assign(node, {
      addEventListener: (type: string, callback: Function) => listen(node, type, callback),
      contains: (target: HTMLElement | null) => {
        for (let current = target; current; current = current.parentNode) if (current === node) return true;
        return false;
      },
      focus: () => focus(node),
    });
    Object.defineProperty(node, 'hidden', {
      get: () => node.hasAttribute('hidden'),
      set: (hidden: boolean) => hidden ? node.setAttribute('hidden', '') : node.removeAttribute('hidden'),
    });
  }
  const media = (matches: boolean) => {
    const query = { matches, addEventListener: (type: string, callback: Function) => listen(query, type, callback) };
    return query;
  };
  const width = media(desktop), pointer = media(souris);
  let now = 0, id = 0;
  const timers = new Map<number, { at: number; callback: Function }>();
  const advance = (ms: number) => {
    const end = now + ms;
    while (true) {
      const next = [...timers.entries()].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      now = next[1].at; timers.delete(next[0]); next[1].callback();
    }
    now = end;
  };
  runInNewContext(script, {
    document, location: { protocol: 'https:' },
    matchMedia: (query: string) => query.includes('min-width') ? width : pointer,
    setTimeout: (callback: Function, delay: number) => { timers.set(++id, { callback, at: now + delay }); return id; },
    clearTimeout: (timer: number) => timers.delete(timer),
  });
  const groups = document.querySelectorAll('.cm-nav-group').map(group => ({
    group, button: group.querySelector('.cm-submenu-toggle')!,
    panel: group.querySelector('.cm-submenu')!,
  }));
  const hidden = (element: HTMLElement) => element.hasAttribute('hidden');
  const enter = (index = 0, pointerType = 'mouse') => event(groups[index]!.group, 'pointerenter', { pointerType });
  const leave = (index = 0) => event(groups[index]!.group, 'pointerleave', { pointerType: 'mouse' });
  const click = (element: HTMLElement) => bubble(element, 'click');
  const escape = () => event(document, 'keydown', { key: 'Escape' });
  return { document, groups, hidden, enter, leave, click, escape, focus, advance,
    resize: () => { width.matches = !width.matches; event(width, 'change'); } };
}

test('les trois intitulés ouvrent leur sous-menu au clic sans lien parent', () => {
  const n = navigation();
  expect(n.groups).toHaveLength(3);
  expect(n.document.querySelector('.cm-nav-parent a')).toBeNull();
  for (const item of n.groups) {
    expect(item.button.hasAttribute('href')).toBe(false);
    expect(n.hidden(item.panel)).toBe(true);
    n.click(item.button);
    expect(n.hidden(item.panel)).toBe(false);
    expect(item.button.getAttribute('aria-expanded')).toBe('true');
    n.click(item.button); expect(n.hidden(item.panel)).toBe(true);
  }
});

test('les destinations initiales et les deux équipes sont dans les sous-menus', () => {
  const n = navigation();
  expect(n.groups.map(item => item.panel.querySelectorAll('a').map(a=>a.getAttribute('href')))).toEqual([
    ['ecole-petons','vie-pratique-petons','tarifs-petons','actualites-petons'],
    ['equipe-petons','association-petons'],
    ['pedagogie-petons','chenilles-petons','papillons-petons'],
  ]);
});

test('un seul sous-menu reste ouvert, le survol ne change pas la sélection', () => {
  const n=navigation(); n.click(n.groups[0]!.button); n.enter(1); n.advance(500);
  expect(n.hidden(n.groups[0]!.panel)).toBe(false);
  expect(n.hidden(n.groups[1]!.panel)).toBe(true);
  n.click(n.groups[1]!.button);
  expect(n.hidden(n.groups[0]!.panel)).toBe(true);
  expect(n.hidden(n.groups[1]!.panel)).toBe(false);
});

test('Échap ferme le panneau et rend le focus au bouton', () => {
  const n=navigation(), item=n.groups[0]!;
  n.click(item.button); n.focus(item.panel.querySelector('a')!); n.escape();
  expect(n.hidden(item.panel)).toBe(true);
  expect(n.document.activeElement).toBe(item.button);
});

test('sortir au clavier ou cliquer ailleurs ferme le sous-menu', () => {
  const n=navigation(), item=n.groups[0]!, outside=n.document.querySelector('main')!;
  n.click(item.button); n.focus(item.panel.querySelector('a')!); n.focus(outside);
  expect(n.hidden(item.panel)).toBe(true);
  n.click(item.button); n.click(outside); expect(n.hidden(item.panel)).toBe(true);
});

test('sur mobile, les intitulés déplient les liens et Échap ferme chaque niveau', () => {
  const n=navigation(false), menu=n.document.querySelector('.cm-menu-toggle')!, mobile=n.document.querySelector('#cm-mobile-menu')!;
  const button=mobile.querySelectorAll('.cm-mobile-submenu-toggle')[1]!, panel=mobile.querySelector('#cm-team-menu-mobile')!;
  n.click(menu); expect(n.hidden(mobile)).toBe(false); expect(n.hidden(panel)).toBe(true);
  n.click(button); expect(n.hidden(panel)).toBe(false);
  n.escape(); expect(n.hidden(panel)).toBe(true); expect(n.hidden(mobile)).toBe(false);
  expect(n.document.activeElement).toBe(button);
  n.escape(); expect(n.hidden(mobile)).toBe(true); expect(n.document.activeElement).toBe(menu);
  n.click(menu); n.click(button); n.click(panel.querySelector('a')!);
  expect(n.hidden(mobile)).toBe(true); expect(n.hidden(panel)).toBe(true);
});

test('changer de taille ferme les menus', () => {
  const n=navigation(); n.click(n.groups[0]!.button); n.resize();
  expect(n.hidden(n.groups[0]!.panel)).toBe(true);
});
