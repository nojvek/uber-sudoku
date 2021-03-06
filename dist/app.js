require.config({
  baseUrl: "lib",
  paths: {
    jquery: "https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min",
    lodash: "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash.min",
    vue: "https://cdnjs.cloudflare.com/ajax/libs/vue/0.11.5/vue.min"
  }
});

define(["jquery", "lodash", "vue"], function($, _, Vue) {
  return console.log("require called", arguments);
});
