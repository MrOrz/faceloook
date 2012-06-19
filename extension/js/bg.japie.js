/*global chrome, FB */
  var bayes = new Bayesian({
    backend:{
      options:{
        name : 'floook'
      }
    }
  });
  var datas = [];

(function(chrome, undefined){
  "use strict";

  // Chrome extension listener
  chrome.extension.onRequest.addListener(function(request){
    var fbid;
    switch(request.type){

      // Insert new record into database
      case "insert":
        fbid = request.fbid;
        console.info('inserting', fbid);
        $.db("INSERT INTO entry (fbid, updated_at)" +
         "values (?, datetime('now', 'localtime'));",
          [fbid]);
        break;

      // Update "clicked"
      case "update":
        fbid = request.fbid;
        console.info('updating', fbid);
        $.db("INSERT OR REPLACE INTO entry (fbid, updated_at, clicked)" +
          "values (?, datetime('now', 'localtime'), 1);",
          [fbid]);
        break;
    }
  });

  
  //====train click=======
  console.log('======train click=====');
  var id = {ids:"486384621378922,378839218841432,485176134832387,4212032504555,316182211803922,4181515221392,482151841800482,482113778470955,485743091443075,304179879676562"};

  FB.get('', id ,function(data){
    $.each(data, function(){

      var item = {
        id : this.id,
        groupId : '',
        message : this.message || "",
        from : this.from.name,
        // updated : this.updated_time || this.created_time,
        link : this.link || "",
        linkName : this.name || "",
        linkDesct : this.description || ""
      };

      // Group message detection
      var tokens = this.id.split('_');
      if(tokens.length === 2){
        item.groupId = tokens[0];
        item.id = tokens[1];
      }

      console.log('ITEM', item);
      $.each(item,function(k,v){        
        datas.push({input:v,output:'not'});
      }); 
    });
    console.log('=======data after click :',datas);
  });

//====train not click=======
  console.log('======train not click=====');
  id = {ids: "461401763877036,456958430988140,3293708616747,394871653891039,3885404424407,381039235265234,430403856979197,3580583166894,457208527626687,359550394105248,461316040552275"};
  
  FB.get('', id ,function(data){
    $.each(data, function(){

      var item = {
        id : this.id,
        groupId : '',
        message : this.message || "",
        from : this.from.name,
        updated : this.updated_time || this.created_time,
        link : this.link || "",
        linkName : this.name || "",
        linkDesct : this.description || ""
      };

      // Group message detection
      var tokens = this.id.split('_');
      if(tokens.length === 2){
        item.groupId = tokens[0];
        item.id = tokens[1];
      }

      console.log('ITEM', item);
      $.each(item,function(k,v){
        datas.push({input:v,output:'not'});
      });      
    });
    console.log('=======data after not:',datas);
  });


}(chrome));

function testC(){
  var bayes = new Bayesian({
    backend:{
      options:{
        name : 'floook'
      }
    }
  });

  var A = {input:"cheap replica watches",output : 'spam'};
  var B = {input:"I don't know if this works on windows",output:'not'};
  var C = {input:"Orz is lalala",output:'not'};
  var E = {input:"you are good",output:'spam'};
  var F = {input:"hi, i'm la",output:'not'};
  var D = [A ,B ,C ,E ,F];
  console.log('D:',D);
  bayes.trainAll(D);

  console.log('====== test =======')
  var category = bayes.classify("hi, i'm japie.");   // "spam"
  console.log('====== test result:=======')
  console.log(category);
  category = bayes.classify("free watch");   // "spam"
  console.log('====== test result:=======')
  console.log(category);  
  // console.log('========bayes.getProbsSync========')
  // bayes.getProbs("free watches",function(p){console.log('p:',p)});
  
};

function trainAll(){
  //=======train
  console.log('trainAll !');
  bayes.trainAll(datas);

  //===== test result
  console.log('======test result=====');
  var t = {ids: "282340608531485"};
  
  // FB.get('', t ,function(data){
  //     var item = {
  //       id : this.id,
  //       groupId : '',
  //       message : this.message || "",
  //       from : this.from.name,
  //       updated : this.updated_time || this.created_time,
  //       link : this.link || "",
  //       linkName : this.name || "",
  //       linkDesct : this.description || ""
  //     };

  //     // Group message detection
  //     var tokens = this.id.split('_');
  //     if(tokens.length === 2){
  //       item.groupId = tokens[0];
  //       item.id = tokens[1];
  //     }

  //     console.log(' test ITEM: ', item);
      
  // });
      // $.each(item,function(k,v){
      var category = bayes.classify("Liang Bo");
      console.log('======result======')
      console.log(category);      
      // });
};