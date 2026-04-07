<template>
  <v-container>
    <div class="d-flex align-center mb-4">
      <v-breadcrumbs :items="[
        { text: $t('menu_home'), to: '/', exact: true },
        { text: 'Patient', disabled: false },
        { text: uid || 'Details', disabled: true }
      ]" class="pa-0">
        <template v-slot:divider>
          <v-icon small>mdi-chevron-right</v-icon>
        </template>
      </v-breadcrumbs>
      <v-spacer></v-spacer>
      <v-btn outlined small color="secondary" @click="$router.go(-1)" v-if="canGoBack" class="text-none">
        <v-icon left small>mdi-arrow-left</v-icon>{{ $t('back') }}
      </v-btn>
      <v-btn outlined small color="secondary" @click="close" v-else class="text-none">
        <v-icon left small>mdi-close</v-icon>{{ $t('close') }}
      </v-btn>
    </div>

    <v-tabs
      v-model="tab"
      background-color="transparent"
      color="primary"
      class="mb-4"
    >
      <v-tab href="#record">
        <v-icon left small>mdi-account</v-icon>{{ $t('record') }}
      </v-tab>
      <v-tab href="#history">
        <v-icon left small>mdi-history</v-icon>{{ $t('history') }}
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item value="record">
        <v-row>
          <v-col cols="12" md="6">
            <v-card elevation="1" rounded="lg">
              <v-carousel
                v-model="selected"
                delimiter-icon="mdi-account"
                next-icon="mdi-chevron-right"
                prev-icon="mdi-chevron-left"
                :show-arrows-on-hover="true"
                height="auto"
              >
                <v-carousel-item
                  v-for="(patient, i) in match_items"
                  :key="`${i}-${patient.id}`"
                >
                  <v-card flat>
                    <div class="pa-4 d-flex align-center" style="background-color: #F5F8FA;">
                      <div>
                        <div class="text-subtitle-2 grey--text">CRUID</div>
                        <div class="text-h6 font-weight-medium">{{ uid }}</div>
                      </div>
                      <v-spacer></v-spacer>
                      <v-chip small outlined>{{ selected+1 }} / {{ match_count }}</v-chip>
                    </div>
                    <v-divider></v-divider>
                    <v-list dense style="max-height: 400px; overflow-y: auto;">
                      <v-list-item>
                        <v-list-item-content class="text-caption grey--text">{{ $t('submitting_system') }}</v-list-item-content>
                        <v-list-item-content class="align-end font-weight-medium">
                          {{ patient.system }}
                        </v-list-item-content>
                      </v-list-item>
                      <v-list-item
                        v-for="(name, j) in patient.name"
                        :key="`${j}-${name.use || 'name'}`"
                      >
                        <v-list-item-content class="text-caption grey--text">{{ $t('surname') }}<span v-if="name.use"> ({{ name.use }})</span></v-list-item-content>
                        <v-list-item-content class="align-end text-capitalize font-weight-medium">
                          {{ name.given ? name.given.join(" ") : "" }} {{ name.family || "" }}
                        </v-list-item-content>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-content class="text-caption grey--text">{{ $t('gender') }}</v-list-item-content>
                        <v-list-item-content class="align-end font-weight-medium">
                          {{ patient.gender }}
                        </v-list-item-content>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-content class="text-caption grey--text">{{ $t('birth_date') }}</v-list-item-content>
                        <v-list-item-content class="align-end font-weight-medium">
                          {{ patient.birthdate }}
                        </v-list-item-content>
                      </v-list-item>
                      <v-list-item v-if="patient.address && patient.address.length > 0">
                        <v-list-item-content class="text-caption grey--text">Address</v-list-item-content>
                        <v-list-item-content class="align-end font-weight-medium">
                          {{ [patient.address[0].city, patient.address[0].state, patient.address[0].country].filter(Boolean).join(", ") }}
                        </v-list-item-content>
                      </v-list-item>
                      <v-list-item v-if="patient.multipleBirth">
                        <v-list-item-content class="text-caption grey--text">Multiple Birth</v-list-item-content>
                        <v-list-item-content class="align-end font-weight-medium">
                          <v-chip x-small color="info" dark>
                            {{ patient.birthOrder ? 'Birth order: ' + patient.birthOrder : 'Yes' }}
                          </v-chip>
                        </v-list-item-content>
                      </v-list-item>
                      <v-list-item
                        v-for="(telecom, k) in patient.telecom"
                        :key="`${k}-${telecom.system}`"
                      >
                        <v-list-item-content class="text-caption grey--text text-capitalize">
                          {{ telecom.system }}
                        </v-list-item-content>
                        <v-list-item-content class="align-end font-weight-medium">
                          {{ telecom.value }}
                        </v-list-item-content>
                      </v-list-item>
                      <v-list-item
                        v-for="(id, l) in patient.identifier"
                        :key="`${l}-${id.system}`"
                      >
                        <v-list-item-content class="text-caption grey--text">{{ id.name }}</v-list-item-content>
                        <v-list-item-content class="align-end font-weight-medium">
                          {{ id.value }}
                        </v-list-item-content>
                      </v-list-item>
                      <v-list-item
                        v-for="(id, l) in patient.extension"
                        :key="`${l}-${id.name}`"
                      >
                        <v-list-item-content class="text-caption grey--text">{{ $t(id.name) }}</v-list-item-content>
                        <v-list-item-content class="align-end font-weight-medium">
                          {{ id.value }}
                        </v-list-item-content>
                      </v-list-item>
                    </v-list>
                  </v-card>
                </v-carousel-item>
              </v-carousel>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card elevation="1" rounded="lg">
              <div class="pa-4 d-flex align-center" style="background-color: #F5F8FA;">
                <v-icon left color="accent">mdi-link-variant</v-icon>
                <div class="text-subtitle-1 font-weight-medium">{{ $t('matched_records') }}</div>
              </div>
              <v-divider></v-divider>
              <v-data-table
                v-model="breaks"
                :headers="match_headers"
                :items="match_items"
                :items-per-page="20"
                :footer-props="{
                'items-per-page-text':this.$t('row_per_page')}"
                :no-data-text="$t('no_data')"
                class="text-capitalize"
                item-key="fid"
                show-select
              />
              <v-card-actions class="pa-4">
                <v-spacer />
                <v-btn
                  color="warning"
                  depressed
                  small
                  :disabled="breaks.length === 0 || match_items.length < 2"
                  @click="breakMatch()"
                  class="text-none"
                >
                  <v-icon left small>mdi-link-off</v-icon>
                  {{ $t('break_matches') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col cols="12">
            <v-card elevation="1" rounded="lg">
              <div class="pa-4 d-flex align-center" style="background-color: #FFF3E0;">
                <v-icon left color="warning">mdi-link-off</v-icon>
                <div class="text-subtitle-1 font-weight-medium">{{ $t('broken_matches') }}</div>
              </div>
              <v-divider></v-divider>
              <v-data-table
                v-model="unbreaks"
                :headers="match_headers"
                :items="break_items"
                :items-per-page="20"
                :footer-props="{
                'items-per-page-text':this.$t('row_per_page')}"
                class="text-capitalize"
                :no-data-text="$t('no_data')"
                item-key="id"
                show-select
              />
              <v-card-actions class="pa-4">
                <v-spacer />
                <v-btn
                  color="accent"
                  depressed
                  small
                  :disabled="unbreaks.length === 0"
                  @click="revertBreak()"
                  class="text-none"
                >
                  <v-icon left small>mdi-undo</v-icon>
                  {{ $t('revert_break') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-tab-item>
      <v-tab-item value="history">
        <v-row>
          <v-col cols="12">
            <v-card elevation="1" rounded="lg">
              <div class="pa-4 d-flex align-center" style="background-color: #F5F8FA;">
                <v-icon left color="secondary">mdi-history</v-icon>
                <div class="text-subtitle-1 font-weight-medium">{{ $t('history') }}</div>
              </div>
              <v-divider></v-divider>
              <v-expansion-panels flat>
                <v-expansion-panel
                  v-for="(event,i) in matchEvents"
                  :key="i"
                >
                  <v-expansion-panel-header class="py-3">
                    <div class="d-flex align-center">
                      <v-chip x-small label class="mr-3" :color="event.type === 'submittedResource' ? 'primary' : event.type === 'breakMatch' ? 'warning' : 'accent'" dark>
                        <template v-if="event.type === 'submittedResource'">{{ $t('submitted_resource') }}</template>
                        <template v-if="event.type === 'breakMatch'">{{ $t('break_matche') }}</template>
                        <template v-if="event.type === 'unBreak'">{{ $t('revert_break') }}</template>
                      </v-chip>
                      <span class="text-body-2">{{ $t('event') }} {{ event.recorded | moment('Do MMM YYYY h:mm:ss a') }}</span>
                    </div>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <div class="pa-2">
                      <template v-if="event.type !== 'submittedResource'">
                        <div class="mb-1"><span class="text-caption grey--text">{{ $t('user') }}:</span> <strong>{{ event.username }}</strong></div>
                      </template>
                      <div class="mb-1"><span class="text-caption grey--text">Operation:</span> <strong>{{ event.operation }}</strong></div>
                      <div class="mb-1"><span class="text-caption grey--text">{{ $t('operation_time') }}:</span> {{ event.recorded | moment('Do MMM YYYY h:mm:ss a') }}</div>
                      <div class="mb-2">
                        <span class="text-caption grey--text">{{ $t('patient_status') }}:</span>
                        <v-chip x-small :color="event.outcomeCode === '0' ? 'success' : 'error'" dark class="ml-1">
                          {{ event.outcome }}
                        </v-chip>
                      </div>
                      <div class="mb-2"><span class="text-caption grey--text">IP Address:</span> {{ event.ipaddress }}</div>
                      <v-row v-if="event.type === 'breakMatch'">
                        <v-col cols="4">
                          <v-card outlined rounded="lg" class="pa-3">
                            <div class="text-caption grey--text mb-1">Break</div>
                            <div class="font-weight-medium">{{ event.break }}</div>
                          </v-card>
                        </v-col>
                        <v-col cols="4">
                          <v-card outlined rounded="lg" class="pa-3">
                            <div class="text-caption grey--text mb-1">Old CRUID</div>
                            <div class="font-weight-medium">{{ event.CRUID }}</div>
                          </v-card>
                        </v-col>
                        <v-col cols="4">
                          <v-card outlined rounded="lg" class="pa-3">
                            <div class="text-caption grey--text mb-1">Broken From</div>
                            <div class="font-weight-medium">
                              <template v-for="breakFrom in event.breakFrom">
                                {{ breakFrom }}<br :key="breakFrom">
                              </template>
                            </div>
                          </v-card>
                        </v-col>
                      </v-row>
                      <v-row v-if="event.type === 'unBreak'">
                        <v-col cols="4">
                          <v-card outlined rounded="lg" class="pa-3">
                            <div class="text-caption grey--text mb-1">Reverting</div>
                            <div class="font-weight-medium">{{ event.unBreak }}</div>
                          </v-card>
                        </v-col>
                        <v-col cols="4">
                          <v-card outlined rounded="lg" class="pa-3">
                            <div class="text-caption grey--text mb-1">Reverting From CRUID</div>
                            <div class="font-weight-medium">{{ event.unBreakFromCRUID }}</div>
                          </v-card>
                        </v-col>
                        <v-col cols="4">
                          <v-card outlined rounded="lg" class="pa-3">
                            <div class="text-caption grey--text mb-1">Reverting From</div>
                            <div class="font-weight-medium">
                              <template v-for="unBreakFrom in event.unBreakFrom">
                                {{ unBreakFrom }}<br :key="unBreakFrom">
                              </template>
                            </div>
                          </v-card>
                        </v-col>
                      </v-row>
                      <v-row
                        v-for="(detail,j) in event.matchData"
                        v-else
                        :key="j"
                      >
                        <v-col cols="6">
                          <v-card outlined rounded="lg">
                            <div class="pa-3">
                              <div class="text-subtitle-2 font-weight-medium mb-2">
                                Decision Rule {{ ++j }} - Matching Type: <strong>{{ detail.matchingType }}</strong>
                              </div>
                            </div>
                            <v-data-table
                              :headers="matchRuleHeaders"
                              :items="detail.decisionRule"
                              :items-per-page="20"
                              item-key="id"
                              dense
                            >
                              <template v-slot:item.details="{ item }">
                                <div class="py-1">
                                  <template v-if="item.details.algorithm">
                                    <span class="text-caption">Algorithm:</span> {{ item.details.algorithm }}<br>
                                  </template>
                                  <template v-if="item.details.threshold">
                                    <span class="text-caption">Threshold:</span>
                                    <v-chip x-small color="error" dark class="ml-1">{{ item.details.threshold }}</v-chip><br>
                                  </template>
                                  <template v-if="detail.matchingType === 'probabilistic'">
                                    <span class="text-caption">mValue:</span>
                                    <v-chip x-small color="success" dark class="ml-1">{{ item.details.mValue }}</v-chip>
                                    <span class="text-caption ml-2">uValue:</span>
                                    <v-chip x-small color="primary" dark class="ml-1">{{ item.details.uValue }}</v-chip><br>
                                  </template>
                                  <template v-if="item.details.fhirpath">
                                    <span class="text-caption">FHIR Path:</span> {{ item.details.fhirpath }}
                                  </template>
                                </div>
                              </template>
                            </v-data-table>
                          </v-card>
                        </v-col>
                        <v-col cols="6">
                          <v-switch
                            v-model="advancedView"
                            label="View Advanced Details"
                            dense
                          />
                          <template v-if="advancedView">
                            <v-card outlined rounded="lg" class="mb-3">
                              <v-card-text>
                                <v-textarea
                                  outlined
                                  dense
                                  color="primary"
                                  label="Elasticsearch Query"
                                  rows="8"
                                  :value="detail.query"
                                />
                              </v-card-text>
                            </v-card>
                            <v-card outlined rounded="lg" class="mb-3">
                              <v-card-text>
                                <v-textarea
                                  outlined
                                  dense
                                  color="primary"
                                  label="Elasticsearch Automatches Results"
                                  rows="8"
                                  :value="detail.autoMatches"
                                />
                              </v-card-text>
                            </v-card>
                            <v-card outlined rounded="lg" class="mb-3">
                              <v-card-text>
                                <v-textarea
                                  outlined
                                  dense
                                  color="primary"
                                  label="Elasticsearch Potential Matches Results"
                                  rows="8"
                                  :value="detail.potentialMatches"
                                />
                              </v-card-text>
                            </v-card>
                            <v-card outlined rounded="lg">
                              <v-card-text>
                                <v-textarea
                                  outlined
                                  dense
                                  color="primary"
                                  label="Elasticsearch Conflicts Matches Results"
                                  rows="8"
                                  :value="detail.conflictsMatchResults"
                                />
                              </v-card-text>
                            </v-card>
                          </template>
                        </v-col>
                      </v-row>
                    </div>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card>
          </v-col>
        </v-row>
      </v-tab-item>
    </v-tabs-items>
  </v-container>
</template>


<script>
import { generalMixin } from "@/mixins/generalMixin";
export default {
  mixins: [generalMixin],
  name: "Client",
  data() {
    return {
      tab: "record",
      advancedView: false,
      outcomes: {
        0: "Success",
        4: "Minor Failure - Client Error",
        8: "Serious Failure - Server Error",
        12: "Major Failure - Server Crashed"
      },
      selected: "",
      matchEvents: [],
      matchRule: [],
      auditEvent: [],
      systems: {},
      primary_systems: [process.env.VUE_APP_SYSTEM_OPENMRS],
      match_count: 0,
      uid: "",
      breaks: [],
      unbreaks: [],
      matchRuleHeaders: [
        {
          text: this.$t('field'),
          value: "name"
        },
        {
          text: this.$t('field_details'),
          value: "details"
        }
      ],
      match_headers: [
        {
          text: this.$t('submitting_system'),
          value: "system"
        },
        {
          text: this.$t('record_id'),
          value: "id"
        },
        {
          text: this.$t('surname'),
          value: "family"
        },
        {
          text: this.$t('given_names'),
          value: "given"
        },
        {
          text: this.$t('gender'),
          value: "gender"
        },
        {
          text: this.$t('birth_date'),
          value: "birthdate"
        }
      ],
      match_items: [],
      break_items: []
    };
  },
  computed: {
    canGoBack() {
      return history.length > 1
    }
  },
  mounted() {
    this.getPatient();
    this.getAuditEvents();
  },
  methods: {
    getPatient() {
      this.breaks = [];
      this.match_items = [];
      this.break_items = [];
      this.match_count = 0;
      this.$http
        .get(
          "/ocrux/fhir/Patient?_elements=link,extension&_id=" +
            this.$route.params.clientId
        )
        .then(response => {
          let uid = response.data.entry[0].resource.link[0].other.reference
            .split("/")
            .pop();
          let resource = response.data.entry[0].resource;
          let brokenList = [];
          if (resource.extension) {
            for (let ext of resource.extension) {
              if (ext.url === process.env.VUE_APP_BROKEN_MATCH_URL) {
                brokenList.push(ext.valueReference.reference.split("/").pop());
              }
            }
          }
          if (brokenList.length > 0) {
            brokenList = brokenList.join(",");
            this.$http
              .get("/ocrux/fhir/Patient?_id=" + brokenList)
              .then(resp => {
                for (let entry of resp.data.entry) {
                  let patient = entry.resource;
                  let recordId, systemName, name, phone;
                  let clientUserId;
                  if (patient.meta && patient.meta.tag) {
                    for (let tag of patient.meta.tag) {
                      if (tag.system === "http://openclientregistry.org/fhir/clientid") {
                        clientUserId = tag.code;
                        systemName = tag.display;
                      }
                    }
                  }
                  let identifiers = [];
                  if (patient.identifier) {
                    for (let id of patient.identifier) {
                      let displName = this.getSystemURIDisplayName(id.system);
                      if (displName) {
                        if (displName.id === "internalid") {
                          recordId = id.value;
                        }
                        identifiers.push({
                          name: displName.name,
                          value: id.value
                        });
                      } else {
                        identifiers.push({
                          name: (id.type && id.type.text) || id.system || "Identifier",
                          value: id.value
                        });
                      }
                    }
                  }
                  try {
                    name = patient.name.find(name => name.use === "official") || patient.name[0];
                    if(!name) {
                      name = { family: "", given: [] };
                    } else if(!name.given) {
                      name.given = []
                    }
                  } catch (err) {
                    name = { family: "", given: [] };
                  }
                  try {
                    phone = patient.telecom.find(
                      phone => (phone.system = "phone")
                    ).value;
                  } catch (err) {
                    phone = "";
                  }
                  if (
                    this.$route.query.pos &&
                    this.$route.query.pos === clientUserId
                  ) {
                    this.break_items.unshift({
                      fid: patient.id,
                      system: systemName,
                      id: recordId,
                      gender: patient.gender,
                      birthdate: patient.birthDate,
                      name: patient.name,
                      telecom: patient.telecom,
                      identifier: identifiers,
                      family: name.family,
                      given: name.given.join(" "),
                      phone: phone,
                      multipleBirth: patient.multipleBirthBoolean || (patient.multipleBirthInteger > 0),
                      birthOrder: patient.multipleBirthInteger || null
                    });
                  } else {
                    this.break_items.push({
                      fid: patient.id,
                      system: systemName,
                      id: recordId,
                      gender: patient.gender,
                      birthdate: patient.birthDate,
                      name: patient.name,
                      telecom: patient.telecom,
                      identifier: identifiers,
                      family: name.family,
                      given: name.given.join(" "),
                      phone: phone,
                      multipleBirth: patient.multipleBirthBoolean || (patient.multipleBirthInteger > 0),
                      birthOrder: patient.multipleBirthInteger || null
                    });
                  }
                }
              });
          }
          this.$http
            .get("/ocrux/fhir/Patient?_include=Patient:link&_id=" + uid)
            .then(resp => {
              for (let entry of resp.data.entry) {
                let patient = entry.resource;
                if (
                  patient.meta.tag &&
                  patient.meta.tag.find(
                    tag => tag.code === process.env.VUE_APP_CRUID_TAG
                  ) !== undefined
                ) {
                  this.uid = patient.id;
                } else {
                  if (patient.id === this.$route.params.clientId)
                    this.selected = this.match_count;
                  let recordId, systemName, name, phone;
                  let clientUserId;
                  if (patient.meta && patient.meta.tag) {
                    for (let tag of patient.meta.tag) {
                      if (tag.system === "http://openclientregistry.org/fhir/clientid") {
                        clientUserId = tag.code;
                        systemName = tag.display;
                      }
                    }
                  }
                  let identifiers = [];
                  if (patient.identifier) {
                    for (let id of patient.identifier) {
                      let displName = this.getSystemURIDisplayName(id.system);
                      if (displName && displName.name) {
                        if (displName.id === "internalid") {
                          recordId = id.value;
                        }
                        identifiers.push({
                          name: displName.name,
                          value: id.value
                        });
                      } else {
                        identifiers.push({
                          name: (id.type && id.type.text) || id.system || "Identifier",
                          value: id.value
                        });
                      }
                    }
                  }
                  let extensions = [];
                  if (patient.extension) {
                    for (let id of patient.extension) {
                        extensions.push({
                          name: id.url,
                          value: ( id.valueString ? id.valueString : id.valueDate )
                        });
                    }
                  }
                  try {
                    name = patient.name.find(name => name.use === "official") || patient.name[0];
                    if(!name) {
                      name = { family: "", given: [] };
                    } else if(!name.given) {
                      name.given = []
                    }
                  } catch (err) {
                    name = { family: "", given: [] };
                  }
                  try {
                    phone = patient.telecom.find(
                      phone => (phone.system = "phone")
                    ).value;
                  } catch (err) {
                    phone = "";
                  }
                  if (
                    this.$route.query.pos &&
                    this.$route.query.pos === clientUserId
                  ) {
                    this.match_items.unshift({
                      fid: patient.id,
                      selectIdx: this.match_count,
                      system: systemName,
                      id: recordId,
                      gender: patient.gender,
                      birthdate: patient.birthDate,
                      name: patient.name,
                      telecom: patient.telecom,
                      identifier: identifiers,
                      extension: extensions,
                      family: name.family,
                      given: name.given.join(" "),
                      phone: phone,
                      multipleBirth: patient.multipleBirthBoolean || (patient.multipleBirthInteger > 0),
                      birthOrder: patient.multipleBirthInteger || null
                    });
                  } else {
                    this.match_items.push({
                      fid: patient.id,
                      selectIdx: this.match_count,
                      system: systemName,
                      id: recordId,
                      gender: patient.gender,
                      birthdate: patient.birthDate,
                      name: patient.name,
                      telecom: patient.telecom,
                      identifier: identifiers,
                      extension: extensions,
                      family: name.family,
                      given: name.given.join(" "),
                      phone: phone,
                      multipleBirth: patient.multipleBirthBoolean || (patient.multipleBirthInteger > 0),
                      birthOrder: patient.multipleBirthInteger || null
                    });
                  }
                  this.match_count++;
                }
              }
            });
        });
    },
    selectPatient(patient) {
      this.selected = patient.selectIdx;
    },
    breakMatch() {
      if (this.breaks.length > 0) {
        this.$store.state.progress.enable = true;
        this.$store.state.progress.title = "Breaing Match";
        let username = this.$store.state.auth.username;
        let url = `/ocrux/match/break-match?username=${username}`;
        let ids = [];
        for (let breakIt of this.breaks) {
          ids.push("Patient/" + breakIt.fid);
        }
        this.$http.post(url, ids).then(() => {
          this.$store.state.progress.enable = false;
          this.countMatchIssues();
          this.getPatient();
          this.getAuditEvents();
        });
      }
    },
    revertBreak() {
      if (this.unbreaks.length > 0) {
        this.$store.state.progress.enable = true;
        this.$store.state.progress.title = "UnBreaing Match";
        let username = this.$store.state.auth.username;
        let url = `/ocrux/match/unbreak-match?username=${username}`;
        let ids = [];
        for (let unBreak of this.unbreaks) {
          for (let match of this.match_items) {
            ids.push({
              id2: "Patient/" + match.fid,
              id1: "Patient/" + unBreak.fid
            });
          }
        }
        this.$http.post(url, ids).then(() => {
          this.$store.state.progress.enable = false;
          this.countMatchIssues();
          this.getPatient();
          this.getAuditEvents();
        });
      }
    },
    getAuditEvents() {
      this.matchEvents = [];
      let url = `/ocrux/fhir/AuditEvent?entity=${this.$route.params.clientId}&entity-name=submittedResource,breakTo,breakFrom,unBreak,unBreakFromResource&_sort=-_lastUpdated`;
      this.$http.get(url).then(response => {
        this.auditEvent = response.data;
        for (let event of response.data.entry) {
          let modifiedEvent = { matchData: [] };
          modifiedEvent.recorded = event.resource.recorded;
          let isBreakEvent = event.resource.entity.find(entity => {
            return entity.name === "break" || entity.name === "breakFrom";
          });
          let isUnBreakEvent = event.resource.entity.find(entity => {
            return (
              entity.name === "unBreak" || entity.name === "unBreakFromResource"
            );
          });
          let operation;
          if(event.resource.subtype && Array.isArray(event.resource.subtype)) {
            for (let subtype of event.resource.subtype) {
              if (subtype.system === "http://hl7.org/fhir/restful-interaction") {
                operation = subtype.code;
              }
            }
          }
          modifiedEvent.operation = operation;
          modifiedEvent.outcomeCode = event.resource.outcome;
          modifiedEvent.outcome = this.outcomes[event.resource.outcome];
          modifiedEvent.outcomeDesc = event.resource.outcomeDesc;
          if (event.resource.agent && Array.isArray(event.resource.agent)) {
            for (let agent of event.resource.agent) {
              if (agent.altId) {
                modifiedEvent.username = agent.altId;
              }
              if (agent.network) {
                modifiedEvent.ipaddress = agent.network.address;
              }
            }
          }
          if (isBreakEvent) {
            modifiedEvent.breakFrom = [];
            modifiedEvent.type = "breakMatch";
            for (let entity of event.resource.entity) {
              if (entity.name === "break") {
                modifiedEvent.break = entity.what.reference;
              }
              if (entity.name === "oldCRUID") {
                modifiedEvent.CRUID = entity.what.reference;
              }
              if (entity.name === "breakFrom") {
                modifiedEvent.breakFrom.push(entity.what.reference);
              }
            }
            this.matchEvents.push(modifiedEvent);
            continue;
          }
          if (isUnBreakEvent) {
            modifiedEvent.unBreakFrom = [];
            modifiedEvent.type = "unBreak";
            for (let entity of event.resource.entity) {
              if (entity.name === "unBreak") {
                modifiedEvent.unBreak = entity.what.reference;
              }
              if (entity.name === "unBreakFromCRUID") {
                modifiedEvent.unBreakFromCRUID = entity.what.reference;
              }
              if (entity.name === "unBreakFromResource") {
                modifiedEvent.unBreakFrom.push(entity.what.reference);
              }
            }
            this.matchEvents.push(modifiedEvent);
            continue;
          }
          for (let entity of event.resource.entity) {
            if (entity.name === "submittedResource") {
              modifiedEvent.type = "submittedResource";
              modifiedEvent.submittedResource = entity.what.reference;
              for (let detail of entity.detail) {
                if (detail.type === "resource") {
                  modifiedEvent.submittedResourceData = detail.valueString;
                } else if (detail.type === "match" && detail.valueBase64Binary) {
                  let matches = new Buffer.from(detail.valueBase64Binary, "base64").toString("ascii");
                  matches = JSON.parse(matches);
                  let decRule = [];
                  for (let field in matches.rule.fields) {
                    let fieldDet = matches.rule.fields[field];
                    decRule.push({
                      name: field,
                      id: field,
                      details: fieldDet
                    });
                  }
                  modifiedEvent.matchData.push({
                    decisionRule: decRule,
                    matchingType: matches.rule.matchingType,
                    filters: matches.rule.filters,
                    autoMatches: JSON.stringify(matches.autoMatches, 0, 2),
                    potentialMatches: JSON.stringify(matches.potentialMatches, 0, 2),
                    conflictsMatchResults: JSON.stringify(matches.conflictMatches, 0, 2),
                    query: JSON.stringify(matches.query, 0, 2)
                  });
                }
              }
            }
          }
          this.matchEvents.push(modifiedEvent);
        }
      });
    },
    close() {
      window.close()
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
