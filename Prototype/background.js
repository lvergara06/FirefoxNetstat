/*****************************************************************
 * Background.js
 *     HttpSendInfo : This extenstion opens a dialog box to the
 *     user. On user selection the extension sends traffic info
 *     to storage.
 ****************************************************************/


/*****************************************************************
 * Global Variables
 ****************************************************************/
let targetPage = "https://*./"; // Which pages trigger the dialog box

// Get public IP
const MAX_IP_LENGTH = 45; // For IPv6 is 39 expect in IPv4-mapped IPv6 case
const MAIN_API_URL = "https://twin.sh/api/v1/ip";
const FALLBACK_API_URL = "http://ip-api.com/line?fields=query";

// Passing Headers from background to popup
let globalHeaders = [];

// User Selection
let userSelection = "";
let sourceIp = "";
let destinationUrl = "";
let destinationIp = "";
let baseDestinationUrl = "";
let CREATEAPIADDRESS = "https://prototypeapi2022.azurewebsites.net/api/Connection/Create";
let redirectNeeded = undefined;
let epochTime = "";
let completedIp = "";
let state = "";
let savedData = undefined;
let message = []; // Message to be passed to native application
let inOrder = undefined;
let tabId = "";
let tabIndex = "";
let localWindowType = "";
let requests = [];
/*****************************************************************
 * Event Handlers
 ****************************************************************/

/* onBeforeRequest Handler
   This event is triggered when a request is about to be made, and before headers are available.
   This is a good place to listen if you want to cancel or redirect the request. */
// This function opens a dialog box, if yes is selected then headers are logged
function logOnBeforeRequest(eventDetails) {
    console.log("Entrace to logOnBeforeRequest");

    console.log(eventDetails);

    // Create an entry for this request
    // Check if there is an entry for this requestId
    const result = requests.find(({ id }) => id === eventDetails.requestId);
    if (result === undefined) // Create the request 
    {
        newRequest = {
            id: eventDetails.requestId,
            url: eventDetails.url,
            method: eventDetails.method,
            type: eventDetails.type,
            timeStamp: eventDetails.timeStamp,
            tabId: eventDetails.tabId,
            destinationIp: "",
            originalDestIp: "",
            globalHdrs: [],
            completedIp: "",
            requestStatus: ""
        };
        requests.push(newRequest);
    }
    else {
        if (redirectNeeded) {
            result.url = eventDetails.url;
        }
        else {
            console.log("request found and redirect was not needed!")
            console.log(response);
            console.log(eventDetails);
        }
    }

    // Save headers to send to popup
    try {
        request = [];
        if (result === undefined) {
            request = requests.find(({ id }) => id === eventDetails.requestId);
        }
        const requestResult = request.globalHdrs.find(({ name }) => name === "url");
        if (requestResult === undefined) {
            request.globalHdrs.push({ name: "url", value: eventDetails.url });
        }
        else {
            requestResult.value = eventDetails.url;
        }
    } catch (err) {
        console.log("passing headers failed");
        console.error(err);
    }
}

/* onBeforeSendHeaders Handler
   This event is triggered before sending any HTTP data, but after all HTTP headers are available.
   This is a good place to listen if you want to modify HTTP request headers. */
function logOnBeforeSendHeaders(eventDetails) {
    console.log("Entrace to logOnBeforeSendHeaders");

    console.log(eventDetails);

}

/* onSendHeaders
   This event is fired just before sending headers.
   If your extension or some other extension modified headers in onBeforeSendHeaders,
   you'll see the modified version here. */
function logOnSendHeaders(eventDetails) {
    console.log("Entrace to logOnSendHeaders");

    console.log(eventDetails);

}

/* onHeadersReceived
   Fired when the HTTP response headers for a request are received.
   Use this event to modify HTTP response headers. */
function logOnHeadersReceived(eventDetails) {
    console.log("Entrace to logOnHeadersReceived");

    console.log(eventDetails);

    // Add destinationIp to the request 
    const result = requests.find(({ id }) => id === eventDetails.requestId);
    if (result === undefined) {
        // why are we here without a request for this requestId?
        console.error("No request for id: " + eventDetails.requestId + " in lonOnHeadersReceived!!!");
    }
    else {
        if (redirectNeeded) {
            // Keep track if the destination ip is different when redirection is needed
            if (result.destinationIp != eventDetails.ip) {
                result.originalDestIp = result.detinationIp;
            }
        }

        result.destinationIp = eventDetails.ip;
    }
}

/* onBeforeRedirect
   Fired when a request has completed. */
function logOnBeforeRedirect(eventDetails) {
    console.log("Entrace to logOnBeforeRedirect");

    console.log(eventDetails);

    // This flag will indicate that a redirection was needed
    // redirection sends us back to 
    redirectNeeded = "true"
}

/* onResponseStarted
   Fired when the first byte of the response body is received. */
function logOnResponseStarted(eventDetails) {
    console.log("Entrace to logOnResponseStarted");

    console.log(eventDetails);
}

/* onCompleted
   Fired when a request has completed. */
async function logOnCompleted(eventDetails) {
    console.log("Entrace to logOnCompleted");

    console.log(eventDetails);

    // Log onCompleted time
    const result = requests.find(({ id }) => id === eventDetails.requestId);
    if (result === undefined) {
        // why are we here without a request for this requestId?
        console.error("No request for id: " + eventDetails.requestId + " in logOnCompleted!!!");
    }
    else {
        result.epochTime = eventDetails.timeStamp;
        // The onCompleted ip might yet be different here
        result.completedIp = eventDetails.ip;
        result.requestStatus = eventDetails.statusCode;
    }

    // If this pop-up is for the same destination ip address then skip it
    if (savedData) {
        if (savedData.destinationIp === destinationIp) {
            state = "resendData";
            callNative();
        }
        else {
            // Call pop up and wait for answer
            if (eventDetails.method.toLowerCase() === "get") {
                try {
                    browser.windows.create({
                        type: "popup", url: "/popup.html",
                        top: 0, left: 0, width: 400, height: 300,
                    });
                } catch (err) {
                    console.log("Creating popup failed");
                    console.error(err);
                }
            }
        }
    }
    else {
        if (eventDetails.method.toLowerCase() === "get") {
            console.log(result);
            try {
                browser.windows.create({
                    type: "popup", url: "/popup.html",
                    top: 0, left: 0, width: 400, height: 300,
                    titlePreface: "%"+ result.id + "%"
                });
            } catch (err) {
                console.log("Creating popup failed");
                console.error(err);
            }
        }
    }
}

/* Tab
   This is a good place to start the app.
   Send an init message to the app. */
// Window
function logCreatedTab(createdTab) {

    console.log("Entrace to logCreatedTab");
    console.log(createdTab);
    // Call native function to prepare things for this tab
    tabInfo = { tabId: createdTab.id };
    state = "create_tab";
    message = {
        state: state,
        dataIn: tabInfo,
        dataOut: [],
        exitMessage: ""
    };

    callNative();
}

async function logTab(info) {
    console.log("Entrace to logTab");
    console.log("requests are:");
    console.log(requests);
    console.log(info);

}

function handleRemoved(removedId, removeInfo) {
    console.log("removing tabId = " + removedId)
    // close and delete file
    tabInfo = { tabId: removedId };
    state = "delete_tab";
    message = {
        state: state,
        dataIn: tabInfo,
        dataOut: [],
        exitMessage: ""
    };

    // destroy request
    result = requests.findIndex(({ tabId }) => tabId === removedId);
    if (result === -1) {
        // why are we here without a request for this requestId?
        console.error("No request for tabId: " + removedId + " in handleRemoved!!!");
    }

    while (result != -1) {
        requests.splice(result, 1);
        result = requests.findIndex(({ tabId }) => tabId === removedId);
    }
    callNative();

    console.log(removeInfo);
}


// Window
function logWindow(windowInfo) {
    console.log("Entrace to logWindow");
    console.log(windowInfo);
    localWindowType = windowInfo.type;
    console.log("localWindowType = " + localWindowType);
}

/* callNative
 * This function is called when the user makes a selection or when new request need to be saved
 * the selection along with netstat data is ready to be sent to database */
function callNative() {
    console.log("In callNative");

    // dataIn is the input to the native program
    console.log("message is :")
    console.log(message);
    // Send the message to send all data to database
    var sending = browser.runtime.sendNativeMessage(
        "Transport",
        message);
    sending.then(onResponse, onError);
}

function onResponse(response) {
    console.log("In onResponse");
    console.log(response);

    if (response.exitMessage === "Success") {
        // Depending on the previous state
        if (response.state === "create_tab") {
            // Creating a new connection file doesn't merit anything new
            // 
        }

        if (response.state === "add_connection") {
            // If netstat is called then we need to resend the connections
           if (response.dataOut.connections .length > 0) {
               for (let connection of response.dataOut.connections) {
                    var request = new XMLHttpRequest();
                    request.open("POST", CREATEAPIADDRESS);
                    request.setRequestHeader("Content-Type", "application/json");
                    request.overrideMimeType("text/plain");
                    request.onload = function () {
                       console.log("Response received: " + request.responseText);
                    };
                    console.log("connection :" + JSON.stringify(connection));
                    request.send(JSON.stringify(connection));
                }
            }
        }
    }
    else {
        console.log(response.exitMessage);
    }

    //if(response.responseText === "Success")
    /*    console.log("Received " + JSON.stringify(response));*/

    //var request = new XMLHttpRequest();
    //request.open("POST", CreateAPIAddress);
    //request.setRequestHeader("Content-Type", "application/json");
    //request.overrideMimeType("text/plain");
    //request.onload = function () {
    //    console.log("Response received: " + request.responseText);
    //};
    //if (response.response) {
    //    /*for(let connection of response.response)*/
    //    console.log("connection :" + JSON.stringify(response.response));
    //    request.send('{"id": 0, "website": "' + destinationUrl + '", "description": ' + JSON.stringify(response.response) + ' }');
    //}
}

/*****************************************************************
 * Message Handlers
 ****************************************************************/

browser.runtime.onMessage.addListener((msg) => {
    /* get_hdrs  */
    if (msg.type === "get_hdrs") {
        const result = requests.find(({ id }) => id === msg.requestId); 
        if (result === undefined) {
            // why are we here without a request for this requestId?
            console.error("No request for id: " + eventDetails.requestId + " in get_hdrs!!!");
        }
        else {
            hdrs = result.globalHdrs;
        }
        result.globalHdrs = [];
        return Promise.resolve(hdrs);
    }

    // set_user_selection
    if (msg.type === "set_user_selection") {
        userSelection = msg.response;
        console.log("user_selection: " + userSelection);
        state = "add_connection"
        console.log("state: " + state);
        const result = requests.find(({ id }) => id === msg.requestId);
        if (result === undefined) {
            // why are we here without a request for this requestId?
            console.error("No request for id: " + eventDetails.requestId + " in get_hdrs!!!");
        }
        else {
            message = {
                state: state,
                dataIn: [{
                    tabId: result.tabId,
                    destinationIp: result.destinationIp,
                    userSelection: userSelection,
                    epochTime: result.epochTime,
                    completedIp: result.completedIp,
                    requestId: result.requestId,
                    originalDestIp: result.originalDestIp
                }],
                dataOut: [],
                exitMessage: ""
            };
            callNative();
            return Promise.resolve(true);
        }
    }
});

/*****************************************************************
 * Event Listeners
 ****************************************************************/
// onBeforeRequest Listener
browser.webRequest.onBeforeRequest.addListener(
    logOnBeforeRequest,
    { urls: [targetPage] },
    ["requestBody"]
);
// onBeforeSendHeaders Listener
browser.webRequest.onBeforeSendHeaders.addListener(
    logOnBeforeSendHeaders,
    { urls: [targetPage] },
    ["blocking", "requestHeaders"]
);
//  onSendHeaders Listener
browser.webRequest.onSendHeaders.addListener(
    logOnSendHeaders,
    { urls: [targetPage] },
    ["requestHeaders"]
);
// onHeadersReceived
browser.webRequest.onHeadersReceived.addListener(
    logOnHeadersReceived,
    { urls: [targetPage] },
    ["blocking", "responseHeaders"]
);
// onResponseStarted
browser.webRequest.onResponseStarted.addListener(
    logOnResponseStarted,
    { urls: [targetPage] },
    ["responseHeaders"]
);
// OnCompleted Listener
browser.webRequest.onCompleted.addListener(
    logOnCompleted,
    { urls: ["<all_urls>"], types: ["main_frame"] },
    ["responseHeaders"]);
// OnBeforeRedirect
browser.webRequest.onBeforeRedirect.addListener(
    logOnBeforeRedirect,
    { urls: [targetPage] }
);

// Tab Select Listener
browser.tabs.onActivated.addListener(logTab);

// Tab Created Listener
browser.tabs.onCreated.addListener(logCreatedTab);

// Tab Removed Listener
browser.tabs.onRemoved.addListener(handleRemoved);

/*****************************************************************
 * Helper Functions
 *
 ****************************************************************/
// Log Errors
function onError(error) {
    console.log(`Error: ${error}`);
}


// Get Public Address Start
function fetchClientIP() {
    callAjax(MAIN_API_URL, handler, false);
}

function callAjax(url, callback, isFallback) {
    let xhr = new XMLHttpRequest();
    if (!isFallback) {
        xhr.timeout = 1000;
    }
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                callback(xhr.responseText, isFallback);
            } else {
                callback(null, isFallback);
            }
        }
    };
    xhr.open("GET", url, true);
    xhr.send();
}

function handler(content, isFallback) {
    if (!content && !isFallback) {
        callAjax(FALLBACK_API_URL, handler, true);
    } else {
        displayContent(content, isFallback);
    }
}
let storedIp = "";
function displayContent(content, isFallback) {
    let ip = 'ERROR';
    if (content && content.length <= MAX_IP_LENGTH) {
        ip = sanitize(content);
    }
    console.log("source ip is: " + ip);
}

/**
 * Removes characters that shouldn't be in an IPv4 or an IPv6
 * @param s String to sanitize
 * @returns sanitized string
 */
function sanitize(s) {
    return s.replace(/[^0-9:a-fA-F.]/g, '');
}
// Get Public Address End

// Get pids
async function _promiseSnapshot() {
    console.log("in promise snapshot");
    browser.processes.getProcessIdForTab(1);
}

// On Installed
//browser.runtime.onInstalled.addListener(() => {
//    browser.contextMenus.create({
//        "id": "sampleContextMenu",
//        "title": "Sample Context Menu",
//        "contexts": ["selection"]
//    });
//});

// Local Storage
//set
// browser.storage.local.set({ variable: variableInformation });
//get
//browser.storage.local.get(['variable'], (result) => {
//let someVariable = result.variable;
  // Do something with someVariable
//});