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

  return ObjectiveFunction.parseObjectiveFunction({type: "min", z: tempZ}, this.allVarList);
}

ObjectiveFunction.prototype.getElementCoef = function (varName) {
  for (var i = 0; i < this.elements.length; ++i) {
    if (this.elements[i].var == varName) {
      return this.elements[i].coef;
    }
  }

  return 0;
}

ObjectiveFunction.prototype.getValue = function (varValue) {
  var result = 0;

  for (var i = 0; i < this.allVarList.length; ++i) {
    result += this.getElementCoef( this.allVarList[i] ) * varValue[i];
  }

  return result;
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

    elArr.push(new Element(varName[0], parseInt(coef)));
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