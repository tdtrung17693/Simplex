'use strict';

app.controller('simplexCtrl', ['$scope', function($scope){
	var elemPattern = /([\w^]+)/g,
		  blockPattern = /([-\d]+\w|[\d\w]+)/g,
      varPattern = /(?!\d)([\w^\d]+)/g,
      numPattern = /([-\d]+)/g;
		
	$scope.z = {type: 1, f: ""};
	$scope.conditions = [{p1: "", op: "", p2: ""}];

	$scope.solve = function () {
		var canonical = getCanonical();

		printCanonicalForm(canonical.constraints);
		printMtrx(canonical.matrix);

		if (canonical.has2Phase.length > 0) {
			
		}
	};

	function solvePhase1(canonical) {

	}

	$scope.addNewCond = function ($event) {
		$event.preventDefault();
		$scope.conditions.push({p1: "", op: "", p2: ""});
	}


	function printMtrx(mtrx) {
		var col = mtrx.length,
				str = "\\(\\begin{vmatrix} ";

		for (var i = 0; i < col; ++i) {
      str += mtrx[i].join("&") + "\\\\ ";
    }

    str += "\\end{vmatrix}\\)";
    console.log(str);
    $("#matrix").html(str);
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, "matrix"]);
	}

	function parseConditions() {
		var conditions = [], condition,
				condCount = $scope.conditions.length,
				varList = getVariableList();

		for (var i = 0; i < condCount; ++i) {
			condition = Constraint.parseCond($scope.conditions[i], varList);
			condition.order = i+1;
			conditions.push(condition);
		}

		return conditions;
	}

	function getCanonical() {
		var result = {constraints: null, matrix: null},
			varList = getVariableList(),
			varCount = varList.length,
			block,
			parsedConditions = (parseConditions());

		result.constraints = Constraint.getCanonicalForm(parsedConditions);
		result.has2Phase = result.constraints[1];
		result.constraints = result.constraints[0];
		result.matrix = Constraint.getConstraintMatrix(result.constraints);
		return result;
	}

	function printCanonicalForm(result) {
		var condEl;

		$("#solution").html("");
		for (var i = 0; i < result.length; ++i) {
			condEl = $("<p />", {class:"cond-"+i}).text("\\(" + result[i].toString() + "\\)");
			$("#solution").append(condEl);
		}
		MathJax.Hub.Queue(["Typeset", MathJax.Hub, "solution"]);
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
		return $scope.z.f.match(varPattern);
	}

	function getCondVar() {
		var result = [];
		angular.forEach($scope.conditions, function (cond, $idx) {
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
				$scope.z.type = that.data("choice");
			});
		});
	});
}]);

function Element(varName, coef) {
  this.var = varName;
  this.coef = parseInt(coef);

  this.getVar = function () {
    return this.var;
  };

  this.getCoef = function () {
    return this.coef;
  };

  this.toString = function () {
    if (coef >= 0) {
      return ((this.coef == 1) ? "" : this.coef) + this.var;
    } else {
      return ((this.coef == -1) ? "-" : this.coef) + this.var;
    }
  };
}


function Constraint(elements, op, rside, varList) {
  var blockPattern = /([-\d]+\w|[\d\w]+)/g,
      varPattern = /(?!\d)([\w^\d]+)/g,
      numPattern = /([-\d]+)/g;
      
  this.artVar = [];
  this.mainVar = varList.concat([]);
  this.allVarList = varList;
  this.elements = elements;
  this.op = op;
  this.rside = rside;
}

Constraint.prototype.getMatrixRow = function () {
  var lside = this.elements.concat([]).sort(function (i1,i2) {
    if (i1.var.indexOf("_") == -1 && i2.var.indexOf("_") == -1 && i1.var.charCodeAt(0) > i2.var.charCodeAt(0)) {
      return 1;
    } else if (i1.var.indexOf("_") == -1 && i2.var.indexOf("_") == -1 && i1.var.charCodeAt(0) == i2.var.charCodeAt(0)) {
      return 0;
    } else if (i1.var.indexOf("_") == -1 && i2.var.indexOf("_") == -1 && i1.var.charCodeAt(0) < i2.var.charCodeAt(0)) {
      return -1;
    } else if (i1.var.indexOf("_") > -1 && i2.var.indexOf("_") > -1) {
      var num1 = i1.var.split("_")[1],
          num2 = i2.var.split("_")[1];

      if (num1 > num2) {
        return 1;
      } else if (num1 < num2) {
        return -1;
      } else {
        return 0;
      }
    }
  });   

  var count = lside.length,
      row = [],
      allVarCount = this.allVarList.length,
      coef;

  var lsideVarName = lside.map(function (item) {
    return item.var;
  });

  for (var i = 0; i < allVarCount; ++i) {
    if (lsideVarName.indexOf(this.allVarList[i]) == - 1) {
      row.push(0);
    } else {
      coef = this.elements[lsideVarName.indexOf(this.allVarList[i])].getCoef();
      row.push(coef);
    }
  }

  return row;
}

Constraint.prototype.addNewArtElem = function (varName, coef) {
  this.elements.push(new Element(varName, coef));
  this.allVarList.push(varName);
  this.artVar.push(varName);
}

Constraint.prototype._getSignChangedCondition = function () {
  var elCount = this.elements.length,
      tempEl,
      tempLside = "",
      tempRside = this.rside,
      tempOp = this.op;

  for (var i = 0; i < elCount; ++i) {
    if (this.elements[i].getCoef() < 0) {
      tempLside += ((i == 0) ? "" : "+") + this.elements[i].toString().replace("-","");
    } else {
      tempLside += "-" + this.elements[i].toString();
    }
  }

  if (tempRside < 0) {
    tempRside = tempRside.replace("-", "");
  }

  if (tempOp == ">=") {
    tempOp = "<=";
  } else if (tempOp == "<=") {
    tempOp = ">=";
  }

  return Constraint.parseCond({p1: tempLside, op: tempOp, p2: tempRside}, this.allVarList);
}

// Constraint.getCanonicalForm = function (constraints) {
//   var mtrx = Constraint.getConstraintMatrix(constraints);
//   var checkUnitMatrix = Constraint.checkUnitMatrix(mtrx);

//   if (checkUnitMatrix.length != constraints.length) {

//   }
// }

Constraint.getCanonicalForm = function (constraints) {
  var result,
  		nVarName = "",
  		have2Phase = [];
      
  constraints = constraints.map(function ($constraint) {
    if ($constraint.rside < 0) {
      result = $constraint._getSignChangedCondition($constraint);
    } else {
      result = $constraint;
    }

    if (result.op != "=") {
      nVarName = "x_" + ($constraint.allVarList.length + 1);
    }

    if (result.op == ">=") {
      result.addNewArtElem(nVarName, -1);
    } else if (result.op == "<=") {
      result.addNewArtElem(nVarName, 1);
    }
    
    result.op = "=";

    return result;
  });

  var constraintMtrx = Constraint.getConstraintMatrix(constraints);
 
  var lackUnitMtx = Constraint.checkUnitMatrix(constraintMtrx);

  console.log(lackUnitMtx);
  if (lackUnitMtx.length != constraints.length) {
    for (var i = 0; i < constraints.length; ++i) {
      if (lackUnitMtx.indexOf(i+1) == -1) {
        nVarName = "x_" + (constraints[i].allVarList.length + 1);
        has2Phase.push(nVarName);
        constraints[i].addNewArtElem(nVarName, 1);
      }
    }
  }
  
  return [constraints, has2Phase];
}

Constraint.getConstraintMatrix = function (constraints) {
  var matrix = [],
      cCount = constraints.length;

  for (var i = 0; i < cCount; ++i) {
    matrix.push(constraints[i].getMatrixRow());
  }

  return matrix;
}

Constraint.checkUnitMatrix = function (constraints) {
  var hasUnitMatrix = false,
      cCount = constraints.length;// constraint count

  var checkMtx = 0,
      i = 0,
      previ = [],
      hasOne = 0;

  for (var j = 0; j < constraints[0].length; ++j) {
    for (var k = 0; k < cCount; ++k) {
      if (constraints[k][j] != 0 && constraints[k][j] != 1) {
        hasOne = 0;
        break;
      }

      if (constraints[k][j] == 1 && !hasOne) {
        hasOne = k+1;
        if (k == (cCount - 1)) {
          if (previ.indexOf(hasOne) == -1) {
            ++checkMtx;
            previ.push(hasOne);
          }
          hasOne = 0;
        }
      } else if (hasOne && constraints[k][j] != 0) {
        hasOne = 0;
        break;
      } else if (k == (cCount - 1) && hasOne) {
        if (previ.indexOf(hasOne) == -1) {
          ++checkMtx;
          previ.push(hasOne);
        }
        hasOne = 0;
      }
    }
  }

  if (checkMtx >= cCount) {
    hasUnitMatrix = true;
  }
  
  return previ;
}

Constraint._clone = function (obj) {
  if(obj === null || typeof(obj) !== 'object')
      return obj;

  var temp = obj.constructor(); // changed

  for(var key in obj) {
      if(Object.prototype.hasOwnProperty.call(obj, key)) {
          temp[key] = clone(obj[key]);
      }
  }
  return temp;
}

Constraint.prototype.toString = function () {
  var str = "",
      elCount = this.elements.length;
      
  for (var i = 0; i < elCount; ++i) {
    if (this.elements[i].getCoef() > 0) {
      str += ((i == 0) ? "" : "+") + this.elements[i].toString();
    } else {
      str += this.elements[i].toString();
    }
  }

  return str + this.op + this.rside;
}

Constraint.parseCond = function (condition, varList) {
  var elements = Constraint.parseElements(condition.p1);

  return  new Constraint(elements, condition.op, condition.p2, varList);
}

Constraint.parseElements = function (func) {
  var lsideEl = func.match(/([-\d]+\w|[\d\w]+)/g),
        count = lsideEl.length,
        elArr = [],
        coef, varName;

  for (var i = 0; i < count; ++i) {
    coef = lsideEl[i].match(/([-\d]+)/g);
    coef = (coef == null) ? 1 : ((coef[0] === "-") ? -1 : parseInt(coef[0]));
    varName = lsideEl[i].match(/(?!\d)([\w^\d]+)/g);

    elArr.push(new Element(varName[0], coef));
  }

  return elArr;
}
