/*global Bayesian, CAS, _ */

(function(){
  "use strict";
  var bayes,
  THRESHOLD = 0.7,
  init = function(){
    bayes = new Bayesian({
      backend:{
        options : {
          name : 'japie'
        }
      }
    });
  };

  window.BAYES = {
    trainObj : function(data){
      $.each(data,function(k,v){
        if(v.message !==''){
          bayes.train(v.message,v.rowData.clicked);
          bayes.train(v.from,v.rowData.clicked);
          if(v.link !== ''){
            bayes.train(v.link,v.rowData.clicked);
          }
          if(v.groupId !== ''){
            bayes.train(v.groupId,v.rowData.clicked);
          }
          if(v.type !== ''){
            bayes.train( 'TYPE' + v.type,v.rowData.clicked);
          }
          if(v.caption !== ''){
            bayes.train( v.caption ,v.rowData.clicked);
          }
        }
      });
    },

    getCASProb : function(data,callback){

      var itemsToTokenize = {};
      var item = {};
      $.each(data,function(){
        itemsToTokenize[this.id] = {
          message : this.message || "",
          link : this.link || "",
          linkName : this.name || "",
          linkDesct : this.description || "",
          caption : this.caption || ""
        };

        item[this.id] = {
          type : 'TYPE' + this.type,
          id : this.id,
          groupId : '',
          from : this.from.id,
          name : this.from.name,
          picture : this.picture || "",
          story : this.story || "",
          create_time : this.created_time || "",
          updated : this.updated_time || this.created_time,

          originMsg : this.message || "",
          originCap : this.caption || "",
          originLink : this.link || "",
          originLinkName : this.name || "",
          originLinkDesct : this.description || ""
        };
      });
      console.log('itemsToTokenize: ',itemsToTokenize);
      console.log('item: ',item);

      CAS(itemsToTokenize, function(tokenized){
        tokenized = $.extend(true,{},item,tokenized);
        console.log('CAS, tokenized: ',tokenized);
        //get prob from classifier w/
        _(tokenized).each(function(v,k){
          var p = window.BAYES.getProb(v);
          v.prob = p;
        });
        // console.log('tokenized: ',tokenized);

        //deal w/ after tokenized
        var sortToken = _.sortBy(_.values(tokenized),function(v){ return -v.prob;});
        console.log('sortToken: ',sortToken);
        callback(sortToken);

      }).fail(function(){
        console.log('CAS fails!')
      });

    },

    getProb : function(tokenized){

      // console.log('tokenized: ',tokenized);
      var totalmsg = "";
      $.each(tokenized,function(k,msg){
        if(msg !== ''){
          totalmsg = totalmsg + ' ' + msg;
        }
      });
      var category = bayes.classify(totalmsg);

      //==== weight ====
      var clickTime = new Date(tokenized.rowData.updated)
      console.log('clickTime',clickTime);
      var now = new Date();
      var age = now - clickTime
      console.log('age',age);

      return Math.exp(-age) * category[1]/(category[0] + category[1]);
    },

    isInterested: function(tokenized){
      return window.BAYES.getProb(tokenized) > THRESHOLD;
    },

    // clear local storage
    resetStorage: function(){
      localStorage.clear();
      init();
    }
  };

  // Initialize bayes variable
  init();
}());