const HomePage = {
  template: `
    <div>
      <h1 class="mb-3">Helix Signals</h1>
      <p class="lead">Training tools for communications.</p>
      <p>If you have any suggestions for new features or tools, please feel free to reach out.</p>
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
