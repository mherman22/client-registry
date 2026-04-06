<template>
  <v-container fluid>
    <v-dialog
      v-model="editDialog"
      persistent
      :overlay="false"
      max-width="500px"
      transition="dialog-transition"
    >
      <v-card rounded="lg">
        <div class="pa-4 d-flex align-center" style="background-color: #E3F2FD;">
          <v-icon left color="primary">mdi-account-edit-outline</v-icon>
          <div class="text-h6 font-weight-medium">{{user.userName}}</div>
          <v-spacer></v-spacer>
          <v-btn icon small @click="editDialog = false"><v-icon small>mdi-close</v-icon></v-btn>
        </div>
        <v-divider></v-divider>
        <v-card-text class="pa-6">
          <v-form
            ref="form"
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
              :label="$t('user_role')"
              class="mb-1"
            ></v-autocomplete>
            <v-autocomplete
              v-model="status"
              :items="statuses"
              item-text="name"
              item-value="value"
              @blur="$v.status.$touch()"
              @change="$v.status.$touch()"
              :error-messages="statusErrors"
              outlined
              dense
              color="primary"
              :label="$t('patient_status')"
            ></v-autocomplete>
          </v-form>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            depressed
            :disabled="$v.$invalid"
            color="primary"
            @click="saveChanges()"
            class="text-none"
          >
            <v-icon left small>mdi-content-save</v-icon>{{ $t('save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <div class="d-flex align-center mb-4">
      <div>
        <div class="text-h5 font-weight-medium">{{ $t('users_list') }}</div>
        <div class="text-subtitle-2 grey--text">Manage system users</div>
      </div>
      <v-spacer></v-spacer>
    </div>
    <v-card elevation="1" rounded="lg" class="mx-auto" max-width="1200">
      <v-card-title class="pa-4">
        <v-text-field
          v-model="searchUsers"
          prepend-inner-icon="mdi-magnify"
          label="Search"
          single-line
          hide-details
          outlined
          dense
          rounded
          clearable
        ></v-text-field>
      </v-card-title>
      <v-divider></v-divider>
      <v-data-table
        :headers="usersHeader"
        :items="users"
        :search="searchUsers"
        :loading='loadingUsers'
        :footer-props="{
        'items-per-page-text':this.$t('row_per_page')}"
        :no-data-text="$t('no_data')"
      >
        <v-progress-linear
          slot="progress"
          color="primary"
          indeterminate
        ></v-progress-linear>
        <template
          v-slot:item="{ item }"
        >
          <tr>
            <td class="py-3">{{item.firstName}}</td>
            <td class="py-3">{{item.surname}}</td>
            <td class="py-3">{{item.otherName}}</td>
            <td class="py-3">{{item.userName}}</td>
            <td class="py-3" v-if='item.role'>
              <v-chip small label :color="item.role === 'admin' ? 'primary' : 'accent'" dark>{{item.role}}</v-chip>
            </td>
            <td class="py-3" v-else></td>
            <td class="py-3">
              <v-chip small label :color="item.status === 'active' ? 'success' : 'grey'" dark>{{item.status}}</v-chip>
            </td>
            <td class="py-3">
              <v-btn
                small
                outlined
                color="primary"
                @click="edit(item)"
                class="text-none"
              ><v-icon left small>mdi-pencil</v-icon>Edit</v-btn>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>
<script>
import axios from 'axios'
import { required } from 'vuelidate/lib/validators'
import { generalMixin } from '../mixins/generalMixin'

export default {
  mixins: [generalMixin],
  validations: {
    role: { required },
    firstName: { required },
    surname: { required },
    status: { required }
  },
  data () {
    return {
      users: [],
      user: {},
      id: '',
      firstName: "",
      otherName: "",
      surname: "",
      role: "",
      status: '',
      roles: [{
        name: 'Admin',
        value: 'admin'
      }, {
        name: 'Deduplication',
        value: 'deduplication'
      }],
      statuses: [{
        name: 'Active',
        value: 'active'
      }, {
        name: 'InActive',
        value: 'inactive'
      }],
      editDialog: false,
      loadingUsers: false,
      searchUsers: '',
      alertSuccess: false,
      alertFail: false,
      alertMsg: ''
    }
  },
  methods: {
    edit (item) {
      this.user = item
      this.editDialog = true
      this.firstName = item.firstName
      this.otherName = item.otherName
      this.surname = item.surname
      this.role = item.role
      this.status = item.status
      this.id = item.id
    },
    saveChanges () {
      this.$store.state.progress.enable = true;
      this.$store.state.progress.width = "300px";
      this.$store.state.progress.title = "Saving Changes"
      let formData = new FormData();
      formData.append("firstName", this.firstName);
      formData.append("otherName", this.otherName);
      formData.append("surname", this.surname);
      formData.append("role", this.role);
      formData.append("status", this.status);
      formData.append("id", this.id);
      axios
        .post("/ocrux/user/editUser/", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        })
        .then(() => {
          this.editDialog = false
          this.$store.state.progress.enable = false;
          this.$store.state.alert.show = true;
          this.$store.state.alert.width = "500px";
          this.$store.state.alert.msg = "User added successfully";
          this.$store.state.alert.type = "success";
          this.$refs.form.reset();
          this.getUsers()
        })
        .catch(() => {
          this.$store.state.progress.enable = false;
          this.$store.state.alert.show = true;
          this.$store.state.alert.width = "500px";
          this.$store.state.alert.msg =
            "This user was not added, ensure userName is not used";
          this.$store.state.alert.type = "error";
        });
    },
    getUsers () {
      let formData = new FormData()
      formData.append('username', this.username)
      formData.append('password', this.password)
      this.users = []
      this.loadingUsers = true
      axios.get('/ocrux/user/getUsers/').then((users) => {
        this.loadingUsers = false
        this.users = users.data
      }).catch((err) => {
        this.loadingUsers = false
        if (err.hasOwnProperty('response')) {
          console.log(err.response.data.error)
        }
      })
    }
  },
  computed: {
    usersHeader() {
      return [
        { text:  this.$t('given_names'), value: 'firstName' },
        { text:  this.$t('surname'), value: 'surname' },
        { text:  this.$t('other_name'), value: 'otherName' },
        { text:  this.$t('username'), value: 'username' },
        { text:  this.$t('user_role'), value: 'role' },
        { text:  this.$t('patient_status'), value: 'status' }
      ]
    },
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
    roleErrors() {
      const errors = [];
      if (!this.$v.role.$dirty) return errors;
      !this.$v.role.required && errors.push("Role is missing");
      return errors;
    },
    statusErrors() {
      const errors = [];
      if (!this.$v.status.$dirty) return errors;
      !this.$v.status.required && errors.push("Status is missing");
      return errors;
    }
  },
  created () {
    this.getUsers()
  }
}
</script>
<style scoped>
.v-data-table >>> tbody tr:hover {
  background-color: #F5F8FA !important;
}
.v-data-table >>> thead th {
  font-weight: 600 !important;
  text-transform: uppercase;
  font-size: 0.75rem !important;
  letter-spacing: 0.05em;
  color: #616161 !important;
}
</style>
