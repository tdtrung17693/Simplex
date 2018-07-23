/**
 * Simplex
 * @param {object} objFunc     Raw object that presents an objective function. {type: "[max/min]", z: "[function]"}
 * @param {object[]} constraints Raw object that presents all constraints. Constraint: {p1: "function left side", op: "operator", p2: "function right side"}
 * @param {array} varList     Array of all variables
 * @author  <Dinh Trung> [trandinhtrung176@gmail.com]
 */
function Simplex(objFunc, constraints, varList) {
  console.log(objFunc);
  this.objFunc = ObjectiveFunction.parseObjectiveFunction(objFunc, varList);
  this.constraints = Simplex.parseConstraints(constraints, varList);
  console.log(this.constraints);
  this.allVarList = varList;
  this.mainVar = varList.concat([]);
}


Simplex.printCanonicalForm = function (result) {
    var condEl;
    $("#form").html("");
    for (var i = 0; i < result.length; ++i) {
      condEl = $("<p />", {class:"cond-"+i}).text("\\(" + result[i].toString() + "\\)");
      $("#form").append(condEl);
    }
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, "solution"]);
}

Simplex.parseConstraints = function (rawConstraints, varList) {
  console.log(rawConstraints);
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

  if (this.objFunc.type.match(/max/gi)) {
    this.objFunc = this.objFunc.changeSign();
  }

  this.objFunc.allVarList = this.allVarList;

  var mtx = Constraint.getConstraintMatrix(canonical[0]);

  if (canonical[1].length > 0) {
    // 2-phase
    // solve secondary objective function to find
    var phase2ObjFunc = ObjectiveFunction.parseObjectiveFunction({type:"min", z: canonical[1].join("+")}, this.allVarList);
    
    C_T.push(phase2ObjFunc.getMatrixRow());

    for (var i = 0; i < this.constraints.length; ++i) {
      b.push([this.constraints[i].rside]);
    }

    var basicVar = Simplex.getBasicVar(mtx);

    for (var i = 0; i < basicVar.row.length; ++i) {
      bsCol = basicVar.col[i];
      bsRow = basicVar.row[i];

      Ci[bsRow-1] = [phase2ObjFunc.getElementCoef(this.allVarList[ bsCol-1 ])];
    }

    deltas = Simplex.getDeltas(Ci, C_T, mtx);

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

      deltas = Simplex.getDeltas(Ci, C_T, mtx);
    }

    basicVar = Simplex.getBasicVar(mtx);

    var varValue = this.getVarValue(mtx, b),
      result = phase2ObjFunc.getValue(varValue);
    
    console.log(result);
    if (result != 0) cantSolve = true;

    if (cantSolve) {
      console.log("Cannot solve");
      return false;
    } else {

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
        console.log("var", JSON.stringify(basicVar));
        console.log("deltas", JSON.stringify(deltas));
      }
    } 
  } else { 

      C_T.push(this.objFunc.getMatrixRow());

      for (var i = 0; i < this.constraints.length; ++i) {
        b.push([this.constraints[i].rside]);
      }

      var basicVar = Simplex.getBasicVar(mtx);

      for (var i = 0; i < basicVar.row.length; ++i) {
        bsCol = basicVar.col[i];
        bsRow = basicVar.row[i];

        Ci[bsRow-1] = [ this.objFunc.getElementCoef(this.allVarList[ bsCol-1 ]) ];
      }

      deltas = Simplex.getDeltas(Ci, C_T, mtx);

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
      }
    }

  var varValue = this.getVarValue(mtx, b),
      result = this.objFunc.getValue(varValue);

  varValue = [varValue];

  return {"canonical": canonical[0], "var_value": varValue, "result": (this.objFunc.type.match(/max/g)) ? (0-result) : result};
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

Simplex.checkAvailable = function (mtx, index) {
  var available = false;

  for (var i = 0; i < mtx.length; ++i) {
    if (mtx[i][index] < 0) {
      available = available || false;
    } else {
      available = available || true;
    }
  }

  return available;
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
