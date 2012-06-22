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
    'status': $('.status'),
    'video': $('.video'),
    'photo': $('photo'),
    'link': $('link')
  };

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
    FB.get('me/home', {q:input,limit:2}, function(data){
      var itemsToTokenize = {};
      console.log('FB.get,data: ',data);
      
      $.each(data.data,function(k,v){
        // console.log('k: ',k);
        // console.log('v: ',v);

        itemsToTokenize[this.id] = {
          message : this.message || "",
          link : this.link || "",
          linkName : this.name || "",
          linkDesct : this.description || "",
          caption : this.caption || ""
        };
      
        // lists[v.type].append('<div>'+v+'</div>');
      });

      CAS(itemsToTokenize, function(tokenized){
        console.log('CAS, tokenized: ',tokenized);
        //get prob from classifier w/
        var bayes = new Bayesian({
          backend:{
            options : {
              name : 'japie'
            }
          }
        });
        console.log('tokenized: ',tokenized);
        $.each(tokenized,function(k,v){
          var thismsg = {};
          console.log('v',v);
          var totalmsg = "";
          $.each(v,function(k,msg){
            if(msg!=''){
              totalmsg = totalmsg + msg
            }
          });
          console.log('totalmsg: ',totalmsg);
          var category = bayes.classify(totalmsg);
          console.log('category: ',category);
          // $.extend(true,,thismsg,category);
          // // thismsg.append(category);
          // console.log('thismsg: ',thismsg);
          v.prob = category;
        });
        console.log('tokenized: ',tokenized);
      }).fail(function(){
        console.log('CAS fails!')
      });

      // var ret = $.extend(true, {}, items, tokenized);

    });

  });
  
  

}());