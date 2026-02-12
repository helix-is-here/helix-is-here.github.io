const { createApp } = Vue;

/* =========================
   Components
========================= */

// Navbar component
const NavbarComponent = {
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark">
      <div class="container">
        <a class="navbar-brand" href="#">Morse Trainer</a>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto">
            <li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>
            <li class="nav-item"><a class="nav-link" href="trainer.html">Trainer</a></li>
          </ul>
        </div>
      </div>
    </nav>
  `
};

// Footer component
const FooterComponent = {
  template: `
    <footer>
      <div class="container">
        <small>&copy; 2026 Morse Trainer. All rights reserved.</small>
      </div>
    </footer>
  `
};

// Home page component
const HomePage = {
  template: `
    <div>
      <h1 class="mb-3">Welcome to Morse Trainer</h1>
      <p>This is a simple Vue + Bootstrap template for your Morse code app.</p>
      <a href="trainer.html" class="btn btn-primary">Go to Trainer</a>
    </div>
  `
};

// Trainer page component
const TrainerPage = {
  data() {
    return {
      message: "",
      chars: []
    };
  },
  methods: {
    generateDummyMessage() {
      this.message = "HELLO WORLD";
      this.chars = this.message.split("").map(c => c === " " ? " " : c);
    }
  },
  template: `
    <div>
      <h2 class="mb-3">Morse Trainer</h2>

      <div class="mb-3">
        <button class="btn btn-success me-2" @click="generateDummyMessage">Generate Message</button>
      </div>

      <div class="morse-message mt-3">
        <template v-for="(c, index) in chars" :key="index">
          <span v-if="c === ' '" class="morse-word-space"></span>
          <span v-else class="morse-char">{{ c }}</span>
        </template>
      </div>
    </div>
  `
};

/* =========================
   App Setup
========================= */

const app = createApp({
  components: {
    'navbar-component': NavbarComponent,
    'footer-component': FooterComponent
  },
  template: `<router-view></router-view>` // placeholder
});

// Simple multipage router (without Vue Router)
const routes = {
  'index.html': HomePage,
  'trainer.html': TrainerPage
};

// Mount correct page based on current URL
const page = window.location.pathname.split("/").pop() || 'index.html';
const pageComponent = routes[page] || HomePage;

// Mount Vue
createApp({
  components: {
    'navbar-component': NavbarComponent,
    'footer-component': FooterComponent,
    'router-view': pageComponent
  }
}).mount('#app');