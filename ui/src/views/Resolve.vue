<template>
  <v-container>
    <v-navigation-drawer
      color="white"
      right
      permanent
      clipped
      app
      width="280"
    >
      <div class="pa-4">
        <div class="text-subtitle-2 font-weight-medium mb-4 grey--text text--darken-2">Actions</div>
        <v-btn
          block
          depressed
          color="accent"
          dark
          class="mb-3 text-none"
          @click="showMatrix = true; $vuetify.goTo($refs.scoreMatrix);"
        >
          <v-icon left small>mdi-table</v-icon>
          {{ $t('show_scores_matrix') }}
        </v-btn>
        <v-btn
          block
          depressed
          color="success"
          dark
          class="mb-4 text-none"
          @click="showReview = true"
        >
          <v-icon left small>mdi-content-save</v-icon>
          {{ $t('save_changes') }}
        </v-btn>
        <v-divider class="mb-4"></v-divider>
        <div class="text-subtitle-2 font-weight-medium mb-3 grey--text text--darken-2">Options</div>
        <v-switch v-model="useNickname" :label="$t('simplified_naming')" @change="setupCRIDList" dense hide-details class="mt-0 mb-2"></v-switch>
        <v-switch v-model="includeCRID" :label="$t('include_real_crid')" @change="setupCRIDList" dense hide-details class="mt-0"></v-switch>
      </div>
    </v-navigation-drawer>
    <v-dialog :value="showReview" max-width="900" persistent>
      <v-card rounded="lg">
        <div class="pa-4 d-flex align-center" style="background-color: #E3F2FD;">
          <v-icon left color="primary">mdi-clipboard-check-outline</v-icon>
          <div class="text-h6 font-weight-medium">{{ $t('review_changes') }}</div>
          <v-spacer></v-spacer>
          <v-btn icon @click="showReview = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider></v-divider>
        <v-card-text v-if="!bucketsModified" class="pa-6 text-body-1">
          {{ $t('confirm_remove_flag') }}
        </v-card-text>
        <v-data-table
          v-else
          :headers="review_headers"
          :items="review_list"
          :disable-pagination="true"
          :hide-default-footer="true"
          :no-data-text="$t('no_data')"
        >
        </v-data-table>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-btn
            outlined
            color="error"
            @click="showReview = false"
            class="text-none"
          >
            {{ $t('cancel') }}
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            depressed
            color="success"
            @click="saveChanges"
            class="text-none"
          >
            <v-icon left small>mdi-check</v-icon>
            {{ $t('save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog :value="cohortPopup" width="500">
      <v-card rounded="lg">
        <div class="pa-4" style="background-color: #F5F8FA;">
          <div class="text-h6 font-weight-medium">{{ $t('move_all') }}</div>
          <div class="text-body-2 grey--text mt-1">{{ $t('confirm_move_all_to_new') }}</div>
        </div>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-btn depressed color="primary" @click="copyClient" class="text-none">
            <v-icon left small>mdi-account-arrow-right</v-icon>
            {{ $t('move_one') }}
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn depressed color="warning" @click="copyCohort" class="text-none">
            <v-icon left small>mdi-account-group</v-icon>
            {{ $t('move_all_records') }}
          </v-btn>
        </v-card-actions>
        <v-card-actions class="px-4 pb-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn outlined color="error" @click="copyCohortInfo = null; cohortPopup = false" class="text-none">
            {{ $t('cancel') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-row v-for="(list, uid) in crids" :key="uid">
      <v-col cols="12">
        <v-card elevation="1" rounded="lg">
          <div class="pa-4 d-flex align-center" style="background-color: #E3F2FD;">
            <v-icon left color="primary">mdi-account-group</v-icon>
            <div class="font-weight-medium" v-if="useNickname">
              {{ nickname[uid] }}
            </div>
            <v-spacer></v-spacer>
            <v-chip small outlined color="primary">CR ID: {{ uid }}</v-chip>
          </div>
          <v-divider></v-divider>
          <v-data-table
            style="cursor: pointer"
            :headers="headers"
            :items="list"
            :disable-pagination="true"
            :hide-default-footer="true"
            :loading="loading"
            >
            <template v-slot:header.uid="{ props: { } }">
              {{ cridHeader }}
            </template>
            <template v-slot:item.uid="{ item }">
              <v-select
                :value="item.uid"
                :items="crid_list"
                :success-messages="'Original: '+cridDisplay(item.ouid)"
                @change="moveClient($event, item)"
                :key="item.source+item.source_id"
                dense
                outlined
              ></v-select>
            </template>
            <template v-slot:item.source_id="{ item }">
              <a @click="goTo('client',{ clientId: item.uid, sourceId: item.source_id })" class="primary--text text-decoration-none font-weight-medium">{{ item.source_id }}</a>
            </template>
            <template v-slot:item.view="{ item }">
              <v-switch v-model="showCard[item.source_id]" hide-details dense @change="if ( showCard[item.source_id] ) $vuetify.goTo($refs.fullCards)"></v-switch>
            </template>
            <template v-slot:item.score="{ item }">
              <v-switch v-model="showScore[item.source_id]" hide-details dense></v-switch>
            </template>
            <template v-slot:item.birthDate="{ item }">
              {{ item.birthDate | moment("MMMM DD YYYY") }}
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
    <v-row ref="scoreMatrix">
      <v-col cols="12" v-if="showMatrix">
        <v-card elevation="1" rounded="lg">
          <div class="pa-4 d-flex align-center" style="background-color: #E0F7FA;">
            <v-icon left color="accent">mdi-table</v-icon>
            <div class="text-subtitle-1 font-weight-medium">{{ $t('scores_matrix') }}</div>
            <v-spacer></v-spacer>
            <v-btn icon small @click="showMatrix = false"><v-icon small>mdi-close</v-icon></v-btn>
          </div>
          <v-divider></v-divider>
          <v-data-table
            style="cursor: pointer"
            :headers="score_headers"
            :items="score_matrix"
            :disable-pagination="true"
            :hide-default-footer="true"
            >
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
    <v-row ref="fullCards">
      <template v-for="data in resolves">
        <v-col cols="12" md="4" v-if="showCard[data.source_id]" :key="data.source_id">
          <v-card
            elevation="1"
            rounded="lg"
            :id="data.source+data.source_id"
            :ref="data.source+data.source_id"
            >
            <div class="pa-4 d-flex align-center" style="background-color: #F5F8FA;">
              <div>
                <div class="text-caption grey--text">Source</div>
                <div class="font-weight-medium">{{ data.source }} {{ data.source_id }}</div>
              </div>
              <v-spacer></v-spacer>
              <v-btn icon small @click="showCard[data.source_id] = false"><v-icon small>mdi-close</v-icon></v-btn>
            </div>
            <v-divider></v-divider>
            <v-list
              dense
              >
              <v-list-item
              v-for="(val, key) in fields"
              :key="key">
                <v-list-item-content class="text-caption grey--text">{{val}}</v-list-item-content>
                <v-list-item-content class="align-end font-weight-medium" v-if="dates[key]">
                  {{ data[key] | moment("MMMM Do YYYY") }}
                </v-list-item-content>
                <v-list-item-content class="align-end font-weight-medium" v-else>
                  {{ data[key] }}
                </v-list-item-content>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item>
                <div class="text-subtitle-2 font-weight-medium grey--text text--darken-2 py-2">Scores</div>
              </v-list-item>
              <v-list-item
                v-for="(score,source_id) in filteredScores(data.scores)"
                :key="data.source_id+'-'+source_id"
                >
                <v-list-item-content class="text-caption grey--text">{{getSource(source_id)}}</v-list-item-content>
                <v-list-item-content class="text-caption grey--text">{{source_id}}</v-list-item-content>
                <v-list-item-content class="font-weight-medium">{{score}}</v-list-item-content>
              </v-list-item>

            </v-list>
          </v-card>
        </v-col>
      </template>
    </v-row>
  </v-container>
</template>

<script>
//const ADD_TEXT =  this.$t('assign_new_cr_id') ;
//const NEW_PREFIX = this.$t('new_cr_id') ;
// @ is an alias to /src
//import draggable from 'vuedraggable'
const ADD_TEXT = "Assign to new CR ID"
const NEW_PREFIX = "New CR ID "
import axios from "axios";
const shuffle = (arr) => {
  for( let i = arr.length - 1; i > 0; i-- ) {
    let j = Math.floor(Math.random() * (i+1))
    let temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
}
import { generalMixin } from "@/mixins/generalMixin";
export default {
  name: "Resolve",
  mixins: [generalMixin],
  components: {
    //draggable
  },
  data() {
    return {
      crids: {},
      crid_list: [],
      showCard: {},
      showScore: {},
      showMatrix: false,
      showReview: false,
      cohortPopup: false,
      resolves: [],
      loading: false,
      newIdx: 1,
      headers: [
        { text: this.cridHeader, value: "uid", sortable: false },
        { text: "Source", value: "source" },
        { text: this.$t('source_id') , value: "source_id" },
        { text: this.$t('surname'), value: "family" },
        { text: this.$t('given_names'), value: "given" },
        { text: this.$t('birth_date'), value: "birthDate" },
        { text: this.$t('gender'), value: "gender" },
        { text: this.$t('full_view'), value: "view", sortable: false },
        { text: "Scores", value: "score", sortable: false },
      ],
      dates: { birthDate: true },
      fields: { source: this.$t('submitting_system'), source_id: this.$t('source_id'), family: this.$t('surname'), given: this.$t('given_names'),
        gender: this.$t('gender'), birthDate: this.$t('birth_date'), phone: this.$t('phone')
      },
      score_matrix: [],
      score_headers: [ { text: "Source", value: "name" } ],
      review_headers: [
        { text: "Source", value: "source" },
        { text: this.$t('source_id'), value: "source_id" },
        { text: this.$t('original_cr_id'), value: "ouid" },
        { text: this.$t('new_cr_id'), value: "uid" }
      ],
      review_list: [],
      copyCohortInfo: null,
      useNickname: true,
      includeCRID: false,
      available_nicknames: [
        "Aluminum", "Beryllium", "Carbon", "Dysprosium", "Europium", "Flourine", "Gallium", "Hydrogen", "Iron", "Krypton",
        "Lithium", "Magnesium", "Nitrogen", "Oxygen", "Phosphorus", "Copper", "Sodium", "Titanium", "Uranium",
        "Vanadium", "Xenon", "Gold", "Zinc"
        ],
      nickname: {}
    };
  },
  watch: {
    showScore: {
      handler(val) {
        for( let source_id of Object.keys(val) ) {
          if ( val[source_id] ) {
            if ( !this.headers.find( header => header.value === source_id ) ) {
              this.headers.push( { text: this.getSource(source_id)+" "+source_id, value: source_id } )
            }
          } else {
            this.headers = this.headers.filter( header => header.value !== source_id )
          }
        }
      },
      deep: true
    }
  },
  created: function() {
    this.$store.state.progress.enable = true;
    this.$store.state.progress.width = "300px";
    this.$store.state.progress.title = this.$route.query.flagType === 'autoMatches' ? this.$t('loading_auto') : this.$t('loading_potential');

    axios.get(`/ocrux/match/potential-matches/${this.$route.params.clientId}`).then((resp) => {

    let responseData = resp.data;
    if(this.$route.query.flagType === 'autoMatches'){

      const parentObject = responseData.find(item => item.id === this.$route.params.clientId);

      if (parentObject) {
        responseData = responseData.filter(item => item.uid === parentObject.uid);
      }

    }
        let extRegexPattern = /^extension_/;

        let matchingKeys = [];

        for (let i = 0; i < resp.data.length; i++) {
          const dataObject = resp.data[i];
            for (let key in dataObject) {
              if (extRegexPattern.test(key)) {
                matchingKeys.push(key);
                this.$set(this.fields, key, this.$t(key));
              }
            }
        }


        let idRegexPattern = /^identifier/;
        for (let key in resp.data[0]) {
          if (idRegexPattern.test(key)) {
              this.$set(this.fields, key, this.$t(key));

          }
        }


      this.resolves = resp.data

      shuffle(this.available_nicknames)
      this.organizeResolves(true)
      this.$store.state.progress.enable = false;
    }).catch(() => {
      this.$store.state.progress.enable = false;
      this.$store.state.alert.show = true;
      this.$store.state.alert.width = "500px";
      this.$store.state.alert.msg = this.$t('something_wrong');
      this.$store.state.alert.type = "error";
    })
  },
  computed: {
    cridHeader: function() {
      return this.useNickname ?  this.$t('Temporary_cr_id') + ( this.includeCRID ? " / Actual CR ID" : "") : "CR ID"
    },
    filteredScores(scores) {
        return (data) => {
          const filteredScores = {};

            Object.entries(data)
              .forEach(([source_id, value]) => {
                if (this.getSource(source_id) !== null && this.getSource(source_id) !== '') {
                  filteredScores[source_id] = value;
                }
              });
            return filteredScores;
        }
    },
    bucketsModified () {
      for(let matrix of this.resolves) {
        if(matrix.uid !== matrix.ouid) {
          return true
        }
      }
      return false;
    }
  },
  methods: {
    organizeResolves: function( firstTime ) {
      this.loading = true
      for( let idx of Object.keys(this.crids) ) {
        this.crids[idx] = []
      }
      this.review_list = []

      for( let resolve of this.resolves ) {
        if ( firstTime ) {
          let scoreRow = {}
          scoreRow.name = resolve.source+" "+resolve.source_id
          this.score_headers.push( { text: scoreRow.name, value: resolve.source_id } )
          for( let score_id of Object.keys(resolve.scores) ) {
            resolve[score_id] = resolve.scores[score_id]
            scoreRow[score_id] = resolve.scores[score_id]
          }
          this.score_matrix.push( scoreRow )
          resolve.ouid = resolve.uid
        }
        if ( !this.crids[ resolve.uid ] ) {
          this.crids[ resolve.uid ] = []
          this.nickname[ resolve.uid ] = this.available_nicknames.pop()
        }
        this.crids[ resolve.uid ].push( resolve )
        if ( resolve.ouid !== resolve.uid ) {
          this.review_list.push( resolve )
        }
      }


      this.setupCRIDList()
      this.loading = false
    },
    setupCRIDList: function() {
      this.crid_list = Object.keys(this.crids).map( crid => { return { text: this.cridDisplay(crid), value: crid } } )
      this.crid_list.push( { divider: true } )
      this.crid_list.push( { text: ADD_TEXT, value: ADD_TEXT } )
    },
    cridDisplay: function( crid ) {
      return this.useNickname ? this.nickname[crid] + ( this.includeCRID ? " ("+crid+")" : "" ): crid
    },
    getSource: function(source_id) {
      const resolvedObject = this.resolves.find(resolve => resolve.source_id === source_id);
      return resolvedObject ? resolvedObject.source : '';
    },
    moveClient: function(val,item) {
      this.copyCohortInfo = { old_id: item.uid, new_id: val, item: item }
      this.cohortPopup = true
    },
    copyClient: function() {
      if ( this.copyCohortInfo ) {
        let item = this.copyCohortInfo.item
        if ( this.copyCohortInfo.new_id === ADD_TEXT ) {
          item.uid = NEW_PREFIX + this.newIdx
          this.nickname[ item.uid ] = this.available_nicknames.pop()
          this.newIdx++
        } else {
          item.uid = this.copyCohortInfo.new_id
        }
        this.organizeResolves()
      }
      this.copyCohortInfo = null
      this.cohortPopup = false
    },
    copyCohort: function() {
      if ( this.copyCohortInfo ) {
        if ( this.copyCohortInfo.new_id === ADD_TEXT ) {
          this.copyCohortInfo.new_id = NEW_PREFIX + this.newIdx
          this.nickname[ this.copyCohortInfo.new_id ] = this.available_nicknames.pop()
          this.newIdx++
        }
        for ( let resolve of this.resolves.filter( resolve => resolve.uid === this.copyCohortInfo.old_id ) ) {
          resolve.uid = this.copyCohortInfo.new_id
        }
        this.organizeResolves()
      }
      this.copyCohortInfo = null
      this.cohortPopup = false
    },
    goTo: function( name, params ) {
      let routeData = this.$router.resolve( { name: name, params: params } )
      window.open(routeData.href, '_blank')
    },
    saveChanges() {
      this.$store.state.progress.enable = true
      this.$store.state.progress.title = this.$t('saving');
      // if no changes made on buckets then remove the flag
      let removeFlag = true
      // if buckets have been modified, flag will be removed if changes made will results in no more issues
      if(this.bucketsModified) {
        removeFlag = false
      }
      let body = {
        resolvingFrom: this.$route.params.clientId,
        resolves: this.resolves,
        removeFlag,
        flagType: this.$route.query.flagType
      }
      axios.post('/ocrux/match/resolve-match-issue', body).then(() => {
        this.countMatchIssues();
        this.countNewAutoMatches();
        this.showReview = false
        this.$store.state.progress.enable = false
        this.$store.state.alert.show = true;
        this.$store.state.alert.width = "500px";
        this.$store.state.alert.msg = this.$t('operation_successful');
        this.$store.state.alert.type = "success";
      }).catch((err) => {
        this.showReview = false
        this.$store.state.progress.enable = false
        this.$store.state.alert.show = true;
        this.$store.state.alert.width = "500px";
        this.$store.state.alert.msg = this.$t('operation_failed');
        this.$store.state.alert.type = "error";
        console.log(err);
      })
    }
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
