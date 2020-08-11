<!-- Alert.vue -->
<template>
  <div>
    <v-alert class="text-center" :value="!!message" :type="type" dismissible
      >{{ alert['message'] }}</v-alert
    >
  </div>
</template>

export