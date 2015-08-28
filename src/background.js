//------------------------------------------------------------------------------
//
// 	SPRINT READER
//	Speed Reading Extension for Google Chrome
//	Copyright (c) 2013-2015, Anthony Nosek
//	https://github.com/anthonynosek/sprint-reader-chrome/blob/master/LICENSE
//
//------------------------------------------------------------------------------

var readerHeightPercentOfScreen = 0.53;
var readerWidthPercentOfScreen = 0.70;

// Object representing an open reader window
var readerWindow;

// Chrome versioning for communication events
if (!chrome.runtime) {
    // Chrome 20-21
    chrome.runtime = chrome.extension;
} else if(!chrome.runtime.onMessage) {
    // Chrome 22-25
    chrome.runtime.onMessage = chrome.extension.onMessage;
    chrome.runtime.sendMessage = chrome.extension.sendMessage;
    chrome.runtime.onConnect = chrome.extension.onConnect;
    chrome.runtime.connect = chrome.extension.connect;
}

function openReaderWindowFromContext(context) {
	if (context.selectionText) {
		// Save the selected text to local storage
		var selectedText = context.selectionText;
		var selectedTextEncoded = htmlEntitiesEncode(selectedText);
		saveSelectedTextToResource(selectedTextEncoded);
		localStorage.setItem("selectedText", selectedTextEncoded);
		localStorage.setItem("haveSelection", true);
		localStorage.setItem("selectedTextIsRTL", dirRTL);
	}

	openReaderWindow();
}

function openReaderWindowFromShortcut(selectedText, haveSelection, dirRTL) {
	var selectedTextEncoded = htmlEntitiesEncode(selectedText);
	saveSelectedTextToResource(selectedTextEncoded);
	localStorage.setItem("selectedText", selectedTextEncoded);
	localStorage.setItem("haveSelection", haveSelection);
	localStorage.setItem("selectedTextIsRTL", dirRTL);
	openReaderWindow();
}

function openReaderWindow() {
	// Obtain the location of the screen, firstly calculate the location
	// and then check to see if values have been stored for the session
	// If values are found, use them.
	var percentOfScreenWidth = screen.width * 0.05;
	
	// WIDTH	
	var readerWidth = screen.width * readerWidthPercentOfScreen;
	var width = getFromLocalGreaterThanZero("readerWidth", readerWidth);

	// HEIGHT
	var readerHeight = screen.height * readerHeightPercentOfScreen;
	var height = getFromLocalGreaterThanZero("readerHeight", readerHeight);
	
	// The minimum height and width of the window is 880x550 which
	// ensures the window maintains the correct ratio width to height
	if (width < 880) width = 880;
	if (height < 550) height = 550;
	
	// TOP & LEFT
	var top = (screen.height - (screen.height * readerHeightPercentOfScreen)) - percentOfScreenWidth;
	var left = (screen.width - (screen.width * readerWidthPercentOfScreen)) - percentOfScreenWidth;

	width = parseInt(width);
    height = parseInt(height);
	
  	openReader("reader.html", "", width, height, top, left);
}

function openReader(url, title, w, h, t, l) {
	// Only open a new window if one does not already exist
	if (readerWindow == null) {
		// Open a new reader
		readerWindow = window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+t+', left='+l);
	}
	else {
		// Refresh the existing reader window
		readerWindow.refreshReader();
		readerWindow.focus();
	}

	return readerWindow;
} 

// -------------------------------------------------------------
// Create the selection menu item in the default context menu
var contexts = ["page", "selection"];
for (var i = 0; i < contexts.length; i++) {
  	var context = contexts[i];
	
	var title = "Sprint read selected text";	
	if (context == 'page') {
		title = "Sprint read last saved selection";
	}
	
	chrome.contextMenus.create({
							"title": title, 
							"contexts": [context],
							"onclick": openReaderWindowFromContext
						});
}

// -------------------------------------------------------------
// Listener for window close
// We save the selected text to the first history position
chrome.windows.onRemoved.addListener(function(windowId) {   
	readerWindow = null;
});

// -------------------------------------------------------------
var dirRTL;
var selectedText;
var haveSelection;

// -------------------------------------------------------------
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	// Reset the selected text
	selectedText = "";	
	dirRTL = false;
	//alert(request.selectedText);
	
	switch(request.message)
	{
		case 'getSelection':
			haveSelection = request.haveSelection;
			selectedText = request.selectedText;
			dirRTL = request.dirRTL;
			break;
		case 'openReader':
			haveSelection = request.haveSelection;
			selectedText = request.selectedText;
			dirRTL = request.dirRTL;
			openReaderWindowFromShortcut(selectedText, haveSelection, dirRTL);
			break;
		case 'getHotkeyEnabledStatus':
			var isEnabled = 'false';
			isEnabled = getFromLocalNotEmpty('madvHotkeySelectionEnabled', isEnabled);
			sendResponse({ status: isEnabled });
			break;
		case 'openReaderFromPopup':
			openReaderWindow();
			break;
	}
	
	// No need to send a response, we snub them
	sendResponse({});
	return true;
});

// -------------------------------------------------------------
var mouseY;
var mouseX;
chrome.commands.onCommand.addListener(function(command) {	
	// Listening for commands
 	if (command == 'sprint-read-shortcut') {
		// User has hit CTRL+SHIFT+Z on the keyboard
		// Display the selection of text in the sprint reader or
		// automatically attempt to select text where the mouse is located		
		if (selectedText.length) {			
			// The user has selected text
			openReaderWindowFromShortcut(selectedText, haveSelection, dirRTL);
		}
		else {
			// No selection of text exists so we try and obtain a selection
			// using the mouse location as a guide, i.e. select text block at cursor
			// Ask the browser for the mouse coordinates
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {action:'getMouseCoordinates'}, function(response) {
					mouseX = response.x;
					mouseY = response.y;
				}); 
			});			
		}
	}
	
	return true;
});

// -------------------------------------------------------------
// Install or update detection
// Check if the version has changed.
var currVersion = getVersion();
var prevVersion = localStorage['version']
if (currVersion != prevVersion) {
	// Check if we just installed this extension.
	if (typeof prevVersion == 'undefined') {
  		onInstall();
	} else {
  		onUpdate();
	}
	localStorage['version'] = currVersion;
}

function getVersion() {
	var details = chrome.app.getDetails();
	return details.version;
}

// Function is fired on initial install
function onInstall() {
	chrome.tabs.create({url: "src/welcome.html"});
}

// Function is fired after an update
function onUpdate() {
	chrome.tabs.create({url: "src/updated.html"});
}

// -------------------------------------------------------------
// Copy and paste support
function copy(str) {
    var sandbox = $('#sandbox').val(str).select();
    document.execCommand('copy');
    sandbox.val('');
}

function paste() {
    var result = '',
        sandbox = $('#sandbox').val('').select();
    if (document.execCommand('paste')) {
        result = sandbox.val();
    }
    sandbox.val('');
    return result;
}