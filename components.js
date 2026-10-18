/* =========================
   Shared site chrome
   Pages include <div data-site-navbar></div> and <div data-site-footer></div>;
   this script fills them in.
   ========================= */

const NAV_LINKS = [
  { label: "Morse Table", href: "/morse-table/" },
  { label: "Morse Drop", href: "/morse-drop/" },
  { label: "ADF Ranks Quiz", href: "/adf-ranks-quiz/" },
  // not built yet: shown struck out and not clickable
  { label: "Flags Table" },
  { label: "Flags Quiz" }
];

function renderNavLink(link) {
  if (!link.href) {
    return `
      <li class="nav-item">
        <span class="nav-link nav-link-upcoming" aria-disabled="true" title="Coming soon">
          <s>${link.label}</s>
        </span>
      </li>`;
  }

  const isCurrent = window.location.pathname.startsWith(link.href);
  return `
    <li class="nav-item">
      <a class="nav-link${isCurrent ? " active" : ""}" href="${link.href}"${isCurrent ? ' aria-current="page"' : ""}>
        ${link.label}
      </a>
    </li>`;
}

function renderNavbar(container) {
  container.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark">
      <div class="container">
        <a class="navbar-brand" href="/">
          <img src="/assets/shell-outline-white.png" alt="Helix home">
        </a>
        <button class="navbar-toggler" type="button" aria-controls="site-nav-links" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="site-nav-links">
          <ul class="navbar-nav ms-auto">
            ${NAV_LINKS.map(renderNavLink).join("")}
          </ul>
        </div>
      </div>
    </nav>`;

  const toggler = container.querySelector(".navbar-toggler");
  const links = container.querySelector("#site-nav-links");
  toggler.addEventListener("click", () => {
    const isOpen = links.classList.toggle("show");
    toggler.setAttribute("aria-expanded", String(isOpen));
  });
}

function renderFooter(container) {
  container.innerHTML = `
    <footer class="text-light">
      <div class="container">
        <small>Built by Jake Grover | <a href="mailto:grover.jake.t@gmail.com">grover.jake.t@gmail.com</a></small>
      </div>
    </footer>`;
}

document.querySelectorAll("[data-site-navbar]").forEach(renderNavbar);
document.querySelectorAll("[data-site-footer]").forEach(renderFooter);
