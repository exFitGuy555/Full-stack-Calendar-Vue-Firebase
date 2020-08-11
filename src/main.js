import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import VueTextAreaautosize from 'vue-textarea-autosize';
import firebase from 'firebase/app';
import 'firebase/firestore';
import VueSimpleAlert from "vue-simple-alert";

Vue.use(VueSimpleAlert);
Vue.use(VueTextAreaautosize)
Vue.use(vuetify)



Vue.config.productionTip = false

firebase.initializeApp({
  apiKey: "AIzaSyAMkEuqYnWjRUJYTCDy7eauC6Kmv9O8xEQ",
  authDomain: "vue-calendar-b2426.firebaseapp.com",
  databaseURL: "https://vue-calendar-b2426.firebaseio.com",
  projectId: "vue-calendar-b2426",
  storageBucket: "vue-calendar-b2426.appspot.com",
  messagingSenderId: "730320015317",
  appId: "1:730320015317:web:796fc59debf2925211f75c"
})


export const db = firebase.firestore();

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')
