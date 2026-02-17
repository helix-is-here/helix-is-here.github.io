const HomePage = {
  template: `
    <div>
      <h1 class="mb-3">Helix Signals</h1>
      <p class="lead">Training tools for communications.</p>

      <div class="mt-4">
        <a href="/morse-table/" class="btn btn-outline-primary me-2">
          View Morse Table
        </a>
        <a href="/morse-trainer/" class="btn btn-primary">
          Launch Morse Trainer
        </a>
      </div>
    </div>
  `
};

Vue.createApp({
  components: {
    'navbar-component': NavbarComponent,
    'footer-component': FooterComponent,
    'home-page': HomePage
  }
}).mount('#app');
