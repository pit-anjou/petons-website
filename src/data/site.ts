// Source unique pour la navigation et les coordonnées de l'école.
// Modifier ici met à jour le header et le footer de toutes les pages.

export interface NavLink {
  readonly href: string;
  readonly label: string;
}

export interface NavItem extends NavLink {
  readonly children?: ReadonlyArray<NavLink>;
  /** Sous-menu desktop : identifiant et libellé du bouton d'ouverture. */
  readonly submenu?: { readonly id: string; readonly toggleLabel: string };
}

export const brand = {
  href: '/',
  label: 'Les Petons dans l’Herbe — Accueil',
  logo: {
    src: 'assets/img/logo-petons-2026.svg',
    alt: 'Les Petons dans l’Herbe — École Montessori Nantes',
    width: 976,
    height: 322,
  },
} as const;

export const contact = {
  address: ['6 rue de la Petite Sensive', '44300 Nantes'],
  email: 'contact@ecolemontessorinantes.com',
  instagram: {
    handle: '@lespetonsdanslherbe',
    href: 'https://www.instagram.com/lespetonsdanslherbe/',
  },
} as const;

export const mainNav: ReadonlyArray<NavItem> = [
  { href: '/', label: 'Accueil' },
  {
    href: 'ecole-petons',
    label: 'L’école',
    submenu: { id: 'cm-school-menu', toggleLabel: 'Afficher les informations pratiques, les tarifs et les actualités' },
    children: [
      { href: 'vie-pratique-petons', label: 'Informations pratiques' },
      { href: 'tarifs-petons', label: 'Tarifs' },
      { href: 'actualites-petons', label: 'Actualités' },
    ],
  },
  { href: 'equipe-petons', label: 'L’équipe' },
  {
    href: 'pedagogie-petons',
    label: 'Pédagogie et ambiances',
    submenu: { id: 'cm-ambiences-menu', toggleLabel: 'Afficher les deux ambiances' },
    children: [
      { href: 'chenilles-petons', label: 'L’ambiance 3–6 ans aux Petons' },
      { href: 'papillons-petons', label: 'L’ambiance 6–12 ans aux Petons' },
    ],
  },
  { href: 'inscriptions-petons', label: 'Inscriptions' },
];

export const contactCta: NavLink = { href: 'contact-petons', label: 'Rencontrons-nous' };

/** Encart « Dons & mécénat » en bas de page. */
export const support = {
  href: 'soutenir-les-petons',
  /** Ancre utilisée quand on est déjà sur la page Soutenir. */
  anchor: '#soutiens',
  eyebrow: 'Dons & mécénat',
  title: 'Aux côtés des enfants',
  text: 'Un don, du matériel, un savoir-faire : votre soutien a sa place.',
  cta: 'Soutenir l’école',
  image: { src: 'assets/img/soutien-ensemble-maison-petons-v2.webp', alt: 'Deux adultes et deux enfants tiennent ensemble une petite maison.', width: 1536, height: 1024 },
} as const;

export const footerNav: ReadonlyArray<{ readonly title: string; readonly links: ReadonlyArray<NavLink> }> = [
  {
    title: 'L’école',
    links: [
      { href: '/', label: 'Accueil' },
      { href: 'ecole-petons', label: 'L’école' },
      { href: 'equipe-petons', label: 'L’équipe' },
      { href: 'vie-pratique-petons', label: 'Informations pratiques' },
      { href: 'actualites-petons', label: 'Actualités' },
    ],
  },
  {
    title: 'Pédagogie et ambiances',
    links: [
      { href: 'pedagogie-petons', label: 'Notre pédagogie' },
      { href: 'chenilles-petons', label: 'L’ambiance 3–6 ans aux Petons' },
      { href: 'papillons-petons', label: 'L’ambiance 6–12 ans aux Petons' },
    ],
  },
  {
    title: 'Nous rejoindre',
    links: [
      { href: 'inscriptions-petons', label: 'Inscriptions' },
      { href: 'tarifs-petons', label: 'Tarifs' },
      { href: 'contact-petons', label: 'Contact' },
    ],
  },
];

/** Adresse de la page courante, sous la forme des liens du menu : « / » pour l’accueil, sinon « tarifs-petons ». */
export const currentPage = (pathname: string): string => {
  const last = (pathname.split('/').filter(Boolean).pop() ?? '').replace(/\.html$/, '');
  return last === '' || last === 'index' ? '/' : last;
};
