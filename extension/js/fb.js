/*global FB, chrome */

(function(chrome, undefined){
  "use strict";

  // Pub/sub interface
  var
  LOGIN_URL = "https://www.facebook.com/dialog/oauth?client_id=" +
    "224887097626771&response_type=token&scope=read_stream&redirect_uri=" +
    "http://www.facebook.com/connect/login_success.html",
  SUCCESS_URL = "https://www.facebook.com/connect/login_success.html",
  API_URL = "https://graph.facebook.com/",
  callbacks = {
    contentParsed: $.Callbacks('unique memory'),
    loggedIn: $.Callbacks('unique memory')
  };

  // Pub/sub interface
  window.FB = {
    _loginTabId: null,
    _check : function(eventType){
      if(!callbacks[eventType]){
        console.error('Undefined event type for myFB');
        return false;
      }
      return true;
    },
    // event handler of login tab URL change
    _facebookLogin : function(tabId, changeInfo, tab){
      // check if the login tab achieves success state
      console.log('Tab change info:', changeInfo, tab, FB._loginTabId);
      if(changeInfo.status === 'complete' && tabId === FB._loginTabId && tab.url.indexOf(SUCCESS_URL) === 0){
        var result = tab.url.match(/access_token=(\w+)/);
        if(result){

          // Store the access token to local storage
          localStorage.accessToken = result[1];
          console.log(localStorage.accessToken);

          // Close tab and reset
          chrome.tabs.onUpdated.removeListener(FB._facebookLogin);
          chrome.tabs.remove(FB._loginTabId);
          FB._loginTabId = null;

          // fire loggedIn callback
          callbacks.loggedIn.fire();
        }
      }
    },
    subscribe : function(eventType, func){
      if(this._check(eventType)){
        callbacks[eventType].add(func);
      }
      return this;
    },
    unsubscribe : function(eventType, func){
      if(this._check(eventType)){
        callbacks[eventType].remove(func);
      }
      return this;
    },
    login: function(){
      chrome.tabs.create({
        url: LOGIN_URL
      }, function(tab){
        FB._loginTabId = tab.id;
        chrome.tabs.onUpdated.addListener(FB._facebookLogin);
      });
    },
    get: function(url, func){

      // If no access token
      if(!localStorage.accessToken){
        // Retry after logged in
        FB.subscribe('loggedIn', function retry(){
          FB.get(url, func);
          FB.unsubscribe('loggedIn', retry);
        });
        // trigger login
        FB.login();
      }
      else { // If has access token
        $.getJSON(API_URL + url + '?access_token=' + localStorage.accessToken, {},
          function(data){
            func(data);
          }).fail(function(jqXHR){
            var err = $.parseJSON(jqXHR.responseText).error;
            console.error('Error while requesting "'+url+'" : ', err);

            // Check if access token is invalid (error code 190).
            // If so, clean up access token and try again.
            if(err.code === 190){
              delete localStorage.accessToken;
              FB.get(url, func);
            }
          });
      }

      return FB; // enable chaining
    }
  };

  // facebook inititialization
  //if(! localStorage.accessToken){
  //  FB.login();
  //}

}(chrome));