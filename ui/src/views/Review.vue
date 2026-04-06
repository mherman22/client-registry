<template>
  <div>
    <div class="d-flex align-center mb-4">
      <div>
        <div class="text-h5 font-weight-medium">{{ $t('menu_action_required') }}</div>
        <div class="text-subtitle-2 grey--text">Review flagged patient matches</div>
      </div>
      <v-spacer></v-spacer>
    </div>
    <v-card elevation="1" rounded="lg">
      <v-card-title class="pa-4">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          :label="$t('search')"
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
        style="cursor: pointer"
        :headers="headers"
        :items="reviews"
        :options.sync="options"
        :footer-props="{
        'items-per-page-options': [5,10,20,50] ,
        'items-per-page-text':this.$t('row_per_page')}"
        :no-data-text="$t('no_data')"
        :loading="loading"
        :search="search"
        @click:row="clickIt"
      >
        <template v-slot:item.uid="{ item }">
          <router-link :to="'/resolve/'+item.id+'?flagType='+item.reasonCode" class="text-decoration-none primary--text font-weight-medium">{{ item.uid }}</router-link>
        </template>
        <template v-slot:item.reason="{ item }">
          <v-chip small label :color="item.reason === 'conflict' ? 'error' : 'warning'" dark>
            {{ item.reason }}
          </v-chip>
        </template>
        <template v-slot:item.source="{ item }">
          <span class="text-uppercase text-caption">{{ getClientDisplayName(item.source) }}</span>
        </template>
        <template v-slot:item.date="{ item }">
          <span class="text-caption grey--text text--darken-1">{{ item.date | moment("MMMM DD YYYY HH:mm:ssZ") }}</span>
        </template>
        <template v-slot:no-data>
          <div class="text-center pa-8">
            <v-icon size="64" color="grey lighten-1">mdi-check-circle-outline</v-icon>
            <div class="text-h6 grey--text mt-3">{{ $t('no_data') }}</div>
            <div class="text-subtitle-2 grey--text text--lighten-1 mt-1">No action items at this time</div>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
// @ is an alias to /src
import axios from "axios";
import { generalMixin } from "@/mixins/generalMixin";
export default {
  mixins: [generalMixin],
  name: "Review",
  components: {
  },
  data() {
    return {
      reviews: [],
      debug: "",
      search: "",
      loading: false,
      prevPage: -1,
      link: [],
      options: { itemsPerPage: 10, sortBy: ["family"] },
      rowsPerPageItems: [5, 10, 20, 50],
      headers: [
        { text:  this.$t('cr_id'), value: "uid" },
        { text:  this.$t('surname'), value: "family" },
        { text:  this.$t('given_names'), value: "given" },
        { text:  this.$t('source'), value: "source" },
        { text:  this.$t('source_id') , value: "source_id" },
        { text:  this.$t('reason'), value: "reason" },
        { text:  this.$t('date_flagged'), value: "date" }
      ],
    };
  },
  methods: {
    getReviews() {
      this.loading = true
      axios.get('/ocrux/match/get-match-issues').then((resp) => {
        this.reviews = resp.data
        this.loading = false
      })
    },
    clickIt: function(client) {
      this.$router.push({ name: "review", params: { clientId: client.uid } });
    }
  },
  created() {
    this.getReviews()
  }
};
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
