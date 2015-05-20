/**
 * Constraint
 * @param {Element[]} elements Array of all elements that have in left side
 * @param {string} op       Operator
 * @param {string} rside    Right side of constraint
 * @param {string[]} varList  Array of all variables
 */
function Constraint(elements, op, rside, varList) {
  var blockPattern = /([-\d]+\w|[\d\w]+)/g,
      varPattern = /(?!\d)([\w^\d]+)/g,
      numPattern = /([-\d]+)/g;
      
  this.artVar = []; // Artificial variables
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