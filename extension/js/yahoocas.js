/*global chrome */

(function(chrome, undefined){
  "use strict";
  var APP_ID = "N_XPkVrV34EdffJI6YyJb9ESkLxDgZ6hS3GpWQjVH.VKdu7qvtYa0xT3_SG.8lb1SLup.g--",
      URL = "http://asia.search.yahooapis.com/cas/v1/ws/";
  $.post(URL, {
    appid: APP_ID,
    content: '我與父親不相見已有二年餘了，我最不能忘記的是他的背影。那年冬天，祖母死了，父親的差使也交卸了，正是禍不單行的日子，我從北京到徐州',
    format: 'json'
  }, function(data){console.log('CAS', data)}, 'json');

}(chrome));