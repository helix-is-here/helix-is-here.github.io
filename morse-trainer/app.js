const MorseTrainerPage = {
  template: `
    <div>
      <h2 class="mb-4">Morse Trainer</h2>
      <p>Coming soon...</p>
    </div>
  `
};

Vue.createApp({
  components: {
    'navbar-component': NavbarComponent,
    'footer-component': FooterComponent,
    'morse-trainer-page': MorseTrainerPage
  }
}).mount('#app');
