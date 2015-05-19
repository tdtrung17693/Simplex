
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
      has2Phase = [];
      
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
    coef = lsideEl[i].match(/^([-\d]+)/g);
    coef = (coef == null) ? 1 : ((coef[0] === "-") ? -1 : parseInt(coef[0]));
    varName = lsideEl[i].match(/(?!\d)([\w^\d]+)/g);

    elArr.push(new Element(varName[0], coef));
  }

  return elArr;
}

function printCanonicalForm(result) {
    var condEl;
    $("#form").html("");
    for (var i = 0; i < result.length; ++i) {
      condEl = $("<p />", {class:"cond-"+i}).text("\\(" + result[i].toString() + "\\)");
      $("#form").append(condEl);
    }
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, "solution"]);
}

function Simplex(objFunc, constraints, varList) {
  this.objFunc = ObjectiveFunction.parseObjectiveFunction(objFunc, varList);
  this.constraints = Simplex.parseConstraints(constraints, varList);
  this.allVarList = varList;
}

Simplex.parseConstraints = function (rawConstraints, varList) {
  var constraints = [], constraint,
        constraintCount = rawConstraints.length;
    for (var i = 0; i < constraintCount; ++i) {
      constraint = Constraint.parseCond(rawConstraints[i], varList);
      constraint.order = i+1;
      constraints.push(constraint);
    }

    return constraints;
}

Simplex.prototype.solve = function () {
  var canonical = Constraint.getCanonicalForm(this.constraints),
      C_T = [],
      Ci = [],
      b = [],
      deltas = [[]],
      delta = 0,
      pivotEl,
      pivotColIdx;

  if (canonical[1].length > 0) {
    var phase2ObjFunc = ObjectiveFunction.parseObjectiveFunction({type:"min", z: canonical[1].join("+")}, this.allVarList);
    
    console.log(phase2ObjFunc);
    var mtx = Constraint.getConstraintMatrix(canonical[0]);
    C_T.push(phase2ObjFunc.getMatrixRow());
    console.log(C_T);
    for (var i = 0; i < this.constraints.length; ++i) {
      b.push([this.constraints[i].rside]);
    }
    console.log(b);

    printMtrx(mtx, "matrix");
    printMtrx(C_T, "CT");
    printMtrx(b, "b");

    var basicVar = Simplex.getBasicVar(mtx);
    
    for (var i = 0; i < basicVar.length; ++i) {
      Ci.push([phase2ObjFunc.getElementCoef(this.allVarList[ basicVar[i]-1 ])]);
    }
    printMtrx(Ci, "Ci");

    for (var i = 0; i < Ci[0].length; ++i) {
      for (var j = 0; j < mtx[0].length; ++j) {
        for (var k = 0; k < mtx.length; ++k) {
          delta += Ci[k][0]*mtx[k][j];
        }
        deltas[0].push(C_T[0][j] - delta);
        delta=0;
      }
    }

    printMtrx(deltas, "Delta");

    console.log(deltas);
   
    // while ( Simplex.hasNegativeDelta(deltas) ) {
      pivotColIdx = Simplex.getMinDeltaIndex(deltas);
      pivotRowIdx = Simplex.getPivotIndex(mtx, pivotColIdx, b);
      console.log(mtx[pivotRowIdx][pivotColIdx]);

    // }
  }
}


Simplex.getBasicVar = function (constraints) {
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
        hasOne = j+1;
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

Simplex.getMinDeltaIndex = function (deltas) {
  var min = Math.min.apply(Math, deltas[0]);

  return deltas[0].indexOf(min);
}

Simplex.getPivotIndex = function (mtx, index, b) {
  var tempArr = [];
  for (var i = 0; i < mtx.length; ++i) {
    tempArr.push(b[i][0]/mtx[i][index]);
  }

  return tempArr.indexOf(Math.min.apply(Math, tempArr));
}


Simplex.hasNegativeDelta = function (deltas) {
  for (var i = 0; i < deltas.length; ++i) {
    if (deltas[i] < 0) return true;
  }

  return false;
}

function ObjectiveFunction(type, elements, varList) {
  this.allVarList = varList;
  this.elements = elements;
  this.type = type;
}

ObjectiveFunction.prototype.changeSign = function () {
  var elCount = this.elements.length,
      tempEl,
      tempZ = "";

  for (var i = 0; i < elCount; ++i) {
    if (this.elements[i].getCoef() < 0) {
      tempZ += ((i == 0) ? "" : "+") + this.elements[i].toString().replace("-","");
    } else {
      tempZ += "-" + this.elements[i].toString();
    }
  }

  return ObjectiveFunction.parseObjectiveFunction({p1: tempLside, op: tempOp, p2: tempRside}, this.allVarList);
}

ObjectiveFunction.prototype.getElementCoef = function (varName) {
  for (var i = 0; i < this.elements.length; ++i) {
    if (this.elements[i].var == varName) {
      return this.elements[i].coef;
    }
  }

  return 0;
}

ObjectiveFunction.parseObjectiveFunction = function (objFunc, varList) {
  var elements = ObjectiveFunction.parseElements(objFunc.z);

  return  new ObjectiveFunction(objFunc.type, elements, varList.concat([]));
}

ObjectiveFunction.parseElements = function (func) {
  var lsideEl = func.match(/([-\d]+\w|[\d\w]+)/g),
        count = lsideEl.length,
        elArr = [],
        coef, varName;

  for (var i = 0; i < count; ++i) {
    coef = lsideEl[i].match(/^([-\d]+)/g);
    coef = (coef == null) ? 1 : ((coef[0] === "-") ? -1 : parseInt(coef[0]));
    varName = lsideEl[i].match(/(?!\d)([\w^\d]+)/g);

    elArr.push(new Element(varName[0], coef));
  }

  return elArr;
}

ObjectiveFunction.prototype.getMatrixRow = function () {
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


function printMtrx(mtrx, id) {
  var col = mtrx.length,
      str = "\\(\\begin{vmatrix} ";

  for (var i = 0; i < col; ++i) {
    str += mtrx[i].join("&") + "\\\\ ";
  }

  str += "\\end{vmatrix}\\)";
  console.log(str);
  $("#"+id).html(str);
  MathJax.Hub.Queue(["Typeset", MathJax.Hub, "matrix"]);
}



var allVar = ["x","y","z"],
    b = allVar.concat([]),
    constraints = [];

    constraints.push(({p1:"x+y+z", op:"=", p2:"2"}));
    constraints.push(({p1:"x-2y+3z", op:"=", p2:"3"}));
// var a = Constraint.getCanonicalForm(constraints);
var objFunc = {type: "min", z: "x-y"};
var sx = new Simplex(objFunc, constraints, allVar);
console.log(sx);
sx.solve();
// printCanonicalForm(a[0]);
// printMtrx(Constraint.getConstraintMatrix(a[0]));
// console.log(a[1]);
