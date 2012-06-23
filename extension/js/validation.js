/*global _, DB, BAYES, Raphael */
(function(raphael, undefined){
	"use strict";
	var
		FOLDNUM = 5,
		THRES_STEP = 0.05,


	// Definition of agents.
	/* Agents should get an item and return clicked(1) or not(0).
		 The item is in the form of {
      from: "1621831892"
      groupId: "131051573672766"
      id: "242421059202483"
      link: "https www facebook com photo php fbid 3902523854517 set o 131051573672766 type 1"
      linkDesct: ""
      linkName: ""
      message: "就在 這個 和 網頁 組 一同 奮鬥 並且 下著 大雨 的 夜晚 ， 讓 我們 文宣..."
      rowData: {
        clicked: 0
        explicit: null
        fbid: "242421059202483"
        id: 4129
        trained: 0
        updated_at: "2012-06-14 08:59:28"
      }
      updated: "2012-06-12T07:44:19+0000"
    }
  */
	japieAgent = function(item){
		if(item.from === "100002188898192"){ // always clicks JohnsonLiang's post
			return 1;
		}
		return 0;
	},
	orzAgent = function(item){
		if(item.from === "100000202897569"){ // always clicks Japie's post
			return 1;
		}
		if(item.groupId === "269274213165180"){ // Shotwill Core group
			return 1;
		}
		return 0;
	},
	currentUserAgent = function(item){
		return item.rowData.clicked;
	},

	// Test FOLDNUM folds with the given agent.
	// testResult is passed to callback.
	// testResult is an array consists of {cat: ground truth, prob:classifier output}
	validateWithAgent = function(agent, callback){

		// Reset storage to start anew.
		BAYES.resetStorage();

		DB.getCached(function(tx, result){
			var rows = result.rows, // SQL result rows
					row, size = rows.length, currentFold = 0, foldSize = Math.floor(size / FOLDNUM),
					item, // the current row's cached item
					rowId = _.shuffle( _.range(size) ), // randomized entry id
					rowId2Train, rowId2Test,
					i, testResult = []; // test result array

			// Multifold cross-validation
			for(; currentFold < FOLDNUM; currentFold += 1){

				rowId2Train = rowId.slice(0); // make a copy of rowId array
				rowId2Test = rowId2Train.splice(currentFold * foldSize, foldSize); // splice out test fold

				// Training Phase
				console.log('Training fold', currentFold, ', ', rowId2Train.length, 'items to train.');
				for(i = 0; i < rowId2Train.length; i+=1){
					row = rows.item(rowId2Train[i]);
					item = JSON.parse(row.cache);
					item.rowData = row;
					// Training fold
					BAYES.trainObj({data:item});
					if(i%100===0){
						console.log('  ', i, 'item done.');
					}
				}

				// Testing Phase
				console.log('Testing fold', currentFold, ', ', rowId2Test.length, 'items to test.');
				for(i = 0; i < rowId2Test.length; i+=1){
					row = rows.item(rowId2Test[i]);
					item = JSON.parse(row.cache);
					item.rowData = row;
					testResult.push({
						cat: agent(item),
						prob: BAYES.getProb(item)
					});
					if(i%100===0){
						console.log('  ', i, 'item done.');
					}
				}
			}

			callback(testResult);
		});
	},

	// Given threshold, calculate the classifier evaluation scores
	calculateScores = function(testResult, threshold){
		var truePositive = 0, trueNegative = 0, falsePositive = 0, falseNegative = 0;

		_.each(testResult, function(result){
			var classifiedCat = +(result.prob > threshold); // 0 or 1
			if(classifiedCat === result.cat){ // true results
				if(classifiedCat === 0){ // negative
					trueNegative += 1;
				}else{
					truePositive += 1;
				}
			}else{	// false results
				if(classifiedCat === 0){ // negative
					falseNegative += 1;
				}else{
					falsePositive += 1;
				}
			}
		});

		return {
			tp: truePositive, tn: trueNegative,
			fp: falsePositive, fn: falseNegative,

			precision: truePositive / (truePositive + falsePositive),
			recall: truePositive / (truePositive + falseNegative),
			accuracy: (truePositive + trueNegative) / testResult.length,
			f1: 0
		}
	},

	// Draw PR curve
	drawPR = function(testResult, $targetCanvas){
		var thres = 0, scores, points = _([]);

		for(; thres <= 1; thres += THRES_STEP){
			scores = calculateScores(testResult);
			points.push({
				x: scores.precision,
				y: scores.accuracy
			});
		}

		points.sortBy('x');

		var paper = raphael($targetCanvas.get(0));
		paper.linechart(20, 0, 400, 400, points.pluck('x'), points.pluck('y'), {
			axis: "0 0 1 1", axisstep: 10, symbol: 'circle', smooth:true
		})
	};

	$('h1').click(function(){
		validateWithAgent(japieAgent, function(result){
			drawPR(result, $('.japie-result .graph'));
		});
	});

	// Set all as untrained so that current user model can be re-trained
	// when bg.js is loaded in the future.
	$('.untrain').click(function(){
		if(confirm("Set all DB entries to be untrained?\n"+
							 "The data will be re-trained upon restart.")){
			DB.untrainAll();
		}
	});

}(Raphael));