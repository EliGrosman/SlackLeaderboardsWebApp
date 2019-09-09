var i = 0  
function addPersonField() {
    var li = document.createElement("li");           
    var input = document.createElement("INPUT");
    input.setAttribute("type", "text");
    input.setAttribute("id", i);
    input.setAttribute("name", "player" + i);
    li.appendChild(input);


    document.getElementById("playerList").appendChild(li);
    i++
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