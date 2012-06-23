/*global DB */
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
    // console.log('click search!');
    alert($("#input").val());
    var input = $("#input").val();
    //https://graph.facebook.com/search?q=QUERY&type=OBJECT_TYPE
    // $.getJSON('https://graph.facebook.com/me/home?q=' + input + '&access_token=', 
    //   {access_token: $access_token.val()},
    //   function(data,status){
    //     console.log('data: ',data)
    //   });
    FB.get('me/home', {q:input,limit:15}, function(data){
      var itemsToTokenize = {};
      var item = {};
      var itemsAfterTokenize = {};
      console.log('FB.get,data: ',data);
      
      BAYES.getCASProb(data.data,function(sortToken){
        console.log(sortToken);
        $.each(sortToken,function(k,v){
          console.log('v:',v);
          if(v.type == 'TYPEstatus' ){            
            
            if( v.originMsg.length > 30 )
               v.originMsg = v.originMsg.slice(0,30) + "..." ;

            lists[v.type].append('<div class="oneStatus"> ' + 
              '<img src="' + API_URL + v.from + '/picture">' + 
              '<div class="text"><p><span>' + v.name + '</span><p>' +
              '<span class="msg"><a href="https://www.facebook.com/' + v.from + '/posts/' + v.tokenId[1]  + '">'
              + v.originMsg + '</a></div>'
            );

          }
          else if(v.type == 'TYPEphoto'){
            lists[v.type].append('<div class="onePhoto">' + 
              '<img class="p" src="' + v.picture +
              '<img class="u" src="https://graph.facebook.com/' + v.from + '/picture">' + 
              '<span class="t">' + v.create_time + '</span></div>');            
          }
          else if(v.type == 'TYPEvideo'){

          }
        });
      });
    
    });
  });
  
  

}());