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

// "De Stagiair" -> klein "De" + groot "STAGIAIR" op de cover.
export function mastParts(name = SITE.name) {
  let [first, ...rest] = name.trim().split(/\s+/)
  if (rest.length && first.length <= 3) {
    return { small: first, big: rest.join(' ').toUpperCase() }
  }
  return { small: '', big: name.toUpperCase() }
}
