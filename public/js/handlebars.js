var url = window.location.pathname;
var username = url.substr(url.lastIndexOf("/")+1);

var data = {
   "name"   : username,
};