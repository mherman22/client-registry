<template>
  <v-app>
    <v-app-bar
      app
      color="white"
      clipped-right
      elevation="1"
    >
      <v-toolbar-title class="text-h6 font-weight-medium primary--text">
        Open Client Registry
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items v-if='!$store.state.denyAccess'>
        <v-btn
          text
          to="/"
          class="text-none"
        >
          <v-icon left small>mdi-home</v-icon> {{ $t('menu_home') }}
        </v-btn>
        <v-btn
          text
          to="/review"
          class="text-none"
        >
          <v-icon left small>mdi-alert-circle-outline</v-icon>
          {{ $t('menu_action_required') }}
          <v-chip
            v-if="displayActionRequiredBadge"
            color="error"
            x-small
            class="ml-2 white--text"
          >{{ $store.state.totalMatchIssues }}</v-chip>
        </v-btn>
        <v-btn
          text
          to="/automatch"
          class="text-none"
        >
          <v-icon left small>mdi-link-variant</v-icon>
          {{ $t('menu_auto_matches') }}
          <v-chip
            v-if="displayAutoMatchBadge"
            color="warning"
            x-small
            class="ml-2 white--text"
          >{{ $store.state.totalAutoMatches }}</v-chip>
        </v-btn>
        <v-btn
          text
          to="/csvreport"
          class="text-none"
        >
          <v-icon left small>mdi-file-chart-outline</v-icon>{{ $t('menu_csv') }}
        </v-btn>
        <v-btn
          text
          to="/audit"
          class="text-none"
        >
          <v-icon left small>mdi-clipboard-text-clock-outline</v-icon>Audit Log
        </v-btn>
        <v-menu
          bottom
          offset-y
          v-if='$store.state.auth.role !== "deduplication"'
        >
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              text
              class="text-none"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon left small>mdi-account-circle-outline</v-icon>
              {{ $t('menu_accounts') }}
              <v-icon right small>mdi-chevron-down</v-icon>
            </v-btn>
          </template>

          <v-list dense>
            <v-list-item to="/addUser">
              <v-list-item-icon><v-icon small>mdi-account-plus-outline</v-icon></v-list-item-icon>
              <v-list-item-content><v-list-item-title>{{ $t('account_add') }}</v-list-item-title></v-list-item-content>
            </v-list-item>
            <v-list-item to="/usersList">
              <v-list-item-icon><v-icon small>mdi-account-group-outline</v-icon></v-list-item-icon>
              <v-list-item-content><v-list-item-title>{{ $t('account_list') }}</v-list-item-title></v-list-item-content>
            </v-list-item>
            <v-list-item to="/changePassword">
              <v-list-item-icon><v-icon small>mdi-lock-reset</v-icon></v-list-item-icon>
              <v-list-item-content><v-list-item-title>{{ $t('account_change_password') }}</v-list-item-title></v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-toolbar-items>
      <div v-if='!$store.state.denyAccess' class="lang-toggle ml-2">
        <v-btn
          v-for="entry in languages"
          :key="entry.title"
          text
          x-small
          class="text-none mx-1"
          @click="$i18n.locale=entry.language"
        >
          {{ entry.title }}
        </v-btn>
      </div>
      <v-divider vertical class="mx-2" v-if='!$store.state.denyAccess'></v-divider>
      <v-btn
        text
        to="/logout"
        v-if='!$store.state.denyAccess'
        class="text-none"
        color="secondary"
      >
        <v-icon left small>mdi-logout</v-icon> {{ $t('menu_logout') }}
      </v-btn>
    </v-app-bar>

    <v-main class="app-background">
      <v-container fluid class="pa-4">
        <v-alert
          v-model="$store.state.alert.show"
          :type="$store.state.alert.type"
          :dismissible="$store.state.alert.dismisible"
          :transition="$store.state.alert.transition"
          class="mx-auto mb-4"
          max-width="600"
          outlined
          dense
        >
          {{ $store.state.alert.msg }}
        </v-alert>
        <v-dialog
          v-model="$store.state.progress.enable"
          persistent
          :width="$store.state.progress.width"
        >
          <v-card class="pa-4">
            <v-card-text class="text-center">
              <div class="text-subtitle-1 mb-3">{{$store.state.progress.title}}</div>
              <v-progress-linear
                indeterminate
                color="primary"
                rounded
                height="4"
              ></v-progress-linear>
            </v-card-text>
          </v-card>
        </v-dialog>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import VueCookies from "vue-cookies";
import axios from "axios";
import { generalMixin } from "@/mixins/generalMixin";

export default {
  name: "App",
  mixins: [generalMixin],
  data() {
    return {
      totalMatchIssues: 0,
      totalAutoMatches: 0,
      languages: [
            { flag: 'us', language: 'en', title: 'English' },
            { flag: 'fr', language: 'fr', title: 'Francais' }
        ]
    }
  },
  created() {
    if (VueCookies.get("token") && VueCookies.get("userID")) {
      this.$store.state.auth.token = VueCookies.get("token");
      this.$store.state.auth.userID = VueCookies.get("userID");
      this.$store.state.auth.username = VueCookies.get("username");
      axios.get("/ocrux/isTokenActive/").then(() => {
        this.$store.state.denyAccess = false;
        axios
          .get("/ocrux/config/getURI")
          .then(response => {
            this.$store.state.systemURI = response.data;
          })
          .catch(err => {
            throw err;
          });
        this.getClients();
      });
    }
    this.countMatchIssues();
    this.countNewAutoMatches();
  },
  computed: {
    displayActionRequiredBadge() {
      if(this.$store.state.totalMatchIssues > 0) {
        return true
      }
      return false
    },
    displayAutoMatchBadge() {
      if(this.$store.state.totalAutoMatches > 0) {
        return true
      }
      return false
    }
  }
};
</script>
<style scoped>
.app-background {
  background-color: #FAFBFC;
}
.lang-toggle .v-btn {
  min-width: auto;
  letter-spacing: normal;
}
</style>
