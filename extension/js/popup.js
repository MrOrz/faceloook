/*global DB, BAYES, FB */
(function(undefined){
  "use strict";

  var
  $clicked = $('.clicked tbody'),
  $not_clicked = $('.not_clicked tbody'),
  trMaker = function(row){
    var
    td1 = $('<td><a href="javascript:;">' + row.fbid + '</a></td>'),
    td2 = $('<td>' + row.updated_at + '</td>');
    return $('<tr></tr>').append(td1).append(td2);
  };

  DB("SELECT * FROM entry WHERE clicked=1 ORDER BY updated_at DESC;",
    [], function(tx, result){
      var rows = result.rows, i;
      for(i=0; i<rows.length; i+=1){
        trMaker(rows.item(i)).appendTo($clicked);
      }
    }
  );

  DB("SELECT * FROM entry WHERE clicked=0 ORDER BY updated_at DESC;",
    [], function(tx, result){
      var rows = result.rows, i;
      for(i=0; i<rows.length; i+=1){
        trMaker(rows.item(i)).appendTo($not_clicked);
      }
    }
  );

  // $('table').on('click', 'a', function(e){
  //   e.preventDefault();
  //   var fbid = $(this).text();
  //   $.getJSON('https://graph.facebook.com/' + fbid, {
  //     access_token: $access_token.val()
  //   }, function(data){
  //     alert(data.from.name + ': ' + data.message);
  //   })
  // });

  var lists = {
    'TYPEstatus': $('.status'),
    'TYPEvideo': $('.video'),
    'TYPEphoto': $('.photo'),
    'TYPElink': $('.link'),
    'TYPEcheckin': $('.checkin')
  };

  var API_URL = "https://graph.facebook.com/";

  /*GET(src, function(){})\
  src 可以是 facebook id 的陣列
  function(data){ } 拿到的會是斷詞過後的結果*/
  //FB.get('me/feed', {limit:10}, function(data){...})
  $('#searchform').on('submit',function(e){
    e.preventDefault();
    //clear list
    $.each(lists,function(k,v){
      v.empty();
    });
    // console.log('click search!');
    alert($("#input").val());
    var input = $("#input").val();
    FB.get('me/home', {q:input,limit:15}, function(data){
      var itemsToTokenize = {};
      var item = {};
      var itemsAfterTokenize = {};
      console.log('FB.get,data: ',data);

      BAYES.getCASProb(data.data,function(sortToken){
        console.log(sortToken);
        $.each(sortToken,function(k,v){
          console.log('v:',v);
          var postId = FB.ID(v.id);
          if(v.type === 'TYPEstatus' ){
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

          }
          else if(v.type === 'TYPEphoto'){
            // make text information
            var info = "" ;
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
            //append
            var now = new Date();
            var age = (now - v.create_time)/60000;
            lists[v.type].append('<div class="onePhoto">' +
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
                  '<span class="pmsg time">' + age + ' mins</span></br>' +
                '</div>' +
              '</div>' +
            '</div>');
          }
          else if(v.type === 'TYPEvideo'){
            lists[v.type].append('<div class="onePhoto">' +
              '</div>');
          }
        });
      });

    });
  });



}());