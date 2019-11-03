var x = 0  

function addPersonField() {
    var li = document.createElement("li");           
    var input = document.createElement("select");
    input.setAttribute("id", x);
    input.setAttribute("name", "player" + x);
    for(var i = 0; i < players[0].length; i++) {
      var el = document.createElement("option");
      el.textContent = players[0][i]
      el.value = ids[0][i]
      input.appendChild(el)
    }
    li.appendChild(input);


    document.getElementById("playerList").appendChild(li);
    x++
    //show address header
    $("#addressHeader").show();
    }

function validate(evt) {
  var theEvent = evt || window.event;
  if (theEvent.type === 'paste') {
      key = event.clipboardData.getData('text/plain');
  } else {
      var key = theEvent.keyCode || theEvent.which;
      key = String.fromCharCode(key);
  }
  var regex = /[0-9]|\./;
  if( !regex.test(key) ) {
    theEvent.returnValue = false;
    if(theEvent.preventDefault) theEvent.preventDefault();
  }
}


$(document).ready(function() {
  return $("#board_points_board").click(function() {
    $("#board_elo_enabled").prop("disabled", this.checked); 
    $("#board_rr_tournament").prop("disabled", this.checked);
  });
});

$(document).ready(function() {
  return $("#board_elo_enabled").click(function() {
    $("#board_points_board").prop("disabled", this.checked);
  });
});

$(document).ready(function() {
  return $("#board_rr_tournament").click(function() {
    $("#board_points_board").prop("disabled", this.checked);
  });
});