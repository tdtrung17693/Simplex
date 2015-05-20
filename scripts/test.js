
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

Constraint.getCanonicalForm = function (fconstraints) {
  var result,
      nVarName = "",
      has2Phase = [],
      constraints = fconstraints.concat([]);

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
      if (!hasOne && constraints[k][j] != 0) {
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
  // (-[\d]+[a-zA-Z\-]|-[\w]+|[\w]+)
  var lsideEl = func.match(/(-[\w]+|[\w]+)/g),
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
  console.log(this.constraints);
  this.allVarList = varList;
  this.mainVar = varList.concat([]);
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

/** Solve using Simplex Method */
Simplex.prototype.solve = function () {
  var canonical = Constraint.getCanonicalForm(this.constraints),
      C_T = [],
      Ci = [],
      b = [],
      deltas = [[]],
      delta = 0,
      pivotEl,
      pivotColIdx,
      pivotRowIdx,
      pivotValue,
      basicVar,// All separated variable
      bsCol,
      bsRow,
      cantSolve = false;

  if (canonical[1].length > 0) {
    $("<p />").text("Phase 1").appendTo("body");

    var phase2ObjFunc = ObjectiveFunction.parseObjectiveFunction({type:"min", z: canonical[1].join("+")}, this.allVarList);
    
    var mtx = Constraint.getConstraintMatrix(canonical[0]);
    C_T.push(phase2ObjFunc.getMatrixRow());

    printCanonicalForm(canonical[0]);
   
    for (var i = 0; i < this.constraints.length; ++i) {
      b.push([this.constraints[i].rside]);
    }

    var basicVar = Simplex.getBasicVar(mtx);

      printMtrx(mtx, "matrix");
    for (var i = 0; i < basicVar.row.length; ++i) {
      bsCol = basicVar.col[i];
      bsRow = basicVar.row[i];

      Ci[bsRow-1] = [phase2ObjFunc.getElementCoef(this.allVarList[ bsCol-1 ])];
    }

    deltas = Simplex.getDeltas(Ci, C_T, mtx);
    var e = 0;
    
    while ( Simplex.hasNegativeDelta(deltas) ) {
      pivotColIdx = Simplex.getMinDeltaIndex(deltas);
      pivotRowIdx = Simplex.getPivotIndex(mtx, pivotColIdx, b);
      pivotValue = mtx[pivotRowIdx][pivotColIdx];
      
      Simplex.changeMtxAccordingToPivot(pivotValue, {row: pivotRowIdx, col: pivotColIdx}, mtx, b);

      basicVar = Simplex.getBasicVar(mtx);
      
      Ci = [];
      for (var i = 0; i < basicVar.row.length; ++i) {
        bsCol = basicVar.col[i];
        bsRow = basicVar.row[i];
        Ci[bsRow - 1] = [phase2ObjFunc.getElementCoef(this.allVarList[ bsCol-1 ])];
      }
      console.log("Ci:", JSON.stringify(Ci));

      deltas = Simplex.getDeltas(Ci, C_T, mtx);
      $("<div />").append($("<p />").text("Step " + e)).append($("<div />", {id: "p1-matrix-" + e})).appendTo("body");
      printMtrx(mtx, "p1-matrix-"+e);
      console.log("var", JSON.stringify(basicVar));
      console.log("deltas", JSON.stringify(deltas));
      ++e;
    }

    basicVar = Simplex.getBasicVar(mtx);
    printMtrx(b, "b");

    for (var i = 0; i < basicVar.row.length; ++i) {
      if (this.mainVar.indexOf( this.allVarList[ basicVar.col[i] - 1 ] ) == -1) {
        cantSolve = true;
        break;
      }
    }

    if (cantSolve) {
      console.log("Cannot solve");
      return false;
    } else {
      $("<p />").text("Phase 2").appendTo("body");

      C_T = [];
      C_T.push(this.objFunc.getMatrixRow());

      Ci = [];
      for (var i = 0; i < basicVar.row.length; ++i) {
        bsCol = basicVar.col[i];
        bsRow = basicVar.row[i];
        Ci[bsRow - 1] = [this.objFunc.getElementCoef(this.allVarList[ bsCol-1 ])];
      }

      for (var j = 0; j < mtx.length; ++j) {
        for (var i = 0; i < canonical[1].length; ++i) {
          mtx[j].splice( this.allVarList.indexOf( canonical[1][i] ) - i, 1 );
          console.log(this.allVarList.indexOf( canonical[1][i] ));
        }
      }

      for (var i = 0; i < canonical[1].length; ++i) {
        this.allVarList.splice( this.allVarList.indexOf( canonical[1][i] ), 1 );
      }

      deltas = Simplex.getDeltas(Ci, C_T, mtx);

      e = 0;
      while ( Simplex.hasNegativeDelta(deltas) ) {
        pivotColIdx = Simplex.getMinDeltaIndex(deltas);
        pivotRowIdx = Simplex.getPivotIndex(mtx, pivotColIdx, b);
        pivotValue = mtx[pivotRowIdx][pivotColIdx];
        
        Simplex.changeMtxAccordingToPivot(pivotValue, {row: pivotRowIdx, col: pivotColIdx}, mtx, b);

        basicVar = Simplex.getBasicVar(mtx);
        
        Ci = [];
        for (var i = 0; i < basicVar.row.length; ++i) {
          bsCol = basicVar.col[i];
          bsRow = basicVar.row[i];
          Ci[bsRow - 1] = [this.objFunc.getElementCoef(this.allVarList[ bsCol-1 ])];
        }
        console.log("Ci:", JSON.stringify(Ci));

        deltas = Simplex.getDeltas(Ci, C_T, mtx);
        $("<div />").append($("<p />").text("Step " + e)).append($("<div />", {id: "p2-matrix-" + e})).appendTo("body");
        printMtrx(mtx, "p2-matrix-"+e);
        console.log("var", JSON.stringify(basicVar));
        console.log("deltas", JSON.stringify(deltas));
        ++e;
      }
    } 
  } else { 

      $("<p />").text("Solution").appendTo("body");

      var mtx = Constraint.getConstraintMatrix(canonical[0]);
      C_T.push(this.objFunc.getMatrixRow());

      printCanonicalForm(this.constraints);
     
      for (var i = 0; i < this.constraints.length; ++i) {
        b.push([this.constraints[i].rside]);
      }

      var basicVar = Simplex.getBasicVar(mtx);

      printMtrx(mtx, "matrix");
      printMtrx(b, "b");
      printMtrx(C_T, "CT");

      for (var i = 0; i < basicVar.row.length; ++i) {
        bsCol = basicVar.col[i];
        bsRow = basicVar.row[i];

        Ci[bsRow-1] = [ this.objFunc.getElementCoef(this.allVarList[ bsCol-1 ]) ];
      }

      deltas = Simplex.getDeltas(Ci, C_T, mtx);
      printMtrx(Ci, "Ci");
      printMtrx(deltas, "Delta");
      var e = 0;

      while ( Simplex.hasNegativeDelta(deltas) ) {
        pivotColIdx = Simplex.getMinDeltaIndex(deltas);
        pivotRowIdx = Simplex.getPivotIndex(mtx, pivotColIdx, b);
        pivotValue = mtx[pivotRowIdx][pivotColIdx];
        
        Simplex.changeMtxAccordingToPivot(pivotValue, {row: pivotRowIdx, col: pivotColIdx}, mtx, b);

        basicVar = Simplex.getBasicVar(mtx);
        
        Ci = [];
        for (var i = 0; i < basicVar.row.length; ++i) {
          bsCol = basicVar.col[i];
          bsRow = basicVar.row[i];
          Ci[bsRow - 1] = [this.objFunc.getElementCoef(this.allVarList[ bsCol-1 ])];
        }
        console.log("Ci:", JSON.stringify(Ci));

        deltas = Simplex.getDeltas(Ci, C_T, mtx);
        $("<div />").append($("<p />").text("Step " + e)).append($("<div />", {id: "p2-matrix-" + e})).appendTo("body");
        printMtrx(mtx, "p2-matrix-"+e);
        ++e;
      }
    }

    return this.objFunc.getValue( this.getVarValue(mtx,b) );
}

Simplex.prototype.dualPhase = function () {

}

Simplex.prototype.getVarValue = function (mtx, b) {
    var basicVar = Simplex.getBasicVar(mtx),
      varValue = [],
      varName = [],
      varList = this.allVarList;

  for (var i = 0; i < basicVar.col.length; ++i) {
    varName[basicVar.row[i] - 1] = this.mainVar[ basicVar.col[i] - 1];
  }

  for (var i = 0; i < varList.length; ++i) {
    if (varName.indexOf( varList[i] ) > -1) {
      varValue[i] = b[ varName.indexOf( varList[i] ) ][0];
    } else {
      varValue[i] = 0;
    }
  }
  console.log("Value", JSON.stringify(varValue));
  return varValue;
}

Simplex.changeMtxAccordingToPivot = function (pivotValue, pivotIndex, mtx, b) {
  var coef = 0;

  for ( var i = 0; i < mtx[0].length; ++i ) {
    mtx[pivotIndex.row][i] = Math.floor((mtx[pivotIndex.row][i] / pivotValue)*100)/100;
  }
  b[pivotIndex.row][0] = Math.floor((b[pivotIndex.row][0] / pivotValue)*100)/100;

  for ( var i = 0; i < mtx.length; ++i ) {
    if ( i == pivotIndex.row ) continue; // Not change pivot row
    
    for ( var j = 0; j < mtx[0].length; ++j ) {
      if ( j == 0 ) coef = mtx[i][pivotIndex.col]; // Assign value to avoid object reference in javascript
      
      mtx[i][j] = mtx[i][j] - mtx[pivotIndex.row][j] * coef;
    }

    b[i][0] = Math.floor((b[i][0] - b[pivotIndex.row][0] * coef)*100)/100;

    coef = 0;
  }

}

Simplex.changeBMatrix = function (pivotIndex, b) {

}

Simplex.getDeltas = function (Ci, C_T, mtx) {
  var deltas = [[]],
      delta = 0;

  for (var i = 0; i < Ci[0].length; ++i) {
    for (var j = 0; j < mtx[0].length; ++j) {
      for (var k = 0; k < mtx.length; ++k) {
        delta += Math.floor(Ci[k][0]*mtx[k][j]*100)/100;
      }
      deltas[0].push(Math.floor((C_T[0][j] - delta)*100)/100);
      delta=0;
    }
  }

  return deltas;  
}

Simplex.getBasicVar = function (constraints) {
  var hasUnitMatrix = false,
      cCount = constraints.length;// constraint count

  var checkMtx = 0,
      i = 0,
      previ = {col: [], row: []},
      hasOne = 0;

  for (var j = 0; j < constraints[0].length; ++j) {
    for (var k = 0; k < cCount; ++k) {

      if (!hasOne && constraints[k][j] != 0) {

        hasOne = k+1;

        if (k == (cCount - 1)) {
          if (previ.row.indexOf(hasOne) == -1) {
            ++checkMtx;
            previ.row.push(hasOne);
            previ.col.push(j+1);
          }
          hasOne = 0;
        }

      } else if (hasOne && constraints[k][j] != 0) {

        hasOne = 0;
        break;

      } else if (k == (cCount - 1) && hasOne) {

        if (previ.row.indexOf(hasOne) == -1) {
          ++checkMtx;
          previ.row.push(hasOne);
          previ.col.push(j+1);
        }

        hasOne = 0;
      }
    }
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
    if (mtx[i][index] < 0) {
      tempArr.push(Infinity);
    } else {
      tempArr.push(b[i][0]/mtx[i][index]);
    }
  }

  return tempArr.indexOf(Math.min.apply(Math, tempArr));
}


Simplex.hasNegativeDelta = function (deltas) {
  for (var i = 0; i < deltas[0].length; ++i) {
    if (deltas[0][i] < 0) return true;
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
  var lsideEl = func.match(/(-[\w]+|[\w]+)/g),
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

ObjectiveFunction.prototype.getValue = function (varValue) {
  var result = 0;

  for (var i = 0; i < this.allVarList.length; ++i) {
    console.log(this.getElementCoef( this.allVarList[i] ), varValue[i]);
    result += this.getElementCoef( this.allVarList[i] ) * varValue[i];
  }

  return result;
}

function printMtrx(mtrx, id) {
  var col = mtrx.length,
      str = "\\(\\begin{vmatrix} ";

  for (var i = 0; i < col; ++i) {
    str += mtrx[i].join("&") + "\\\\ ";
  }

  str += "\\end{vmatrix}\\)";
  $("#"+id).html(str);
  MathJax.Hub.Queue(["Typeset", MathJax.Hub, id]);
}



var allVar = ["x_1","x_2","x_3","x_4","x_5","x_6"],
    b = allVar.concat([]),
    constraints = [];

    constraints.push(({p1:"x_1+x_3+x_4-x_6", op:"=", p2:"2"}));
    constraints.push(({p1:"x_2+x_4+x_6", op:"=", p2:"12"}));
    constraints.push(({p1:"4x_3+2x_4+x_5+3x_6", op:"=", p2:"9"}));
// var a = Constraint.getCanonicalForm(constraints);
var objFunc = {type: "min", z: "x_1-x_2+2x_3-2x_4-3x_6"};
var sx = new Simplex(objFunc, constraints, allVar);
console.log(sx);
console.log(sx.solve());
// printMtrx(Constraint.getConstraintMatrix(a[0]));
// console.log(a[1]);
