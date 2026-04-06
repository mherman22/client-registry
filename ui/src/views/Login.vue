<template>
  <v-container fluid fill-height class="login-background">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-alert
          type="error"
          :value="authStatus"
          class="mb-4"
          outlined
          dense
        > {{ $t('auth_failed') }}
        </v-alert>
        <v-card class="login-card pa-6" elevation="2" rounded="lg">
          <div class="text-center mb-6">
            <v-icon size="56" color="primary" class="mb-3">mdi-shield-account</v-icon>
            <div class="text-h5 font-weight-medium">Open Client Registry</div>
            <div class="text-subtitle-2 grey--text text--darken-1 mt-1">Sign in to your account</div>
          </div>
          <v-form
            ref="form"
            class="px-2"
          >
            <v-text-field
              v-model="username"
              required
              outlined
              dense
              color="primary"
              :label="$t('labels_Username')"
              prepend-inner-icon="mdi-account-outline"
              @keyup.enter="authenticate()"
              @blur="$v.username.$touch()"
              @change="$v.username.$touch()"
              :error-messages="usernameErrors"
              class="mb-2"
            />
            <v-text-field
              v-model="password"
              required
              outlined
              dense
              type="password"
              color="primary"
              :label="$t('labels_Password')"
              prepend-inner-icon="mdi-lock-outline"
              @keyup.enter="authenticate()"
              @blur="$v.password.$touch()"
              @change="$v.password.$touch()"
              :error-messages="passwordErrors"
              class="mb-2"
            />
          </v-form>
          <div class="px-2 mt-2">
            <v-btn
              block
              color="primary"
              depressed
              large
              @click="authenticate()"
              :disabled="$v.$invalid"
              class="text-none font-weight-medium"
            >
              <v-icon left>mdi-login</v-icon>
              {{ $t('login') }}
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import { required } from "vuelidate/lib/validators";
import axios from "axios";
import VueCookies from "vue-cookies";
import { generalMixin } from "@/mixins/generalMixin";

export default {
  mixins: [generalMixin],
  validations: {
    username: { required },
    password: { required }
  },
  data() {
    return {
      username: "",
      password: "",
      authStatus: false
    };
  },
  methods: {
    authenticate() {
      let formData = new FormData();
      formData.append("username", this.username);
      formData.append("password", this.password);
      let params = { username: this.username, password: this.password };
      axios({
        method: "POST",
        url: "/ocrux/user/authenticate",
        params
      })
        .then(authResp => {
          this.countMatchIssues();
          this.countNewAutoMatches();
          this.getClients();
          this.$store.state.auth.token = authResp.data.token;
          this.$store.state.auth.username = this.username;
          this.$store.state.auth.userID = authResp.data.userID;
          this.$store.state.auth.role = authResp.data.role;
          VueCookies.config("30d");
          VueCookies.set("token", this.$store.state.auth.token, "infinity");
          VueCookies.set("userID", this.$store.state.auth.userID, "infinity");
          VueCookies.set(
            "username",
            this.$store.state.auth.username,
            "infinity"
          );
          this.$store.state.auth.role = authResp.data.role;
          if (!authResp.data.token) {
            this.authStatus = true;
          } else {
            this.$store.state.denyAccess = false;
            this.$router.push({
              name: "home"
            });
          }
        })
        .catch(err => {
          this.$store.state.progress.enable = false;
          this.$store.state.alert.show = true;
          this.$store.state.alert.width = "500px";
          this.$store.state.alert.msg = this.$t('login_failed');
          this.$store.state.alert.type = "error";
          if (err.hasOwnProperty("response")) {
            throw err;
          }
        });
    }
  },
  computed: {
    usernameErrors() {
      const errors = [];
      if (!this.$v.username.$dirty) return errors;
      !this.$v.username.required && errors.push(this.$t('username_required'));
      return errors;
    },
    passwordErrors() {
      const errors = [];
      if (!this.$v.password.$dirty) return errors;
      !this.$v.password.required && errors.push(this.$t('password_required'));
      return errors;
    }
  }
};
</script>
<style scoped>
.login-background {
  background: linear-gradient(135deg, #E3F2FD 0%, #FAFBFC 50%, #E0F7FA 100%);
  min-height: 100vh;
}
.login-card {
  border-top: 3px solid #1976D2;
}
</style>
