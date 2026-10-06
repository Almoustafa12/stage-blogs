import React, { type CSSProperties, type ReactNode } from 'react'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { highlight } from 'sugar-high'
import { pad2, slugify } from 'app/blog/utils'
import { SITE } from 'app/site'

// ---------- kleine hulpjes ----------

const vars = (v: Record<string, string | number>) => v as CSSProperties

// Alle tekst uit een stuk JSX, zonder opmaak.
function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (React.isValidElement(node)) return textOf((node.props as any).children)
  return ''
}

// De <li>'s uit een lijst halen (ook als de lijst al door <List> ging).
function listItems(children: ReactNode): React.ReactElement[] {
  let found: React.ReactElement[] = []
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child) || found.length) return
    let props = child.props as any
    let kids = React.Children.toArray(props.children).filter(React.isValidElement)
    if (child.type === 'li') return
    if (kids.some((k: any) => k.type === 'li')) found = kids as React.ReactElement[]
    else found = listItems(props.children)
  })
  return found
}

// Een losse lijst-item: soms zit de tekst nog in een <p>.
function itemContent(li: React.ReactElement): ReactNode {
  let kids = React.Children.toArray((li.props as any).children)
  if (kids.length === 1 && React.isValidElement(kids[0]) && (kids[0] as any).type === 'p') {
    return (kids[0].props as any).children
  }
  return (li.props as any).children
}

// "Eerste zin. De rest." -> [eerste zin, rest]
function firstSentence(content: ReactNode): [ReactNode, ReactNode] {
  if (typeof content !== 'string') return [content, null]
  let m = content.match(/^(.+?[.!?])\s+(.+)$/s)
  return m ? [m[1], m[2]] : [content, null]
}

// "**Apotheek bestelt** in de webshop" -> ["Apotheek bestelt", "in de webshop"]
function strongHead(content: ReactNode): [ReactNode, ReactNode] {
  let kids = React.Children.toArray(content)
  let first = kids[0]
  if (React.isValidElement(first) && ((first as any).type === 'strong' || (first as any).type === Strong)) {
    let rest = kids.slice(1)
    let restText = textOf(rest).trim()
    return [(first.props as any).children, restText ? restText : null]
  }
  return [content, null]
}

// ---------- onderdelen van een artikel ----------

// ## Tussenkop
function H2({ children }) {
  let id = slugify(textOf(children))
  return (
    <h2 id={id} className="tk">
      <a href={`#${id}`}>{children}</a>
    </h2>
  )
}

function H3({ children }) {
  let id = slugify(textOf(children))
  return (
    <h3 id={id} className="tk3">
      {children}
    </h3>
  )
}

// > Citaat: groot, in de kleur van het nummer
function Quote({ children }) {
  return (
    <figure className="pq">
      <blockquote>{children}</blockquote>
    </figure>
  )
}

// **vet**: als met een markeerstift
function Strong({ children }) {
  return <strong className="mk">{children}</strong>
}

// - lijst
function List({ children }) {
  return <ul className="ls">{children}</ul>
}

// <Bon> met een lijst erin: een leveringsbon waarop elk punt wordt afgevinkt als je scrolt.
function Bon({ titel = 'Leveringsbon', children }: { titel?: string; children?: ReactNode }) {
  let items = listItems(children)
  return (
    <figure className="bon" data-bon="" style={vars({ '--n': items.length })}>
      <div className="bon-paper">
        <figcaption className="bon-head">
          <span className="bon-t">{titel}</span>
          <span className="bon-c">
            <span data-bon-count="">{items.length}</span> van {items.length} geleverd
          </span>
        </figcaption>
        <ol className="bon-list">
          {items.map((li, i) => {
            let [first, rest] = firstSentence(itemContent(li))
            return (
              <li className="bon-item" key={i} style={vars({ '--i': i })}>
                <span className="bon-box" aria-hidden="true">
                  <svg viewBox="0 0 20 20">
                    <path d="M4.5 10.5l3.6 3.6L15.8 6" />
                  </svg>
                </span>
                <span className="bon-text">
                  <b>{first}</b>
                  {rest && <> {rest}</>}
                </span>
              </li>
            )
          })}
        </ol>
        <p className="bon-foot" aria-hidden="true">
          <span>Afgetekend</span>
          <span className="bon-sign">{SITE.author.split(' ')[0]}</span>
        </p>
      </div>
    </figure>
  )
}

function OrderedList({ children }) {
  return <ol className="ls ls--n">{children}</ol>
}

// <Route titel="..."> met een lijst erin: een tijdlijn die zich tekent als je scrolt.
function Route({ titel, children }: { titel?: string; children?: ReactNode }) {
  let items = listItems(children)
  return (
    <figure className="route" data-route style={vars({ '--n': items.length })}>
      {titel && <figcaption className="route-cap">{titel}</figcaption>}
      <div className="route-body">
        <span className="route-rail" aria-hidden="true">
          <span className="route-fill" />
          <span className="route-pkg">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.5 21 7v10l-9 4.5L3 17V7l9-4.5Z" />
              <path d="M3 7l9 4.5L21 7M12 11.5V21.5" />
            </svg>
          </span>
        </span>
        <ol className="route-list">
          {items.map((li, i) => {
            let [name, sub] = strongHead(itemContent(li))
            return (
              <li className="route-stop" style={vars({ '--i': i })} key={i}>
                <span className="route-dot" aria-hidden="true">
                  {pad2(i + 1)}
                </span>
                <span className="route-name">{name}</span>
                {sub && <span className="route-sub">{sub}</span>}
              </li>
            )
          })}
        </ol>
      </div>
    </figure>
  )
}

// <Getal waarde="29" was="30">uitleg</Getal>: een groot getal dat doortelt.
function Getal({ waarde, was, children }: { waarde: string | number; was?: string | number; children?: ReactNode }) {
  let to = String(waarde)
  let from = was != null ? String(was) : ''
  let fromDigits = from.padStart(to.length, '0')
  return (
    <figure className="stat" data-stat>
      <div className="stat-row">
        {from && (
          <span className="stat-was" aria-label={`niet ${from}`}>
            {from}
          </span>
        )}
        <span className="stat-num" aria-label={to}>
          {to.split('').map((ch, i) =>
            /\d/.test(ch) ? (
              <span className="odo" aria-hidden="true" key={i}>
                <span
                  className="odo-strip"
                  style={vars({
                    '--d': Number(ch),
                    '--f': /\d/.test(fromDigits[i] || '') ? Number(fromDigits[i]) : 0,
                    '--k': i,
                  })}
                >
                  {Array.from({ length: 10 }, (_, n) => (
                    <span key={n}>{n}</span>
                  ))}
                </span>
              </span>
            ) : (
              <span aria-hidden="true" key={i}>
                {ch}
              </span>
            )
          )}
        </span>
      </div>
      {children && <figcaption className="stat-cap">{children}</figcaption>}
    </figure>
  )
}

function Hr() {
  return (
    <div className="orn" role="separator" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  )
}

function Img({ alt, ...props }) {
  return (
    <figure className="fig">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={alt || ''} loading="lazy" {...props} />
      {alt && <figcaption>{alt}</figcaption>}
    </figure>
  )
}

function A({ href = '', ...props }) {
  if (href.startsWith('/') || href.startsWith('#')) return <a href={href} {...props} />
  return <a href={href} target="_blank" rel="noopener noreferrer" {...props} />
}

function Code({ children, ...props }) {
  let codeHTML = highlight(children)
  return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />
}

function Table({ data }) {
  return (
    <table>
      <thead>
        <tr>
          {data.headers.map((header, index) => (
            <th key={index}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const components = {
  h2: H2,
  h3: H3,
  blockquote: Quote,
  strong: Strong,
  ul: List,
  ol: OrderedList,
  hr: Hr,
  img: Img,
  a: A,
  code: Code,
  Image: Img,
  Table,
  Route,
  Getal,
  Bon,
}

export function CustomMDX(props) {
  return <MDXRemote {...props} components={{ ...components, ...(props.components || {}) }} />
}
