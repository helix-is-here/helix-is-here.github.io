const { createApp } = Vue;

/* =========================
   Shared Components
========================= */

const NavbarComponent = {
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" href="/">Helix Signals</a>
        <div>
          <ul class="navbar-nav me-auto flex-row gap-3">
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
    <footer class="bg-dark text-light py-3 mt-5">
      <div class="container text-center">
        <small>&copy; 2026 Helix Signals. Built by Jake Grover.</small>
      </div>
    </footer>
  `
};
