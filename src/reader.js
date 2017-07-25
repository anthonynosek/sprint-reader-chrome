//------------------------------------------------------------------------------
//
// 	SPRINT READER
//	Speed Reading Extension for Google Chrome
//	Copyright (c) 2013-2015, Anthony Nosek
//	https://github.com/anthonynosek/sprint-reader-chrome/blob/master/LICENSE
//
//------------------------------------------------------------------------------

// This file has a dependency on engine.js
// engine.js contains all the logic to split the selected
// text and how it should be run (timing) on the screen.
// It's the brains behind this silly little extension!

// Language of selected text
//	- language.shortname
//	- language.fullname
//	- language.isrighttoleft
var language;

// Window parameter
var leftPaddingBorderOptimised;

// Have listeners been assigned?
var listenersExist = false;

// Has heavy javascript been loaded
var javascriptLoaded = false;

// Have the main divs been assigned to variables
var divVariablesHaveBeenAssigned;

// Reader text display size variables
var wordContainerTop;
var wordContainerHeight;
var wordHeightOuter;
var wordHeight;

// Text constants
var strRestart = "Restart";
var strPause = "Pause";
var strPlay = "Play";

// Divs that are used frequently
var divPlay;
var divWord;
var divRemainingTime;
var divProgress;
var divProgressUpdate;

// Color scheme used for the extension
//	0 = Default (White)
//	1 = Black
//	2 = Grey
//  3 = Blue
//	4 = Purple
//	5 = Green
//  6 = High Contrast
var colorScheme = 0;
var colorSchemeName;
var colorSentenceBorder;
var colorGithubIcon;

// Refers to the selected text item
// This is used to manage selected text history
//	 	0 = latest selected text
//		1 = history 1
//		2 = history 2
//		9 = clipboard
var selectedTextID = 0;

// The slide tooltip which is created at init
var slideTooltip;

// Various options/variables used
var focalCharacter;
var divFocalGuideTop;
var divFocalGuideBottom;
var divContentAll;

// Misc.
var sentenceTimer;
var showRemainingTime;

// Initialise the main screen
function init() {
	// Load javascript
	loadHeavyJavascriptInBackground();

	// wait for frequency data to load
	loadScript("data/wordfrequency-en-US.js", function()
	{
		// continue loading the reader window

		// Load the reader window
		loadReader();

		// Insert any SVG images
		insertSVG();
		showFocalGuide();
	});
}

function loadReader() {
	
	// More advanced settings
	getMoreAdvancedSettingsDefaults();
	getMoreAdvancedSettings();
		
	// Get the selected text from local storage
	// Use can select a historical text
	var selectedText = getSelectedTextHistoryFromLocal(selectedTextID);
	//console.log("Selected Text ID: " + selectedTextID);
	//console.log("Selected Text: " + selectedText);	
	if (isEmpty(selectedText)) selectedText = "-";

	// Go and build our array of fun facts
	buildFactArray();	
	
	// If we have selected text then we need to perform action
	if (!isEmpty(selectedText)) {		
		// Set the div variables
		setDivVariables();
		
		// Set the language of the selected text
		language = getLanguage(selectedText);
	
		// User settings
		getSettingsDefault();
		getSettings();
		displaySettings();
		
		// Advanced settings
		getAdvancedSettingsDefault();
		getAdvancedSettings();
		displayAdvancedSettings();
		
		// Set the static focal character
		setFocalCharacter();
		
		// Setup the colour picker
		setColourPicker();
		
		// Set the font properties, color scheme and display properties
		setFontProperties();
		setDisplayProperties();
		setColorScheme(colorScheme);
		
		// Set the hyphenator (if used)
		setHyphenator();
		
		// Set the padding in pixels for the word div
		// This ensures the text div is centered vertically
		// This function is called in resize() located in this document
   		centerWordInDiv();
		
		// Text alignment - first pass
		setTextPositionBasic();
		
		// Display the entire selected text content on the second tab
		divContentAll = document.getElementById('contentall');
		displayAllContentInViewer(selectedText);	
		
		// Group the words depending upon the chunk size set
		textArray = getTextArray(selectedAlgorithm, selectedText, chunkSize);	
		
		// Set the display of the status
		displayStatusData(selectedText);

		// Get the word div
		// divWord is a global variable, we use it a lot
		divWord = document.getElementById('word');
		
		// Set the focal guide
		showFocalGuide();
		
		// Find the progress bar, we need it later and frequently
		divProgressUpdate = $("#progress-indicator");

		
		// Set the initial text location/position variables
		textItemIndex = 0;
		if (madvSaveSlidePosition == 'true') {			
			if (textArray.length > 0) {
				// make the progress bar display correctly
				var percent = Math.abs((wordIndex/textArray.length)*100);
				setProgress(percent);
			}			
		}
		else {
			wordIndex = 0;	
		}	
		
		// If we autostart, let's run the countdown
		if (autoStart == 'true') {		
			divWord.innerHTML = "";		
			seconds = autoStartSeconds;
			changePlayButtonText(strPause);
			
			clearInterval(counter);
			$(document).ready(function() {
				counter = setInterval(textPlayCountdown, 1000);			
			});
		}
		else {
			displayWord(textArray[wordIndex]);			
		}
		
		// Set the positioning of the forst word
		setWordLeftPadding(textArray[wordIndex]);	
			
		// Setup the slide tooltip
		// This has to be called before setEventListeners
		setupSlideTooltip();
		
		// Add event listeners 
		setEventListeners();
	
		// Log the word count to Google Analytics
		if (!listenersExist) {
			trackSelectedWordCount(totalWords, language, displayReaderRightToLeft);
		}
		
		// Hide the sentence
		if (madvDisplaySentenceAtReaderOpen == 'true') {
			displaySentence(true);
		}
		else {
			displaySentence(false);
		}
		
		// Write a fact on the screen
		writeFact(WPM);
	}
}

// Load some of the heavier (internet dependent) scripts via AJAX
function loadHeavyJavascriptInBackground() {
	if (!javascriptLoaded) {
		$.getScript('https://apis.google.com/js/plusone.js');
		javascriptLoaded = true;
	}
	
	if (!navigator.onLine) {
		var socialFrame = $('.social');
		socialFrame.css('visibility', 'hidden');
	}
}

function setFocalCharacter() {
	// Dot operator	 or custom separator
	var focal = '\u22C5';
	if (madvStaticFocalUnicodeCharacter) {
		focal = madvStaticFocalUnicodeCharacter;
	}
	var enc = encodeURIComponent(focal)
	focalCharacter = decodeURIComponent(enc);
}

function setDivVariables() {
	if (!divVariablesHaveBeenAssigned) {
		divPlay = document.getElementById('btnPlay');	
		divRemainingTime = document.getElementById('remainingTime');
		divProgress = document.getElementById('progress');	
		divMenuReset = document.getElementById('menuReset');
		divMenuStepBack = document.getElementById('menuStepBack');
		divMenuHistory1 = document.getElementById('menuHistory1');
		divMenuHistory2 = document.getElementById('menuHistory2');
		divMenuPlayPause = document.getElementById('menuPlayPause');	
		divMenuStepForward = document.getElementById('menuStepForward');	
		divMenuLoadSelection = document.getElementById('menuLoadSelection');
		divMenuLoadClipboard = document.getElementById('menuLoadClipboard');
	}
}

function setEventListeners() {
	if (!listenersExist) {
		// Assign hotkeys
		$(document).bind('keypress', bindKeys);
		$(document).bind('keypress', 'q', bindQuit);
		$(document).bind('keypress', 'r', bindReset);
		$(document).bind('keypress', 'c', bindClipboardLoad);
		$(document).bind('keypress', 'v', bindSelectionLoad);
		
		// Set all the event listeners for the extension
		// A boolean flag prevents us from repeatedly adding
		// listeners when the user resets the text stream
		
		// Add play/pause button listeners				
		divPlay.addEventListener("click", textPlay, false);
		
		// ----------------------------------
		// play menu - play		
		divMenuPlayPause.addEventListener("click", textPlay, false);
		
		// play menu - reset		
		divMenuReset.addEventListener("click", textReset, false);
		
		// play menu - step forward
		divMenuStepForward = document.getElementById('menuStepForward');
		divMenuStepForward.addEventListener("click", function(){ textStep(1); }, false);
		
		// play menu - step back
		divMenuStepBack = document.getElementById('menuStepBack');
		divMenuStepBack.addEventListener("click", function(){ textStep(-1); }, false);
		
		// play menu - load selected text
		divMenuLoadSelection = document.getElementById('menuLoadSelection');
		divMenuLoadSelection.addEventListener("click", function(){ loadSelectedTextHistory(0); }, false);
		
		// play menu - load history 1
		divMenuHistory1 = document.getElementById('menuHistory1');
		divMenuHistory1.addEventListener("click", function(){ loadSelectedTextHistory(1); }, false);
		
		// play menu - load history 2
		divMenuHistory2 = document.getElementById('menuHistory2');
		divMenuHistory2.addEventListener("click", function(){ loadSelectedTextHistory(2); }, false);
		
		// play menu - load clipboard
		divLoadClipboard = document.getElementById('menuLoadClipboard');
		divLoadClipboard.addEventListener("click", function(){ loadSelectedTextHistory(9); }, false);
	
		// ----------------------------------
		// Add event listener to the progress bar
		divProgress = document.getElementById('progress');
		divProgress.addEventListener("click", textSeek, false);
	
		// Add event listeners to settings buttons
		var divDefaults = document.getElementById('btnRestoreDefaults');
		divDefaults.addEventListener("click", restoreDefaultSettings, false);
		
		var divSaveSettings = document.getElementById('btnSaveSettings');
		divSaveSettings.addEventListener("click", saveSettings, false);
		
		var divResetSize = document.getElementById('btnResetSize');
		divResetSize.addEventListener("click", resetSize, false);
		
		// ----------------------------------
		// Add event listeners to advanced buttons
		var divAdvDefaults = document.getElementById('btnRestoreAdvancedDefaults');
		divAdvDefaults.addEventListener("click", restoreDefaultAdvancedSettings, false);
		
		var divAdvSaveSettings = document.getElementById('btnSaveAdvanced');
		divAdvSaveSettings.addEventListener("click", saveAdvancedSettings, false);
		
		var divAdvMoreSettings = document.getElementById('btnMoreAdvanced');
		divAdvMoreSettings.addEventListener("click", displayMoreAdvancedSettings, false);

		// Mouseover event for the status tooltip
		var divStatus = document.getElementById("statuslabel");
		divStatus.addEventListener("mouseover", showSlideTooltip, false);

		// ----------------------------------
		// Set Google Analytics tracking to each of the buttons
		var buttons = document.querySelectorAll('button');
		for (var i = 0; i < buttons.length; i++) {
			buttons[i].addEventListener('click', trackButtonClick);
		}
		
		// Tracking for default values
		divSaveSettings.addEventListener("click", function(){ trackSaveDefaults(colorSchemeName, 
																				font, 
																				fontSize, 
																				WPM, 
																				chunkSize,
																				autoStart,
																				autoStartSeconds,
																				autoCloseReader,
																				textOrientationIsRightToLeft,
																				textOrientationAutoDetect); }, false);

		// Tracking for advanced default values
		divAdvSaveSettings.addEventListener("click", function(){ trackSaveAdvancedDefaults(selectedAlgorithmName, 
																						   pauseAfterComma, 
																						   pauseAfterCommaDelay,
																						   pauseAfterPeriod, 
																						   pauseAfterPeriodDelay,
																						   pauseAfterParagraph, 
																						   pauseAfterParagraphDelay,
																						   highlightOptimalLetter,
																						   highlightOptimalLetterColour,
																						   textPosition); }, false);
		
		listenersExist = true;
	}
}

function centerWordInDiv() {	
	// Set the word container height and line-height
	var wordContainerHeight = Math.round(window.innerHeight - 210);
	var wordContainerHeightPX = wordContainerHeight + "px";
	var wordContainerHeightMinusOnePX = (wordContainerHeight-1) + "px";
	$( "#word-container").css('height', wordContainerHeightPX);
	$( "#word-container").css('line-height', wordContainerHeightMinusOnePX);
	
	// Set the tab control height
	var tabHeight = Math.round(window.innerHeight - 27) + "px";
	$( ".tabbable").css('height', tabHeight);
	
	// Set the tab content height based on the size of the window
	var tabContentHeight = Math.round(window.innerHeight - 65) + "px";
	$( ".tab-content").css('height', tabContentHeight);
	var tabPaneHeight = Math.round(window.innerHeight - 67) + "px";
	$( ".tab-pane").css('height', tabPaneHeight);
	
	var containerHeight = tabHeight;
	$( "#container").css('height', containerHeight);

	$(document).ready(function() {
		leftPaddingBorderOptimised = Math.round(window.innerWidth * (madvOptimisedPositionLeftMarginPercent/100));
	});
	
	// set the content all div to the correct height
	// Found on tab 2 - Content
	var wordContentAllHeight = Math.round(window.innerHeight - 135);
	var wordContentAllHeightPX = wordContentAllHeight + "px";
	$( "#contentall_outer").css('height', wordContentAllHeightPX);
}

function setTextPositionBasic() {
	var word = $( "#word");
	var wordContainer = $( "#word-container");
	
	// Reset/remove text alignment properties
	wordContainer.css('width', '');
	wordContainer.css('word-wrap', '');
	wordContainer.css('white-space', '');	
	wordContainer.css('display', 'table');	
	
	// Left align text in window
	if (textPosition == 1) {		
		wordContainer.css('padding-left', "0px");
		wordContainer.css('padding-right', "0px");
		wordContainer.css('float', 'left');
		if (displayReaderRightToLeft) wordContainer.css('float', 'right');
		// Large chunk size
		if (chunkSize > 1) {
			wordContainer.css('float', '');
			wordContainer.css('display', 'table-cell');	
			if (displayReaderRightToLeft) wordContainer.css('display', 'table');
		}
	} 
	// Optimal positioning
	else if (textPosition == 2) {
		wordContainer.css('float', 'left');		
		if (displayReaderRightToLeft) wordContainer.css('float', 'right');
	}
	// Optimal + Static Focal positioning
	else if (textPosition == 3) {
		wordContainer.css('padding-left', "0px");
		wordContainer.css('padding-right', "0px");
		wordContainer.css('float', 'left');
		if (displayReaderRightToLeft) wordContainer.css('float', 'right');
	}
	// Centered text in window
	else {		
		wordContainer.css('padding-left', "0px");
		wordContainer.css('padding-right', "0px");
		wordContainer.css('float', 'none');
	}
}

function getSettingsDefault() {
	// Default values for user settings
	WPM = 300;
	chunkSize = 1;
	fontSize = 85;
	colorScheme = 0;
	font = "Lucida Console";
	colorSchemeName = "white";
	autoStart = 'false';
	autoStartSeconds = 2;
	autoCloseReader = 'false';
	textOrientationIsRightToLeft = 'false';
	textOrientationAutoDetect = 'true';
	showRemainingTime = 'false';
}

function getAdvancedSettingsDefault() {
	// Advanced settings
	selectedAlgorithm = 0;	
	pauseAfterComma = 'true';
	pauseAfterPeriod = 'true';
	pauseAfterParagraph = 'true';	
	pauseAfterCommaDelay = 250;
	pauseAfterPeriodDelay = 450;
	pauseAfterParagraphDelay = 700;
	
	highlightOptimalLetter = 'true';
	highlightOptimalLetterColour = '#FF0000';	
	textPosition = 2; // Optimal positioning
}

function getSettings() {
	// Harvest user settings
	// Words per minute (WPM)
	WPM = getFromLocalGreaterThanZero('WPM', WPM);
	if (WPMAdjusted == 0) WPMAdjusted = WPM;

	// Chunk Size
	chunkSize = getFromLocalGreaterThanZero('chunkSize', chunkSize);
	
	// Font
	font = getFromLocalNotEmpty('font', font);

	// Font Size
	fontSize = getFromLocalGreaterThanZero('fontSize', fontSize);

	// Color Scheme
	colorScheme = getFromLocalIsNumber('colorScheme', colorScheme);
	
	// Auto close, auto start
	autoStart = getFromLocalNotEmpty('autoStart', autoStart);
	autoStartSeconds = getFromLocalIsNumber('autoStartSeconds', autoStartSeconds);
	autoCloseReader = getFromLocalNotEmpty('autoCloseReader', autoCloseReader);
	
	// Text orientation
	textOrientationIsRightToLeft = getFromLocalNotEmpty('textOrientationIsRightToLeft', textOrientationIsRightToLeft);
	textOrientationAutoDetect = getFromLocalNotEmpty('textOrientationAutoDetect', textOrientationAutoDetect);
	setTextOrientation();

	//Display
	showRemainingTime = getFromLocalNotEmpty('showRemainingTime', showRemainingTime);
}

function getAdvancedSettings() {
	// Harvest advanced settings
	// Algorithm
	selectedAlgorithm = getFromLocalGreaterThanZero('selectedAlgorithm', selectedAlgorithm);

	// Pause after a comma
	pauseAfterComma = getFromLocalNotEmpty('pauseComma', pauseAfterComma);
	pauseAfterCommaDelay = getFromLocalIsNumber('pauseCommaDelay', pauseAfterCommaDelay);

	// Pause after a period
	pauseAfterPeriod = getFromLocalNotEmpty('pausePeriod', pauseAfterPeriod);
	pauseAfterPeriodDelay = getFromLocalIsNumber('pausePeriodDelay', pauseAfterPeriodDelay);
	
	// Pause after a paragraph
	pauseAfterParagraph = getFromLocalNotEmpty('pauseParagraph', pauseAfterParagraph);
	pauseAfterParagraphDelay = getFromLocalIsNumber('pauseParagraphDelay', pauseAfterParagraphDelay);
	
	// Display parameters
	textPosition = getFromLocalIsNumber('textPosition', textPosition);
	highlightOptimalLetter = getFromLocalNotEmpty('highlightOptimalLetter', highlightOptimalLetter);
	highlightOptimalLetterColour = getFromLocalNotEmpty('highlightOptimalLetterColour', highlightOptimalLetterColour);
}

// Return the selected text history item from local storage
function getSelectedTextHistoryFromLocal(historyid) {
	var data, text;
	var position = 0;
	switch(historyid)
	{
		case 0:
			// Currently selected text
			selectedTextID = 0;
			data = getSelectedTextFromResourceString(localStorage.getItem("selectedText"));
			text = data.text;
			position = data.position;
			if (text == "") text = "-";		
			break;		  	
		case 1:
			// Historical text selection 1
			selectedTextID = 1;
			data = getSelectedTextFromResourceString(localStorage.getItem("selectedTextHistory1"));
			text = data.text;
			position = data.position;	  	
			break;
		case 2:
			// Historical text selection 2
			selectedTextID = 2;
		  	data = getSelectedTextFromResourceString(localStorage.getItem("selectedTextHistory2"));
			text = data.text;
			position = data.position;
			break;
		case 9: 
			// Clipboard data
			selectedTextID = 9;
			text = getClipboardContentsAsText();
			break;
	}
			
	wordIndex = 0;
	if (madvSaveSlidePosition == 'true' && !isNaN(position)) wordIndex = parseInt(position);
	return text;
}

// Load the selected text and re-initialise the reader
function loadSelectedTextHistory(historyid) {
	selectedTextID = historyid;
	wordIndex = 0;
	setProgress(0);
	loadReader();
}

// Load the text in the clipboard
function getClipboardContentsAsText() {
	var clipboardContents = chrome.extension.getBackgroundPage().paste();
	return clipboardContents.toString();
}

// Reshuffle the history items in local storage and
// save local storage. Three selected text history items are saved
// Function location in background.js chrome.windows.onRemoved.addListener

function displaySettings() {
	// Display the user settings on the settings screen	
	document.getElementById('wpm').value = WPM;	
	document.getElementById('chunk').value = chunkSize;
	document.getElementById('color').value = colorScheme;
	document.getElementById('fontsize').value = fontSize;
	
	if (autoStart == 'true') {
		$('#autostart').prop('checked', 'true');
	}
	else {
		$('#autostart').removeAttr('checked');
	}
	
	document.getElementById('autostartseconds').value = autoStartSeconds;
	
	if (autoCloseReader == 'true') {
		$('#autoclosereader').prop('checked', 'true');
	}
	else {
		$('#autoclosereader').removeAttr('checked');
	}
	
	$('#font').attr("data-family", font);
	$('#fontdataoption').text(font);
	document.getElementById('fontselection').value = font;
	
	// Display the WPM, chunk size and text orientation on the main screen (status)
	var divStatus = document.getElementById("statuslabel");
	var orient = "";
	if (displayReaderRightToLeft) orient = " RTL";
	divStatus.innerHTML = "WPM: " + WPM + " (" + chunkSize + ")" + orient;
	
	// Text orientation
	if (textOrientationIsRightToLeft == 'true') {
		$('#wordrighttoleft').prop('checked', 'true');
	}
	else {
		$('#wordrighttoleft').removeAttr('checked');
	}
	
	if (textOrientationAutoDetect == 'true') {
		$('#autotextorientation').prop('checked', 'true');
	}
	else {
		$('#autotextorientation').removeAttr('checked');
	}

	if (showRemainingTime == 'true') {
		$('#showremainingtime').prop('checked', 'true');
	}
	else {
		$('#showremainingtime').removeAttr('checked');
	}
}

function displayAdvancedSettings() {
	// Display the advanced settings on the advanced screen	
	document.getElementById('algorithm').value = selectedAlgorithm;
	
	if (pauseAfterComma == 'true') {
		$('#pausecomma').prop('checked', 'true');
	}
	else {
		$('#pausecomma').removeAttr('checked');
	}
	
	if (pauseAfterPeriod == 'true') {
		$('#pauseperiod').prop('checked', 'true');	
	}
	else {
		$('#pauseperiod').removeAttr('checked');
	}
	
	if (pauseAfterParagraph == 'true') {
		$('#pauseparagraph').prop('checked', 'true');	
	}
	else {
		$('#pauseparagraph').removeAttr('checked');
	}

	document.getElementById('pausecommadelay').value = pauseAfterCommaDelay;
	document.getElementById('pauseperioddelay').value = pauseAfterPeriodDelay;
	document.getElementById('pauseparagraphdelay').value = pauseAfterParagraphDelay;

	// Advanced display parameters		
	setColourPickerDisplay(highlightOptimalLetterColour);
	document.getElementById('textposition').value = textPosition;

	if (highlightOptimalLetter == 'true') {
		$('#highlightoptimalletter').prop('checked', 'true');
	}
	else {
		$('#highlightoptimalletter').removeAttr('checked');
	}
}

function restoreDefaultSettings() {
	getSettingsDefault();
	displaySettings();	
	saveSettings();	
}

function restoreDefaultAdvancedSettings() {
	getAdvancedSettingsDefault();
	displayAdvancedSettings();	
	saveAdvancedSettings();
}

function saveSettings() {
	// Save the settings to localstorage
	var newWPM = document.getElementById('wpm').value;
	var newChunkSize = document.getElementById('chunk').value;
	var newFontSize = document.getElementById('fontsize').value;
	var newColorScheme = document.getElementById('color').value;
	var newFont = document.getElementById('fontselection').value;
	
	localStorage.setItem("font", newFont);
	
	// These user settings need to be numbers
	// If the user has not entered a valid number we
	// simply don't save the setting. Harsh but fair.
	if (!isNaN(newWPM)) localStorage.setItem("WPM", newWPM);
	
	if (!isNaN(newFontSize)) {
		localStorage.setItem("fontSize", newFontSize);
		fontSize = newFontSize;
	}
	
	if (!isNaN(newChunkSize)) {
		localStorage.setItem("chunkSize", newChunkSize);
		chunkSize = newChunkSize;
	}
	
	if (!isNaN(newColorScheme)) {
		localStorage.setItem("colorScheme", newColorScheme);
		colorScheme = newColorScheme;
	}

	// Assign the values to variables
	font = newFont;
	
	var newAutoStartSeconds = document.getElementById('autostartseconds').value;
	var newAutoStart = document.getElementById('autostart').checked;
	var newAutoCloseReader = document.getElementById('autoclosereader').checked;
			
	localStorage.setItem("autoStart", newAutoStart);
	localStorage.setItem("autoCloseReader", newAutoCloseReader);
			
	if (!isNaN(newAutoStartSeconds)) {
		localStorage.setItem("autoStartSeconds", newAutoStartSeconds);
		autoStartSeconds = newAutoStartSeconds;
	}
	
	// Text orientation
	var newtextOrientationIsRightToLeft = document.getElementById('wordrighttoleft').checked;
	localStorage.setItem("textOrientationIsRightToLeft", newtextOrientationIsRightToLeft);
	textOrientationIsRightToLeft = newtextOrientationIsRightToLeft;
	
	var newtextOrientationAutoDetect = document.getElementById('autotextorientation').checked;
	localStorage.setItem("textOrientationAutoDetect", newtextOrientationAutoDetect);
	textOrientationAutoDetect = newtextOrientationAutoDetect;

	//Display
	var newShowRemainingTime = document.getElementById('showremainingtime').checked;
	localStorage.setItem("showRemainingTime",newShowRemainingTime);
	showRemainingTime = newShowRemainingTime;
			
	// Because the settings have changed we need to adjust the output accordingly
	// setFontProperties();
	// setColorScheme(colorScheme);
	// These refresh methods are called in init which is called in textReset below
	
	// Determine if we need to recalculate timings for the selected text	
	if (newWPM != WPM) {
		WPM = newWPM;
		getTextArrayTiming(selectedAlgorithm, textArray);		
	}
	
	// Reset the display
	textReset();
}

function saveAdvancedSettings() {
	// Save the advanced settings to localstorage
	var newAlgorithm = document.getElementById('algorithm').value;
	var newPauseCommaDelay = document.getElementById('pausecommadelay').value;
	var newPausePeriodDelay = document.getElementById('pauseperioddelay').value;
	var newPauseParagraphDelay = document.getElementById('pauseparagraphdelay').value;
	
	var newPauseComma = document.getElementById('pausecomma').checked;
	var newPausePeriod = document.getElementById('pauseperiod').checked;
	var newPauseParagraph = document.getElementById('pauseparagraph').checked;
	
	localStorage.setItem("pauseComma", newPauseComma);
	localStorage.setItem("pausePeriod", newPausePeriod);
	localStorage.setItem("pauseParagraph", newPauseParagraph);

	// These settings need to be numbers
	// If the user has not entered a valid number we
	// simply don't save the setting. Harsh but fair.
	if (!isNaN(newAlgorithm)) localStorage.setItem("selectedAlgorithm", newAlgorithm);
	
	if (!isNaN(newPauseCommaDelay)) {
		localStorage.setItem("pauseCommaDelay", newPauseCommaDelay);
		pauseAfterCommaDelay = newPauseCommaDelay;
	}
	
	if (!isNaN(newPausePeriodDelay)) {
		localStorage.setItem("pausePeriodDelay", newPausePeriodDelay);
		pauseAfterPeriodDelay = newPausePeriodDelay;
	}
	
	if (!isNaN(newPauseParagraphDelay)) { 
		localStorage.setItem("pauseParagraphDelay", newPauseParagraphDelay);
		pauseAfterParagraphDelay = newPauseParagraphDelay;
	}
	
	// Assign the values to variables
	pauseAfterComma = newPauseComma;
	pauseAfterPeriod = newPausePeriod;
	pauseAfterParagraph = newPauseParagraph;		
	
	// Determine if we need to recalculate timings for the selected text	
	if (newAlgorithm != selectedAlgorithm) {
		selectedAlgorithm = newAlgorithm;
		getTextArrayTiming(selectedAlgorithm, textArray);		
	}

	// Display parameters	
	var newTextPosition = document.getElementById('textposition').value;
	var newHighlightOptimalLetter = document.getElementById('highlightoptimalletter').checked;
	var newHighlightOptimalLetterColour = $('.cp-small').css('background-color');
	
	localStorage.setItem("textPosition", newTextPosition);
	localStorage.setItem("highlightOptimalLetter", newHighlightOptimalLetter);
	localStorage.setItem("highlightOptimalLetterColour", newHighlightOptimalLetterColour);
	
	// Reset the display
	textReset();
}

function setFontProperties() {
	$('#word').css('font-size', fontSize+"px");
	$('#word').css('font-family', font);
}

function setColourPicker() {	
	var slide = document.getElementById('slide');
	var picker = document.getElementById('picker');
	if (slide != null && picker != null) {
		ColorPicker(slide,
					picker,
					function(hex, hsv, rgb) {
						setColourPickerDisplay(hex);
					});	
	}
}

function setDisplayProperties() {
	// Set the reader display settings
	if (madvDisplayProgress == 'true') {
		$("#progress").show();
	}
	else {
		$("#progress").hide();
	}
	
	if (madvDisplaySocial == 'true') {
		$('.social').css('visibility', 'visible');
	}
	else {
		$('.social').css('visibility', 'hidden');
	}
	
	if (madvDisplayWPMSummary == 'true') {
		$("#status").show();
	}
	else {
		$("#status").hide();
	}
}

function setTextOrientation() {
	displayReaderRightToLeft = false;
	
	// User has instructed the text is RIGHT TO LEFT
	if (textOrientationIsRightToLeft == 'true') {
		displayReaderRightToLeft = true;
	}
	// Sprint reader should auto-detect RIGHT TO LEFT
	else if (textOrientationAutoDetect == 'true') {
		var detectedRTL = getFromLocalNotEmpty('selectedTextIsRTL', detectedRTL);
		if (detectedRTL == 'true' || language.isrighttoleft) displayReaderRightToLeft = true;
		// English (most common language is ALWAYS LTR)
		if (language.shortname == 'en') displayReaderRightToLeft = false;
	}
	
	var word = $("#word");
	if (displayReaderRightToLeft) {
		word.css('direction', 'rtl');
	}
	else {
		word.css('direction', 'ltr');	
	}
	
	//console.log("Is RTL " + displayReaderRightToLeft);
}

function setColourPickerDisplay(hex) {
	$('.cp-small').css('background-color', hex);
	$('#highlightoptimalletterlabel').html('<input type="checkbox" id="highlightoptimalletter"> Highlight optimal letter (' + hex + ')');
	if (highlightOptimalLetter) $('#highlightOptimalLetter').prop('checked', 'true');
}

function setColorScheme(scheme) {
	//console.log("Colour scheme (set): " + scheme)
	switch(scheme)
	{
		case 0:
			// WHITE
			colorSchemeName = "white";
		  	$('body').css('background', 'white');
			$('body').css('color', 'black');
			$('.tab-content').css('border', '1px solid #ddd');			
			$('.nav-tabs').css('border-top', '1px solid #ddd');
			$('.nav-tabs > li > a').css('color', '#08c');
			$('.alert-info').css('color', 'black');
			$('.alert-info').css('border-color', '#5bc0de');
			$('.alert-info').css('background-color', '#5bc0de');	
			$('.label-info').css('color', '#fff');
			$('.label-info').css('background-color', '#5bc0de');
			$('.btn-info').css('color', '#fff');
			$('.btn-info').css('background-color', '#5bc0de');
			$('.btn-info').css('border-color', '#46b8da');
			$('.btn-info > .caret').css('border-top-color', 'white');
			$('.progress-bar-info').css('background-color', '#5bc0de');
			$('.input-column-right').css('border-left-color', '#ddd');	
			colorSentenceBorder = '#ddd';	
			colorGithubIcon = '#46b8da';		
		  	break;
		case 1:
			// BLACK
			colorSchemeName = "black";
		  	$('body').css('background', 'black');
			$('body').css('color', 'white');
			$('.tab-content').css('border', '1px solid #666666');
			$('.nav-tabs').css('border-top', '1px solid #666666');
			$('.nav-tabs > li > a').css('color', '#6C6E6F');
			$('.alert-info').css('color', 'black');
			$('.alert-info').css('border-color', '#6C6E6F');
			$('.alert-info').css('background-color', '#6C6E6F');
			$('.label-info').css('color', 'black');
			$('.label-info').css('background-color', '#6C6E6F');
			$('.btn-info').css('color', 'black');
			$('.btn-info').css('background-color', '#6C6E6F');
			$('.btn-info').css('border-color', '#6C6E6F');		
			$('.btn-info > .caret').css('border-top-color', 'black');
			$('.progress-bar-info').css('background-color', '#8D888F');
			$('.input-column-right').css('border-left-color', '#3f3f40');
			$('.contentall_inner').css('border-color', '#6C6E6F');
			colorSentenceBorder = '#3f3f40';
			colorGithubIcon = 'white';				
		  	break;
		case 2:
			// GREY
			colorSchemeName = "grey";
		  	$('body').css('background', 'Gainsboro');
			$('body').css('color', 'DimGray');
			$('.tab-content').css('border', '1px solid #C0C0C0');
			$('.nav-tabs').css('border-top', '1px solid #C0C0C0');
			$('.nav-tabs > li > a').css('color', '#08c');
			$('.alert-info').css('color', 'LightGrey');
			$('.alert-info').css('border-color', 'DimGray');
			$('.alert-info').css('background-color', 'DimGray');	
			$('.label-info').css('color', '#fff');
			$('.label-info').css('background-color', '#5bc0de');
			$('.btn-info').css('color', '#fff');
			$('.btn-info').css('background-color', '#5bc0de');
			$('.btn-info').css('border-color', '#46b8da');
			$('.btn-info > .caret').css('border-top-color', 'white');
			$('.progress-bar-info').css('background-color', '#5bc0de');
			$('.input-column-right').css('border-left-color', '#C0C0C0');
			$('.contentall_inner').css('border-color', '#46b8da');
			colorSentenceBorder = '#C0C0C0';
			colorGithubIcon = 'black';				
		  	break;
		case 3:
			// BLUE
			colorSchemeName = "blue";
		  	$('body').css('background', '#9FC1FF');
			$('body').css('color', '#2955A6');
			$('.tab-content').css('border', '1px solid #7494D2');
			$('.nav-tabs').css('border-top', '1px solid #7494D2');
			$('.nav-tabs > li > a').css('color', '#2955A6');
			$('.alert-info').css('color', '#9FC1FF');
			$('.alert-info').css('border-color', '#2955A6');
			$('.alert-info').css('background-color', '#2955A6');
			$('.label-info').css('color', '#fff');
			$('.label-info').css('background-color', '#2955A6');
			$('.btn-info').css('color', '#fff');
			$('.btn-info').css('background-color', '#2955A6');
			$('.btn-info').css('border-color', '#2955A6');
			$('.btn-info > .caret').css('border-top-color', 'white');
			$('.progress-bar-info').css('background-color', '#325BDB');
			$('.input-column-right').css('border-left-color', '#96b6f1');
			$('.contentall_inner').css('border-color', '#2955A6');
			colorSentenceBorder = '#96b6f1';	
			colorGithubIcon = '#2955A6';			
		  	break;
		case 4:
			// PURPLE
			colorSchemeName = "purple";
		  	$('body').css('background', '#AB97CB');
			$('body').css('color', '#361A62');
			$('.tab-content').css('border', '1px solid #6C5097');
			$('.nav-tabs').css('border-top', '1px solid #6C5097');
			$('.nav-tabs > li > a').css('color', '#361A62');
			$('.alert-info').css('color', '#AB97CB');
			$('.alert-info').css('border-color', '#361A62');
			$('.alert-info').css('background-color', '#361A62');
			$('.label-info').css('color', '#fff');
			$('.label-info').css('background-color', '#361A62');
			$('.btn-info').css('color', '#fff');
			$('.btn-info').css('background-color', '#361A62');
			$('.btn-info').css('border-color', '#361A62');
			$('.btn-info > .caret').css('border-top-color', 'white');
			$('.progress-bar-info').css('background-color', '#762496');
			$('.input-column-right').css('border-left-color', '#9885b8');
			$('.contentall_inner').css('border-color', '#361A62');
			$('.github_logo path').css('fill', '#361A62');
			colorSentenceBorder = '#9885b8';	
			colorGithubIcon = black;			
		  	break;
		case 5:
			// GREEN
			colorSchemeName = "green";
		  	$('body').css('background', '#A4D3B1');
			$('body').css('color', '#136428');
			$('.tab-content').css('border', '1px solid #6EA27C');
			$('.nav-tabs').css('border-top', '1px solid #6EA27C');
			$('.nav-tabs > li > a').css('color', '#136428');
			$('.alert-info').css('color', '#A4D3B1');
			$('.alert-info').css('border-color', '#136428');
			$('.alert-info').css('background-color', '#136428');
			$('.label-info').css('color', '#fff');
			$('.label-info').css('background-color', '#136428');
			$('.btn-info').css('color', '#fff');
			$('.btn-info').css('background-color', '#136428');
			$('.btn-info').css('border-color', '#136428');
			$('.btn-info > .caret').css('border-top-color', 'white');
			$('.progress-bar-info').css('background-color', '#33751E');
			$('.input-column-right').css('border-left-color', '#91c19f');
			$('.contentall_inner').css('border-color', '#136428');
			colorSentenceBorder = '#91c19f';		
			colorGithubIcon = '#136428';		
		  	break;
		case 6:
			// HIGH CONTRAST
			colorSchemeName = "highcontrast";
		  	$('body').css('background', '#161616');
			$('body').css('color', '#cfba58');
			$('.tab-content').css('border', '1px solid #cfba58');
			$('.nav-tabs').css('border-top', '1px solid #cfba58');
			$('.nav-tabs > li > a').css('color', '#cfba58');
			$('.alert-info').css('color', '#cfba58');
			$('.alert-info').css('border-color', '#cfba58');
			$('.alert-info').css('background-color', '#161616');
			$('.label-info').css('color', '#cfba58');
			$('.label-info').css('background-color', '#161616');
			$('.btn-info').css('color', '#cfba58');
			$('.btn-info').css('background-color', '#161616');
			$('.btn-info').css('border-color', '#cfba58');		
			$('.btn-info > .caret').css('border-top-color', '#cfba58');
			$('.progress-bar-info').css('background-color', '#cfba58');
			$('.input-column-right').css('border-left-color', '#cfba58');
			$('.contentall_inner').css('border-color', '#cfba58');
			colorSentenceBorder = '#cfba58';	
			colorGithubIcon = '#cfba58';			
		  	break;
		case 7:
			// EL DESIGNO
			colorSchemeName = "eldesigno";
		  	$('body').css('background', '#a79e65');
			$('body').css('color', '#2b2301');
			$('.tab-content').css('border', '1px solid #7e7644');
			$('.nav-tabs').css('border-top', '1px solid #7e7644');
			$('.nav-tabs > li > a').css('color', '#2b2301');
			$('.alert-info').css('color', '#2b2301');
			$('.alert-info').css('border-color', '#2b2301');
			$('.alert-info').css('background-color', '#e2d893');
			$('.label-info').css('color', '#2b2301');
			$('.label-info').css('background-color', '#e2d893');
			$('.btn-info').css('color', '#2b2301');
			$('.btn-info').css('background-color', '#e2d893');
			$('.btn-info').css('border-color', '#7e7644');		
			$('.btn-info > .caret').css('border-top-color', '#2b2301');
			$('.progress-bar-info').css('background-color', '#73afb6');
			$('.input-column-right').css('border-left-color', '#b9ae66');
			$('.contentall_inner').css('border-color', '#7e7644');
			colorSentenceBorder = '#b9ae66';		
			colorGithubIcon = 'black';		
		  	break;
		case 8:
			// NEUTRAL FARM
			colorSchemeName = "neutralfarm";
		  	$('body').css('background', '#d7c3aa');
			$('body').css('color', '#815747');
			$('.tab-content').css('border', '1px solid #c69876');
			$('.nav-tabs').css('border-top', '1px solid #c69876');
			$('.nav-tabs > li > a').css('color', '#815747');
			$('.alert-info').css('color', '#815747');
			$('.alert-info').css('border-color', '#815747');
			$('.alert-info').css('background-color', '#f0ce91');
			$('.label-info').css('color', '#815747');
			$('.label-info').css('background-color', '#f0ce91');
			$('.btn-info').css('color', '#815747');
			$('.btn-info').css('background-color', '#f0ce91');
			$('.btn-info').css('border-color', '#c69876');		
			$('.btn-info > .caret').css('border-top-color', '#815747');
			$('.progress-bar-info').css('background-color', '#c69876');
			$('.input-column-right').css('border-left-color', '#b9ae66');
			$('.contentall_inner').css('border-color', '#c69876');
			colorSentenceBorder = '#b9ae66';	
			colorGithubIcon = 'black';			
		  	break;
		case 9:
			// DARK GREY
			colorSchemeName = "darkgrey";
		  	$('body').css('background', '#6e6e70');
			$('body').css('color', '#2d2d2e');
			$('.tab-content').css('border', '1px solid #2d2d2e');
			$('.nav-tabs').css('border-top', '1px solid #2d2d2e');
			$('.nav-tabs > li > a').css('color', '#2d2d2e');
			$('.alert-info').css('color', '#2d2d2e');
			$('.alert-info').css('border-color', '#2d2d2e');
			$('.alert-info').css('background-color', '#8b8b86');
			$('.label-info').css('color', '#2d2d2e');
			$('.label-info').css('background-color', '#8b8b86');
			$('.btn-info').css('color', '#2d2d2e');
			$('.btn-info').css('background-color', '#8b8b86');
			$('.btn-info').css('border-color', '#2d2d2e');		
			$('.btn-info > .caret').css('border-top-color', '#2d2d2e');
			$('.progress-bar-info').css('background-color', '#2d2d2e');
			$('.input-column-right').css('border-left-color', '#808082');
			$('.contentall_inner').css('border-color', '#2d2d2e');
			colorSentenceBorder = '#808082';	
			colorGithubIcon = 'black';			
		  	break;
		case 10:
			// DARK PURPLE
			colorSchemeName = "darkpurple";
		  	$('body').css('background', '#470763');
			$('body').css('color', '#C7AFD1');
			$('.tab-content').css('border', '1px solid #8E6F9B');
			$('.nav-tabs').css('border-top', '1px solid #8E6F9B');
			$('.nav-tabs > li > a').css('color', '#C7AFD1');
			$('.alert-info').css('color', '#C7AFD1');
			$('.alert-info').css('border-color', '#8E6F9B');
			$('.alert-info').css('background-color', '#470763');
			$('.label-info').css('color', '#C7AFD1');
			$('.label-info').css('background-color', '#470763');
			$('.btn-info').css('color', '#470763');
			$('.btn-info').css('background-color', '#C7AFD1');
			$('.btn-info').css('border-color', '#470763');		
			$('.btn-info > .caret').css('border-top-color', '#470763');
			$('.progress-bar-info').css('background-color', '#8E6F9B');
			$('.input-column-right').css('border-left-color', '#8E6F9B');
			$('.contentall_inner').css('border-color', '#470763');
			colorSentenceBorder = '#8E6F9B';	
			colorGithubIcon = 'white';			
		  	break;
		case 11:
			// CHARCOAL
			colorSchemeName = "charcoal";
		  	$('body').css('background', '#282828');
			$('body').css('color', '#e7e0e0');
			$('.tab-content').css('border', '1px solid #4d4d4d');
			$('.nav-tabs').css('border-top', '1px solid #4d4d4d');
			$('.nav-tabs > li > a').css('color', '#4d4d4d');
			$('.alert-info').css('color', '#e7e0e0');
			$('.alert-info').css('border-color', '#4d4d4d');
			$('.alert-info').css('background-color', '#282828');
			$('.label-info').css('color', '#4d4d4d');
			$('.label-info').css('background-color', '#282828');
			$('.btn-info').css('color', '#4d4d4d');
			$('.btn-info').css('background-color', '#282828');
			$('.btn-info').css('border-color', '#4d4d4d');		
			$('.btn-info > .caret').css('border-top-color', '#4d4d4d');
			$('.progress-bar-info').css('background-color', '#4d4d4d');
			$('.input-column-right').css('border-left-color', '#4d4d4d');
			$('.contentall_inner').css('border-color', '#4d4d4d');
			colorSentenceBorder = '#4d4d4d';	
			colorGithubIcon = 'white';			
		  	break;
		case 12:
			// EARTHY GREENS
			colorSchemeName = "earthygreens";
		  	$('body').css('background', '#cce0c4');
			$('body').css('color', '#59812e');
			$('.tab-content').css('border', '1px solid #59812e');
			$('.nav-tabs').css('border-top', '1px solid #59812e');
			$('.nav-tabs > li > a').css('color', '#59812e');
			$('.alert-info').css('color', '#59812e');
			$('.alert-info').css('border-color', '#59812e');
			$('.alert-info').css('background-color', '#cce0c4');
			$('.label-info').css('color', '#59812e');
			$('.label-info').css('background-color', '#cce0c4');
			$('.btn-info').css('color', '#59812e');
			$('.btn-info').css('background-color', '#cce0c4');
			$('.btn-info').css('border-color', '#59812e');		
			$('.btn-info > .caret').css('border-top-color', '#59812e');
			$('.progress-bar-info').css('background-color', '#59812e');
			$('.input-column-right').css('border-left-color', '#59812e');
			$('.contentall_inner').css('border-color', '#59812e');
			colorSentenceBorder = '#59812e';	
			colorGithubIcon = '#59812e';			
		  	break;
		case 13:
			// PURDY PINK
			colorSchemeName = "purdypink";
		  	$('body').css('background', '#ffffff');
			$('body').css('color', '#fe14a9');
			$('.tab-content').css('border', '1px solid #cccccc');
			$('.nav-tabs').css('border-top', '1px solid #cccccc');
			$('.nav-tabs > li > a').css('color', '#f866c3');
			$('.alert-info').css('color', '#f866c3');
			$('.alert-info').css('border-color', '#f866c3');
			$('.alert-info').css('background-color', '#fddaf0');
			$('.label-info').css('color', '#f866c3');
			$('.label-info').css('background-color', '#fddaf0');
			$('.btn-info').css('color', '#f866c3');
			$('.btn-info').css('background-color', '#fddaf0');
			$('.btn-info').css('border-color', '#f866c3');		
			$('.btn-info > .caret').css('border-top-color', '#f996d5');
			$('.progress-bar-info').css('background-color', '#f996d5');
			$('.input-column-right').css('border-left-color', '#facfea');
			$('.contentall_inner').css('border-color', '#f866c3');
			colorSentenceBorder = '#f866c3';			
			colorGithubIcon = 'black';	
		  	break;
		case 14:
			// OLIVE BRANCH
			colorSchemeName = "olivebranch";
		  	$('body').css('background', '#cfba58');
			$('body').css('color', '#000000');
			$('.tab-content').css('border', '1px solid #a69546');
			$('.nav-tabs').css('border-top', '1px solid #a69546');
			$('.nav-tabs > li > a').css('color', '#bf3211');
			$('.alert-info').css('color', '#ffffff');
			$('.alert-info').css('border-color', '#bf3211');
			$('.alert-info').css('background-color', '#bf3211');
			$('.label-info').css('color', '#ffffff');
			$('.label-info').css('background-color', '#bf3211');
			$('.btn-info').css('color', '#ffffff');
			$('.btn-info').css('background-color', '#bf3211');
			$('.btn-info').css('border-color', '#bf3211');		
			$('.btn-info > .caret').css('border-top-color', '#bf3211');
			$('.progress-bar-info').css('background-color', '#bf3211');
			$('.input-column-right').css('border-left-color', '#a69546');
			$('.contentall_inner').css('border-color', '#bf3211');
			colorSentenceBorder = '#bf3211';		
			colorGithubIcon = '#bf3211';		
		  	break;
		case 15:
			// TOKYO
			colorSchemeName = "tokyo";
		  	$('body').css('background', '#0095ca');
			$('body').css('color', '#48371d');
			$('.tab-content').css('border', '1px solid #48371d');
			$('.nav-tabs').css('border-top', '1px solid #48371d');
			$('.nav-tabs > li > a').css('color', '#48371d');
			$('.alert-info').css('color', '#48371d');
			$('.alert-info').css('border-color', '#ed2645');
			$('.alert-info').css('background-color', '#ffffff');
			$('.label-info').css('color', '#ffffff');
			$('.label-info').css('background-color', '#ed2645');
			$('.btn-info').css('color', '#48371d');
			$('.btn-info').css('background-color', '#ffffff');
			$('.btn-info').css('border-color', '#ed2645');		
			$('.btn-info > .caret').css('border-top-color', '#48371d');
			$('.progress-bar-info').css('background-color', '#ed2645');
			$('.input-column-right').css('border-left-color', '#48371d');
			$('.contentall_inner').css('border-color', '#ed2645');
			colorSentenceBorder = '#48371d';			
			colorGithubIcon = 'black';	
		  	break;
	}
	
	$('.tab-content').css('border-bottom', '0px');
	$('.github_logo path').css('fill', colorSentenceBorder);
}

// Play the selected text countdown
// Will coutdown in seconds
var counter;
var seconds;
function textPlayCountdown() {
	divWord.innerHTML = seconds;
	
	// Create a dummy text item for the countdown
	var textItem = {};
	textItem.optimalletterposition = 1;
	textItem.text = seconds.toString();
	
	var orient = 'left';
	if (displayReaderRightToLeft) orient = 'right';
	
	$( "#word-container").css('padding-left', "0px");
	$( "#word-container").css('padding-right', "0px");
	
	// Optimal positioning
	//    - Optimal positioning
	//	  - Optimal positioning + static focal
	if (textPosition == 2 || textPosition == 3) {
		var px = calculatePixelOffsetToOptimalCenter(textItem);
		var offset = leftPaddingBorderOptimised - px;
		$( "#word-container").css('padding-' + orient, offset + "px");
		$( "#word-container").css('margin-left', "0");		
	}
	else {
		$( "#word-container").css('margin-left', "auto");	
	} 
	
	// Highlighting of the countdown letter
	highlightTheOptimalLetter(textItem);
	
	// Display the correct slide/duration
	seconds = seconds - 1;
	if (seconds == -1) {
		wordIndex = 0;
		displayWord(textArray[wordIndex]);
		stopSlideShow = false;
		playingText = true;
	}
	else if (seconds < -1)
	{
		// Stop the timer recursive execution of the function
	 	clearInterval(counter);
		stopSlideShow = true;
		playingText = false;
		wordIndex = 1;
		textPlay();
	}
}

// Play the selected text
// The play button toggles into a pause button during playback
// During pause the button turns into a play button
function textPlay() {
	clearTimeout(sentenceTimer);
	displaySentence(false);
	// User has watched the text all the way to the end
	// We start playback after 1000ms delay. This gives
	// the progress bar a chance to reset itself to the 
	// zero position.
	if (!playingText && divPlay.innerHTML == strRestart) {
		wordIndex = 0;
		setProgress(0);	
		stopSlideShow = false;
		playingText = true;	
		changePlayButtonText(strPause);
		divWord.innerHTML = textArray[0].text;
		textItemType = 1;
		setTimeout(playSlideShow, 1000);
	}
	// User has commenced normal playback of text
	else if (!playingText) {
		changePlayButtonText(strPause);
		stopSlideShow = false;
		playingText = true;
		playSlideShow();
	}
	// User was playing text and has instructed to pause
	else {
		textPause();
	}	
}

// Change the play button text, toggles between
// Play, Pause and Restart
function changePlayButtonText(caption) {
	divPlay.innerHTML = caption;
	document.getElementById('menuPlayPause').innerHTML = caption + " (SPACE)";
}

function textPause() {
	stopSlideShow = true;
	clearInterval(counter);	
	
	displaySentence(true);
 	clearTimeout(sentenceTimer);
	if (madvAutoHideSentence == 'true') {
		sentenceTimer = setTimeout(function() { displaySentence(false); }, madvAutoHideSentenceSeconds*1000);	
	}
	
	getWord();		
	playingText = false;
	changePlayButtonText(strPlay);
	
	saveSelectedTextPosition();
}

// Reset the text display back to the start
function textReset() {
	textPause();
	setProgress(0);
	
	// Rather than call init() we simply load the reader again
	loadReader();
}

// Step through the displayed text forwards or backwards
function textStep(stepDirection) {
	if (playingText) textPause(); 
	if (stepDirection < 0) {
		// Reverse	
		if (wordIndex <= 0) { return; }
		else if (wordIndex == 1) wordIndex = 0;
		else wordIndex = wordIndex - 1;
		getWord();		
	}
	else {		
		// Forwards
		if (wordIndex == textArray.length-1) { 
			setProgress(100);
			return; 
		}
		if(wordIndex == textArray.length-1) return;
		wordIndex = wordIndex + 1;
		getWord();
		if (wordIndex == textArray.length) { 
			setProgress(100);
		}
	}	
	
	// Hide the sentence
	displaySentence(true);	
	saveSelectedTextPosition();
	
	// Check the wordIndex
	//console.log(wordIndex);
}

function textSeek() {
	textPause();
	
	// Set the progress bar value to the correct width
	var prog = $('#progress');
	var progressWidth = prog.width();
	var x = Math.round(event.pageX - prog.offset().left, 0);
	if (x<0) x = 0;
		
   	var percentClicked = Math.round((x / progressWidth) * 100);
	setProgress(percentClicked);
	
	// Display the correct word for the progress click selection
	var wordCount = textArray.length;
	var wordLocation = wordCount * (percentClicked / 100);
	wordIndex = Math.round(wordLocation);
	
	getWord();
	displaySentence(true);	
	saveSelectedTextPosition();
	
	// Display the data
	//console.log('x: ' + x + ' progressWidth: ' + progressWidth + ' percentClicked: ' + percentClicked);
	//console.log('wordCount: ' + wordCount + ' wordLocation: ' + wordLocation);
}

function doWeAutoCloseReader() {
	// We have already checked if autoCloseReader is true
	// this will only get executed if autoCloseReader is enabled
	if (wordIndex == textArray.length-1) {
		textPause();
		setProgress(100);	
		// Close the reader after a 750 millisecond delay
		setTimeout(function (){
			closePopup();
       	}, 750);	
	}
}

function getWordIndexByStep(step) {
	if (step == 0) return wordIndex;
	if (step > 0) {
		return Math.min(textArray.length-1, wordIndex+step);	
	}
	else {
		return Math.max(1, wordIndex+step);	
	}
}

function bindKeys(k) {
	//console.log(k.keyCode);
	// KeyCode 32 = Space Bar
	if (k.keyCode == 32) {
		// We fire a button click event which will in turn fire
		// the textPlay() function. This ensures we continue to
		// track data for Google Analytics and prevents a 
		// double firing of the textPlay when the button already
		// has focus.
		document.getElementById('btnPlay').click();
		return;
	}
	// KeyCode 97 = A key
	else if (k.keyCode == 97) {
		textStep(-1);
	}
	// KeyCode 115 = S key
	else if (k.keyCode == 115) {
		textStep(1);
	}
	// KeyCode 122 = Z key
	else if (k.keyCode == 122) {
		adjustWPM(madvWPMAdjustmentStep*-1);
	}
	// KeyCode 120 = X key
	else if (k.keyCode == 120) {
		adjustWPM(madvWPMAdjustmentStep);
	}
	// KeyCode 107 = K key
	else if (k.keyCode == 107) {
		var step = madvLargeStepNumberOfSlides * -1;
		wordIndex = getWordIndexByStep(step);
		textStep(-1);
	}
	// KeyCode 108 = L key
	else if (k.keyCode == 108) {
		var step = madvLargeStepNumberOfSlides;
		wordIndex = getWordIndexByStep(step);
		textStep(1);
	}
}

function bindReset(k) {
	if (String.fromCharCode(k.keyCode) == 'r') {
		if (divPlay.innerHTML == strRestart) {
			textPlay();	
		}
		else {
			wordIndex = 0;
			saveSelectedTextPosition();
			textReset();
		}
	}
}

function bindQuit(k) {
	if (String.fromCharCode(k.keyCode) == 'q') {
		closePopup();
	}
}

function bindSelectionLoad(k) {
	if (String.fromCharCode(k.keyCode) == 'v') {
		loadSelectedTextHistory(0);
	}
}

function bindClipboardLoad(k) {
	if (String.fromCharCode(k.keyCode) == 'c') {
		loadSelectedTextHistory(9);
	}
}

// Sets up the slide tooltip
function setupSlideTooltip() {
	if (listenersExist) return;
	
	$('#statuslabel').qtip({
		overwrite: true,
		position: {
			my: 'right top',
			at: 'top left'
		},
		style: { 
			classes: 'qtip-light qtip-rounded',
			width: 200
		},
		show: {
			delay: 200,
			effect: function() {
				$(this).fadeTo(300, 1);
			}
		},
		content: {
			title: "...loading slide data",
			text: "...please wait"
		}
	});
}

// Display a tooltip which gives additional information regarding the 
// selected slide:
//
// 	Slide 1 of 456
// 	Word: test
//	Timing:	
//		- Pre 45ms
//		- Word 230ms
//		- Post 34ms
function showSlideTooltip() {	
	// Don't show the tooltip if certain conditions exist
	if (textArray.length == 0) return;

	// Build the tooltip text
	var textItem = textArray[wordIndex];
	if (textItem.text == "") return;

	var slideNumber = wordIndex + 1;
	var slideDuration = textItem.duration + WPMTimingAdjustmentMS;
	var titlenote = "Showing slide <b>" + slideNumber + "</b> of <b>" + textArray.length + "</b>";
	var description = "Word: " + textItem.textforinfo + "<br/>" +
						"- Pre delay: " + textItem.predelay.toFixed(2) + "ms <br/>" +
						"- Slide duration: <b>" + slideDuration.toFixed(2) + "ms </b><br/>" +
						"- Post delay: " + textItem.postdelay.toFixed(2) + "ms <br/><br/>" +
						"- WPM setting: " + WPM + " <br/>" +
						"- WPM real: <b>" + slideShowData.realWPM + " </b><br/>" +
						"- WPM all pauses: " + slideShowData.realWPMAllPauses;

	$('#statuslabel').qtip('option', 'content.text', description);
	$('#statuslabel').qtip('option', 'content.title', titlenote);
}

// Show the focal guide if we are using a focal positioning method
function showFocalGuide() {
	// Do not show the guide if the chunk size is more than 1
	if (chunkSize > 1 || madvAlwaysHideFocalGuide == 'true') {
		hideFocalGuide();
		return;
	}
	
	divFocalGuideTop = $("#focal-guide.top");
	divFocalGuideBottom = $("#focal-guide.bottom");
	
	// Reset left and right positioning because of text orientation
	divFocalGuideTop.css('left', "");	
	divFocalGuideTop.css('right', "");	
	divFocalGuideBottom.css('left', "");	
	divFocalGuideBottom.css('right', "");
	
	var backColour = $('body').css('background');
	var guideColor = $('body').css('color');
	if (highlightOptimalLetter == 'true') {
		guideColor = highlightOptimalLetterColour;
	}

	// Optimal positioning
	//    - Optimal positioning
	//	  - Optimal positioning + static focal	
	if (textPosition == 2 || textPosition == 3) {
		var word = $("#word");
		var wordContainer = $("#word-container");

		var centreLeft = leftPaddingBorderOptimised;
		
		// Word container height
		var wordCH = wordContainer.height();
		if (wordCH > 0 || wordContainerHeight == 0) {
			wordContainerHeight = wordCH;
		}
		
		// Word height
		var wordH = word.height();
		if (wordH > 0 || wordHeight == 0) {
			wordHeight = wordH;
		}
		
		// Word outer height
		var wordOH = word.outerHeight(true);
		if (wordOH > 0 || wordHeightOuter == 0) {
			wordHeightOuter = wordOH;
		}
		var margin = wordContainerHeight * 0.05;
		if (fontSize <= 40) margin = wordHeightOuter * 0.20;
		
		// Word container top
		var wordPosition = word.offset();
		if (wordPosition.top > 0 || wordContainerTop == 0) {
			wordContainerTop = wordPosition.top;
		}			

		var middleOfWordContainer = wordContainerHeight / 2;
		var wordOHHalf = wordHeightOuter / 2;

		var height = (wordHeight / 3).toFixed(0);
		divFocalGuideTop.css('height', height + "px");
		divFocalGuideBottom.css('height', height + "px");
		
		var toptop = middleOfWordContainer - wordOHHalf - margin - height;
		var bottomtop = middleOfWordContainer + wordOHHalf + margin;

		// Set the left OR right for the focal guide
		var orient = 'left';
		if (displayReaderRightToLeft) orient = 'right';	
		divFocalGuideTop.css(orient, centreLeft + "px");	
		divFocalGuideBottom.css(orient, centreLeft + "px");	
		
		// Set the top of the focal guide
		divFocalGuideTop.css('top', toptop + "px");
		divFocalGuideBottom.css('top', bottomtop + "px");
		
		// Set the colour of the guide
		divFocalGuideTop.css('border-left-color', guideColor);
		divFocalGuideBottom.css('border-left-color', guideColor);			
	}
	else hideFocalGuide();
}

// Hide the focal guide
function hideFocalGuide() {
	divFocalGuideTop = $("#focal-guide.top");
	divFocalGuideBottom = $("#focal-guide.bottom");
	
	var backColour = $('body').css('background');
	
	divFocalGuideTop.css('top', "0px");
	divFocalGuideTop.css('left', "0px");
	divFocalGuideTop.css('height', "0px");		
	divFocalGuideBottom.css('top', "0px");
	divFocalGuideBottom.css('left', "0px");	
	divFocalGuideBottom.css('height', "0px");
	
	// Hide th guide by making the same colour as background
	divFocalGuideTop.css('border-left-color', backColour);	
	divFocalGuideBottom.css('border-left-color', backColour);	
}

// Display ALL the content in the second tab
function displayAllContentInViewer(selectedText) {
	// divContentAll assigned upon load
	divContentAll.innerHTML = "<pre>" + selectedText + "</pre>";
}

// Display sentence method
function displaySentence(show) {
	var sentenceHTML = document.getElementById('sentence');
	var sentenceOuter = $('#sentence_outer');
	var sentenceContainer = $('#sentence');
	
	sentenceOuter.css('border-top', '');
	sentenceContainer.css('margin-left', '-' + madvSentencePositionPercentOffset + '%');
	sentenceHTML.innerHTML = "";
	
	// Do not show the sentence if not assigned
	if (madvDisplaySentenceWhenPaused == 'false') return;
	if (!show) {return;	}
	
	// Display the sentence in the sentence div
	var sentenceText = getSentence();
	sentenceHTML.innerHTML = sentenceText.text;
	
	if (madvDisplaySentenceTopBorder == 'true') {
		sentenceOuter.css('border-top', '1px solid ' + colorSentenceBorder);
	}
	
	// Highlight the selected word
	$("#sentence").lettering('words');
	if (chunkSize > 1) {
		for (var i=0, count = chunkSize; i < count; i++) {	
			var index = sentenceText.index - 1 + i;
			var wordClass = ".word" + index;
			$(wordClass).css('color', highlightOptimalLetterColour);
			$(wordClass).css('font-weight', 'bold');
		}
	} 
	else {
		var index = sentenceText.index;
		var wordClass = ".word" + index;
		$(wordClass).css('color', highlightOptimalLetterColour);
		$(wordClass).css('font-weight', 'bold');
	}	
}

// Build a sentence for us to display to the user
// Return the sentence (string) and the ID of the selected word
function getSentence() {
	var numberOfWordsBackward = Math.round(madvSentenceBackwardWordCount/chunkSize, 0);
	var numberOfWordsForward = Math.round(20/chunkSize, 0);
	var indexMin = Math.max(0, wordIndex-numberOfWordsBackward);
	var indexMax = Math.min(textArray.length, wordIndex+numberOfWordsForward);
	var sentenceArray = textArray.slice(indexMin, indexMax)
	//console.log(sentenceArray);

	// Put the words together to build a sentence
	var index = 0;
	var wordCount = 0;
	var wordCountToPaused = 0;
	var sentenceText = "";

	// Build the sentence, text is default left-to-right
	for (var i=indexMin, count = indexMax; i < count; i++) {
		index = index + 1;
		wordCount = wordCount + textArray[i].wordsinslide;
		// Identify when we have hit the paused word
		if (i == wordIndex) {
			wordCountToPaused = textArray[i].slidenumber - textArray[indexMin].slidenumber+1;
			if (chunkSize > 1) wordCountToPaused = wordCount - 1;
		}
		// Build the sentance to display
		var word = textArray[i].textoriginal;

		if (textArray[i].childofprevious) {
			//console.log(textArray[i]);
			continue;
		}
		if (chunkSize > 1) word = textArray[i].text;
		if (sentenceText != "") { 
			sentenceText = sentenceText + " " + word;
		} 
		else sentenceText = word;
	}
	
	var wordID = wordCountToPaused;
	//console.log("indexMin " + indexMin + " | indexMax " + indexMax + " | sentenceText " + sentenceText + " wordID " + wordID);
	
	return {
		text: sentenceText, 
		index: wordID
	};
}

// Set the progress bar for the selected text length
function setProgress(percent) {
	var progress = percent + '%';
	divRemainingTime.innerHTML = showRemainingTime == 'true' ? getMinAndSecondsString(slideShowData.totalDurationIncPauses * (100 - percent) / 100) : "";
	divProgressUpdate.css('width', progress);
}

// Set the engine hyphenator
function setHyphenator() {
	//hyphenator.config({minwordlength : madvLongWordTriggerCharacterCount});	
	//var userLang = navigator.language || navigator.userLanguage; 
 	//alert ("The language is: " + userLang);
}

// Store the size of the popup window to local storage
window.onresize = resize;
function resize()
{
	centerWordInDiv();
 	localStorage.setItem("readerWidth", window.outerWidth);
 	localStorage.setItem("readerHeight", window.outerHeight);
	
	// If the textPosition is set for optimal we need to recalculate
	// the left padding to ensure the text is positioned correctly
	// - Optimal positioning
	// - Optimal positioning + static focal
	if (textPosition == 2 || textPosition == 3) {
		// Perform a full reset as this will unbind button events
		// and will ensure events are getting registered multiple times
		textReset();
	}
}

// Delete the window size properties in localStorage
function resetSize() {
	localStorage.removeItem("readerHeight");
	localStorage.removeItem("readerWidth");	
}

// Close the popup window
function closePopup() {
	this.close();
}

// Refresh the reader by reinitialising
// This is called to prevent multiple reader windows opening
function refreshReader() {
	// Do not reset the listeners flag as this is set 
	// when the reader window is opened
	// 1. Shuffle the saved text down one place	
	saveSelectedTextPosition();
	// 2. Open the current text selection in the reader
	//	  Reset the word index
	selectedTextID = 0;
	wordIndex = 0;
	textReset();
}

// Display the WPM, chunk size and text orientation on the main screen (status)
function displayStatusData(selectedText) {	
	var divStatus = document.getElementById("statuslabel");
	// Text orientation
	var orient = "";
	if (displayReaderRightToLeft) orient = " RTL";
	// Real words per minute
	var realWPM = slideShowData.realWPM;
	if (realWPM != WPMAdjusted) {
		divStatus.innerHTML = language.fullname + " WPM: " + WPMAdjusted + " [" + realWPM + "] (" + chunkSize + ") " + orient;
	}
	else divStatus.innerHTML = language.fullname + " WPM: " + WPMAdjusted + " (" + chunkSize + ") " + orient;
}

// Set (and save) the selected text position
// Usually executed when paused
function saveSelectedTextPosition() {
	if (madvSaveSlidePosition == 'true' && selectedTextID !== 9) {
		// Get the information required to save the text position
		var text;
		var position = wordIndex;
		//console.log(selectedTextID + ' | ' + position);
		
		switch(selectedTextID)
		{
			case 0:
				text = getSelectedTextFromResourceString(localStorage.getItem("selectedText")).text;
				if (text == null || text == "") return;
				localStorage.setItem("selectedText", text + textPositionDelimiter + position);
				break;
			case 1:
				text = getSelectedTextFromResourceString(localStorage.getItem("selectedTextHistory1")).text;
				if (text == null || text == "") return;
				localStorage.setItem("selectedTextHistory1", text + textPositionDelimiter + position);
				break;
			case 2:
				text = getSelectedTextFromResourceString(localStorage.getItem("selectedTextHistory2")).text;
				if (text == null || text == "") return;
				localStorage.setItem("selectedTextHistory2", text + textPositionDelimiter + position);
				break;
		}
	}
}

// Display more advanced settings which control the algorithm
function displayMoreAdvancedSettings() {
	// Load the advanced settings tab
	chrome.tabs.create({url: "src/advanced.html"});	
}

document.addEventListener("DOMContentLoaded", init, false);