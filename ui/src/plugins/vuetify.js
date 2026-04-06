import Vue from "vue";
import Vuetify from "vuetify/lib";

Vue.use(Vuetify);

export default new Vuetify({
    theme: {
    options: {
      customProperties: true
    },
    themes: {
      light: {
        primary: {
          base: "#1976D2",
          darken1: "#1565C0",
          darken2: "#0D47A1",
          lighten1: "#BBDEFB",
          lighten2: "#E3F2FD"
        },
        secondary: {
          base: "#424242",
          darken1: "#212121",
          lighten1: "#757575"
        },
        accent: "#00BCD4",
        error: "#F44336",
        info: "#1976D2",
        success: "#4CAF50",
        warning: "#FF9800",
        background: "#FAFBFC"
      }
    }
  }
});
