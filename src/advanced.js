//------------------------------------------------------------------------------
//
// 	SPRINT READER
//	Speed Reading Extension for Google Chrome
//	Copyright (c) 2013-2015, Anthony Nosek
//	https://github.com/anthonynosek/sprint-reader-chrome/blob/master/LICENSE
//
//------------------------------------------------------------------------------

// Have listeners been assigned?
var listenersExist;

// A long list of advanced settings controlled by this screen

// Initialise the screen
function init() {
	displayVersion();
	setEventListeners();	
	
	// More Advanced settings
	getMoreAdvancedSettingsDefaults();
	getMoreAdvancedSettings();
	displayMoreAdvancedSettings();
}

function setEventListeners() {
	if (!listenersExist) {
		// ----------------------------------
		// Advanced settings buttons	
		var divSaveMoreAdvanced = document.getElementById('btnSaveMoreAdvanced');
		divSaveMoreAdvanced.addEventListener("click", saveMoreAdvancedSettings, false);
		
		var divMoreAdvancedDefaults = document.getElementById('btnRestoreMoreAdvancedDefaults');
		divMoreAdvancedDefaults.addEventListener("click", restoreMoreAdvancedSettings, false);
		
		// Tracking for more advanced default values
		divSaveMoreAdvanced.addEventListener("click", function(){ trackSaveMoreAdvancedDefaults(madvStaticFocalUnicodeCharacter, 
																							    madvEnableSpaceInsertion, 
																							    madvRemoveLastSlideNullOrEmpty,
																							    madvEnableHyphenatedWordSplit, 
																							    madvConsolidateHyphenatedWord,
																							    madvEnableLongWordHyphenation, 
																							    madvLongWordTriggerCharacterCount,
																							    madvLongWordMinCharacterPerSlidePostSplit,
																							    madvLongWordCharacterTriggerDoNotJoin,
																								madvEnableAcronymDetection,
																								madvEnableNumberDecimalDetection,
																								madvDeleteEmptySlides,
																								madvOptimisedPositionLeftMarginPercent); }, false);
		
		listenersExist = true;
	}
}

function saveMoreAdvancedSettings() {
	
	// Can be an empty string
	var NEWmadvStaticFocalUnicodeCharacter = document.getElementById('staticfocalunicode').value;	
	localStorage.setItem("madvStaticFocalUnicodeCharacter", NEWmadvStaticFocalUnicodeCharacter);
	madvStaticFocalUnicodeCharacter = NEWmadvStaticFocalUnicodeCharacter;
	
	var NEWmadvLongWordTriggerCharacterCount = document.getElementById('longwordcharactercounttrigger').value;
	if (!isNaN(NEWmadvLongWordTriggerCharacterCount)) {
		localStorage.setItem("madvLongWordTriggerCharacterCount", NEWmadvLongWordTriggerCharacterCount);
		madvLongWordTriggerCharacterCount = NEWmadvLongWordTriggerCharacterCount;
	}
	
	var NEWmadvLongWordMinCharacterPerSlidePostSplit = document.getElementById('longwordcharacterperslidecountpostsplit').value;
	if (!isNaN(NEWmadvLongWordMinCharacterPerSlidePostSplit)) {
		localStorage.setItem("madvLongWordMinCharacterPerSlidePostSplit", NEWmadvLongWordMinCharacterPerSlidePostSplit);
		madvLongWordMinCharacterPerSlidePostSplit = NEWmadvLongWordMinCharacterPerSlidePostSplit;
	}
	
	var NEWmadvLongWordCharacterTriggerDoNotJoin = document.getElementById('longwordlastslidecharactercount').value;
	if (!isNaN(NEWmadvLongWordCharacterTriggerDoNotJoin)) {
		localStorage.setItem("madvLongWordCharacterTriggerDoNotJoin", NEWmadvLongWordCharacterTriggerDoNotJoin);
		madvLongWordCharacterTriggerDoNotJoin = NEWmadvLongWordCharacterTriggerDoNotJoin;
	}
	
	var NEWmadvEnableSpaceInsertion = document.getElementById('enablespacecharacterinsertion').checked;
	localStorage.setItem("madvEnableSpaceInsertion", NEWmadvEnableSpaceInsertion);
	
	var NEWmadvRemoveLastSlideNullOrEmpty = document.getElementById('removelastslideifnullorempty').checked;
	localStorage.setItem("madvRemoveLastSlideNullOrEmpty", NEWmadvRemoveLastSlideNullOrEmpty);
	
	var NEWmadvEnableHyphenatedWordSplit = document.getElementById('enabledhyphenatedwordsplit').checked;
	localStorage.setItem("madvEnableHyphenatedWordSplit", NEWmadvEnableHyphenatedWordSplit);
	
	var NEWmadvConsolidateHyphenatedWord = document.getElementById('consolidatesinglehyphenatedword').checked;
	localStorage.setItem("madvConsolidateHyphenatedWord", NEWmadvConsolidateHyphenatedWord);
	
	var NEWmadvEnableLongWordHyphenation = document.getElementById('enablehyphenationoflongerwords').checked;
	localStorage.setItem("madvEnableLongWordHyphenation", NEWmadvEnableLongWordHyphenation);
	
	var NEWmadvEnableAcronymDetection = document.getElementById('enableacronymdetection').checked;
	localStorage.setItem("madvEnableAcronymDetection", NEWmadvEnableAcronymDetection);
	
	var NEWmadvEnableNumberDecimalDetection = document.getElementById('enablenumberanddecimaldetection').checked;
	localStorage.setItem("madvEnableNumberDecimalDetection", NEWmadvEnableNumberDecimalDetection);
	
	var NEWmadvDeleteEmptySlides = document.getElementById('deleteemtpyslides').checked;
	localStorage.setItem("madvDeleteEmptySlides", NEWmadvDeleteEmptySlides);
	
	var NEWmadvLargeStepNumberOfSlides = document.getElementById('largestepnumberofslides').value;
	if (!isNaN(NEWmadvLargeStepNumberOfSlides)) {
		localStorage.setItem("madvLargeStepNumberOfSlides", NEWmadvLargeStepNumberOfSlides);
		madvLargeStepNumberOfSlides = NEWmadvLargeStepNumberOfSlides;
	}
	
	var NEWmadvWPMAdjustmentStep = document.getElementById('wpmadjustmentstep').value;
	if (!isNaN(NEWmadvWPMAdjustmentStep)) {
		localStorage.setItem("madvWPMAdjustmentStep", NEWmadvWPMAdjustmentStep);
		madvWPMAdjustmentStep = NEWmadvWPMAdjustmentStep;
	}

	var NEWmadvBasicMinimumSlideDuration = document.getElementById('basicminimumslideduration').value;
	if (!isNaN(NEWmadvBasicMinimumSlideDuration)) {
		localStorage.setItem("madvBasicMinimumSlideDuration", NEWmadvBasicMinimumSlideDuration);
		madvBasicMinimumSlideDuration = NEWmadvBasicMinimumSlideDuration;
	}
	
	var NEWmadvWordLengthMinimumSlideDuration = document.getElementById('wordlengthminimumslideduration').value;
	if (!isNaN(NEWmadvWordLengthMinimumSlideDuration)) {
		localStorage.setItem("madvWordLengthMinimumSlideDuration", NEWmadvWordLengthMinimumSlideDuration);
		madvWordLengthMinimumSlideDuration = NEWmadvWordLengthMinimumSlideDuration;
	}
	
	// Word Frequency Algorithm Advanced Settings
	var NEWmadvWordFreqMinimumSlideDuration = document.getElementById('wordfreqminimumslideduration').value;
	if (!isNaN(NEWmadvWordFreqMinimumSlideDuration)) {
		localStorage.setItem("madvWordFreqMinimumSlideDuration", NEWmadvWordFreqMinimumSlideDuration);
		madvWordFreqMinimumSlideDuration = NEWmadvWordFreqMinimumSlideDuration;
	}
	
	var NEWmadvWordFreqHighestFreqSlideDuration = document.getElementById('wordfreqhighestfreqslideduration').value;
	if (!isNaN(NEWmadvWordFreqHighestFreqSlideDuration)) {
		localStorage.setItem("madvWordFreqHighestFreqSlideDuration", NEWmadvWordFreqHighestFreqSlideDuration);
		madvWordFreqHighestFreqSlideDuration = NEWmadvWordFreqHighestFreqSlideDuration;
	}
	
	var NEWmadvWordFreqLowestFreqSlideDuration = document.getElementById('wordfreqlowestfreqslideduration').value;
	if (!isNaN(NEWmadvWordFreqLowestFreqSlideDuration)) {
		localStorage.setItem("madvWordFreqLowestFreqSlideDuration", NEWmadvWordFreqLowestFreqSlideDuration);
		madvWordFreqLowestFreqSlideDuration = NEWmadvWordFreqLowestFreqSlideDuration;
	}
	// end (Word Frequency Algorithm Advanced Settings)
	
	var NEWmadvAlwaysHideFocalGuide = document.getElementById('alwayshidefocalguide').checked;
	localStorage.setItem("madvAlwaysHideFocalGuide", NEWmadvAlwaysHideFocalGuide);
	
	var NEWmadvOptimisedPositionLeftMarginPercent = document.getElementById('optleftmarginpercent').value;
	if (!isNaN(NEWmadvOptimisedPositionLeftMarginPercent)) {
		localStorage.setItem("madvOptimisedPositionLeftMarginPercent", NEWmadvOptimisedPositionLeftMarginPercent);
		madvOptimisedPositionLeftMarginPercent = NEWmadvOptimisedPositionLeftMarginPercent;
	}
	
	var NEWmadvDisplaySentenceWhenPaused = document.getElementById('showsentence').checked;
	localStorage.setItem("madvDisplaySentenceWhenPaused", NEWmadvDisplaySentenceWhenPaused);
	
	var NEWmadvAutoHideSentence = document.getElementById('autohidesentence').checked;
	localStorage.setItem("madvAutoHideSentence", NEWmadvAutoHideSentence);
	
	var NEWmadvAutoHideSentenceSeconds = document.getElementById('autohidesentenceseconds').value;
	if (!isNaN(NEWmadvAutoHideSentenceSeconds)) {
		localStorage.setItem("madvAutoHideSentenceSeconds", NEWmadvAutoHideSentenceSeconds);
		madvAutoHideSentenceSeconds = NEWmadvAutoHideSentenceSeconds;
	}
	
	var NEWmadvDisplaySentenceTopBorder = document.getElementById('showsentenceborder').checked;
	localStorage.setItem("madvDisplaySentenceTopBorder", NEWmadvDisplaySentenceTopBorder);
	
	var NEWmadvDisplaySentenceAtReaderOpen = document.getElementById('sentencereaderopen').checked;
	localStorage.setItem("madvDisplaySentenceAtReaderOpen", NEWmadvDisplaySentenceAtReaderOpen);
	
	var NEWmadvSentenceBackwardWordCount = document.getElementById('sentencebackwardwordcount').value;
	if (!isNaN(NEWmadvSentenceBackwardWordCount)) {
		localStorage.setItem("madvSentenceBackwardWordCount", NEWmadvSentenceBackwardWordCount);
		madvSentenceBackwardWordCount = NEWmadvSentenceBackwardWordCount;
	}
	
	var NEWmadvSentencePositionPercentOffset = document.getElementById('sentencepositionpercentoffset').value;
	if (!isNaN(NEWmadvSentencePositionPercentOffset)) {
		localStorage.setItem("madvSentencePositionPercentOffset", NEWmadvSentencePositionPercentOffset);
		madvSentencePositionPercentOffset = NEWmadvSentencePositionPercentOffset;
	}
	
	var NEWmadvLargeStepNumberOfSlides = document.getElementById('largestepnumberofslides').value;
	if (!isNaN(NEWmadvLargeStepNumberOfSlides)) {
		localStorage.setItem("madvLargeStepNumberOfSlides", NEWmadvLargeStepNumberOfSlides);
		madvLargeStepNumberOfSlides = NEWmadvLargeStepNumberOfSlides;
	}
	
	var NEWmadvDisplayProgress = document.getElementById('displayprogress').checked;
	localStorage.setItem("madvDisplayProgress", NEWmadvDisplayProgress);
	
	var NEWmadvDisplaySocial = document.getElementById('displaysocial').checked;
	localStorage.setItem("madvDisplaySocial", NEWmadvDisplaySocial);
	
	var NEWmadvDisplayWPMSummary = document.getElementById('displaywpmsummary').checked;
	localStorage.setItem("madvDisplayWPMSummary", NEWmadvDisplayWPMSummary);
	
	var NEWmadvHotkeySelectionEnabled = document.getElementById('enableautotextselection').checked;
	localStorage.setItem("madvHotkeySelectionEnabled", NEWmadvHotkeySelectionEnabled);
	
	var NEWmadvSaveSlidePosition = document.getElementById('saveslideposition').checked;
	localStorage.setItem("madvSaveSlidePosition", NEWmadvSaveSlidePosition);
	
	// Close the advanced settings tab
	//chrome.tabs.getCurrent(function(tab) {
	//	chrome.tabs.remove(tab.id, function() { });
	//});
	
	alert('Please restart Sprint Reader for these changes to take effect');
}

function restoreMoreAdvancedSettings() {
	getMoreAdvancedSettingsDefaults();
	displayMoreAdvancedSettings();
	saveMoreAdvancedSettings();
}

function displayMoreAdvancedSettings() {
	// Display the more advanced settings on the screen	
	document.getElementById('staticfocalunicode').value = madvStaticFocalUnicodeCharacter;	
	
	if (madvEnableSpaceInsertion == 'true') {
		$('#enablespacecharacterinsertion').prop('checked', 'true');
	}
	else {
		$('#enablespacecharacterinsertion').removeAttr('checked');
	}
	
	if (madvRemoveLastSlideNullOrEmpty == 'true') {
		$('#removelastslideifnullorempty').prop('checked', 'true');
	}
	else {
		$('#removelastslideifnullorempty').removeAttr('checked');
	}
	
	if (madvEnableHyphenatedWordSplit == 'true') {
		$('#enabledhyphenatedwordsplit').prop('checked', 'true');
	}
	else {
		$('#enabledhyphenatedwordsplit').removeAttr('checked');
	}
	
	if (madvConsolidateHyphenatedWord == 'true') {
		$('#consolidatesinglehyphenatedword').prop('checked', 'true');
	}
	else {
		$('#consolidatesinglehyphenatedword').removeAttr('checked');
	}
	
	if (madvEnableLongWordHyphenation == 'true') {
		$('#enablehyphenationoflongerwords').prop('checked', 'true');
	}
	else {
		$('#enablehyphenationoflongerwords').removeAttr('checked');
	}
		
	document.getElementById('longwordcharactercounttrigger').value = madvLongWordTriggerCharacterCount;	
	document.getElementById('longwordcharacterperslidecountpostsplit').value = madvLongWordMinCharacterPerSlidePostSplit;
	document.getElementById('longwordlastslidecharactercount').value = madvLongWordCharacterTriggerDoNotJoin;
	
	if (madvEnableAcronymDetection == 'true') {
		$('#enableacronymdetection').prop('checked', 'true');
	}
	else {
		$('#enableacronymdetection').removeAttr('checked');
	}
	
	if (madvEnableNumberDecimalDetection == 'true') {
		$('#enablenumberanddecimaldetection').prop('checked', 'true');
	}
	else {
		$('#enablenumberanddecimaldetection').removeAttr('checked');
	}
	
	if (madvDeleteEmptySlides == 'true') {
		$('#deleteemtpyslides').prop('checked', 'true');
	}
	else {
		$('#deleteemtpyslides').removeAttr('checked');
	}
	
	document.getElementById('wpmadjustmentstep').value = madvWPMAdjustmentStep;
	document.getElementById('basicminimumslideduration').value = madvBasicMinimumSlideDuration;
	document.getElementById('wordlengthminimumslideduration').value = madvWordLengthMinimumSlideDuration;
	
	document.getElementById('wordfreqminimumslideduration').value = madvWordFreqMinimumSlideDuration;
	document.getElementById('wordfreqhighestfreqslideduration').value = madvWordFreqHighestFreqSlideDuration;
	document.getElementById('wordfreqlowestfreqslideduration').value = madvWordFreqLowestFreqSlideDuration;
	
	if (madvAlwaysHideFocalGuide == 'true') {
		$('#alwayshidefocalguide').prop('checked', 'true');
	}
	else {
		$('#alwayshidefocalguide').removeAttr('checked');
	}
	
	document.getElementById('optleftmarginpercent').value = madvOptimisedPositionLeftMarginPercent;
	
	if (madvDisplaySentenceWhenPaused == 'true') {
		$('#showsentence').prop('checked', 'true');
	}
	else {
		$('#showsentence').removeAttr('checked');
	}
	
	if (madvAutoHideSentence == 'true') {
		$('#autohidesentence').prop('checked', 'true');
	}
	else {
		$('#autohidesentence').removeAttr('checked');
	}	
	
	if (madvDisplaySentenceTopBorder == 'true') {
		$('#showsentenceborder').prop('checked', 'true');
	}
	else {
		$('#showsentenceborder').removeAttr('checked');
	}
	
	if (madvDisplaySentenceAtReaderOpen == 'true') {
		$('#sentencereaderopen').prop('checked', 'true');
	}
	else {
		$('#sentencereaderopen').removeAttr('checked');
	}
	
	if (madvDisplayProgress == 'true') {
		$('#displayprogress').prop('checked', 'true');
	}
	else {
		$('#displayprogress').removeAttr('checked');
	}
	
	if (madvDisplaySocial == 'true') {
		$('#displaysocial').prop('checked', 'true');
	}
	else {
		$('#displaysocial').removeAttr('checked');
	}
	
	if (madvDisplayWPMSummary == 'true') {
		$('#displaywpmsummary').prop('checked', 'true');
	}
	else {
		$('#displaywpmsummary').removeAttr('checked');
	}
	
	document.getElementById('autohidesentenceseconds').value = madvAutoHideSentenceSeconds;
	document.getElementById('sentencepositionpercentoffset').value = madvSentencePositionPercentOffset;
	document.getElementById('largestepnumberofslides').value = madvLargeStepNumberOfSlides;
	
	if (madvHotkeySelectionEnabled == 'true') {
		$('#enableautotextselection').prop('checked', 'true');
	}
	else {
		$('#enableautotextselection').removeAttr('checked');
	}
	
	if (madvSaveSlidePosition == 'true') {
		$('#saveslideposition').prop('checked', 'true');
	}
	else {
		$('#saveslideposition').removeAttr('checked');
	}
}

document.addEventListener("DOMContentLoaded", init, false);