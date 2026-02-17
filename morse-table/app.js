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

      <table class="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Character</th>
            <th>Morse</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(value, key) in morse" :key="key">
            <td><strong>{{ key }}</strong></td>
            <td>{{ value }}</td>
          </tr>
        </tbody>
      </table>
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
