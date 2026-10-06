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
  href: 'index.html',
  label: 'Les Petons dans l’Herbe — Accueil',
  logo: {
    src: 'assets/img/les-petons-dans-lherbe-ecole-montessori.webp',
    alt: 'Les Petons dans l’Herbe — École Montessori',
    width: 460,
    height: 162,
  },
} as const;

export const contact = {
  address: ['6 rue de la Petite Sensive', '44300 Nantes'],
  phone: { label: '06 45 09 53 37', href: 'tel:+33645095337' },
  email: 'contact@lespetons.fr',
  instagram: {
    handle: '@lespetonsdanslherbe',
    href: 'https://www.instagram.com/lespetonsdanslherbe/',
  },
} as const;

export const mainNav: ReadonlyArray<NavItem> = [
  { href: 'index.html', label: 'Accueil' },
  {
    href: 'ecole-petons.html',
    label: 'L’école',
    submenu: { id: 'cm-school-menu', toggleLabel: 'Afficher les informations pratiques, les tarifs et les actualités' },
    children: [
      { href: 'vie-pratique-petons.html', label: 'Informations pratiques' },
      { href: 'tarifs-petons.html', label: 'Tarifs' },
      { href: 'actualites-petons.html', label: 'Actualités' },
    ],
  },
  { href: 'equipe-petons.html', label: 'L’équipe' },
  {
    href: 'pedagogie-petons.html',
    label: 'Pédagogie et ambiances',
    submenu: { id: 'cm-ambiences-menu', toggleLabel: 'Afficher les deux ambiances' },
    children: [
      { href: 'chenilles-petons.html', label: 'L’ambiance 3–6 ans aux Petons' },
      { href: 'papillons-petons.html', label: 'L’ambiance 6–12 ans aux Petons' },
    ],
  },
  { href: 'inscriptions-petons.html', label: 'Inscriptions' },
];

export const contactCta: NavLink = { href: 'contact-petons.html', label: 'Rencontrons-nous' };

/** Encart « Dons & mécénat » en bas de page. */
export const support = {
  href: 'soutenir-les-petons.html',
  /** Ancre utilisée quand on est déjà sur la page Soutenir. */
  anchor: '#soutiens',
  eyebrow: 'Dons & mécénat',
  title: 'Aux côtés des enfants',
  text: 'Un don, du matériel, un savoir-faire : votre soutien a sa place.',
  cta: 'Soutenir l’école',
  image: { src: 'assets/img/soutien-ensemble-maison-petons-v2.webp', width: 1536, height: 1024 },
} as const;

export const footerNav: ReadonlyArray<{ readonly title: string; readonly links: ReadonlyArray<NavLink> }> = [
  {
    title: 'L’école',
    links: [
      { href: 'index.html', label: 'Accueil' },
      { href: 'ecole-petons.html', label: 'L’école' },
      { href: 'equipe-petons.html', label: 'L’équipe' },
      { href: 'vie-pratique-petons.html', label: 'Informations pratiques' },
      { href: 'actualites-petons.html', label: 'Actualités' },
    ],
  },
  {
    title: 'Pédagogie et ambiances',
    links: [
      { href: 'pedagogie-petons.html', label: 'Notre pédagogie' },
      { href: 'chenilles-petons.html', label: 'L’ambiance 3–6 ans aux Petons' },
      { href: 'papillons-petons.html', label: 'L’ambiance 6–12 ans aux Petons' },
    ],
  },
  {
    title: 'Nous rejoindre',
    links: [
      { href: 'inscriptions-petons.html', label: 'Inscriptions' },
      { href: 'tarifs-petons.html', label: 'Tarifs' },
      { href: 'contact-petons.html', label: 'Contact' },
    ],
  },
];

/** Fichier de la page courante (« index.html » pour la racine). */
export const currentFile = (pathname: string): string => {
  const last = pathname.split('/').filter(Boolean).pop() ?? '';
  if (last === '') return 'index.html';
  return last.endsWith('.html') ? last : `${last}.html`;
};
