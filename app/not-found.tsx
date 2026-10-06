export default function NotFound() {
  return (
    <div id="pg" className="pg pg--404" data-page="404">
      <main className="nf">
        <p className="nf-k">Fout 404</p>
        <h1 className="nf-h">Deze pagina bestaat niet</h1>
        <p className="nf-p">Misschien is het adres verkeerd getypt.</p>
        <a className="nf-a" href="/">
          Naar alle weken
        </a>
      </main>
    </div>
  )
}
