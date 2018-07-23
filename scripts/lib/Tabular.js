function Tabular() {

}

Tabular.getTableaus = function (tableauJSON) {
  return JSON.parse(tableauJSON);
}

Tabular.printTableau = function (tableau, varList, artVar, phase) {
  if (phase == 2 && tableau.step == 1) {
    $(".tableaus > .panel-body").append($("<h3 />").text("Phase " + tableau.phase));
  }

  var table = "<div class='panel panel-default'>"
        + "<div class='panel-heading'>" + "Step " + tableau.step + "</div>"
        + "<table id='tableau' class='table table-hover'>"
        + "<thead>"
        + "<tr>"
        + "<th>\\(C_i\\)</th>"
        + "<th>i</th>"
        + "</tr>";
        + "</thead>";
        + "</table>"; 
        + "</div>";
  
  table = $(table);
  table.appendTo(".tableaus > .panel-body");
  table = $(table.find("table")[0]);

  tableau.b = JSON.parse(tableau.b);

  var allVar = varList.concat([]);

  if (phase == 2 && tableau.phase == 1) {
    allVar = allVar.concat(artVar);
  }


  for (var i = 0; i < allVar.length; ++i) {
    table.find("thead > tr").append($("<th />").text("\\("+allVar[i]+"\\)"));
  }

  table.find("thead > tr").append($("<th />").text("\\(\\mathbf b\\)"));
  
  var mtx = JSON.parse(tableau.matrix);
  console.log(mtx);
  var tBody = $("<tbody />");
  var tRow;
  table.append(tBody);

  var idx = [];

  for (var i = 0; i < tableau.i.col.length; ++i) {
    idx[tableau.i.row[i] - 1] = tableau.i.col[i];
  }
  console.log(idx);
  for (var i = 0; i < mtx.length; ++i) {
    tRow = $("<tr />");

    for (var j = 0; j < allVar.length + 3; ++j) {// 3 row of Ci, i and b {
      if (j == 0) {
        tRow.append($("<td />").text(tableau.Ci[i][0]));
      } else if (j == 1) {
        tRow.append($("<td />").text(idx[i]));
      } else if (j == allVar.length + 2) {
        tRow.append($("<td />").text(tableau.b[i][0]));
      } else {
        tRow.append($("<td />").text(mtx[i][j-2]));
      }
    }

    tBody.append(tRow);
  }

  tRow = $("<tr />");

  tRow.append($("<td />").attr("colspan", 2).text("\\(C^T\\)"));

  for (var i = 0; i < tableau.C_T[0].length; ++i) {
    tRow.append($("<td />").text(tableau.C_T[0][i]));
  }

  tRow.append($("<td />").text(""));

  tRow.appendTo(tBody);

  tRow = $("<tr />");

  tRow.append($("<td />").attr("colspan", 2).text("\\(\\bar{C^T}\\)"));

  for (var i = 0; i < tableau.deltas[0].length; ++i) {
    tRow.append($("<td />").text(tableau.deltas[0][i]));
  }

  tRow.append($("<td />").text(""));
  tRow.appendTo(tBody);
}