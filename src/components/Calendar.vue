<template>
  <div>
    <template>
      <v-row class="fill-height">
        <v-col>
          <v-sheet height="64">
            <v-toolbar flat color="white">
              <v-btn color="primary" dark @click.stop="dialog = true">New Event</v-btn>
              <v-btn outlined class="mr-4" color="grey darken-2" @click="setToday">Today</v-btn>
              <v-btn fab text small color="grey darken-2" @click="prev">
                <v-icon small>mdi-chevron-left</v-icon>
              </v-btn>
              <v-btn fab text small color="grey darken-2" @click="next" class="mr-4">
                <v-icon small>mdi-chevron-right</v-icon>
              </v-btn>
              <v-toolbar-title v-if="$refs.calendar">{{ $refs.calendar.title }}</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-menu bottom right>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn outlined color="grey darken-2" v-bind="attrs" v-on="on">
                    <span>{{ typeToLabel[type] }}</span>
                    <v-icon right>mdi-menu-down</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item @click="type = 'day'">
                    <v-list-item-title>Day</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="type = 'week'">
                    <v-list-item-title>Week</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="type = 'month'">
                    <v-list-item-title>Month</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="type = '4day'">
                    <v-list-item-title>4 days</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-toolbar>
          </v-sheet>

          <!-- add Event dialog -->
          <!-- binding this element to dialog as we want it to show when dialog its true -->
          <v-dialog v-model="dialog" max-width="500">
            <v-card>
              <v-container>
                <!-- want it to submit when we run method called.... -->
                <v-form  @submit.prevent="addEvent">
                  <v-text-field v-model="name" type="text" label="event name (required)"></v-text-field>
                  <v-text-field v-model="details" type="text" label="detail"></v-text-field>
                  <v-text-field v-model="start" type="date" label="start (required)"></v-text-field>
                  <v-text-field v-model="end" type="date" label="end (required)"></v-text-field>
                  <v-text-field
                    v-model="color"
                    type="color"
                    label="color (click to open color menu)"
                  ></v-text-field>
                  <!-- click.stop = means dialog turns false and get closed once we submit -->
                  <v-btn
                    type="submit"
                    color="primary"
                    class="mr-4"
                    @click.stop="dialog = false"
                  >create event</v-btn>
                </v-form>
              </v-container>
            </v-card>
          </v-dialog>

          <v-sheet height="600">
            <v-calendar
              ref="calendar"
              v-model="focus"
              color="primary"
              :events="events"
              :event-color="getEventColor"
              :type="type"
              @click:event="showEvent"
              @click:more="viewDay"
              @click:date="viewDay"
              @change="updateRange"
            ></v-calendar>
            <v-menu
              v-model="selectedOpen"
              :close-on-content-click="false"
              :activator="selectedElement"
              offset-x
            >
              <v-card color="grey lighten-4" min-width="350px" flat>
                <v-toolbar :color="selectedEvent.color" dark>
                  <v-btn @click="deleteEvent(selectedEvent.id)" icon>
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                  <v-toolbar-title v-html="selectedEvent.name"></v-toolbar-title>
                  <v-spacer></v-spacer>
                </v-toolbar>
                <v-card-text>
                  <!-- currentlyEditing is null by default, if editing it will contain the event.id -->
                  <form v-if="currentlyEditing !== selectedEvent.id">{{selectedEvent.details}}</form>
                  <form v-else>
                    <textarea-autosize
                      v-model="selectedEvent.details"
                      type="text"
                      style="width:100%"
                      :min-height="100"
                      placeholder="add note"
                    ></textarea-autosize>
                  </form>
                </v-card-text>
                <v-card-actions>
                  <v-btn text color="secondary" @click="selectedOpen = false">Close</v-btn>
                  <!-- v if here means we clicked on edit btn and now currentlyEditing = selectedEvent.id and we on edit mode and the textarea visible||clickedit event will put us in edit mode -->
                  <v-btn
                    text
                    v-if="currentlyEditing !== selectedEvent.id"
                    @click.prevent="editEvent(selectedEvent)"
                  >Edit</v-btn>
                  <!-- and here the line will run if the iv condition above its not true || UPDATEEvent Will update the event in firebase-->
                  <v-btn text v-else @click.prevent="updateEvent(selectedEvent)">Save</v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>
          </v-sheet>
        </v-col>
      </v-row>
    </template>
  </div>
</template>


<script>
import { db } from "@/main.js";
export default {
  data: () => ({
    today: new Date().toISOString().substring(0, 10),
    focus: new Date().toISOString().substring(0, 10),
    type: "month",
    typeToLabel: {
      month: "Month",
      week: "Week",
      day: "Day",
      "4day": "4 Days",
    },
    //our firebase params
    name: null,
    details: null,
    start: null,
    end: null,
    color: "#1976d2",
    currentlyEditing: null,
    selectedEvent: {},
    selectedElement: null,
    selectedOpen: false,
    events: [],
    dialog: false,
  }),
  //gets called when com is mounted (upload)
  mounted() {
    this.getEvents();
  },
  computed: {
    title() {
      const { start, end } = this;
      if (!start || !end) {
        return "";
      }
      const startMonth = this.monthFormatter(start);
      const endMonth = this.monthFormatter(end);
      const suffixMonth = startMonth === endMonth ? "" : endMonth;
      const startYear = start.year;
      const endYear = end.year;
      const suffixYear = startYear === endYear ? "" : endYear;
      const startDay = start.day + this.nth(start.day);
      const endDay = end.day + this.nth(end.day);
      switch (this.type) {
        case "month":
          return `${startMonth} ${startYear}`;
        case "week":
        case "4day":
          return `${startMonth} ${startDay} ${startYear} - ${suffixMonth} ${endDay} ${suffixYear}`;
        case "day":
          return `${startMonth} ${startDay} ${startYear}`;
      }
      return "";
    },
    monthFormatter() {
      return this.$refs.calendar.getFormatter({
        timeZone: "UTC",
        month: "long",
      });
    },
  },
  methods: {
    async getEvents() {
      //callEvent its the collection name we created
      let snapshot = await db.collection("calEvent").get();
      let events = [];
      snapshot.forEach((doc) => {
        let appData = doc.data();
        appData.id = doc.id;
        events.push(appData);
      });
      this.events = events;
    },
    async addEvent() {
      if (this.name && this.start & this.end) {
        await db.collection("calEvent").add({
          name: this.name,
          details: this.details,
          start: this.start,
          end: this.end,
          color: this.color,
        });
        this.getEvents();
        this.name = "";
        this.details = "";
        this.start = "";
        this.end = "";
        this.color = "#1976d2";
      } else {
        this.$fire({
          title: "Plese Fill Up All Fields",
          text: "",
          type: "error",
          timer: 3000,
        }).then((r) => {
          console.log(r.value);
        });
      }
    },
    //from here all methods is firebase related
    //async because we dealing with firebase => returning a promise
    //we use currentlyEditing as the id of the selected updated elemnt
    async updateEvent(selectedEvent) {
      await db.collection("calEvent").doc(this.currentlyEditing).update({
        details: selectedEvent.details,
      });
      //closing the event popup
      //setting the currentlyEditing to null back for not showing around the id unnecessary
      this.selectedOpen = false;
      this.currentlyEditing = null;
    },
    async deleteEvent(selectedEvent) {
      await db.collection("calEvent").doc(selectedEvent).delete();
      this.selectedOpen = false;
      //calling the getEvents() AGAin TO GET THE updated EVENTS after the delete
      this.getEvents();
    },
    //sets the focus on the day that get pass in and sets the type to day , from default month view
    viewDay({ date }) {
      this.focus = date;
      this.type = "day";
    },
    getEventColor(event) {
      return event.color;
    },
    //sets the focus on today value that get pass in and sets the type to today date , from default month view
    setToday() {
      this.focus = "";
    },
    //uses calendar api that have the prev and next method (passing month by click on > and <)
    prev() {
      this.$refs.calendar.prev();
    },
    next() {
      this.$refs.calendar.next();
    },
    editEvent(selectedEvent) {
      this.currentlyEditing = selectedEvent.id;
    },
    //showEvent get pass in an object and taking the js script event, and the actual calendar event and show it
    //when open called ,its adds the selected ev to the selected event proerpty
    //nativeEvent.target = the actual DOM elemnt being target
    showEvent({ nativeEvent, event }) {
      const open = () => {
        this.selectedEvent = event;
        this.selectedElement = nativeEvent.target;
        setTimeout(() => (this.selectedOpen = true), 10);
      };

      if (this.selectedOpen) {
        this.selectedOpen = false;
        setTimeout(open, 10);
      } else {
        open();
      }

      nativeEvent.stopPropagation();
    },
    updateRange({ start, end }) {
      const events = [];

      const min = new Date(`${start.date}T00:00:00`);
      const max = new Date(`${end.date}T23:59:59`);
      const days = (max.getTime() - min.getTime()) / 86400000;
      const eventCount = this.rnd(days, days + 20);

      for (let i = 0; i < eventCount; i++) {
        const allDay = this.rnd(0, 3) === 0;
        const firstTimestamp = this.rnd(min.getTime(), max.getTime());
        const first = new Date(firstTimestamp - (firstTimestamp % 900000));
        const secondTimestamp = this.rnd(2, allDay ? 288 : 8) * 900000;
        const second = new Date(first.getTime() + secondTimestamp);

        events.push({
          name: this.names[this.rnd(0, this.names.length - 1)],
          start: first,
          end: second,
          color: this.colors[this.rnd(0, this.colors.length - 1)],
          timed: !allDay,
        });
      }

      this.events = events;
    },
    rnd(a, b) {
      return Math.floor((b - a + 1) * Math.random()) + a;
    },
  },
};
</script>

<style>
</style>