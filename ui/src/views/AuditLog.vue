<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h2 class="text-h5 font-weight-medium mb-1">Audit Log</h2>
        <p class="text--secondary mb-4">Full audit trail of patient record changes, configuration updates, and user actions (CRF-8)</p>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="search"
          label="Search audit events"
          prepend-inner-icon="mdi-magnify"
          outlined
          dense
          rounded
          clearable
          hide-details
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filterType"
          :items="eventTypes"
          label="Event type"
          outlined
          dense
          clearable
          hide-details
        ></v-select>
      </v-col>
      <v-col cols="12" md="3">
        <v-menu
          v-model="dateMenu"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="dateRange"
              label="Date range"
              prepend-inner-icon="mdi-calendar"
              outlined
              dense
              clearable
              hide-details
              readonly
              v-bind="attrs"
              v-on="on"
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="dates"
            range
            no-title
            @input="updateDateRange"
          ></v-date-picker>
        </v-menu>
      </v-col>
      <v-col cols="12" md="2">
        <v-btn color="primary" depressed block @click="fetchAuditEvents">
          <v-icon left>mdi-refresh</v-icon>
          Refresh
        </v-btn>
      </v-col>
    </v-row>

    <v-card rounded="lg" outlined>
      <v-data-table
        :headers="headers"
        :items="filteredEvents"
        :loading="loading"
        :items-per-page="20"
        :footer-props="{ 'items-per-page-options': [10, 20, 50, 100] }"
        class="audit-table"
      >
        <template v-slot:item.recorded="{ item }">
          <span class="text-caption">{{ item.recorded | moment("YYYY-MM-DD HH:mm:ss") }}</span>
        </template>

        <template v-slot:item.type="{ item }">
          <v-chip
            small
            :color="getEventColor(item.type)"
            dark
          >
            {{ item.type }}
          </v-chip>
        </template>

        <template v-slot:item.action="{ item }">
          <v-chip small outlined>{{ item.action }}</v-chip>
        </template>

        <template v-slot:item.outcome="{ item }">
          <v-icon small :color="item.outcome === '0' ? 'success' : 'error'">
            {{ item.outcome === '0' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
          </v-icon>
          <span class="ml-1 text-caption">{{ item.outcome === '0' ? 'Success' : 'Failure' }}</span>
        </template>

        <template v-slot:item.agent="{ item }">
          <span class="text-caption">{{ item.agent }}</span>
        </template>

        <template v-slot:item.entity="{ item }">
          <a v-if="item.entityRef" @click="goToPatient(item.entityRef)" class="text-decoration-none">
            {{ item.entity }}
          </a>
          <span v-else class="text-caption">{{ item.entity }}</span>
        </template>

        <template v-slot:no-data>
          <div class="text-center py-8">
            <v-icon size="48" color="grey lighten-1">mdi-clipboard-text-clock-outline</v-icon>
            <p class="text--secondary mt-2">No audit events found</p>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
import axios from "axios";

export default {
  name: "AuditLog",
  data() {
    return {
      loading: false,
      search: "",
      filterType: null,
      dateMenu: false,
      dates: [],
      dateRange: "",
      events: [],
      headers: [
        { text: "Timestamp", value: "recorded", width: "180px" },
        { text: "Type", value: "type", width: "140px" },
        { text: "Action", value: "action", width: "120px" },
        { text: "Outcome", value: "outcome", width: "120px" },
        { text: "Agent", value: "agent" },
        { text: "Entity", value: "entity" },
      ],
      eventTypes: [
        "Patient Create",
        "Patient Update",
        "Patient Merge",
        "Match Decision",
        "Break Match",
        "Configuration",
        "Authentication",
      ],
    };
  },
  computed: {
    filteredEvents() {
      let result = this.events;
      if (this.search) {
        const s = this.search.toLowerCase();
        result = result.filter(
          (e) =>
            (e.agent && e.agent.toLowerCase().includes(s)) ||
            (e.entity && e.entity.toLowerCase().includes(s)) ||
            (e.type && e.type.toLowerCase().includes(s))
        );
      }
      if (this.filterType) {
        result = result.filter((e) => e.type === this.filterType);
      }
      return result;
    },
  },
  methods: {
    async fetchAuditEvents() {
      this.loading = true;
      try {
        let url = `/ocrux/fhir/AuditEvent?_count=200&_sort=-date`;
        if (this.dates.length === 2) {
          url += `&date=ge${this.dates[0]}&date=le${this.dates[1]}`;
        }
        const response = await axios.get(url);
        const bundle = response.data;
        this.events = [];
        if (bundle && bundle.entry) {
          for (const entry of bundle.entry) {
            const ae = entry.resource;
            if (!ae) continue;
            const typeCoding =
              ae.type && ae.type.coding && ae.type.coding[0];
            const agentName =
              ae.agent &&
              ae.agent[0] &&
              ae.agent[0].who &&
              (ae.agent[0].who.display || ae.agent[0].who.reference);
            const entityRef =
              ae.entity &&
              ae.entity[0] &&
              ae.entity[0].what &&
              ae.entity[0].what.reference;
            const entityDisplay =
              ae.entity &&
              ae.entity[0] &&
              ae.entity[0].what &&
              (ae.entity[0].what.display || ae.entity[0].what.reference);

            this.events.push({
              recorded: ae.recorded || "",
              type: this.mapEventType(typeCoding),
              action: ae.action || "",
              outcome: ae.outcome || "",
              agent: agentName || "System",
              entity: entityDisplay || "",
              entityRef: entityRef || null,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch audit events:", error);
      }
      this.loading = false;
    },
    mapEventType(coding) {
      if (!coding) return "Unknown";
      const code = coding.code || "";
      const display = coding.display || code;
      if (code === "110110") return "Patient Create";
      if (code === "110112") return "Patient Update";
      if (code === "110100") return "Authentication";
      return display || "Unknown";
    },
    getEventColor(type) {
      const colors = {
        "Patient Create": "success",
        "Patient Update": "primary",
        "Patient Merge": "accent",
        "Match Decision": "info",
        "Break Match": "warning",
        Configuration: "secondary",
        Authentication: "grey",
      };
      return colors[type] || "grey";
    },
    updateDateRange() {
      if (this.dates.length === 2) {
        this.dateRange = `${this.dates[0]} — ${this.dates[1]}`;
        this.dateMenu = false;
      }
    },
    goToPatient(ref) {
      if (ref && ref.startsWith("Patient/")) {
        const id = ref.replace("Patient/", "");
        this.$router.push({ name: "client", params: { clientId: id } });
      }
    },
  },
  mounted() {
    this.fetchAuditEvents();
  },
};
</script>

<style scoped>
.audit-table th {
  text-transform: uppercase !important;
  font-size: 0.7rem !important;
  letter-spacing: 0.05em;
}
</style>
