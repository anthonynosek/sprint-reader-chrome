//------------------------------------------------------------------------------
//
// 	SPRINT READER
//	Speed Reading Extension for Google Chrome
//	Copyright (c) 2013-2015, Anthony Nosek
//	https://github.com/anthonynosek/sprint-reader-chrome/blob/master/LICENSE
//
//------------------------------------------------------------------------------

// Google Analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-44625620-1']);
_gaq.push(['_trackPageview']);

(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

// Track button clicks (sent to Google Analytics)
function trackButtonClick(e) {
	_gaq.push(['_trackEvent', e.target.id, 'clicked']);
};

// Track the events associated with saving defaults
function trackSaveDefaults(colorScheme, 
						   font, 
						   fontSize, 
						   WPM, 
						   wordsPerSlide,
						   autoStartReader,
						   autoStartReaderSeconds,
						   autoCloseReader,
						   textOrientationIsRightToLeft,
						   textOrientationAutoDetect) {
	var saved = 'saved';
	// Track the default settings which are saved
	_gaq.push(['_trackEvent', 'Font', saved, font, fontSize, true]);
	_gaq.push(['_trackEvent', 'Colour Scheme', saved, colorScheme, true]);
	_gaq.push(['_trackEvent', 'Words per minute', saved, 'words per minute', WPM, true]);
	_gaq.push(['_trackEvent', 'Words per slide', saved, 'words per slide', wordsPerSlide, true]);
	_gaq.push(['_trackEvent', 'Auto start reader', saved, autoStartReader, autoStartReaderSeconds, true]);
	_gaq.push(['_trackEvent', 'Auto close reader', saved, 'auto close reader', autoCloseReader, true]);
	_gaq.push(['_trackEvent', 'Word right-to-left', saved, 'word right-to-left', textOrientationIsRightToLeft, true]);
	_gaq.push(['_trackEvent', 'Word right-to-left', saved, 'auto-detect', textOrientationAutoDetect, true]);
}

// Track the events associated with saving advanced defaults
function trackSaveAdvancedDefaults(algorithm, 
								   pauseAfterComma, 
								   pauseAfterCommaDelay, 
								   pauseAfterPeriod, 
								   pauseAfterPeriodDelay,
								   pauseAfterParagraph,
								   pauseAfterParagraphDelay,
								   highlightoptimalletter,
								   highlightoptimallettercolour,
								   textposition) {
   	var saved = 'saved';
	// Track the default settings which are saved
	_gaq.push(['_trackEvent', 'Algorithm', saved, algorithm, true]);
	_gaq.push(['_trackEvent', 'Pause after comma', saved, pauseAfterComma, pauseAfterCommaDelay, true]);
	_gaq.push(['_trackEvent', 'Pause after period', saved, pauseAfterPeriod, pauseAfterPeriodDelay, true]);
	_gaq.push(['_trackEvent', 'Pause after paragraph', saved, pauseAfterParagraph, pauseAfterParagraphDelay, true]);
	_gaq.push(['_trackEvent', 'Highlight optimal letter', saved, 'highlight optimal letter', highlightoptimalletter, true]);
	_gaq.push(['_trackEvent', 'Highlight optimal letter colour', saved, 'highlight optimal letter colour', highlightoptimallettercolour, true]);
	_gaq.push(['_trackEvent', 'Text position', saved, 'text position', textposition, true]);
}

// Track the events associated with saving more advanced defaults
function trackSaveMoreAdvancedDefaults(madvStaticFocalUnicodeCharacter, 
									   madvEnableSpaceInsertion, 
									   madvRemoveLastSlideNullOrEmpty,
									   madvEnableHyphenatedWordSplit, 
									   madvConsolidateHyphenatedWord,
									   madvEnableLongWordHyphenation, 
									   madvLongWordTriggerCharacterCount,
									   madvLongWordCharacterPerSlidePostSplit,
									   madvLongWordCharacterTriggerDoNotJoin,
									   madvEnableAcronymDetection,
									   madvEnableNumberDecimalDetection,
									   madvDeleteEmptySlides,
									   madvOptimisedPositionLeftMarginPercent) {
   	var saved = 'saved';
	// Track the default settings which are saved
	_gaq.push(['_trackEvent', 'Satic focal character', saved, 'static focal character', madvStaticFocalUnicodeCharacter, true]);
	_gaq.push(['_trackEvent', 'Enable space insertion', saved, 'enable space insertion', madvEnableSpaceInsertion, true]);
	_gaq.push(['_trackEvent', 'Remove last slide null or empty', saved, 'remove last slide null or empty', madvRemoveLastSlideNullOrEmpty, true]);
	_gaq.push(['_trackEvent', 'Enable hyphenated word split', saved, 'enable hyphenated word split', madvEnableHyphenatedWordSplit, true]);
	_gaq.push(['_trackEvent', 'Consolidate hyphenated word', saved, 'consolidated hyphenated word', madvConsolidateHyphenatedWord, true]);
	_gaq.push(['_trackEvent', 'Enable long word hyphenation', saved, 'enable long word hyphenation', madvEnableLongWordHyphenation, true]);
	_gaq.push(['_trackEvent', 'Long word trigger character count', saved, 'long word trigger character count', madvLongWordTriggerCharacterCount, true]);
	_gaq.push(['_trackEvent', 'Long word character per slide post', saved, 'long word character per slide post', madvLongWordCharacterPerSlidePostSplit, true]);
	_gaq.push(['_trackEvent', 'Long word trigger do not join', saved, 'long word trigger do not join', madvLongWordCharacterTriggerDoNotJoin, true]);
	_gaq.push(['_trackEvent', 'Enable acronym detection', saved, 'Enable acronym detection', madvEnableAcronymDetection, true]);
	_gaq.push(['_trackEvent', 'Enable number decimal detection', saved, 'enable number decimal detection', madvEnableNumberDecimalDetection, true]);
	_gaq.push(['_trackEvent', 'Delete empty slides', saved, 'delete empty slides', madvDeleteEmptySlides, true]);
	_gaq.push(['_trackEvent', 'Optimised position left margin %', saved, 'optimised position left margin %', madvOptimisedPositionLeftMarginPercent, true]);
}

// Track the selected word count
function trackSelectedWordCount(wordcount,
								language,
								displayReaderRightToLeft) {
	_gaq.push(['_trackEvent', 'Selected word count', 'reader opened', 'word count', wordcount, true]);
	_gaq.push(['_trackEvent', 'Selected text', 'language', 'fullname', language.fullname, true]);
	_gaq.push(['_trackEvent', 'Selected text', 'language', 'shortname', language.shortname, true]);
	_gaq.push(['_trackEvent', 'Selected text', 'direction', 'right to left', displayReaderRightToLeft, true]);
}