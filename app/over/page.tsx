import { ABOUT, SITE } from 'app/site'
import { Colofon } from 'app/components/magazine'
import { TopBar } from 'app/components/lists'

export const metadata = {
  title: 'Over mij',
  description: `Wie ik ben en wat ik doe tijdens mijn stage bij ${SITE.company}.`,
  alternates: { canonical: '/over' },
}

// Over mij: een korte cv met de gegevens van mijn stage (tekst in app/site.ts).
export default function AboutPage() {
  return (
    <div id="pg" className="pg pg--list" data-page="about">
      <header className="mh">
        <TopBar />
      </header>
      <article className="toc list about" aria-labelledby="about-h">
        <p className="list-kicker">Over mij</p>
        <h1 id="about-h" className="list-h">
          {SITE.author}
        </h1>
        <p className="about-intro">{ABOUT.intro}</p>
        <dl className="about-facts">
          {ABOUT.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
        {ABOUT.sections.map((section) => (
          <section className="about-sec" key={section.title}>
            <h2 className="about-h">{section.title}</h2>
            {section.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </section>
        ))}
        <p className="about-more">
          <a className="tag" href="/#inhoud">
            Lees mijn blogs
          </a>
        </p>
      </article>
      <Colofon />
    </div>
  )
}
