'use strict';

app.controller('simplexCtrl', ['$scope', function($scope){
	var elemPattern = /(-[\w]+|[\w]+)/g,
		  blockPattern = /(-[\w]+|[\w]+)/g,
      varPattern = /(?!\d)([\w^\d]+)/g,
      numPattern = /^([-\d]+)/g;
		
	$scope.f = {type: "max", z: ""};
	$scope.constraints = [{p1: "", op: "", p2: ""}];
  $scope.cantSolve = false;
	$scope.solve = function () {

    var allVar = getVariableList();
    var simplex = new Simplex($scope.f, $scope.constraints, allVar);

    var solution = simplex.solve();


    if ( !solution ) {
      $scope.cantSolve = true;
    } else {
      $scope.cantSolve = false;
      
      var result = '<div class="var-value">'
          + '<p>Value of <strong>x</strong></p>'
          + '<div id="matrix"></div>'
          + '</div>'
          + '<div class="result">'
          + '<strong>Result: </strong> <span></span>'
          +'</div>';
      $(".panel.result > .panel-body").html(result);


      printMtrx(solution.var_value, "matrix");
      printCanonicalForm(solution.canonical);
      $(".result > span").text(solution.result);

      $(".tableaus > .panel-body").html("");

      var tableaus = Tabular.getTableaus(solution.tableaus);

      for (var i = 0; i < tableaus.length; ++i) {
        Tabular.printTableau(tableaus[i],allVar,solution.art_var, solution.phase);
      }

      MathJax.Hub.Queue(["Typeset", MathJax.Hub, "tableaus"]);
    }
	};

	$scope.addNewConstraint = function ($event) {
		$event.preventDefault();
		$scope.constraints.push({p1: "", op: "", p2: ""});
	}

  $scope.removeConstraint = function (constraint) {
    $scope.constraints.splice($scope.constraints.indexOf(constraint), 1);
    console.log($scope.constraints);
  }

	function printMtrx(mtrx, id) {
		var col = mtrx.length,
				str = "\\(\\begin{vmatrix} ";

		for (var i = 0; i < col; ++i) {
      str += mtrx[i].join("&") + "\\\\ ";
    }

    str += "\\end{vmatrix}\\)";
    console.log(str);
    $("#"+id).html(str);
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, id]);
	}

	function parseConditions() {
		var conditions = [], condition,
				condCount = $scope.constraints.length,
				varList = getVariableList();

		for (var i = 0; i < condCount; ++i) {
			condition = Constraint.parseCond($scope.constraints[i], varList);
			condition.order = i+1;
			conditions.push(condition);
		}

		return conditions;
	}


	function printCanonicalForm(result) {
		var condEl;

		$("#canonical").html("");
		for (var i = 0; i < result.length; ++i) {
			condEl = $("<p />", {class:"cond-"+i}).text("\\(" + result[i].toString() + "\\)");
			$("#canonical").append(condEl);
		}

		MathJax.Hub.Queue(["Typeset", MathJax.Hub, "canonical"]);
	}

	function getVariableList() {
		var allVar = getObjFuncVar(), // First, we suppose that main function have all available variables
			condVar = getCondVar(),
			len = condVar.length;

		for (var i = 0; i < len; ++i) {
			if (allVar.indexOf(condVar[i]) == -1) {
				allVar.push(condVar[i]);
			}
		}

		return allVar;
	}

	function checkFunction() {
		var isAllow = false,
			varList = getVariableList(),
			varCount = varList.length;

		for (var i = 0; i < varCount; ++i) {
			if (/^\d/g.test(varList[i])) {

			}
		}
	}

	function getObjFuncVar() {
		return $scope.f.z.match(varPattern);
	}

	function getCondVar() {
		var result = [];
		angular.forEach($scope.constraints, function (cond, $idx) {
			var condVar = cond.p1.match(varPattern);
				
			var	len = condVar.length;

			for (var i = 0; i < len; ++i) {
				if (result.indexOf(condVar[i]) == -1) {
					result.push(condVar[i]);
				}
			}
		});

		return result;
	}

	$(function () {
		$(".choice-list > li > a").on("click", function (ev) {
			ev.preventDefault();
			var that = $(this);

			$(".choice-indicate > .text").text(that.text());
			$scope.$apply(function() {
				$scope.f.type = that.data("choice");
			});
		});
	});
}]);