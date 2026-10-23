// Alles over de site zelf staat op één plek.
// Wil je een andere naam voor het tijdschrift? Verander dan alleen `name`.
export const SITE = {
  name: 'Blog',
  author: 'Almoustafa El handouz',
  company: 'Nexu',
  place: 'Brasschaat',
  school: 'Graduaat Programmeren aan AP Hogeschool',
  intro:
    'Ik ben Almoustafa El handouz en ik loop stage bij Nexu. Elke week plaats ik hier een blog over wat ik die week gedaan en geleerd heb.',
  description: 'Elke week een blog over mijn stage bij Nexu.',
}

// De pagina "Over mij" (/over). Pas de tekst gerust aan: elk blok is een titel met regels eronder.
export const ABOUT = {
  intro:
    'Ik ben Almoustafa, student programmeren aan AP Hogeschool. Tijdens mijn stage bij Nexu leer ik hoe een ERP-systeem een bedrijf draait, en bouw ik er zelf mee.',
  facts: [
    { label: 'Naam', value: 'Almoustafa El handouz' },
    { label: 'Opleiding', value: 'Graduaat Programmeren, AP Hogeschool (Antwerpen)' },
    { label: 'Stage', value: 'Nexu, Brasschaat' },
    { label: 'Rol', value: 'Stagiair Odoo-ontwikkelaar' },
  ],
  sections: [
    {
      title: 'Waar ik stage loop',
      lines: [
        'Nexu is een Odoo-partner in Brasschaat. Ze zetten Odoo op voor bedrijven: verkoop, inkoop, voorraad en boekhouding in één systeem, en ze passen het aan waar een bedrijf iets extra nodig heeft.',
      ],
    },
    {
      title: 'Wat ik doe',
      lines: [
        'Ik bouw ERP-systemen in Odoo voor de klanten van Nexu.',
        'Daarbij hoort alles wat een bedrijf nodig heeft: een volledige webshop, verkoop, inkoop, voorraad, levering en facturatie.',
      ],
    },
    {
      title: 'Mijn rol',
      lines: [
        'Ik stel Odoo in waar het kan en schrijf eigen uitbreidingen (Python en XML) waar het nodig is.',
        'Ik test alles zoals de mensen die het echt gebruiken: als klant , een verkoper, een inkoper en het magazijn.',
        'Ik zoek fouten uit tot ik weet waar ze vandaan komen, en los ze op.',
      ],
    },
    {
      title: 'Waar ik al mee werkte',
      lines: ['Python, C#, React Native, Odoo, Docker, Supabase, n8n en lokale AI-modellen (Ollama).'],
    },
  ],
}

// "De Stagiair" -> klein "De" + groot "STAGIAIR" op de cover.
export function mastParts(name = SITE.name) {
  let [first, ...rest] = name.trim().split(/\s+/)
  if (rest.length && first.length <= 3) {
    return { small: first, big: rest.join(' ').toUpperCase() }
  }
  return { small: '', big: name.toUpperCase() }
}
