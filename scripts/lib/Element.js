/**
 * Element
 * @param {string} varName Var name of element
 * @param {number | string} coef    Coeffiecient
 * @author  <Dinh Trung> [trandinhtrung176@gmail.com]
 */
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

