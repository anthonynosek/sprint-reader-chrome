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
let language;

// Window parameter
let leftPaddingBorderOptimised;

// Have listeners been assigned?
let listenersExist = false;

// Has heavy javascript been loaded
let javascriptLoaded = false;

// Have the main divs been assigned to variables
let divVariablesHaveBeenAssigned;

// Reader text display size variables
let wordContainerTop;
let wordContainerHeight;
let wordHeightOuter;
let wordHeight;

// Text constants
const strRestart = "Restart";
const strPause = "Pause";
const strPlay = "Play";

// Divs that are used frequently
let divPlay;
let divWord;
let divRemainingTime;
let divProgress;
let divProgressUpdate;

// Color scheme used for the extension
//	0 = Default (White)
//	1 = Black
//	2 = Grey
//  3 = Blue
//	4 = Purple
//	5 = Green
//  6 = High Contrast
let colorScheme = 0;
let colorSchemeName;
let colorSentenceBorder;
let colorGithubIcon;

// Refers to the selected text item
// This is used to manage selected text history
//	 	0 = latest selected text
//		1 = history 1
//		2 = history 2
//		9 = clipboard
let selectedTextID = 0;

// Various options/variables used
let focalCharacter;
let divFocalGuideTop;
let divFocalGuideBottom;
let divContentAll;

// Misc.
let sentenceTimer;
let showRemainingTime;

// Initialise the main screen
function init() {
    // Load javascript
    loadHeavyJavascriptInBackground();

    // wait for frequency data to load
    loadScript("data/wordfrequency-en-US.js", function () {
        // continue loading the reader window

        // Load the reader window
        loadReader();

        // Insert any SVG images
        insertSVG();
        showFocalGuide();
    });
}


// Play the selected text countdown
// Will coutdown in seconds
let counter;

let seconds;

function loadReader() {

    // More advanced settings
    getMoreAdvancedSettingsDefaults();
    getMoreAdvancedSettings();

    // Get the selected text from local storage
    // Use can select a historical text
    let selectedText = getSelectedTextHistoryFromLocal(selectedTextID);
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

        // Set up the colour picker
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
        if (madvSaveSlidePosition === 'true') {
            if (textArray.length > 0) {
                // make the progress bar display correctly
                const percent = Math.abs((wordIndex / textArray.length) * 100);
                setProgress(percent);
            }
        } else {
            wordIndex = 0;
        }

        // If we autostart, let's run the countdown
        if (autoStart === 'true') {
            divWord.innerHTML = "";
            seconds = autoStartSeconds;
            changePlayButtonText(strPause);

            clearInterval(counter);
            $(document).ready(function () {
                counter = setInterval(textPlayCountdown, 1000);
            });
        } else {
            displayWord(textArray[wordIndex]);
        }

        // Set the positioning of the first word
        setWordLeftPadding(textArray[wordIndex]);

        // Set up the slide tooltip
        // This has to be called before setEventListeners
        setupSlideTooltip();

        // Add event listeners
        setEventListeners();

        // Log the word count to Google Analytics
        if (!listenersExist) {
            trackSelectedWordCount(totalWords, language, displayReaderRightToLeft);
        }

        // Hide the sentence
        if (madvDisplaySentenceAtReaderOpen === 'true') {
            displaySentence(true);
        } else {
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
        const socialFrame = $('.social');
        socialFrame.css('visibility', 'hidden');
    }
}

function setFocalCharacter() {
    // Dot operator	 or custom separator
    let focal = '\u22C5';
    if (madvStaticFocalUnicodeCharacter) {
        focal = madvStaticFocalUnicodeCharacter;
    }
    const enc = encodeURIComponent(focal);
    focalCharacter = decodeURIComponent(enc);
}

let divMenuReset;
let divMenuStepBack;
let divMenuHistory1;
let divMenuHistory2;
let divMenuPlayPause;
let divMenuStepForward;
let divMenuLoadSelection;
let divMenuLoadClipboard;

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
        divMenuStepForward.addEventListener("click", function () {
            textStep(1);
        }, false);

        // play menu - step back
        divMenuStepBack = document.getElementById('menuStepBack');
        divMenuStepBack.addEventListener("click", function () {
            textStep(-1);
        }, false);

        // play menu - load selected text
        divMenuLoadSelection = document.getElementById('menuLoadSelection');
        divMenuLoadSelection.addEventListener("click", function () {
            loadSelectedTextHistory(0);
        }, false);

        // play menu - load history 1
        divMenuHistory1 = document.getElementById('menuHistory1');
        divMenuHistory1.addEventListener("click", function () {
            loadSelectedTextHistory(1);
        }, false);

        // play menu - load history 2
        divMenuHistory2 = document.getElementById('menuHistory2');
        divMenuHistory2.addEventListener("click", function () {
            loadSelectedTextHistory(2);
        }, false);

        // play menu - load clipboard
        const divLoadClipboard = document.getElementById('menuLoadClipboard');
        divLoadClipboard.addEventListener("click", function () {
            loadSelectedTextHistory(9);
        }, false);

        // ----------------------------------
        // Add event listener to the progress bar
        divProgress = document.getElementById('progress');
        divProgress.addEventListener("click", textSeek, false);

        // Add event listeners to settings buttons
        const divDefaults = document.getElementById('btnRestoreDefaults');
        divDefaults.addEventListener("click", restoreDefaultSettings, false);

        const divSaveSettings = document.getElementById('btnSaveSettings');
        divSaveSettings.addEventListener("click", saveSettings, false);

        const divResetSize = document.getElementById('btnResetSize');
        divResetSize.addEventListener("click", resetSize, false);

        // ----------------------------------
        // Add event listeners to advanced buttons
        const divAdvDefaults = document.getElementById('btnRestoreAdvancedDefaults');
        divAdvDefaults.addEventListener("click", restoreDefaultAdvancedSettings, false);

        const divAdvSaveSettings = document.getElementById('btnSaveAdvanced');
        divAdvSaveSettings.addEventListener("click", saveAdvancedSettings, false);

        const divAdvMoreSettings = document.getElementById('btnMoreAdvanced');
        divAdvMoreSettings.addEventListener("click", displayMoreAdvancedSettings, false);

        // Mouseover event for the status tooltip
        const divStatus = document.getElementById("status-label");
        divStatus.addEventListener("mouseover", showSlideTooltip, false);

        // ----------------------------------
        // Set Google Analytics tracking to each of the buttons
        const buttons = document.querySelectorAll('button');
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', trackButtonClick);
        }

        // Tracking for default values
        divSaveSettings.addEventListener("click", function () {
            trackSaveDefaults(colorSchemeName,
                font,
                fontSize,
                WPM,
                chunkSize,
                autoStart,
                autoStartSeconds,
                autoCloseReader,
                textOrientationIsRightToLeft,
                textOrientationAutoDetect);
        }, false);

        // Tracking for advanced default values
        divAdvSaveSettings.addEventListener("click", function () {
            trackSaveAdvancedDefaults(selectedAlgorithmName,
                pauseAfterComma,
                pauseAfterCommaDelay,
                pauseAfterPeriod,
                pauseAfterPeriodDelay,
                pauseAfterParagraph,
                pauseAfterParagraphDelay,
                highlightOptimalLetter,
                highlightOptimalLetterColour,
                textPosition);
        }, false);

        listenersExist = true;
    }
}

function centerWordInDiv() {
    // Set the word container height and line-height
    const wordContainerHeight = Math.round(window.innerHeight - 210);
    const wordContainerHeightPX = wordContainerHeight + "px";
    const wordContainerHeightMinusOnePX = (wordContainerHeight - 1) + "px";
    const wordContainerElement = $("#word-container");

    wordContainerElement.css('height', wordContainerHeightPX);
    wordContainerElement.css('line-height', wordContainerHeightMinusOnePX);

    // Set the tab control height
    const tabHeight = Math.round(window.innerHeight - 27) + "px";
    $(".tabbable").css('height', tabHeight);

    // Set the tab content height based on the size of the window
    const tabContentHeight = Math.round(window.innerHeight - 65) + "px";
    $(".tab-content").css('height', tabContentHeight);
    const tabPaneHeight = Math.round(window.innerHeight - 67) + "px";
    $(".tab-pane").css('height', tabPaneHeight);

    $(".container").css('height', tabHeight);

    $(document).ready(function () {
        leftPaddingBorderOptimised = Math.round(window.innerWidth * (madvOptimisedPositionLeftMarginPercent / 100));
    });

    // set the content all div to the correct height
    // Found on tab 2 - Content
    const wordContentAllHeight = Math.round(window.innerHeight - 135);
    const wordContentAllHeightPX = wordContentAllHeight + "px";
    $("#contentall_outer").css('height', wordContentAllHeightPX);
}

function setTextPositionBasic() {
    const wordContainer = $("#word-container");

    // Reset/remove text alignment properties
    wordContainer.css('width', '');
    wordContainer.css('word-wrap', '');
    wordContainer.css('white-space', '');
    wordContainer.css('display', 'table');

    // Left align text in window
    if (textPosition === 1) {
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
    else if (textPosition === 2) {
        wordContainer.css('float', 'left');
        if (displayReaderRightToLeft) wordContainer.css('float', 'right');
    }
    // Optimal + Static Focal positioning
    else if (textPosition === 3) {
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
    wordFlicker = 'false';
    pauseAfterCommaDelay = 250;
    pauseAfterPeriodDelay = 450;
    pauseAfterParagraphDelay = 700;
    wordFlickerPercent = 10;

    highlightOptimalLetter = 'true';
    highlightOptimalLetterColour = '#FF0000';
    textPosition = 2; // Optimal positioning
}

function getSettings() {
    // Harvest user settings
    // Words per minute (WPM)
    WPM = getFromLocalGreaterThanZero('WPM', WPM);
    if (WPMAdjusted === 0) WPMAdjusted = WPM;

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

    //Word Flicker
    wordFlicker = getFromLocalNotEmpty('wordFlicker', wordFlicker);
    wordFlickerPercent = getFromLocalIsNumber('wordFlickerPercent', wordFlickerPercent);

    // Display parameters
    textPosition = getFromLocalIsNumber('textPosition', textPosition);
    highlightOptimalLetter = getFromLocalNotEmpty('highlightOptimalLetter', highlightOptimalLetter);
    highlightOptimalLetterColour = getFromLocalNotEmpty('highlightOptimalLetterColour', highlightOptimalLetterColour);
}

// Return the selected text history item from local storage
function getSelectedTextHistoryFromLocal(historyid) {
    let data, text;
    let position = 0;
    switch (historyid) {
        case 0:
            // Currently selected text
            selectedTextID = 0;
            data = getSelectedTextFromResourceString(localStorage.getItem("selectedText"));
            text = data.text;
            position = data.position;
            if (text === "") text = "-";
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
    if (madvSaveSlidePosition === 'true' && !isNaN(position)) wordIndex = Number.parseInt(String(position), 10);
    return text;
}

let wordIndex;

// Load the selected text and re-initialise the reader
function loadSelectedTextHistory(historyid) {
    selectedTextID = historyid;
    wordIndex = 0;
    setProgress(0);
    loadReader();
}

// Load the text in the clipboard
function getClipboardContentsAsText() {
    const clipboardContents = chrome.extension.getBackgroundPage().paste();
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

    if (autoStart === 'true') {
        $('#autostart').prop('checked', 'true');
    } else {
        $('#autostart').removeAttr('checked');
    }

    document.getElementById('autostart-seconds').value = autoStartSeconds;

    if (autoCloseReader === 'true') {
        $('#auto-close-reader').prop('checked', 'true');
    } else {
        $('#auto-close-reader').removeAttr('checked');
    }

    $('#font').attr("data-family", font);
    $('#font-data-option').text(font);
    document.getElementById('font-selection').value = font;

    // Display the WPM, chunk size and text orientation on the main screen (status)
    const divStatus = document.getElementById("status-label");
    let orient = "";
    if (displayReaderRightToLeft) orient = " RTL";
    divStatus.innerHTML = "WPM: " + WPM + " (" + chunkSize + ")" + orient;

    // Text orientation
    if (textOrientationIsRightToLeft === 'true') {
        $('#word-right-to-left').prop('checked', 'true');
    } else {
        $('#word-right-to-left').removeAttr('checked');
    }

    if (textOrientationAutoDetect === 'true') {
        $('#auto-text-orientation').prop('checked', 'true');
    } else {
        $('#auto-text-orientation').removeAttr('checked');
    }

    if (showRemainingTime === 'true') {
        $('#show-remaining-time').prop('checked', 'true');
    } else {
        $('#show-remaining-time').removeAttr('checked');
    }
}

function displayAdvancedSettings() {
    // Display the advanced settings on the advanced screen
    document.getElementById('algorithm').value = selectedAlgorithm;

    if (pauseAfterComma === 'true') {
        $('#pause-comma').prop('checked', 'true');
    } else {
        $('#pause-comma').removeAttr('checked');
    }

    if (pauseAfterPeriod === 'true') {
        $('#pause-period').prop('checked', 'true');
    } else {
        $('#pause-period').removeAttr('checked');
    }

    if (pauseAfterParagraph === 'true') {
        $('#pause-paragraph').prop('checked', 'true');
    } else {
        $('#pause-paragraph').removeAttr('checked');
    }

    if (wordFlicker === 'true') {
        $('#word-flicker').prop('checked', 'true');
    } else {
        $('#word-flicker').removeAttr('checked');
    }

    document.getElementById('pause-comma-delay').value = pauseAfterCommaDelay;
    document.getElementById('pause-period-delay').value = pauseAfterPeriodDelay;
    document.getElementById('pause-paragraph-delay').value = pauseAfterParagraphDelay;
    document.getElementById('word-flicker-percent').value = wordFlickerPercent;

    // Advanced display parameters
    setColourPickerDisplay(highlightOptimalLetterColour);
    document.getElementById('text-position').value = textPosition;

    if (highlightOptimalLetter === 'true') {
        $('#highlightoptimalletter').prop('checked', 'true');
    } else {
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
    const newWPM = document.getElementById('wpm').value;
    const newChunkSize = document.getElementById('chunk').value;
    const newFontSize = document.getElementById('fontsize').value;
    const newColorScheme = document.getElementById('color').value;
    const newFont = document.getElementById('font-selection').value;

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

    const newAutoStartSeconds = document.getElementById('autostart-seconds').value;
    const newAutoStart = document.getElementById('autostart').checked;
    const newAutoCloseReader = document.getElementById('auto-close-reader').checked;

    localStorage.setItem("autoStart", newAutoStart);
    localStorage.setItem("autoCloseReader", newAutoCloseReader);

    if (!isNaN(newAutoStartSeconds)) {
        localStorage.setItem("autoStartSeconds", newAutoStartSeconds);
        autoStartSeconds = newAutoStartSeconds;
    }

    // Text orientation
    const newtextOrientationIsRightToLeft = document.getElementById('word-right-to-left').checked;
    localStorage.setItem("textOrientationIsRightToLeft", newtextOrientationIsRightToLeft);
    textOrientationIsRightToLeft = newtextOrientationIsRightToLeft;

    const newtextOrientationAutoDetect = document.getElementById('auto-text-orientation').checked;
    localStorage.setItem("textOrientationAutoDetect", newtextOrientationAutoDetect);
    textOrientationAutoDetect = newtextOrientationAutoDetect;

    //Display
    const newShowRemainingTime = document.getElementById('show-remaining-time').checked;
    localStorage.setItem("showRemainingTime", newShowRemainingTime);
    showRemainingTime = newShowRemainingTime;

    // Because the settings have changed we need to adjust the output accordingly
    // setFontProperties();
    // setColorScheme(colorScheme);
    // These refresh methods are called in init which is called in textReset below

    // Determine if we need to recalculate timings for the selected text
    if (newWPM !== WPM) {
        WPM = newWPM;
        getTextArrayTiming(selectedAlgorithm, textArray);
    }

    // Reset the display
    textReset();
}

function saveAdvancedSettings() {
    // Save the advanced settings to localstorage
    const newAlgorithm = document.getElementById('algorithm').value;
    const newPauseCommaDelay = document.getElementById('pause-comma-delay').value;
    const newPausePeriodDelay = document.getElementById('pause-period-delay').value;
    const newPauseParagraphDelay = document.getElementById('pause-paragraph-delay').value;
    const newWordFlickerPercent = document.getElementById('word-flicker-percent').value;

    const newPauseComma = document.getElementById('pause-comma').checked;
    const newPausePeriod = document.getElementById('pause-period').checked;
    const newPauseParagraph = document.getElementById('pause-paragraph').checked;
    const newWordFlicker = document.getElementById('word-flicker').checked;

    localStorage.setItem("pauseComma", newPauseComma);
    localStorage.setItem("pausePeriod", newPausePeriod);
    localStorage.setItem("pauseParagraph", newPauseParagraph);
    localStorage.setItem("wordFlicker", newWordFlicker);

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

    if (!isNaN(newWordFlickerPercent)) {
        localStorage.setItem("wordFlickerPercent", newWordFlickerPercent);
        wordFlickerPercent = newWordFlickerPercent;
    }

    // Assign the values to variables
    pauseAfterComma = newPauseComma;
    pauseAfterPeriod = newPausePeriod;
    pauseAfterParagraph = newPauseParagraph;
    wordFlicker = newWordFlicker;

    // Determine if we need to recalculate timings for the selected text
    if (newAlgorithm !== selectedAlgorithm) {
        selectedAlgorithm = newAlgorithm;
        getTextArrayTiming(selectedAlgorithm, textArray);
    }

    // Display parameters
    const newTextPosition = document.getElementById('text-position').value;
    const newHighlightOptimalLetter = document.getElementById('highlightoptimalletter').checked;
    const newHighlightOptimalLetterColour = $('.cp-small').css('background-color');

    localStorage.setItem("textPosition", newTextPosition);
    localStorage.setItem("highlightOptimalLetter", newHighlightOptimalLetter);
    localStorage.setItem("highlightOptimalLetterColour", newHighlightOptimalLetterColour);

    // Reset the display
    textReset();
}

function setFontProperties() {
    const wordElement = $('#word');

    wordElement.css('font-size', fontSize + "px");
    wordElement.css('font-family', font);
}

function setColourPicker() {
    const slide = document.getElementById('slide');
    const picker = document.getElementById('picker');
    if (slide != null && picker != null) {
        ColorPicker(slide,
            picker,
            function (hex) {
                setColourPickerDisplay(hex);
            });
    }
}

function setDisplayProperties() {
    // Set the reader display settings
    if (madvDisplayProgress === 'true') {
        $("#progress").show();
    } else {
        $("#progress").hide();
    }

    if (madvDisplaySocial === 'true') {
        $('.social').css('visibility', 'visible');
    } else {
        $('.social').css('visibility', 'hidden');
    }

    if (madvDisplayWPMSummary === 'true') {
        $("#status").show();
    } else {
        $("#status").hide();
    }
}

function setTextOrientation() {
    displayReaderRightToLeft = false;

    // User has instructed the text is RIGHT TO LEFT
    let displayReaderRightToLeft;
    if (textOrientationIsRightToLeft === 'true') {
        displayReaderRightToLeft = true;
    }
    // Sprint reader should auto-detect RIGHT TO LEFT
    else if (textOrientationAutoDetect === 'true') {
        const detectedRTL = getFromLocalNotEmpty('selectedTextIsRTL', undefined);
        if (detectedRTL === 'true' || language.isrighttoleft) displayReaderRightToLeft = true;
        // English (most common language is ALWAYS LTR)
        if (language.shortname === 'en') displayReaderRightToLeft = false;
    }

    const word = $("#word");
    if (displayReaderRightToLeft) {
        word.css('direction', 'rtl');
    } else {
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
    const bodyElement = $('body');
    const tabContentElement = $('.tab-content');
    const navTabsElement = $('.nav-tabs');
    const navTabsLiAElement = $('.nav-tabs > li > a');
    const alertInfoElement = $('.alert-info');
    const labelInfoElement = $('.label-info');
    const btnInfoElement = $('.btn-info');
    const btnInfoCaretElement = $('.btn-info > .caret');
    const progressBarInfoElement = $('.progress-bar-info');
    const inputColumnRightElement = $('.input-column-right');
    const contentAllInnerElement = $('.contentall_inner');
    const githubLogoPathElement = $('.github_logo path');

    switch (scheme) {
        case 0:
            // WHITE
            colorSchemeName = "white";
            bodyElement.css('background', 'white');
            bodyElement.css('color', 'black');
            tabContentElement.css('border', '1px solid #ddd');
            navTabsElement.css('border-top', '1px solid #ddd');
            navTabsLiAElement.css('color', '#08c');
            alertInfoElement.css('color', 'black');
            alertInfoElement.css('border-color', '#5bc0de');
            alertInfoElement.css('background-color', '#5bc0de');
            labelInfoElement.css('color', '#fff');
            labelInfoElement.css('background-color', '#5bc0de');
            btnInfoElement.css('color', '#fff');
            btnInfoElement.css('background-color', '#5bc0de');
            btnInfoElement.css('border-color', '#46b8da');
            btnInfoCaretElement.css('border-top-color', 'white');
            progressBarInfoElement.css('background-color', '#5bc0de');
            inputColumnRightElement.css('border-left-color', '#ddd');
            colorSentenceBorder = '#ddd';
            colorGithubIcon = '#46b8da';
            break;
        case 1:
            // BLACK
            colorSchemeName = "black";
            bodyElement.css('background', 'black');
            bodyElement.css('color', 'white');
            tabContentElement.css('border', '1px solid #666666');
            navTabsElement.css('border-top', '1px solid #666666');
            navTabsLiAElement.css('color', '#6C6E6F');
            alertInfoElement.css('color', 'black');
            alertInfoElement.css('border-color', '#6C6E6F');
            alertInfoElement.css('background-color', '#6C6E6F');
            labelInfoElement.css('color', 'black');
            labelInfoElement.css('background-color', '#6C6E6F');
            btnInfoElement.css('color', 'black');
            btnInfoElement.css('background-color', '#6C6E6F');
            btnInfoElement.css('border-color', '#6C6E6F');
            btnInfoCaretElement.css('border-top-color', 'black');
            progressBarInfoElement.css('background-color', '#8D888F');
            inputColumnRightElement.css('border-left-color', '#3f3f40');
            contentAllInnerElement.css('border-color', '#6C6E6F');
            colorSentenceBorder = '#3f3f40';
            colorGithubIcon = 'white';
            break;
        case 2:
            // GREY
            colorSchemeName = "grey";
            bodyElement.css('background', 'Gainsboro');
            bodyElement.css('color', 'DimGray');
            tabContentElement.css('border', '1px solid #C0C0C0');
            navTabsElement.css('border-top', '1px solid #C0C0C0');
            navTabsLiAElement.css('color', '#08c');
            alertInfoElement.css('color', 'LightGrey');
            alertInfoElement.css('border-color', 'DimGray');
            alertInfoElement.css('background-color', 'DimGray');
            labelInfoElement.css('color', '#fff');
            labelInfoElement.css('background-color', '#5bc0de');
            btnInfoElement.css('color', '#fff');
            btnInfoElement.css('background-color', '#5bc0de');
            btnInfoElement.css('border-color', '#46b8da');
            btnInfoCaretElement.css('border-top-color', 'white');
            progressBarInfoElement.css('background-color', '#5bc0de');
            inputColumnRightElement.css('border-left-color', '#C0C0C0');
            contentAllInnerElement.css('border-color', '#46b8da');
            colorSentenceBorder = '#C0C0C0';
            colorGithubIcon = 'black';
            break;
        case 3:
            // BLUE
            colorSchemeName = "blue";
            bodyElement.css('background', '#9FC1FF');
            bodyElement.css('color', '#2955A6');
            tabContentElement.css('border', '1px solid #7494D2');
            navTabsElement.css('border-top', '1px solid #7494D2');
            navTabsLiAElement.css('color', '#2955A6');
            alertInfoElement.css('color', '#9FC1FF');
            alertInfoElement.css('border-color', '#2955A6');
            alertInfoElement.css('background-color', '#2955A6');
            labelInfoElement.css('color', '#fff');
            labelInfoElement.css('background-color', '#2955A6');
            btnInfoElement.css('color', '#fff');
            btnInfoElement.css('background-color', '#2955A6');
            btnInfoElement.css('border-color', '#2955A6');
            btnInfoCaretElement.css('border-top-color', 'white');
            progressBarInfoElement.css('background-color', '#325BDB');
            inputColumnRightElement.css('border-left-color', '#96b6f1');
            contentAllInnerElement.css('border-color', '#2955A6');
            colorSentenceBorder = '#96b6f1';
            colorGithubIcon = '#2955A6';
            break;
        case 4:
            // PURPLE
            colorSchemeName = "purple";
            bodyElement.css('background', '#AB97CB');
            bodyElement.css('color', '#361A62');
            tabContentElement.css('border', '1px solid #6C5097');
            navTabsElement.css('border-top', '1px solid #6C5097');
            navTabsLiAElement.css('color', '#361A62');
            alertInfoElement.css('color', '#AB97CB');
            alertInfoElement.css('border-color', '#361A62');
            alertInfoElement.css('background-color', '#361A62');
            labelInfoElement.css('color', '#fff');
            labelInfoElement.css('background-color', '#361A62');
            btnInfoElement.css('color', '#fff');
            btnInfoElement.css('background-color', '#361A62');
            btnInfoElement.css('border-color', '#361A62');
            btnInfoCaretElement.css('border-top-color', 'white');
            progressBarInfoElement.css('background-color', '#762496');
            inputColumnRightElement.css('border-left-color', '#9885b8');
            contentAllInnerElement.css('border-color', '#361A62');
            githubLogoPathElement.css('fill', '#361A62');
            colorSentenceBorder = '#9885b8';
            colorGithubIcon = 'black';
            break;
        case 5:
            // GREEN
            colorSchemeName = "green";
            bodyElement.css('background', '#A4D3B1');
            bodyElement.css('color', '#136428');
            tabContentElement.css('border', '1px solid #6EA27C');
            navTabsElement.css('border-top', '1px solid #6EA27C');
            navTabsLiAElement.css('color', '#136428');
            alertInfoElement.css('color', '#A4D3B1');
            alertInfoElement.css('border-color', '#136428');
            alertInfoElement.css('background-color', '#136428');
            labelInfoElement.css('color', '#fff');
            labelInfoElement.css('background-color', '#136428');
            btnInfoElement.css('color', '#fff');
            btnInfoElement.css('background-color', '#136428');
            btnInfoElement.css('border-color', '#136428');
            btnInfoCaretElement.css('border-top-color', 'white');
            progressBarInfoElement.css('background-color', '#33751E');
            inputColumnRightElement.css('border-left-color', '#91c19f');
            contentAllInnerElement.css('border-color', '#136428');
            colorSentenceBorder = '#91c19f';
            colorGithubIcon = '#136428';
            break;
        case 6:
            // HIGH CONTRAST
            colorSchemeName = "highcontrast";
            bodyElement.css('background', '#161616');
            bodyElement.css('color', '#cfba58');
            tabContentElement.css('border', '1px solid #cfba58');
            navTabsElement.css('border-top', '1px solid #cfba58');
            navTabsLiAElement.css('color', '#cfba58');
            alertInfoElement.css('color', '#cfba58');
            alertInfoElement.css('border-color', '#cfba58');
            alertInfoElement.css('background-color', '#161616');
            labelInfoElement.css('color', '#cfba58');
            labelInfoElement.css('background-color', '#161616');
            btnInfoElement.css('color', '#cfba58');
            btnInfoElement.css('background-color', '#161616');
            btnInfoElement.css('border-color', '#cfba58');
            btnInfoCaretElement.css('border-top-color', '#cfba58');
            progressBarInfoElement.css('background-color', '#cfba58');
            inputColumnRightElement.css('border-left-color', '#cfba58');
            contentAllInnerElement.css('border-color', '#cfba58');
            colorSentenceBorder = '#cfba58';
            colorGithubIcon = '#cfba58';
            break;
        case 7:
            // EL DESIGNO
            colorSchemeName = "eldesigno";
            bodyElement.css('background', '#a79e65');
            bodyElement.css('color', '#2b2301');
            tabContentElement.css('border', '1px solid #7e7644');
            navTabsElement.css('border-top', '1px solid #7e7644');
            navTabsLiAElement.css('color', '#2b2301');
            alertInfoElement.css('color', '#2b2301');
            alertInfoElement.css('border-color', '#2b2301');
            alertInfoElement.css('background-color', '#e2d893');
            labelInfoElement.css('color', '#2b2301');
            labelInfoElement.css('background-color', '#e2d893');
            btnInfoElement.css('color', '#2b2301');
            btnInfoElement.css('background-color', '#e2d893');
            btnInfoElement.css('border-color', '#7e7644');
            btnInfoCaretElement.css('border-top-color', '#2b2301');
            progressBarInfoElement.css('background-color', '#73afb6');
            inputColumnRightElement.css('border-left-color', '#b9ae66');
            contentAllInnerElement.css('border-color', '#7e7644');
            colorSentenceBorder = '#b9ae66';
            colorGithubIcon = 'black';
            break;
        case 8:
            // NEUTRAL FARM
            colorSchemeName = "neutralfarm";
            bodyElement.css('background', '#d7c3aa');
            bodyElement.css('color', '#815747');
            tabContentElement.css('border', '1px solid #c69876');
            navTabsElement.css('border-top', '1px solid #c69876');
            navTabsLiAElement.css('color', '#815747');
            alertInfoElement.css('color', '#815747');
            alertInfoElement.css('border-color', '#815747');
            alertInfoElement.css('background-color', '#f0ce91');
            labelInfoElement.css('color', '#815747');
            labelInfoElement.css('background-color', '#f0ce91');
            btnInfoElement.css('color', '#815747');
            btnInfoElement.css('background-color', '#f0ce91');
            btnInfoElement.css('border-color', '#c69876');
            btnInfoCaretElement.css('border-top-color', '#815747');
            progressBarInfoElement.css('background-color', '#c69876');
            inputColumnRightElement.css('border-left-color', '#b9ae66');
            contentAllInnerElement.css('border-color', '#c69876');
            colorSentenceBorder = '#b9ae66';
            colorGithubIcon = 'black';
            break;
        case 9:
            // DARK GREY
            colorSchemeName = "darkgrey";
            bodyElement.css('background', '#6e6e70');
            bodyElement.css('color', '#2d2d2e');
            tabContentElement.css('border', '1px solid #2d2d2e');
            navTabsElement.css('border-top', '1px solid #2d2d2e');
            navTabsLiAElement.css('color', '#2d2d2e');
            alertInfoElement.css('color', '#2d2d2e');
            alertInfoElement.css('border-color', '#2d2d2e');
            alertInfoElement.css('background-color', '#8b8b86');
            labelInfoElement.css('color', '#2d2d2e');
            labelInfoElement.css('background-color', '#8b8b86');
            btnInfoElement.css('color', '#2d2d2e');
            btnInfoElement.css('background-color', '#8b8b86');
            btnInfoElement.css('border-color', '#2d2d2e');
            btnInfoCaretElement.css('border-top-color', '#2d2d2e');
            progressBarInfoElement.css('background-color', '#2d2d2e');
            inputColumnRightElement.css('border-left-color', '#808082');
            contentAllInnerElement.css('border-color', '#2d2d2e');
            colorSentenceBorder = '#808082';
            colorGithubIcon = 'black';
            break;
        case 10:
            // DARK PURPLE
            colorSchemeName = "darkpurple";
            bodyElement.css('background', '#470763');
            bodyElement.css('color', '#C7AFD1');
            tabContentElement.css('border', '1px solid #8E6F9B');
            navTabsElement.css('border-top', '1px solid #8E6F9B');
            navTabsLiAElement.css('color', '#C7AFD1');
            alertInfoElement.css('color', '#C7AFD1');
            alertInfoElement.css('border-color', '#8E6F9B');
            alertInfoElement.css('background-color', '#470763');
            labelInfoElement.css('color', '#C7AFD1');
            labelInfoElement.css('background-color', '#470763');
            btnInfoElement.css('color', '#470763');
            btnInfoElement.css('background-color', '#C7AFD1');
            btnInfoElement.css('border-color', '#470763');
            btnInfoCaretElement.css('border-top-color', '#470763');
            progressBarInfoElement.css('background-color', '#8E6F9B');
            inputColumnRightElement.css('border-left-color', '#8E6F9B');
            contentAllInnerElement.css('border-color', '#470763');
            colorSentenceBorder = '#8E6F9B';
            colorGithubIcon = 'white';
            break;
        case 11:
            // CHARCOAL
            colorSchemeName = "charcoal";
            bodyElement.css('background', '#282828');
            bodyElement.css('color', '#e7e0e0');
            tabContentElement.css('border', '1px solid #4d4d4d');
            navTabsElement.css('border-top', '1px solid #4d4d4d');
            navTabsLiAElement.css('color', '#4d4d4d');
            alertInfoElement.css('color', '#e7e0e0');
            alertInfoElement.css('border-color', '#4d4d4d');
            alertInfoElement.css('background-color', '#282828');
            labelInfoElement.css('color', '#4d4d4d');
            labelInfoElement.css('background-color', '#282828');
            btnInfoElement.css('color', '#4d4d4d');
            btnInfoElement.css('background-color', '#282828');
            btnInfoElement.css('border-color', '#4d4d4d');
            btnInfoCaretElement.css('border-top-color', '#4d4d4d');
            progressBarInfoElement.css('background-color', '#4d4d4d');
            inputColumnRightElement.css('border-left-color', '#4d4d4d');
            contentAllInnerElement.css('border-color', '#4d4d4d');
            colorSentenceBorder = '#4d4d4d';
            colorGithubIcon = 'white';
            break;
        case 12:
            // EARTHY GREENS
            colorSchemeName = "earthygreens";
            bodyElement.css('background', '#cce0c4');
            bodyElement.css('color', '#59812e');
            tabContentElement.css('border', '1px solid #59812e');
            navTabsElement.css('border-top', '1px solid #59812e');
            navTabsLiAElement.css('color', '#59812e');
            alertInfoElement.css('color', '#59812e');
            alertInfoElement.css('border-color', '#59812e');
            alertInfoElement.css('background-color', '#cce0c4');
            labelInfoElement.css('color', '#59812e');
            labelInfoElement.css('background-color', '#cce0c4');
            btnInfoElement.css('color', '#59812e');
            btnInfoElement.css('background-color', '#cce0c4');
            btnInfoElement.css('border-color', '#59812e');
            btnInfoCaretElement.css('border-top-color', '#59812e');
            progressBarInfoElement.css('background-color', '#59812e');
            inputColumnRightElement.css('border-left-color', '#59812e');
            contentAllInnerElement.css('border-color', '#59812e');
            colorSentenceBorder = '#59812e';
            colorGithubIcon = '#59812e';
            break;
        case 13:
            // PURDY PINK
            colorSchemeName = "purdypink";
            bodyElement.css('background', '#ffffff');
            bodyElement.css('color', '#fe14a9');
            tabContentElement.css('border', '1px solid #cccccc');
            navTabsElement.css('border-top', '1px solid #cccccc');
            navTabsLiAElement.css('color', '#f866c3');
            alertInfoElement.css('color', '#f866c3');
            alertInfoElement.css('border-color', '#f866c3');
            alertInfoElement.css('background-color', '#fddaf0');
            labelInfoElement.css('color', '#f866c3');
            labelInfoElement.css('background-color', '#fddaf0');
            btnInfoElement.css('color', '#f866c3');
            btnInfoElement.css('background-color', '#fddaf0');
            btnInfoElement.css('border-color', '#f866c3');
            btnInfoCaretElement.css('border-top-color', '#f996d5');
            progressBarInfoElement.css('background-color', '#f996d5');
            inputColumnRightElement.css('border-left-color', '#facfea');
            contentAllInnerElement.css('border-color', '#f866c3');
            colorSentenceBorder = '#f866c3';
            colorGithubIcon = 'black';
            break;
        case 14:
            // OLIVE BRANCH
            colorSchemeName = "olivebranch";
            bodyElement.css('background', '#cfba58');
            bodyElement.css('color', '#000000');
            tabContentElement.css('border', '1px solid #a69546');
            navTabsElement.css('border-top', '1px solid #a69546');
            navTabsLiAElement.css('color', '#bf3211');
            alertInfoElement.css('color', '#ffffff');
            alertInfoElement.css('border-color', '#bf3211');
            alertInfoElement.css('background-color', '#bf3211');
            labelInfoElement.css('color', '#ffffff');
            labelInfoElement.css('background-color', '#bf3211');
            btnInfoElement.css('color', '#ffffff');
            btnInfoElement.css('background-color', '#bf3211');
            btnInfoElement.css('border-color', '#bf3211');
            btnInfoCaretElement.css('border-top-color', '#bf3211');
            progressBarInfoElement.css('background-color', '#bf3211');
            inputColumnRightElement.css('border-left-color', '#a69546');
            contentAllInnerElement.css('border-color', '#bf3211');
            colorSentenceBorder = '#bf3211';
            colorGithubIcon = '#bf3211';
            break;
        case 15:
            // TOKYO
            colorSchemeName = "tokyo";
            bodyElement.css('background', '#0095ca');
            bodyElement.css('color', '#48371d');
            tabContentElement.css('border', '1px solid #48371d');
            navTabsElement.css('border-top', '1px solid #48371d');
            navTabsLiAElement.css('color', '#48371d');
            alertInfoElement.css('color', '#48371d');
            alertInfoElement.css('border-color', '#ed2645');
            alertInfoElement.css('background-color', '#ffffff');
            labelInfoElement.css('color', '#ffffff');
            labelInfoElement.css('background-color', '#ed2645');
            btnInfoElement.css('color', '#48371d');
            btnInfoElement.css('background-color', '#ffffff');
            btnInfoElement.css('border-color', '#ed2645');
            btnInfoCaretElement.css('border-top-color', '#48371d');
            progressBarInfoElement.css('background-color', '#ed2645');
            inputColumnRightElement.css('border-left-color', '#48371d');
            contentAllInnerElement.css('border-color', '#ed2645');
            colorSentenceBorder = '#48371d';
            colorGithubIcon = 'black';
            break;
    }

    tabContentElement.css('border-bottom', '0px');
    githubLogoPathElement.css('fill', colorSentenceBorder);
}

function textPlayCountdown() {
    divWord.innerHTML = seconds;

    // Create a dummy text item for the countdown
    const textItem = {};
    textItem.optimalletterposition = 1;
    textItem.text = seconds.toString();

    let orient = 'left';
    if (displayReaderRightToLeft) orient = 'right';

    const wordContainerElement = $("#word-container");

    wordContainerElement.css('padding-left', "0px");
    wordContainerElement.css('padding-right', "0px");

    // Optimal positioning
    //    - Optimal positioning
    //	  - Optimal positioning + static focal
    if (textPosition === 2 || textPosition === 3) {
        const px = calculatePixelOffsetToOptimalCenter(textItem);
        const offset = leftPaddingBorderOptimised - px;
        wordContainerElement.css('padding-' + orient, offset + "px");
        wordContainerElement.css('margin-left', "0");
    } else {
        wordContainerElement.css('margin-left', "auto");
    }

    // Highlighting of the countdown letter
    highlightTheOptimalLetter(textItem);

    // Display the correct slide/duration
    seconds = seconds - 1;
    if (seconds === -1) {
        wordIndex = 0;
        displayWord(textArray[wordIndex]);
        stopSlideShow = false;
        playingText = true;
    } else if (seconds < -1) {
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
    if (!playingText && divPlay.innerHTML === strRestart) {
        wordIndex = 0;
        setProgress(0);
        stopSlideShow = false;
        playingText = true;
        changePlayButtonText(strPause);
        divWord.innerHTML = textArray[0].text;
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
    if (madvAutoHideSentence === 'true') {
        sentenceTimer = setTimeout(function () {
            displaySentence(false);
        }, madvAutoHideSentenceSeconds * 1000);
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
        if (wordIndex <= 0) {
            return;
        } else if (wordIndex === 1) wordIndex = 0;
        else wordIndex = wordIndex - 1;
        getWord();
    } else {
        // Forwards
        if (wordIndex === textArray.length - 1) {
            setProgress(100);
            return;
        }
        if (wordIndex === textArray.length - 1) return;
        wordIndex = wordIndex + 1;
        getWord();
        if (wordIndex === textArray.length) {
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
    const prog = $('#progress');
    const progressWidth = prog.width();
    let x = Math.round(event.pageX - prog.offset().left);
    if (x < 0) x = 0;

    const percentClicked = Math.round((x / progressWidth) * 100);
    setProgress(percentClicked);

    // Display the correct word for the progress click selection
    const wordCount = textArray.length;
    const wordLocation = wordCount * (percentClicked / 100);
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
    if (wordIndex === textArray.length - 1) {
        textPause();
        setProgress(100);
        // Close the reader after a 750-millisecond delay
        setTimeout(function () {
            closePopup();
        }, 750);
    }
}

function getWordIndexByStep(step) {
    if (step === 0) return wordIndex;
    if (step > 0) {
        return Math.min(textArray.length - 1, wordIndex + step);
    } else {
        return Math.max(1, wordIndex + step);
    }
}

function bindKeys(k) {
    //console.log(k.keyCode);
    let step;
    // KeyCode 32 = Space Bar
    if (k.keyCode === 32) {
        // We fire a button click event which will in turn fire
        // the textPlay() function. This ensures we continue to
        // track data for Google Analytics and prevents a
        // double firing of the textPlay when the button already
        // has focus.
        document.getElementById('btnPlay').click();

    }
    // KeyCode 97 = A key
    else if (k.keyCode === 97) {
        textStep(-1);
    }
    // KeyCode 115 = S key
    else if (k.keyCode === 115) {
        textStep(1);
    }
    // KeyCode 122 = Z key
    else if (k.keyCode === 122) {
        adjustWPM(madvWPMAdjustmentStep * -1);
    }
    // KeyCode 120 = X key
    else if (k.keyCode === 120) {
        adjustWPM(madvWPMAdjustmentStep);
    }
    // KeyCode 107 = K key
    else if (k.keyCode === 107) {
        step = madvLargeStepNumberOfSlides * -1;
        wordIndex = getWordIndexByStep(step);
        textStep(-1);
    }
    // KeyCode 108 = L key
    else if (k.keyCode === 108) {
        step = madvLargeStepNumberOfSlides;
        wordIndex = getWordIndexByStep(step);
        textStep(1);
    }
}

function bindReset(k) {
    if (String.fromCharCode(k.keyCode) === 'r') {
        if (divPlay.innerHTML === strRestart) {
            textPlay();
        } else {
            wordIndex = 0;
            saveSelectedTextPosition();
            textReset();
        }
    }
}

function bindQuit(k) {
    if (String.fromCharCode(k.keyCode) === 'q') {
        closePopup();
    }
}

function bindSelectionLoad(k) {
    if (String.fromCharCode(k.keyCode) === 'v') {
        loadSelectedTextHistory(0);
    }
}

function bindClipboardLoad(k) {
    if (String.fromCharCode(k.keyCode) === 'c') {
        loadSelectedTextHistory(9);
    }
}

// Sets up the slide tooltip
function setupSlideTooltip() {
    if (listenersExist) return;

    $('#status-label').qtip({
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
            effect: function () {
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
    if (textArray.length === 0) return;

    // Build the tooltip text
    const textItem = textArray[wordIndex];
    if (textItem.text === "") return;

    const slideNumber = wordIndex + 1;
    const slideDuration = textItem.duration + WPMTimingAdjustmentMS;
    const titlenote = "Showing slide <b>" + slideNumber + "</b> of <b>" + textArray.length + "</b>";
    const description = "Word: " + textItem.textforinfo + "<br/>" +
        "- Pre delay: " + textItem.predelay.toFixed(2) + "ms <br/>" +
        "- Slide duration: <b>" + slideDuration.toFixed(2) + "ms </b><br/>" +
        "- Post delay: " + textItem.postdelay.toFixed(2) + "ms <br/><br/>" +
        "- WPM setting: " + WPM + " <br/>" +
        "- WPM real: <b>" + slideShowData.realWPM + " </b><br/>" +
        "- WPM all pauses: " + slideShowData.realWPMAllPauses;

    const statusLabelElement = $('#status-label');

    statusLabelElement.qtip('option', 'content.text', description);
    statusLabelElement.qtip('option', 'content.title', titlenote);
}

// Show the focal guide if we are using a focal positioning method
function showFocalGuide() {
    // Do not show the guide if the chunk size is more than 1
    if (chunkSize > 1 || madvAlwaysHideFocalGuide === 'true') {
        hideFocalGuide();
        return;
    }

    divFocalGuideTop = $(".focal-guide.top");
    divFocalGuideBottom = $(".focal-guide.bottom");

    // Reset left and right positioning because of text orientation
    divFocalGuideTop.css('left', "");
    divFocalGuideTop.css('right', "");
    divFocalGuideBottom.css('left', "");
    divFocalGuideBottom.css('right', "");

    const bodyElement = $('body');

    let guideColor = bodyElement.css('color');
    if (highlightOptimalLetter === 'true') {
        guideColor = highlightOptimalLetterColour;
    }

    // Optimal positioning
    //    - Optimal positioning
    //	  - Optimal positioning + static focal
    if (textPosition === 2 || textPosition === 3) {
        const word = $("#word");
        const wordContainer = $("#word-container");

        const centreLeft = leftPaddingBorderOptimised;

        // Word container height
        const wordCH = wordContainer.height();
        if (wordCH > 0 || wordContainerHeight === 0) {
            wordContainerHeight = wordCH;
        }

        // Word height
        const wordH = word.height();
        if (wordH > 0 || wordHeight === 0) {
            wordHeight = wordH;
        }

        // Word outer height
        const wordOH = word.outerHeight(true);
        if (wordOH > 0 || wordHeightOuter === 0) {
            wordHeightOuter = wordOH;
        }
        let margin = wordContainerHeight * 0.05;
        if (fontSize <= 40) margin = wordHeightOuter * 0.20;

        // Word container top
        const wordPosition = word.offset();
        if (wordPosition.top > 0 || wordContainerTop === 0) {
            wordContainerTop = wordPosition.top;
        }

        const middleOfWordContainer = wordContainerHeight / 2;
        const wordOHHalf = wordHeightOuter / 2;

        const height = (wordHeight / 3).toFixed(0);
        divFocalGuideTop.css('height', height + "px");
        divFocalGuideBottom.css('height', height + "px");

        const toptop = middleOfWordContainer - wordOHHalf - margin - height;
        const bottomtop = middleOfWordContainer + wordOHHalf + margin;

        // Set the left OR right for the focal guide
        let orient = 'left';
        if (displayReaderRightToLeft) orient = 'right';
        divFocalGuideTop.css(orient, centreLeft + "px");
        divFocalGuideBottom.css(orient, centreLeft + "px");

        // Set the top of the focal guide
        divFocalGuideTop.css('top', toptop + "px");
        divFocalGuideBottom.css('top', bottomtop + "px");

        // Set the colour of the guide
        divFocalGuideTop.css('border-left-color', guideColor);
        divFocalGuideBottom.css('border-left-color', guideColor);
    } else hideFocalGuide();
}

// Hide the focal guide
function hideFocalGuide() {
    divFocalGuideTop = $(".focal-guide.top");
    divFocalGuideBottom = $(".focal-guide.bottom");

    const backColour = $('body').css('background');

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
    let wordClass;
    let index;
    const sentenceHTML = document.getElementById('sentence');
    const sentenceOuter = $('#sentence_outer');
    const sentenceContainer = $('#sentence');

    sentenceOuter.css('border-top', '');
    sentenceContainer.css('margin-left', '-' + madvSentencePositionPercentOffset + '%');
    sentenceHTML.innerHTML = "";

    // Do not show the sentence if not assigned
    if (madvDisplaySentenceWhenPaused === 'false') return;
    if (!show) {
        return;
    }

    // Display the sentence in the sentence div
    const sentenceText = getSentence();
    sentenceHTML.innerHTML = sentenceText.text;

    if (madvDisplaySentenceTopBorder === 'true') {
        sentenceOuter.css('border-top', '1px solid ' + colorSentenceBorder);
    }

    // Highlight the selected word
    $("#sentence").lettering('words');
    if (chunkSize > 1) {
        let i = 0;
        for (; i < chunkSize; i++) {
            index = sentenceText.index - 1 + i;
            wordClass = ".word" + index;
            $(wordClass).css('color', highlightOptimalLetterColour);
            $(wordClass).css('font-weight', 'bold');
        }
    } else {
        index = sentenceText.index;
        wordClass = ".word" + index;
        $(wordClass).css('color', highlightOptimalLetterColour);
        $(wordClass).css('font-weight', 'bold');
    }
}

// Build a sentence for us to display to the user
// Return the sentence (string) and the ID of the selected word
function getSentence() {
    const numberOfWordsBackward = Math.round(madvSentenceBackwardWordCount / chunkSize);
    const numberOfWordsForward = Math.round(20 / chunkSize);
    const indexMin = Math.max(0, wordIndex - numberOfWordsBackward);
    const indexMax = Math.min(textArray.length, wordIndex + numberOfWordsForward);
    textArray.slice(indexMin, indexMax);

    // Put the words together to build a sentence
    let index = 0;
    let wordCount = 0;
    let wordCountToPaused = 0;
    let sentenceText = "";

    // Build the sentence, text is default left-to-right
    let i = indexMin;
    for (; i < indexMax; i++) {
        index = index + 1;
        wordCount = wordCount + textArray[i].wordsinslide;
        // Identify when we have hit the paused word
        if (i === wordIndex) {
            wordCountToPaused = textArray[i].slidenumber - textArray[indexMin].slidenumber + 1;
            if (chunkSize > 1) wordCountToPaused = wordCount - 1;
        }
        // Build the sentence to display
        let word = textArray[i].textoriginal;

        if (textArray[i].childofprevious) {
            //console.log(textArray[i]);
            continue;
        }
        if (chunkSize > 1) word = textArray[i].text;
        if (sentenceText !== "") {
            sentenceText = sentenceText + " " + word;
        } else sentenceText = word;
    }

    const wordID = wordCountToPaused;
    //console.log("indexMin " + indexMin + " | indexMax " + indexMax + " | sentenceText " + sentenceText + " wordID " + wordID);

    return {
        text: sentenceText,
        index: wordID
    };
}

// Set the progress bar for the selected text length
function setProgress(percent) {
    const progress = percent + '%';
    divRemainingTime.innerHTML = showRemainingTime === 'true' ? getMinAndSecondsString(slideShowData.totalDurationIncPauses * (100 - percent) / 100) : "";
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

function resize() {
    centerWordInDiv();
    localStorage.setItem("readerWidth", window.outerWidth ? String(window.outerWidth) : '0');
    localStorage.setItem("readerHeight", window.outerHeight ? String(window.outerHeight) : '0');

    // If the textPosition is set for optimal we need to recalculate
    // the left padding to ensure the text is positioned correctly
    // - Optimal positioning
    // - Optimal positioning + static focal
    if (textPosition === 2 || textPosition === 3) {
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
function displayStatusData() {
    const divStatus = document.getElementById("status-label");
    // Text orientation
    let orient = "";
    if (displayReaderRightToLeft) orient = " RTL";
    // Real words per minute
    const realWPM = slideShowData.realWPM;
    if (realWPM !== WPMAdjusted) {
        divStatus.innerHTML = language.fullname + " WPM: " + WPMAdjusted + " [" + realWPM + "] (" + chunkSize + ") " + orient;
    } else divStatus.innerHTML = language.fullname + " WPM: " + WPMAdjusted + " (" + chunkSize + ") " + orient;
}

// Set (and save) the selected text position
// Usually executed when paused
function saveSelectedTextPosition() {
    if (madvSaveSlidePosition === 'true' && selectedTextID !== 9) {
        // Get the information required to save the text position
        let text;
        const position = wordIndex;
        //console.log(selectedTextID + ' | ' + position);

        switch (selectedTextID) {
            case 0:
                text = getSelectedTextFromResourceString(localStorage.getItem("selectedText")).text;
                if (text == null || text === "") return;
                localStorage.setItem("selectedText", text + textPositionDelimiter + position);
                break;
            case 1:
                text = getSelectedTextFromResourceString(localStorage.getItem("selectedTextHistory1")).text;
                if (text == null || text === "") return;
                localStorage.setItem("selectedTextHistory1", text + textPositionDelimiter + position);
                break;
            case 2:
                text = getSelectedTextFromResourceString(localStorage.getItem("selectedTextHistory2")).text;
                if (text == null || text === "") return;
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
