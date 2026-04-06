<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6" lg="5">
        <v-card elevation="1" rounded="lg">
          <div class="pa-4" style="background-color: #E3F2FD;">
            <div class="d-flex align-center">
              <v-icon left color="primary">mdi-lock-reset</v-icon>
              <div class="text-h6 font-weight-medium">{{ $t('account_change_password') }}</div>
            </div>
          </div>
          <v-divider></v-divider>
          <v-form
            ref="form"
            class="pa-6"
          >
            <v-text-field
              required
              @blur="$v.password.$touch()"
              @change="$v.password.$touch()"
              :error-messages="passwordErrors"
              v-model="password"
              type="password"
              outlined
              dense
              color="primary"
              :label="$t('current_password')"
              class="mb-1"
            />
            <v-text-field
              required
              @blur="$v.newpassword.$touch()"
              @change="$v.newpassword.$touch()"
              :error-messages="newpasswordErrors"
              v-model="newpassword"
              type="password"
              outlined
              dense
              color="primary"
              :label="$t('new_passord')"
              class="mb-1"
            />
            <v-text-field
              v-model="retype_newpassword"
              :label="$t('retype_password')"
              required
              type="password"
              outlined
              dense
              color="primary"
              :error-messages="retype_newpasswordErrors"
              @blur="$v.retype_newpassword.$touch()"
              @change="$v.retype_newpassword.$touch()"
            />
          </v-form>
          <v-divider />
          <v-card-actions class="pa-4">
            <v-btn
              text
              @click="$refs.form.reset()"
              class="text-none"
              color="secondary"
            >
              <v-icon left small>mdi-eraser</v-icon>{{ $t('clear') }}
            </v-btn>
            <v-spacer />
            <v-btn
              depressed
              :disabled="$v.$invalid"
              color="primary"
              @click="changePassword()"
              class="text-none"
            >
              <v-icon left small>mdi-lock-check</v-icon>{{ $t('password_change') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import axios from "axios";
import { required } from "vuelidate/lib/validators";

export default {
  validations: {
    newpassword: { required },
    retype_newpassword: { required },
    password: { required }
  },
  data() {
    return {
      password: "",
      newpassword: "",
      retype_newpassword: ""
    };
  },

  computed: {
    newpasswordErrors() {
      const errors = [];
      if (!this.$v.newpassword.$dirty) return errors;
      !this.$v.newpassword.required && errors.push(this.$t('new_password_required'));
      return errors;
    },
    retype_newpasswordErrors() {
      const errors = [];
      if (!this.$v.retype_newpassword.$dirty) return errors;
      !this.$v.retype_newpassword.required && errors.push(this.$t('retype_new_password'));
      return errors;
    },
    passwordErrors() {
      const errors = [];
      if (!this.$v.password.$dirty) return errors;
      !this.$v.password.required && errors.push(this.$t('password_required'));
      return errors;
    }
  },
  methods: {
    changePassword() {
      if (this.newpassword !== this.retype_newpassword) {
        this.$store.state.alert.show = true;
        this.$store.state.alert.width = "500px";
        this.$store.state.alert.msg = this.$t('new_password_mismatch');
        this.$store.state.alert.type = "error";
        return;
      }
      this.$store.state.progress.enable = true;
      this.$store.state.progress.width = "300px";
      this.$store.state.progress.title = this.$t('changing_password')
      let formData = new FormData();
      formData.append("password", this.password);
      formData.append("username", this.$store.state.auth.username);
      formData.append("newpassword", this.newpassword);
      axios
        .post("/ocrux/user/changepassword/", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        })
        .then(() => {
          this.$store.state.progress.enable = false;
          this.$store.state.alert.show = true;
          this.$store.state.alert.width = "500px";
          this.$store.state.alert.msg = this.$t('password_changed');
          this.$store.state.alert.type = "success";
          this.$refs.form.reset();
        })
        .catch((error) => {
          let msg = ""
          if (error.response) {
            msg = error.response.data
          } else if (error.request) {
            msg = error.request
          } else if(error.message) {
            msg = error.message
          } else {
            msg = this.$t('error_occured')
          }
          this.$store.state.progress.enable = false;
          this.$store.state.alert.show = true;
          this.$store.state.alert.width = "500px";
          this.$store.state.alert.msg = msg
          this.$store.state.alert.type = "error";
        });
    }
  }
};
</script>
