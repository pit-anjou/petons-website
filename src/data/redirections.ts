// Redirections des adresses de l’ancien site WordPress vers les pages Astro (plan : docs/plan-de-redirection.md).
// Syntaxe des redirections Vercel : `{/}?` accepte l’adresse avec ou sans barre finale, `:page*` tout ce qui suit.
// src/integrations/redirections-vercel.ts les écrit dans le routage produit par l’adaptateur Vercel ;
// tests/redirections.test.ts vérifie chaque ligne, et leur présence dans .vercel/output/config.json.

export interface Redirection {
  readonly source: string;
  readonly destination: string;
  /** Toujours vrai : redirection permanente (308). */
  readonly permanent: true;
}

const permanente = (source: string, destination: string): Redirection => ({ source, destination, permanent: true });

export const redirections: ReadonlyArray<Redirection> = [
  permanente('/ecole-montessori-nantes{/}?', '/'),
  permanente('/lecole{/}?', '/ecole-petons.html'),
  permanente('/qui-sommes-nous{/}?', '/equipe-petons.html'),
  permanente('/nous-rejoindre{/}?', '/equipe-petons.html#rejoindre'),
  permanente('/nos-valeurs{/}?', '/pedagogie-petons.html'),
  permanente('/la-vie-a-lecole{/}?', '/vie-pratique-petons.html'),
  permanente('/informations-pratiques{/}?', '/vie-pratique-petons.html'),
  // Fiches APE de l’ancien portfolio : le bureau de l’association est présenté sur la page Équipe.
  // Elles doivent précéder la règle générale /portfolio/…, la première règle qui correspond l’emporte.
  permanente('/portfolio/role-de-lape{/}?', '/equipe-petons.html#association'),
  permanente('/portfolio/roles-des-membres-de-lape{/}?', '/equipe-petons.html#association'),
  permanente('/portfolio/election-du-bureau{/}?', '/equipe-petons.html#association'),
  permanente('/portfolio/:page*{/}?', '/vie-pratique-petons.html#familles'),
  permanente('/journees-portes-ouvertes{/}?', '/actualites-petons.html#portes-ouvertes'),
  permanente('/tarifs{/}?', '/tarifs-petons.html'),
  permanente('/inscription{/}?', '/inscriptions-petons.html'),
  permanente('/contact{/}?', '/contact-petons.html'),
  permanente('/boite-a-idees{/}?', '/contact-petons.html'),
  permanente('/la-creche{/}?', '/'),
  // Relevées par la Search Console le 12 octobre 2026 : /le-lieu/ (déjà en 404 sur l’ancien site, encore
  // affichée en 8e position) et l’ancien dossier d’inscription, qui reçoit encore des clics.
  permanente('/le-lieu{/}?', '/ecole-petons.html'),
  permanente('/wp-content/uploads/2018/07/Dossier_Inscription_LPDLH_2018_2019.pdf', '/inscriptions-petons.html'),
  permanente('/feed{/}?', '/actualites-petons.html'),
  permanente('/category/:path*{/}?', '/'),
  permanente('/tag/:path*{/}?', '/'),
];
