// Données structurées (JSON-LD, schema.org) : décrivent l’école aux moteurs de recherche et aux IA.
// Chaque page publie un graphe : l’école, le site, la page, et, sur l’accueil et la page Actualités,
// les portes ouvertes (même @id sur les deux pages : un seul événement pour les moteurs).
// Écrit dans le <head> par src/components/Referencement.astro ; vérifié par tests/referencement.test.ts.
// Les coordonnées viennent de src/data/site.ts et les portes ouvertes de src/data/openHouse.ts.
import { brand, contact } from './site';
import { openHouse } from './openHouse';

const nomDeLEcole = 'Les Petons dans l’Herbe';

const [rue, codePostalEtVille] = contact.address;
const [, codePostal, ville] = /^(\d{5})\s+(.+)$/.exec(codePostalEtVille) ?? [];
if (!codePostal || !ville) throw new Error('src/data/site.ts : la 2e ligne de l’adresse doit être « 44300 Nantes ».');

const adresse = {
  '@type': 'PostalAddress',
  streetAddress: rue,
  postalCode: codePostal,
  addressLocality: ville,
  addressRegion: 'Pays de la Loire',
  addressCountry: 'FR',
};

/** Communes d’où viennent les familles (carte de situation de la page d’accueil). */
const communes = [
  'Nantes',
  'Orvault',
  'Carquefou',
  'La Chapelle-sur-Erdre',
  'Treillières',
  'Sucé-sur-Erdre',
  'Sainte-Luce-sur-Loire',
  'Saint-Mars-du-Désert',
  // Hors de la carte : des familles viennent aussi de Héric.
  'Héric',
];
/** Toute la métropole et le département, au-delà des communes nommées. */
const territoires = ['Nantes Métropole', 'Loire-Atlantique'];

export interface PageDecrite {
  /** Adresse canonique de la page. */
  readonly url: string;
  readonly name: string;
  readonly description: string;
}

interface Options {
  readonly site: URL;
  readonly page: PageDecrite;
  /** Image de l’école (adresse relative au site), l’image de partage par défaut. */
  readonly image: string;
  /** Ajoute l’événement des portes ouvertes (src/data/openHouse.ts). */
  readonly portesOuvertes?: boolean;
}

export const donneesStructurees = ({ site, page, image, portesOuvertes = false }: Options) => {
  const absolue = (chemin: string): string => new URL(chemin, site).href;
  const accueil = absolue('/');
  const ecole = `${accueil}#ecole`;
  const siteWeb = `${accueil}#site`;

  const graphe: Array<Record<string, unknown>> = [
    {
      // School hérite d’Organization et de Place : adresse, horaires et association s’y déclarent.
      '@type': 'School',
      '@id': ecole,
      name: nomDeLEcole,
      alternateName: 'École Montessori Les Petons dans l’Herbe',
      description:
        'École Montessori associative hors contrat à Nantes Nord pour les enfants de 3 à 12 ans : une ambiance 3–6 ans, une ambiance 6–12 ans, une maison et près de 650 m² de jardin. Labellisée Eco-École depuis 2021. Ouverte en 2018, elle est la plus ancienne école Montessori de Nantes toujours en activité.',
      url: accueil,
      logo: absolue(brand.logo.src),
      image: absolue(image),
      email: contact.email,
      address: adresse,
      foundingDate: '2018',
      audience: { '@type': 'PeopleAudience', suggestedMinAge: 3, suggestedMaxAge: 12 },
      // Lundi, mardi, jeudi et vendredi : accueil périscolaire dès 8h15, classe de 8h45 à 16h15,
      // périscolaire jusqu’à 18h15 (page Informations pratiques). Le mercredi, l’école est fermée.
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Thursday', 'Friday'].map((jour) => `https://schema.org/${jour}`),
        opens: '08:15',
        closes: '18:15',
      },
      areaServed: [
        ...communes.map((commune) => ({ '@type': 'City', name: commune })),
        ...territoires.map((territoire) => ({ '@type': 'AdministrativeArea', name: territoire })),
      ],
      parentOrganization: { '@type': 'NGO', name: 'Constellation Montessori' },
      sameAs: [contact.instagram.href],
    },
    {
      '@type': 'WebSite',
      '@id': siteWeb,
      url: accueil,
      name: nomDeLEcole,
      inLanguage: 'fr-FR',
      publisher: { '@id': ecole },
    },
    {
      '@type': 'WebPage',
      '@id': page.url,
      url: page.url,
      name: page.name,
      description: page.description,
      inLanguage: 'fr-FR',
      isPartOf: { '@id': siteWeb },
      about: { '@id': ecole },
    },
  ];

  if (portesOuvertes) {
    graphe.push({
      '@type': 'Event',
      '@id': absolue(openHouse.href),
      name: `${openHouse.title} des Petons dans l’Herbe`,
      description: openHouse.summary,
      url: absolue(openHouse.href),
      image: [absolue(openHouse.illustration)],
      startDate: openHouse.start,
      endDate: openHouse.end,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      // Entrée libre, sans inscription.
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: 0,
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: absolue(openHouse.href),
      },
      location: { '@type': 'Place', name: nomDeLEcole, address: adresse },
      organizer: { '@id': ecole },
    });
  }

  return { '@context': 'https://schema.org', '@graph': graphe };
};
