//------------------------------------------------------------------------------
//
// 	SPRINT READER
//	Speed Reading Extension for Google Chrome
//	Copyright (c) 2013-2015, Anthony Nosek
//	https://github.com/anthonynosek/sprint-reader-chrome/blob/master/LICENSE
//
//------------------------------------------------------------------------------

// Initialise the (updated.html) screen
// This screen (updated.html) is opened after Sprint Reader
// has been updated. Updates are automatic through the 
// Google Chrome store.
function init() {
	displayVersion();
}

document.addEventListener("DOMContentLoaded", init, false);