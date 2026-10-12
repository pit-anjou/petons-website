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
  permanente('/lecole{/}?', '/ecole-petons'),
  permanente('/qui-sommes-nous{/}?', '/equipe-petons'),
  permanente('/nous-rejoindre{/}?', '/equipe-petons#rejoindre'),
  permanente('/nos-valeurs{/}?', '/pedagogie-petons'),
  permanente('/la-vie-a-lecole{/}?', '/vie-pratique-petons'),
  permanente('/informations-pratiques{/}?', '/vie-pratique-petons'),
  // Fiches APE de l’ancien portfolio : le bureau de l’association est présenté sur la page Équipe.
  // Elles doivent précéder la règle générale /portfolio/…, la première règle qui correspond l’emporte.
  permanente('/portfolio/role-de-lape{/}?', '/equipe-petons#association'),
  permanente('/portfolio/roles-des-membres-de-lape{/}?', '/equipe-petons#association'),
  permanente('/portfolio/election-du-bureau{/}?', '/equipe-petons#association'),
  permanente('/portfolio/:page*{/}?', '/vie-pratique-petons#familles'),
  permanente('/journees-portes-ouvertes{/}?', '/actualites-petons#portes-ouvertes'),
  permanente('/tarifs{/}?', '/tarifs-petons'),
  permanente('/inscription{/}?', '/inscriptions-petons'),
  permanente('/contact{/}?', '/contact-petons'),
  permanente('/boite-a-idees{/}?', '/contact-petons'),
  permanente('/la-creche{/}?', '/'),
  // Relevées par la Search Console le 12 octobre 2026 : /le-lieu/ (déjà en 404 sur l’ancien site, encore
  // affichée en 8e position) et l’ancien dossier d’inscription, qui reçoit encore des clics.
  permanente('/le-lieu{/}?', '/ecole-petons'),
  permanente('/wp-content/uploads/2018/07/Dossier_Inscription_LPDLH_2018_2019.pdf', '/inscriptions-petons'),
  permanente('/feed{/}?', '/actualites-petons'),
  permanente('/category/:path*{/}?', '/'),
  permanente('/tag/:path*{/}?', '/'),
];
