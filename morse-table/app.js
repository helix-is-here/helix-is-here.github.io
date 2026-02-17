const MorseTablePage = {
  data() {
    return {
      morse: {
        A: ".-",
        B: "-...",
        C: "-.-.",
        D: "-..",
        E: ".",
        F: "..-.",
        G: "--.",
        H: "....",
        I: "..",
        J: ".---",
        K: "-.-",
        L: ".-..",
        M: "--",
        N: "-.",
        O: "---",
        P: ".--.",
        Q: "--.-",
        R: ".-.",
        S: "...",
        T: "-",
        U: "..-",
        V: "...-",
        W: ".--",
        X: "-..-",
        Y: "-.--",
        Z: "--.."
      }
    };
  },
  template: `
    <div>
      <h2 class="mb-4">Morse Code Table</h2>

      <div class="morse-grid">
        <div class="morse-card" v-for="(value, key) in morse" :key="key">
          <div class="morse-letter">{{ key }}</div>
          <div class="morse-code">{{ value }}</div>
        </div>
      </div>
    </div>
  `
};

Vue.createApp({
  components: {
    'navbar-component': NavbarComponent,
    'footer-component': FooterComponent,
    'morse-table-page': MorseTablePage
  }
}).mount('#app');
