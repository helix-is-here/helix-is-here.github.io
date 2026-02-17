const NavbarComponent = {
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark">
      <div class="container">
        <a class="navbar-brand" href="/">
          <img src="/favicon-white.png" alt="Helix Signals">
          <span>Helix Signals</span>
        </a>
        <div>
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <a class="nav-link" href="/">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/morse-table/">Morse Table</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/morse-trainer/">Morse Trainer</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `
};

const FooterComponent = {
  template: `
    <footer class="text-light">
      <div class="container">
        <small>&copy; 2026 Helix Signals. Built by Jake Grover.</small>
      </div>
    </footer>
  `
};