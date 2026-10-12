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
    panel: group.querySelector('.cm-submenu')!, link: group.querySelector('.cm-nav-parent a')!,
  }));
  const hidden = (element: HTMLElement) => element.hasAttribute('hidden');
  const enter = (index = 0, pointerType = 'mouse') => event(groups[index]!.group, 'pointerenter', { pointerType });
  const leave = (index = 0) => event(groups[index]!.group, 'pointerleave', { pointerType: 'mouse' });
  const click = (element: HTMLElement) => bubble(element, 'click');
  const escape = () => event(document, 'keydown', { key: 'Escape' });
  return { document, groups, hidden, enter, leave, click, escape, focus, advance,
    resize: () => { width.matches = !width.matches; event(width, 'change'); } };
}

test('un passage rapide ne déclenche rien, un survol stable ouvre après 350 ms', () => {
  const n = navigation(), item = n.groups[0]!;
  n.enter(); n.advance(200); n.leave(); n.advance(500);
  expect(n.hidden(item.panel)).toBe(true);
  n.enter(); n.advance(349); expect(n.hidden(item.panel)).toBe(true);
  n.advance(1); expect(n.hidden(item.panel)).toBe(false);
  expect(item.button.getAttribute('aria-expanded')).toBe('true');
});

test('le menu tolère une sortie de 250 ms et reste ouvert lors du retour vers le panneau', () => {
  const n = navigation(), item = n.groups[0]!;
  n.enter(); n.advance(350); n.leave(); n.advance(200); n.enter(); n.advance(500);
  expect(n.hidden(item.panel)).toBe(false);
  n.leave(); n.advance(249); expect(n.hidden(item.panel)).toBe(false);
  n.advance(1); expect(n.hidden(item.panel)).toBe(true);
});

test('la flèche ouvre immédiatement et le lien parent garde sa destination', () => {
  const n = navigation(), item = n.groups[0]!;
  expect(item.link.getAttribute('href')).toBe('ecole-petons');
  n.click(item.link); expect(n.hidden(item.panel)).toBe(true);
  n.click(item.button); expect(n.hidden(item.panel)).toBe(false);
  n.click(n.groups[1]!.button);
  expect(n.hidden(item.panel)).toBe(true);
  expect(n.hidden(n.groups[1]!.panel)).toBe(false);
  n.click(n.groups[1]!.button); expect(n.hidden(n.groups[1]!.panel)).toBe(true);
});

test('Échap annule aussi une ouverture en attente sans déplacer le focus au survol', () => {
  const n = navigation(), initial = n.document.activeElement;
  n.enter(); n.advance(100); n.escape(); n.advance(500);
  expect(n.hidden(n.groups[0]!.panel)).toBe(true);
  n.leave(); n.enter(); n.advance(350); n.escape();
  expect(n.document.activeElement).toBe(initial);
  expect(n.hidden(n.groups[0]!.panel)).toBe(true);
});

test('le focus dans le panneau le maintient ouvert, puis Échap revient à sa flèche', () => {
  const n = navigation(), item = n.groups[0]!;
  n.click(item.button); n.focus(item.panel.querySelector('a')!);
  n.leave(); n.advance(500); expect(n.hidden(item.panel)).toBe(false);
  n.enter(1); n.advance(350); expect(n.hidden(n.groups[1]!.panel)).toBe(true);
  n.escape(); expect(n.document.activeElement).toBe(item.button);
  expect(n.hidden(item.panel)).toBe(true);
});

test('après un clic sur une flèche, le survol peut ouvrir un autre menu sans masquer le focus', () => {
  const n = navigation(), item = n.groups[0]!;
  n.focus(item.button); n.click(item.button);
  n.enter(1); n.advance(350);
  expect(n.hidden(item.panel)).toBe(true);
  expect(n.hidden(n.groups[1]!.panel)).toBe(false);
  expect(n.document.activeElement).toBe(item.button);
});

test('sortir au clavier ou cliquer ailleurs ferme le sous-menu', () => {
  const n = navigation(), item = n.groups[0]!, outside = n.document.querySelector('main')!;
  n.click(item.button); n.focus(item.panel.querySelector('a')!); n.focus(outside);
  expect(n.hidden(item.panel)).toBe(true);
  n.enter(); n.advance(350); n.click(outside); expect(n.hidden(item.panel)).toBe(true);
});

test('le tactile et le petit écran ne déclenchent pas de survol, le menu mobile reste utilisable', () => {
  for (const n of [navigation(false), navigation(true, false), navigation()]) {
    n.enter(0, 'touch'); n.advance(500); expect(n.hidden(n.groups[0]!.panel)).toBe(true);
  }
  const tactile = navigation(true, false);
  tactile.enter(); tactile.advance(500); expect(tactile.hidden(tactile.groups[0]!.panel)).toBe(true);
  const n = navigation(false);
  n.enter(); n.advance(500); expect(n.hidden(n.groups[0]!.panel)).toBe(true);
  const button = n.document.querySelector('.cm-menu-toggle')!, mobile = n.document.querySelector('#cm-mobile-menu')!;
  n.click(button); expect(n.hidden(mobile)).toBe(false);
  n.click(mobile.querySelector('a')!); expect(n.hidden(mobile)).toBe(true);
  n.click(button); n.escape(); expect(n.hidden(mobile)).toBe(true);
  expect(n.document.activeElement).toBe(button);
});

test('changer de taille annule une ouverture en attente et ferme les menus', () => {
  const n = navigation();
  n.enter(); n.advance(200); n.resize(); n.advance(500);
  expect(n.hidden(n.groups[0]!.panel)).toBe(true);
});
