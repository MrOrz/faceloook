/*global chrome */

(function(chrome, undefined){
  "use strict";
  var URL = "http://localhost:3000/q";
  //var URL = "http://faceloook.heroku.com/q";

  window.CAS = function(contents, func){
    contents = contents || {};
    return $.post(URL, {t: contents}, func, 'json');
  };
}(chrome));