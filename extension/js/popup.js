/*global DB */
(function(undefined){
  "use strict";

  var
  $access_token = $('#access_token'),
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

  

}());