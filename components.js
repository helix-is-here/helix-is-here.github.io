const NavbarComponent = {
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark">
      <div class="container">
        <a class="navbar-brand" href="/">
          <img src="/assets/shell-outline-white.png" alt="Helix">
        </a>
        <div>
          <ul class="navbar-nav ms-auto">
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
        <small>Built by Jake Grover | <a href="mailto:grover.jake.t@gmail.com">grover.jake.t@gmail.com</a></small>
      </div>
    </footer>
  `
};