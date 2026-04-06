<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6" lg="5">
        <v-card elevation="1" rounded="lg">
          <div class="pa-4" style="background-color: #E3F2FD;">
            <div class="d-flex align-center">
              <v-icon left color="primary">mdi-account-plus-outline</v-icon>
              <div class="text-h6 font-weight-medium">{{ $t('account_add') }}</div>
            </div>
          </div>
          <v-divider></v-divider>
          <v-form
            ref="form"
            class="pa-6"
          >
            <v-text-field
              required
              @blur="$v.firstName.$touch()"
              @change="$v.firstName.$touch()"
              :error-messages="firstnameErrors"
              v-model="firstName"
              outlined
              dense
              color="primary"
              :label="$t('given_names')"
              class="mb-1"
            />
            <v-text-field
              v-model="otherName"
              outlined
              dense
              color="primary"
              :label="$t('middle_names')"
              class="mb-1"
            />
            <v-text-field
              required
              @blur="$v.surname.$touch()"
              @change="$v.surname.$touch()"
              :error-messages="surnameErrors"
              v-model="surname"
              outlined
              dense
              color="primary"
              :label="$t('surname')"
              class="mb-1"
            />
            <v-text-field
              required
              @blur="$v.userName.$touch()"
              @change="$v.surname.$touch()"
              :error-messages="usernameErrors"
              v-model="userName"
              outlined
              dense
              color="primary"
              :label="$t('username')"
              class="mb-1"
            />
            <v-autocomplete
              v-model="role"
              :items="roles"
              item-text="name"
              item-value="value"
              @blur="$v.role.$touch()"
              @change="$v.role.$touch()"
              :error-messages="roleErrors"
              outlined
              dense
              color="primary"
              label="Role"
              class="mb-1"
            ></v-autocomplete>
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
              :label="$t('labels_Password')"
              class="mb-1"
            />
            <v-text-field
              v-model="retype_password"
              :label="$t('retype_password')"
              required
              type="password"
              outlined
              dense
              color="primary"
              :error-messages="retype_passwordErrors"
              @blur="$v.retype_password.$touch()"
              @change="$v.retype_password.$touch()"
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
              @click="addUser()"
              class="text-none"
            >
              <v-icon left small>mdi-account-plus</v-icon>{{ $t('user.add') }}
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
    userName: { required },
    role: { required },
    retype_password: { required },
    password: { required },
    firstName: { required },
    surname: { required }
  },
  data() {
    return {
      firstName: "",
      otherName: "",
      surname: "",
      userName: "",
      role: "",
      password: "",
      retype_password: "",
      roles: [{
        name: 'Admin',
        value: 'admin'
      }, {
        name: 'Deduplication',
        value: 'deduplication'
      }]
    };
  },

  computed: {
    firstnameErrors() {
      const errors = [];
      if (!this.$v.firstName.$dirty) return errors;
      !this.$v.firstName.required && errors.push("First Name is required");
      return errors;
    },
    surnameErrors() {
      const errors = [];
      if (!this.$v.surname.$dirty) return errors;
      !this.$v.surname.required && errors.push("Surname is required");
      return errors;
    },
    usernameErrors() {
      const errors = [];
      if (!this.$v.userName.$dirty) return errors;
      !this.$v.userName.required && errors.push(this.$t('username_required'));
      return errors;
    },
    passwordErrors() {
      const errors = [];
      if (!this.$v.password.$dirty) return errors;
      !this.$v.password.required && errors.push(this.$('password_required'));
      return errors;
    },
    retype_passwordErrors() {
      const errors = [];
      if (!this.$v.retype_password.$dirty) return errors;
      !this.$v.retype_password.required && errors.push("Re-type Password");
      return errors;
    },
    roleErrors() {
      const errors = [];
      if (!this.$v.role.$dirty) return errors;
      !this.$v.role.required && errors.push("Role is missing");
      return errors;
    }
  },
  methods: {
    addUser() {
      if (this.password !== this.retype_password) {
        this.$store.state.dialogError = true;
        this.$store.state.errorTitle = "Error";
        this.$store.state.errorDescription = "Password mismatch";
        return;
      }
      this.$store.state.progress.enable = true;
      this.$store.state.progress.width = "300px";
      this.$store.state.progress.title = "Saving User"
      let formData = new FormData();
      formData.append("firstName", this.firstName);
      formData.append("otherName", this.otherName);
      formData.append("password", this.password);
      formData.append("userName", this.userName);
      formData.append("role", this.role);
      formData.append("surname", this.surname);
      axios
        .post("/ocrux/user/addUser/", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        })
        .then(() => {
          this.$store.state.progress.enable = false;
          this.$store.state.alert.show = true;
          this.$store.state.alert.width = "500px";
          this.$store.state.alert.msg = "User added successfully";
          this.$store.state.alert.type = "success";
          this.$refs.form.reset();
        })
        .catch(() => {
          this.$store.state.progress.enable = false;
          this.$store.state.alert.show = true;
          this.$store.state.alert.width = "500px";
          this.$store.state.alert.msg =
            "This user was not added, ensure userName is not used";
          this.$store.state.alert.type = "error";
        });
    }
  }
};
</script>
