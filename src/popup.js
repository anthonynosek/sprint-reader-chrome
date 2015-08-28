//------------------------------------------------------------------------------
//
// 	SPRINT READER
//	Speed Reading Extension for Google Chrome
//	Copyright (c) 2013-2015, Anthony Nosek
//	https://github.com/anthonynosek/sprint-reader-chrome/blob/master/LICENSE
//
//------------------------------------------------------------------------------

// Initialise the popup (popup.html) screen
// This screen (popup.html) is opened when the user clicks on the 
// Sprint Reader icon located in the top right corner of the 
// Google Chrome screen.
function init() {
	displayVersion();
	setTabHeight();
}

function setTabHeight() {	
	var windowHeight = window.innerHeight;
	if (windowHeight >= 500) windowHeight = 450;
	
	// Set the tab control height
	var tabHeight = Math.round(windowHeight - 5) + "px";
	$( ".tabbable").css('height', tabHeight);
	
	// Set the tab content height based on the size of the window
	var tabContentHeight = Math.round(windowHeight - 70) + "px";
	$( ".tab-content").css('height', tabContentHeight);
}

// Open the reader window when a user clicks on the reader link
window.onload = function() {
	var a = document.getElementById("openReader");
	a.onclick = function() {	
		chrome.runtime.sendMessage({ message: "openReaderFromPopup" });	
		//background.openReaderWindow();	
		close();	
		return false;
	}
}

document.addEventListener("DOMContentLoaded", init, false);