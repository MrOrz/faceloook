/*global _*/
/* classifier library by harthur (https://github.com/harthur/classifier)
 * Copyright (c) 2010 Heather Arthur <fayearthur@gmail.com> */

(function(){
"use strict";
var console = {
  log: $.noop
};
var LocalStorageBackend = function(options) {
  options = options || {};
  var name = options.name || Math.floor(Math.random() * 100000);

  this.prefix = 'classifier.bayesian.' + name;

  if (options.testing) {
    this.storage = {};
  }
  else {
    this.storage = localStorage;
  }

  this.storage[this.prefix + '.cats'] = this.storage[this.prefix + '.cats'] || '{}';
}

LocalStorageBackend.prototype = {
  async : false,

  getCats : function() {
    // console.log('getCats line29');
    // console.log('this.storage[this.prefix + ".cats" ]');
    // console.log(this.storage[this.prefix + '.cats']);
    // console.log('return JSON.parse(this.storage[this.prefix + .cats ]);');
    return JSON.parse(this.storage[this.prefix + '.cats']);
  },

  setCats : function(cats) {
    // console.log('setCats, JSON.stringify(cats) : ',JSON.stringify(cats));
    this.storage[this.prefix + '.cats'] = JSON.stringify(cats);
  },

  getWordCount : function(word) {
    // console.log('getWordCount')
    return JSON.parse(this.storage[this.prefix + '.words.' + word] || '{}');
  },

  setWordCount : function(word, counts) {
    this.storage[this.prefix + '.words.' + word] = JSON.stringify(counts);
  },

  getWordCounts : function(words) {
    // console.log('getWordCounts');
    var counts = {};
    words.forEach(function(word) {
      counts[word] = this.getWordCount(word);
    }, this);
    // console.log('getWordCount, counts:',counts);
    return counts;
  },

  incCounts : function(catIncs, wordIncs) {
    var cats = this.getCats();
    _(catIncs).each(function(inc, cat) {
      cats[cat] = cats[cat] + inc || inc;
    }, this);
    this.setCats(cats);
    _(wordIncs).each(function(incs, word) {
      var wordCounts = this.getWordCount(word);
      _(incs).each(function(inc, cat) {
        wordCounts[cat] = wordCounts[cat] + inc || inc;
      }, this);
      this.setWordCount(word, wordCounts);
    }, this);
  },

  toJSON : function() {
    var words = {};
    var regex = new RegExp("^" + this.prefix + "\\.words\\.(.+)$");
    for (var item in this.storage) {
      var match = regex.exec(item);
      if (match) {
        words[match[1]] = JSON.parse(this.storage[item]);
      }
    }
    return {
      cats: JSON.parse(this.storage[this.prefix + '.cats']),
      words: words
    };
  },

  fromJSON : function(json) {
    this.incCounts(json.cats, json.words);
  }
}

window.Bayesian = function(options) {
  options = options || {}
  this.thresholds = options.thresholds || {};
  this['default'] = options['default'] || 'unclassified';
  this.weight = options.weight || 1;
  this.assumed = options.assumed || 0.5;
  var backend = options.backend || {};
  this.backend = new LocalStorageBackend(backend.options);
};

window.Bayesian.prototype = {
  getCats : function(callback) {
    // console.log('getCats line100');
    return this.backend.getCats(callback);
  },

  getWordCounts : function(words, cats, callback) {
    return this.backend.getWordCounts(words, cats, callback);
  },

  incDocCounts : function(docs, callback) {
    // accumulate all the pending increments
    // console.log('incDocCounts(docs, callback) ===')

    var wordIncs = {};
    var catIncs = {};
    docs.forEach(function(doc) {
      var cat = doc.cat;
      catIncs[cat] = catIncs[cat] ? catIncs[cat] + 1 : 1;
      var words = this.getWords(doc.doc);
      words.forEach(function(word) {
        wordIncs[word] = wordIncs[word] || {};
        wordIncs[word][cat] = wordIncs[word][cat] ? wordIncs[word][cat] + 1 : 1;
      }, this);
    }, this);
    return this.backend.incCounts(catIncs, wordIncs, callback);
  },

  setThresholds : function(thresholds) {
    this.thresholds = thresholds;
  },

  getWords : function(doc) {
    // console.log('==== getWords() === ');
    // console.log('doc: ',doc);
    if (_(doc).isArray()) {
      // console.log('_(doc).isArray() , return doc ');
      return doc;
    }
    //why this line cannot be done well ?
    // var words = doc.split(/\W+/);
    var words = doc.split(" ");
    // console.log('words: ',words)
    // console.log('return _(words).uniq() : ' , _(words).uniq());
    return _(words).uniq();
  },

  train : function(doc, cat, callback) {
    this.incDocCounts([{doc: doc, cat: cat}], function(err, ret) {
      if (callback) {
        callback(ret);
      }
    });
  },

  trainAll : function(data, callback) {
    data = data.map(function(item) {
      return {doc: item.input, cat: item.output};
    });
    this.incDocCounts(data, function(err, ret) {
      if (callback) {
        callback(ret);
      }
    });
  },

  wordProb : function(word, cat, cats, counts) {
    // console.log('======function wordProb:======');
    // times word appears in a doc in this cat / docs in this cat
    var prob = (counts[cat] || 0) / cats[cat];
    // console.log('prob: ',prob);
    // get weighted average with assumed so prob won't be extreme on rare words
    var total = _(cats).reduce(function(sum, p, cat) {
      // console.log('sum- ',sum);
      return sum + (counts[cat] || 0);
    }, 0, this);
    // console.log('total:',total);
    // console.log('this.weight: ',this.weight);
    // console.log('this.assumed: ',this.assumed);
    // console.log('(this.weight * this.assumed + total * prob) / (this.weight + total) : ');
    // console.log((this.weight * this.assumed + total * prob) / (this.weight + total));
    return (this.weight * this.assumed + total * prob) / (this.weight + total);
  },

  getCatProbs : function(cats, words, counts) {
    // console.log('getCatProbs! line173:');
    // console.log('cats:',cats);
    // console.log('words:',words);
    var numDocs = _(cats).reduce(function(sum, count) {
      // console.log('sum+count:',sum+count);
      return sum + count;
    }, 0);

    var probs = {};
    // console.log('_(cats).each(function(catCount, cat) : ');
    _(cats).each(function(catCount, cat) {
      // console.log('catCount: ',catCount);
      // console.log('cat: ',cat);
      var catProb = (catCount || 0) / numDocs;
      // console.log('catProb =(catCount || 0) / numDocs = ',catProb);
      // console.log('this',this);
      // console.log('_(words): ',_(words));
      // console.log('docProb = _(words).reduce(function(prob, word)');
      var docProb = _(words).reduce(function(prob, word) {
        // console.log('word: ',word);
        var wordCounts = counts[word] || {};
        // console.log("wordCounts: = counts[word] || {} ",wordCounts);
        // console.log('this.wordProb(word, cat, cats, wordCounts)');
        var tmp = prob * this.wordProb(word, cat, cats, wordCounts);
        // console.log('return:',tmp);
        return tmp;
      }, 1, this);
      // console.log('docProb:',docProb)
      // the probability this doc is in this category
      probs[cat] = catProb * docProb;
    }, this);
    // console.log('probs:',probs);
    return probs;
  },

  getProbs : function(doc, callback) {
    // console.log('getProb() ===')
    var that = this;
    var tmp = this.getCats(function(cats) {
      var words = that.getWords(doc);
      that.getWordCounts(words, cats, function(counts) {
        var probs = that.getCatProbs(cats, words, counts);
        callback(probs);
      });
    });
    // console.log('tmp:',tmp);
  },

  getProbsSync : function(doc) {
    // console.log('getProbsSync :')
    // console.log('var words = this.getWords(doc);');
    var words = this.getWords(doc);
    // console.log('words:',words);
    // console.log('var cats = this.getCats();');
    var cats = this.getCats();
    // console.log("cats :",cats)
    // console.log('var counts = this.getWordCounts(words, cats);');
    var counts = this.getWordCounts(words, cats);
    // console.log('counts: ', counts);
    // var counts = this.getWordCounts(doc, cats);
    // console.log("count : ",counts)
    // return this.getCatProbs(cats, doc, counts);
    console.log('return this.getCatProbs(cats, words, counts);')
    var tmp = this.getCatProbs(cats, words, counts);
    console.log('this.getCatProbs(cats, words, counts): ',tmp);
    return tmp;
  },

  bestMatch : function(probs) {
    var max = _(probs).reduce(function(max, prob, cat) {
      return max.prob > prob ? max : {cat: cat, prob: prob};
    }, {prob: 0});

    var category = max.cat || this['default'];
    var threshold = this.thresholds[max.cat] || 1;

    _(probs).map(function(prob, cat) {
     if ((cat !== max.cat) && prob * threshold > max.prob) {
       category = this['default']; // not greater than other category by enough
     }
    }, this);

    return category;
  },

  classify : function(doc, callback) {

    if (!this.backend.async) {
      console.log('!this.backend.async');
      return this.classifySync(doc);
    }

    var that = this;
    this.getProbs(doc, function(probs) {
      callback(that.bestMatch(probs));
    });
  },

  classifySync : function(doc) {
    console.log('classifySync : function(doc): ',doc);
    var probs = this.getProbsSync(doc);
    console.log('classifySync - probs : ',probs);
    return probs;
    //return this.bestMatch(probs);
  },

  test : function(data) {
    // misclassification error
    var error = 0;
    data.forEach(function(datum) {
      var output = this.classify(datum.input);
      error += output === datum.output ? 0 : 1;
    }, this);
    return error / data.length;
  },

  toJSON : function(callback) {
    return this.backend.toJSON(callback);
  },

  fromJSON : function(json, callback) {
    this.backend.fromJSON(json, callback);
    return this;
  }
}

}());