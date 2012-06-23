/*global DB, BAYES, FB, GET, _ */
(function(undefined){
  "use strict";

  var lists = {
    'TYPEstatus': $('.status'),
    'TYPEvideo': $('.video'),
    'TYPEphoto': $('.photo'),
    'TYPElink': $('.link'),
    'TYPEcheckin': $('.checkin'),
    'TYPEnormal': $('.status')
  };


  var
  API_URL = "https://graph.facebook.com/",
  suggestions = [];

  /*GET(src, function(){})\
  src 可以是 facebook id 的陣列
  function(data){ } 拿到的會是斷詞過後的結果*/
  //FB.get('me/feed', {limit:10}, function(data){...})
  var app2div = function(sortToken){
    $.each(sortToken,function(k,v){
      console.log('v:',v);
      var postId = FB.ID(v.id);
      var info = "" ;
      var href = "https://www.facebook.com/" +
               (v.rowData.href || v.from + '/posts/' + postId);
      console.log('postId:',postId);
      if(v.type === 'TYPEphoto' || v.type === 'TYPEvideo'){
        // make text information
        if(v.originMsg !== "" ){
          info = info + '<span class="pmsg">' + v.originMsg + '</span></br>' ;
        }
        if(v.originCap !== "" ){
          info = info + '<span class="pmsg cap">' + v.originCap + '</span></br>' ;
        }
        if(v.originLinkDesct !== "" ){
          info = info + '<span class="pmsg des">' + v.originLinkDesct + '</span></br>' ;
        }
        console.log('info:',info);
        // append
        var now = new Date();
        var updateTime = new Date();
        var age = (now - v.updated)/60000;

        console.log('age:',age);
        lists[v.type].append('<div class="onePhoto">' +
          '<a href="' + v.originLink + '">' +
            '<img class="p" src="' + v.picture + '">' +
          '</a>' +
          '<div class="info">' +
            '<a href="' + href + '" target="_blank">' +
              '<div class="pmsg">' + info + '</div>' +
            '</a>' +
            '<div>' +
              '<a href="https://www.facebook.com/' + v.from  + '">' +
                '<span class="pmsg u">' + v.name + '</span>' +
              '</a>' +
              '<span class="pmsg time">' + age + ' mins</span></br>' +
            '</div>' +
          '</div>' +
        '</div>');
      }
      else if(v.type === 'TYPElink'){
        // make text information
        if(v.originLinkName !== "" ){
          info = info + '<span class="pmsg lname">' + v.originLinkName + '</span></br>' ;
        }
        if(v.originLinkDesct !== "" ){
          info = info + '<span class="pmsg ldes">' + v.originLinkDesct + '</span></br>' ;
        }
        if(v.originMsg !== "" ){
          info = info + '<span class="pmsg des">' + v.originMsg + '</span></br>' ;
        }
        console.log('info:',info);

        lists[v.type].append('<div class="oneLink">' +
          '<a href="' + v.originLink + '">' +
            '<img class="p" src="' + v.picture + '">' +
          '</a>' +
          '<div class="info">' +
            '<a href="https://www.facebook.com/' + v.from + '/posts/' + postId  + '" target="_blank">' +
              '<div class="pmsg">' + info + '</div>' +
            '</a>' +
            '<div>' +
              '<a href="https://www.facebook.com/' + v.from  + '">' +
                '<span class="pmsg u">' + v.name + '</span>' +
              '</a>' +
              // '<span class="pmsg time">' + age + ' mins</span></br>' +
            '</div>' +
          '</div>' +
        '</div>');
      }
      else if(v.type === 'TYPEcheckin'){
        lists[v.type].append('<div class="oneCheck">' +
          '<img class="u" src="' + API_URL + v.from + '/picture">' +
          '</div>');
      }
      else if(v.type === 'TYPEstatus' || 1 ){
        // console.log('v.type === status');
        // console.log(lists[v.type]);
        v.type = 'TYPEstatus';
        lists[v.type].append('<div class="oneStatus" > ' +
          '<img class="u" src="' + API_URL + v.from + '/picture">' +
          '<div class="text">' +
            '<a href="https://www.facebook.com/' + v.from + '/posts/' + postId  + '" target="_blank">' +
              '<span class="name">' + v.name + '</span>' + '<br>' +
              '<span class="msg">' + v.originMsg + '</span>' +
            '</a>' +
          '</div>' +
        '</div>'
        );
        // console.log('v.type === status doneeeeee');
      }
    });
  };

  GET(DB.getRecentlySeen, function(data){
    // data is the same as bg.js
    console.log('GET, data: ',data);
    //sorted
    $.each(data,function(k,v){
      v.prob = BAYES.getProb(v);
      suggestions.push(v);
    });
    console.log('after each, data: ',data);
  },function(){
    console.log('suggestions: ', suggestions);
    var sortToken = _.sortBy(suggestions,function(v){ return -v.prob;});
    console.log('sortToken: ', sortToken);
    app2div(sortToken);
  });

  $('#searchform').on('submit',function(e){
    e.preventDefault();
    //clear list
    $.each(lists,function(k,v){
      v.empty();
    });
    // console.log('click search!');
    alert($("#input").val());
    var input = $("#input").val();
    FB.get('me/home', {q:input,limit:30}, function(data){
      console.log('FB.get,data: ',data);
      BAYES.getCASProb(data.data,function(sortToken){

        // injecting "rowData" property into sortToken
        var fbids = _.map(sortToken, function(v){return FB.ID(v.id)});
        console.log(fbids);
        DB.getByFBIDs(fbids, function(tx, result){
          var i = 0, rows = result.rows, rowData = {}, row;
          for(; i<rows.length; i+=1){
            row = rows.item(i);
            rowData[row.id] = row;
          }
          _.each(sortToken, function(v, i){
            sortToken[i].rowData = rowData[v.id] || {};
          });
          console.log(sortToken);
          app2div(sortToken);
        });
      });

    });
  });



}());