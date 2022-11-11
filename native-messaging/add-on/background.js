function onResponse(response) {
  actualResponse = { response : "" };
  actualResponse = response;
  
  console.log("Received " + response);
  console.log("Received " + JSON.stringify(response));
}
function onError(error) {
  console.log(`Error: ${error}`);
}
/*
On a click on the browser action, send the app a message.
*/
browser.browserAction.onClicked.addListener(() => {
  console.log("Sending: 192.168.1.64");
  var sending = browser.runtime.sendNativeMessage(
    "netstat",
    "192.168.1.64");
  sending.then(onResponse, onError);
});