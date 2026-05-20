export default function Footer() {
  return (
    <footer
      className="py-4 border-top border-secondary mt-5"
      style={{ background: 'rgba(0,0,0,0.3)' }}
    >
      <div className="container text-center">
        <div className="logo mb-3 fs-4">LIBRO<span>RANK</span></div>
        <div className="d-flex justify-content-center gap-4 mb-3">
          <a href="#" className="text-muted small text-decoration-none">Términos</a>
          <a href="#" className="text-muted small text-decoration-none">Privacidad</a>
          <a href="#" className="text-muted small text-decoration-none">Soporte</a>
        </div>
        <p className="text-muted small mb-0">
          &copy; {new Date().getFullYear()} LibroRank — Desarrollado por Juan Cruz Martin
        </p>
      </div>
    </footer>
  )
}
