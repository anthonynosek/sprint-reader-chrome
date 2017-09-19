//------------------------------------------------------------------------------
//
// 	SPRINT READER
//	Speed Reading Extension for Google Chrome
//	Copyright (c) 2013-2015, Anthony Nosek
//	https://github.com/anthonynosek/sprint-reader-chrome/blob/master/LICENSE
//
//------------------------------------------------------------------------------
// User settings
var WPM;
var font;
var fontSize;
var chunkSize;
var autoStart;
var playingText;
var autoStartSeconds;
var autoCloseReader;

// Word arrays and control variables
var wordIndex;
var showSlideTime = 0;
var stopSlideShow = false;

// 0 = predelay
// 1 = text
// 2 = postdelay
var textItemIndex = 0;

// The selectedAlgorithm is set via variable
// For more detailed discussion regarding each algorithm
// please refer to the function header text
//		0 = BASIC 
//		1 = WORDLENGTH
//		2 = WORDFREQ
var selectedAlgorithm = 0;
var selectedAlgorithmName = "basic";

// Additional advanced settings
var pauseAfterComma;
var pauseAfterPeriod;
var pauseAfterParagraph;
var wordFlicker;
var pauseAfterCommaDelay;
var pauseAfterPeriodDelay;
var pauseAfterParagraphDelay;
var wordFlickerPercent;

// Advanced display settings
var highlightOptimalLetter;
var highlightOptimalLetterColour;

// 0 = Centered in reader window
// 1 = Left aligned in reader window
// 2 = Optimal text positioning
// 3 = Optimal text positioning + static focal
var textPosition;

// Text orientation variables
// 	- 	Default (left to right)
//		textOrientationIsRightToLeft = false
var displayReaderRightToLeft = false;
var textOrientationAutoDetect = 'true';
var textOrientationIsRightToLeft = 'false';

// The first pass text array
//		.text							<- text to be displayed
//		.textoriginal					<- the original text in the selected
//		.slidenumber					<- the number of the slide by word
//		.childofprevious				<- indicates if the word is a child of the previous slide

// The second pass text array
//		.text							<- text to be displayed
//		.textoriginal					<- the original text in the selected
//		.slidenumber					<- the number of the slide by word
//		.childofprevious				<- indicates if the word is a child of the previous slide

// The final text array
// 	textArray is a multidimensional array that contains
// 	the following information
//		textArray[0].text 							<- text to be displayed
//		textArray[0].textoriginal					<- the original text in the selection	
//		textArray[0].textforinfo					<- the text the slide used on the info slide			
//		textArray[0].duration 						<- ms for text display
//		textArray[0].predelay						<- ms delay before showing
//		textArray[0].postdelay  					<- ms delay after showing
// 		textArray[0].wpm							<- wpm calculated for text
//		textArray[0].totalwords 					<- total words in display
//		textArray[0].wordsinslide 					<- number of words on slide
//		textArray[0].optimalletterposition			<- the optimal letter position
//		textArray[0].pixeloffsettooptimalletter		<- the number of pixels from the left edge of the word
//													<- to the center of the optimal letter. Used for alignment	
//		textArray[0].hasbeenreversed				<- indicates if the slide has been reversed
//		textArray[0].slidenumber					<- the number of the slide by word		
//		textArray[0].childofprevious				<- indicates if the word is a child of the previous slide																		
var textArray;

// Statistics
var totalWords;

// Variables used in the split algorithm
var splitTextFirstPass;
var splitTextSecondPass;
var indexGlobal;
var exText;

// Slide show data
//		totalDuration;
//		totalDurationIncPauses;
//		totalSegments;
//		minDuration;
//		maxDuration;
//		minSlideDuration;
//		realWPM;
var slideShowData;

// WPM variables to adjust speed on the fly
var WPMAdjusted = 0;
var WPMAdjustedPadding = 0;
var WPMTimingAdjustmentMS = 0;

// --------------------------------------------------
// Return the text array for the passed in algorithm
// Algorithms are explained in more detail above each
// algorithm function. Refer to these for more information
function getTextArray(algorithm, selectedText, chunkSize) {
	var tArray;
	switch(algorithm)
	{
		case 1:
			selectedAlgorithmName = "word length";
	  		tArray = getTextArrayWordLength(selectedText, chunkSize);
			getTextArrayWordLengthTiming(tArray);
			break;
		case 2:
			selectedAlgorithmName = "word frequency";
			tArray = getTextArrayWordFreq(selectedText, chunkSize);
			getTextArrayWordFreqTiming(tArray);
			break;
		default:
			selectedAlgorithmName = "basic";
	  		tArray = getTextArrayBasic(selectedText, chunkSize);
			getTextArrayBasicTiming(tArray);
	}
	
	totalWords = tArray.length;
	displayStatistics(tArray);
	return tArray;
}

// Process the timings for the textArray based on the 
// passed in display algorithm
function getTextArrayTiming(algorithm, textData) {
	switch(algorithm)
	{
		case 1:
			getTextArrayWordLengthTiming(textData);
			break;
		case 2:
			getTextArrayWordFreqTiming(textData);
		default:
			getTextArrayBasicTiming(textData);
	}
	
	displayStatistics(textData);
}

// --------------------------------------------------
// SPLIT SELECTED TEXT ALGORITHM
// This function will split the selected text into
// an array of text. It takes into consideration
// the settings for right-to-left and bottom-to-top

// First pass at the selected text
// Returns a first pass array
function splitTextToArray_FirstPass(selectedText) {
	
	// Text is split in a series of steps and rules
	//
	// STEP 1 -	Add a space character after a seperator character (.,?!:;) that doesn't already have a space.
	// STEP 2 - Split the text by space character. The previous step added spaces and we have naturally occuring spaces between words.
	// STEP 3 - Remove the last array item (slide) if it's blank.
	// STEP 4 - Make corrections for 
	//			1. Hyphenated words
	//			2. Long words
	//			3. Acronyms
	//			4. Numbered lists
	//			5. Numbers displayed with decimal places
	
	splitTextFirstPass = new Array();
			
	// --------------------------------------------------------------------
	// STEP 1
	// 04/03/2014 Anthony Nosek
	// In some instances the split doesn't work if there is
	// no space in between separators. This method manually 
	// adds a space character after a detected separator
	// has no space character
	var spacedText = htmlEntitiesDecode(selectedText);
	if (madvEnableSpaceInsertion == 'true') {
		selectedText = selectedText.replace(/([.,?!:;])(?! )/g, '$1 ');
	}
	spacedText = htmlEntitiesEncode(selectedText);
	
	// --------------------------------------------------------------------
	// STEP 2
	// Split the selected text by single space character
	//console.log(spacedText);	
	var splitText = spacedText.match(/\S+/g);
		
	// --------------------------------------------------------------------
	// STEP 3
	// Remove the last array element if it's blank
	var totalWords = splitText.length;
	if (madvRemoveLastSlideNullOrEmpty == 'true') {
		totalWords = splitText.length;
		if (totalWords > 0 & splitText[totalWords-1] == "") {
			splitText.splice(totalWords-1, 1);
		}
	}
	
	// --------------------------------------------------------------------
	// STEP 4
	// Make corrections for:
	//	1. Hyphenated words
	//	2. Long words
	//	3. Acronyms
	// 	4. Numbered lists
	// 	5. Numbers displayed with decimal places
	indexGlobal = 0;
	splitTextToArray_FirstPass_CleanupLoop(indexGlobal, splitText);	
	
	// Safety Checks
	//console.log(selectedText);
	//console.log(splitText);
	//console.log(splitTextFirstPass);
}

// STEP 4 - The first pass loop
// Loops through the initial split text array for processing
function splitTextToArray_FirstPass_CleanupLoop(index, splitText) {
	// Loop through the array from point i (index)
	for (var i=index, count = splitText.length; i < count; i++) {	
		// Increment the global index
		indexGlobal = i;
		
		// The text from the slide
		var textItemFirst = {};		
		textItemFirst.slidenumber = i + 1;
		textItemFirst.text = splitText[i];
		textItemFirst.childofprevious = false;
		textItemFirst.textoriginal = splitText[i];		

		var textOnSlide = textItemFirst.text;

		if (chunkSize == 1) {
			// --------------------------------------------------------
			// HYPHENATED WORDS
			// We detect hyphenated words and split them according to the hyphen
			if (textOnSlide.indexOf("-") !== -1) {
				if (textOnSlide.length == 1) {
					// Slide is a single hyphen (-)
					splitTextFirstPass.push(textItemFirst);
					continue;
				}
				else {
					// We have detected a hyphen exists before an end of line character
					var lastCharacter = textOnSlide.indexOf("\n");
					if (lastCharacter !== -1 && textOnSlide[textOnSlide.length-1] == "-") {
						if (madvConsolidateHyphenatedWord == 'true') {
							// The last character on the slide is a new line
							// If the word is small enough let's just put the 
							// two words together and drop the hyphen	
							exText = textOnSlide;
							var result = joinHyphenatedWord(i, splitText);
							if (result) {
								// Re-analyse the slide
								i=i-1;
								continue;
							}
						}
					}
					else if (madvEnableHyphenatedWordSplit == 'true') {
						// This is a hyphenated word
						splitHyphenatedWord(i, splitText, textItemFirst);
						i = indexGlobal;
						continue;
					}
				}
			}
			
			// --------------------------------------------------------
			// LONG WORDS
			// We split long words so they're easier to read
			if (madvEnableLongWordHyphenation == 'true') {	
				var textDecoded = htmlEntitiesDecode(textOnSlide);		
				if (textDecoded.length > madvLongWordTriggerCharacterCount) {
					// Split the word using hyphenate and language pattern
					var splitFirst = $().hyphenateWord(textOnSlide, language.pattern, madvLongWordTriggerCharacterCount);
					var splitWord = adjustStringArray(splitFirst, madvLongWordMinCharacterPerSlidePostSplit, madvLongWordTriggerCharacterCount);					
					//console.log(splitFirst);
					//console.log(splitWord);
					
					for (var x=0; x<splitWord.length; x++) {
						var tempText = {};
						tempText.childofprevious = false;
						tempText.slidenumber = textItemFirst.slidenumber;
						tempText.textoriginal = textItemFirst.textoriginal;	
						if (x == splitWord.length-1) {
							// We are at the last character of the split
							var lastTextSegment = splitWord[x];
							if (lastTextSegment.length <= madvLongWordCharacterTriggerDoNotJoin) {
								var lastWord = splitTextFirstPass[splitTextFirstPass.length-1].text;
								splitTextFirstPass[splitTextFirstPass.length-1].text = lastWord.substring(0, lastWord.length-1) + lastTextSegment;
							}
							else {
								tempText.childofprevious = true;
								tempText.text = splitWord[x];
								splitTextFirstPass.push(tempText);
							}
						} 
						else if (x==0){
							tempText.text = splitWord[x] + '-';
							splitTextFirstPass.push(tempText);					
						}
						else {
							tempText.childofprevious = true;
							tempText.text = splitWord[x] + '-';
							splitTextFirstPass.push(tempText);		
						}
					}
					continue;
				}
			}
		}
		
		// --------------------------------------------------------
		// ACRONYM
		// Test for an acronym
		// If the slide ends in a period and contains one other 
		// character which is not a number
		if (madvEnableAcronymDetection == 'true') {
			if (textOnSlide.slice(-1) == '.' && textOnSlide.length >= 2) {
				if (isNaN(textOnSlide[0])) {
					// We have found a slide ending in a period and more than two
					// characters long. Let's test to see if it's an acronym
					exText = textOnSlide;
					recursiveCheckForAcronym(i, splitText);
					// Push the extracted data onto the array
					textItemFirst.text = exText;
					textItemFirst.textforinfo = exText;
					textItemFirst.textoriginal = exText;
					splitTextFirstPass.push(textItemFirst);
					i = indexGlobal;
					continue;			
				}
			}
		}
		
		// --------------------------------------------------------
		// NUMBERED LIST
		// A numbered list such as:
		// 	1. This is item one
		//	2. This is item two etc
		// The slides should display:
		//	1. This --> next slide
		//	2. This --> next slide
		// We look for a new line and then a number and period		
		
		// --------------------------------------------------------
		// NUMBERS AND DECIMALS
		// Clean up for numbers with decimals
		if (madvEnableNumberDecimalDetection == 'true') {
			if (textOnSlide.slice(-1) == '.' || textOnSlide.slice(-1) == ',') {
				// We have found a comma or period. 
				// Check elements for the remainder of the number.				
				exText = textOnSlide;
				recursiveCheckForNumber(i, splitText);
				// Push the extracted data onto the array
				textItemFirst.text = exText;
				textItemFirst.textoriginal = exText;
				splitTextFirstPass.push(textItemFirst);
				i = indexGlobal;
				continue;
			}
		}
		
		// --------------------------------------------------------
		// PUSH THE REMAINDER TO THE ARRAY STACK
		// Add the text to the array
		splitTextFirstPass.push(textItemFirst);
	}
}

// --------------------------------------------------
// Will process the passed in string array and return a
// string array contained within the pased in parameters
function adjustStringArray(stringArray, minCharCountPerItem, maxItemLength) {
	var clean = new Array();
	for (var i=0; i<stringArray.length; i++) {
		var text = stringArray[i];
		var cleanedText = text;
		if (text.length < minCharCountPerItem && i < stringArray.length) {	
			var nextText = "";
			if (typeof(stringArray[i+1]) != 'undefined') nextText = stringArray[i+1];		
			cleanedText = cleanedText + nextText;			
			if (cleanedText.length > maxItemLength) {
				clean.push(text);
				continue;
			}			
			clean.push(cleanedText);
			i = i + 1;
			continue;
		}		
		else {			
			clean.push(cleanedText);
		}
	}
	return clean;
}

// --------------------------------------------------
// Will check for a hyphen to join word
function joinHyphenatedWord(index, splitText) {
	// We have a slide that has a new line at the end
	if (index+1 < splitText.length) {
		var nextWord = splitLength[index+1];
		if (nextWord.indexOf("-") == -1) {
			exText = exText.replace("-/n", nextWord);
		}
		return true;
	}
	else return false;
}

// --------------------------------------------------
// Will check for a hyphen to split word
function splitHyphenatedWord(index, splitText, textItemFirst) {
	// We check for a hyphen (-) with a character on either side
	var text = splitText[index];
	chrRegEx = /[a-z]/i;

	var splitHyphenated = text.split("-").reduce(function(result, current) {
		var previous = result[result.length - 1];
		if (!previous) {
			return result.concat(current);
		}
	
		// Testing for non-numeric 
		if (chrRegEx.test(previous[previous.length-1])) { // && chrRegEx.test(current[0])){
			result = result.concat(current);
		} else {
			result[result.length - 1] += "-" + current;
		}
	
		return result;
	}, []);
	
	// Add the split word to the main text array, adding the hyphen back
	if (splitHyphenated.length > 0) {
		for (var i=0, count = splitHyphenated.length; i < count; i++) {	
			var tempText = {};
			tempText.childofprevious = false;
			if (i > 0) tempText.childofprevious = true;
			tempText.slidenumber = textItemFirst.slidenumber;
			tempText.textoriginal = textItemFirst.textoriginal;	
			// We make adjustments in case the word is hyphenated with only two parts
			// We test for length and put them back together, i.e. co-founder
			if (i==0 && splitHyphenated.length == 2) {
				var combinedLength = splitHyphenated[0].length + splitHyphenated[1].length;
				if (combinedLength <= 12) {
					tempText.text = splitHyphenated[0] + "-" + splitHyphenated[1];
					splitTextFirstPass.push(tempText);
					break;
				}
			}			
			// Add the text item to the final array
			if (i == splitHyphenated.length-1) {
				tempText.text =splitHyphenated[i];
				splitTextFirstPass.push(tempText);
			}
			else {
				tempText.text = splitHyphenated[i] + "-";
				splitTextFirstPass.push(tempText);	
			}
		}
	}
	
	indexGlobal = index;
	index = index+1;		
}

// --------------------------------------------------
// Will check recursively for an acronym
function recursiveCheckForAcronym(index, splitText) {
	indexGlobal = index;
	index = index+1;
	if (index < splitText.length) {
		text = splitText[index];
		//console.log(text);
		if (text.slice(-1) == '.' && text.length >= 2 && isNaN(text[0])) {
			exText = exText + text;
			recursiveCheckForAcronym(index, splitText);
		}
		else if (text.length == 1) {
			// The slide is a single character that is not an I or A
			// This will more than likely be the final character of an acronym
			var containsAbbStartingCharacter = text[0].match('/A|I/i');
			if (containsAbbStartingCharacter == null) {	
				exText = exText + text;	
				indexGlobal = index;
				index = index+1;
			}
		}
	}
}

// --------------------------------------------------
// Will check recursively for a number
function recursiveCheckForNumber(index, splitText) {
	indexGlobal = index;
	index = index+1;	
	if (index < splitText.length) {
		text = splitText[index];
		// Is the first letter of the next word a number?
		if (!isNaN(parseInt(text[0]))) {
			exText = exText + text;
			recursiveCheckForNumber(index, splitText);
		}
	}
}

// --------------------------------------------------
// Second pass at the selected text
// Returns a second pass array
function splitTextToArray_SecondPass() {
	
	// Text is split in a series of steps and rules
	//
	// STEP 1 -	Cycle through the array and do not add any slides that have zero text.
	//			The main slide should always display text. Delays are programmed into 
	//			the pre-post and main slide. If the slide is not displaying text then
	//			we can omit it from the final array.
	//			Also, html encode each slide to ensure all characters are displayed
	
	splitTextSecondPass = new Array();
			
	// --------------------------------------------------------------------
	// STEP 1
	indexGlobal = 0;
	splitTextToArray_SecondPass_CleanupLoop(indexGlobal, splitTextFirstPass);
	
	// Safety Checks
	//console.log(splitTextFirstPass);
	//console.log(splitTextSecondPass);
}

// STEP 1 - The first pass loop
// Loops through the initial split text array for processing
function splitTextToArray_SecondPass_CleanupLoop(index, splitText) {
	// Loop through the array from point i (index)
	for (var i=index, count = splitText.length; i < count; i++) {	
		// Increment the global index
		indexGlobal = i;
		
		// Assign text to variables
		var text = splitText[i].text;
		var textOriginal = splitText[i].textoriginal;
		
		// Check for 
		
		// The text from the slide
		var textItemSecond = {};		
		textItemSecond.slidenumber = i + 1;
		textItemSecond.text = text;
		textItemSecond.textoriginal = textOriginal;
		textItemSecond.childofprevious = splitText[i].childofprevious;
		
		// The text from the slide
		var textOnSlide = splitText[i].text;

		// --------------------------------------------------------
		// EMPTY SLIDES
		if (madvDeleteEmptySlides == 'true') {
			if (textOnSlide) {
				splitTextSecondPass.push(textItemSecond);	
			}			
		} 
		else splitTextSecondPass.push(textItemSecond);
	}	
}

// --------------------------------------------------
// Fix spacings for HTML encoded characters
// Will remove spaces which have been inserted as a result of the 
// ; character. This method searches 
//		&amp; 	→ & (ampersand, U+0026)
//		&lt; 	→ < (less-than sign, U+003C)
//		&gt; 	→ > (greater-than sign, U+003E)
//		&quot; 	→ " (quotation mark, U+0022)
//		&apos; 	→ ' (apostrophe, U+0027)
function fixSpacingsForHTMLEncodedCharacters() {
	// loop through the slides
	for (var i=index, count = splitText.length; i < count; i++) {	
	
	}
}

// --------------------------------------------------
// Add a comma pause after character
function addCommaPauseAfterCharacter(character, text, textItem, splitTextArray) {
	var indexCharacter = text.lastIndexOf(character);
	if (indexCharacter !== -1) {
		// We have the character at the end
		if (indexCharacter == text.length-1) {
			if (pauseAfterComma == 'true') textItem.postdelay = pauseAfterCommaDelay;
			return true;
		}
		// We have the character at the start
		else if (indexCharacter == 0) {
			splitTextArray[splitTextArray.length-1].text = splitTextArray[splitTextArray.length-1].text + ",";
			text = text.slice(1, text.length-1);
			if (pauseAfterComma == 'true') { splitTextArray[splitTextArray.length-1].postdelay = pauseAfterCommaDelay;	}
		}					
	}
	return false;
}

// --------------------------------------------------
// Add a period pause after character
function addPeriodPauseAfterCharacter(character, text, textItem, splitTextArray) {
	var indexCharacter = text.lastIndexOf(character);			
	if (indexCharacter) {
		// We have the character at the end
		if (indexCharacter == text.length-1) {
			if (pauseAfterPeriod == 'true') textItem.postdelay = pauseAfterPeriodDelay;
			return true;
		}
		// We have the character at the start
		else if (indexCharacter == 0) {
			splitTextArray[splitTextArray.length-1].text = splitTextArray[splitTextArray.length-1].text + '.';
			text = text.slice(1, text.length-1);
			if (pauseAfterPeriod == 'true') { splitTextArray[splitTextArray.length-1].postdelay = pauseAfterPeriodDelay;	}
		}
	}
	return false;
}

// --------------------------------------------------
// Add a paragraph pause after character
function addParagraphPauseAfterCharacter(character, text, textItem, splitTextArray) {
	var indexCharacter = text.indexOf(character);
	if (indexCharacter !== -1) {
		// We have the character at the end
		if (indexCharacter == text.length-1) {						
			if (pauseAfterParagraph == 'true') {
				textItem.postdelay = pauseAfterParagraphDelay;
				return true;
			}
		}
		// We have the character at the start
		else if (indexCharacter == 0) {
			if (pauseAfterParagraph == 'true') { splitTextArray[splitTextArray.length-1].postdelay = pauseAfterParagraphDelay;	}
		}
		text = text.trim(character);
	}	
	return false;
}

// --------------------------------------------------
// SPLIT TEXT (BASIC)
// This is the basic split text algorithm.
//
// Text is split by space character and then sorted  
// into chunks based on the chunk size setting.
//
// This function will add required delays after comma
// period and paragraphs if specified by the user
function getTextArrayBasic(selectedText, chunkSize) {

	// An array to store the final display of text items
	var splitTextArray = new Array();
	var slideNumber = 1;

	// Use this to test the splitting algorithm
	// Assign test text to the variable below
	//selectedText = "this-is-hyphenated text - this isn't another-hyphenated-word-1.20";

	splitTextToArray_FirstPass(selectedText);
	splitTextToArray_SecondPass();	
	var splitText = splitTextSecondPass;
	
	var wordsInChunk;
	for (var i=0; i < splitText.length; i++) {		
		var textItem = {};		
		textItem.text = "";	
		textItem.textoriginal = "";		
		textItem.wpm = WPM;
		textItem.predelay = 0;
		textItem.postdelay = 0;
		textItem.slidenumber = 0;
		textItem.wordsinslide = 0;
		textItem.totalwords = totalWords;	
		textItem.hasbeenreversed = false;
		textItem.childofprevious = false;	
		textItem.hyphenatedfrompreviousslide = false;		
				
		for (var j=0; j<chunkSize; j++) {
			if (i+j < splitText.length) {
				
				wordsInChunk = j+1;
				var text = splitText[i+j].text;
				textItem.text = textItem.text + text + " ";
				
				// "" This is a character which looks like no character.
				// As we have done a split of the selected text based on the space character we can
				// assume that this is a new paragraph.
				if (text == "") {
					if (pauseAfterParagraph == 'true') {
						textItem.postdelay = pauseAfterParagraphDelay;
						break;
					}
				}
				
				// Check the last character of the word
				// If a comma, period or paragraph this signifies the start of
				// a new chunk. In this manner comma, sentences and paragraphs are
				// concluded with a pause if the user requests.
				
				// --------------------------
				// COMMA
				var comma = addCommaPauseAfterCharacter(',', text, textItem, splitTextArray);
				if (comma) break;
				
				// SEMI-COLON
				var semi = addCommaPauseAfterCharacter(';', text, textItem, splitTextArray);
				if (semi) break;
				
				// COLON
				var colon = addCommaPauseAfterCharacter(':', text, textItem, splitTextArray);
				if (colon) break;
				
				// --------------------------
				// PERIOD (Period .)
				var period = addPeriodPauseAfterCharacter('.', text, textItem, splitTextArray);
				if (period) break;
				
				// QUESTION MARK (Period ?)
				var question = addPeriodPauseAfterCharacter('?', text, textItem, splitTextArray);
				if (question) break;
				
				// APOSTROPHE (Period !)
				var apostrophe = addPeriodPauseAfterCharacter('!', text, textItem, splitTextArray);
				if (apostrophe) break;
				
				// --------------------------
				// PARAGRAPH
				var paragraph = addParagraphPauseAfterCharacter("\r\n", text, textItem, splitTextArray);
				if (paragraph) break;

				// NEW LINE
				var newLine = addParagraphPauseAfterCharacter("\n", text, textItem, splitTextArray);
				if (newLine) break;													
			}
		}

		textItem.wordsinslide = wordsInChunk;
		textItem.text = $.trim(textItem.text);
				
		textItem.textforinfo = splitText[i].textoriginal;
		textItem.textoriginal = splitText[i].textoriginal;	
		textItem.childofprevious = splitText[i].childofprevious;		
				
		if (textItem.childofprevious) textItem.slidenumber = slideNumber - 1;
		else {
			textItem.slidenumber = slideNumber;
			slideNumber = slideNumber + 1;
		}

		// -------------------------------------
		// Assign the optimal letter position
		textItem.optimalletterposition = assignOptimalLetterPosition(textItem);
				
		// Add a static focal if required
		if (textPosition == 3) addStaticFocalToTextItem(textItem, false);
		
		// Assign the optimal pixel offset
		textItem.pixeloffsettooptimalletter = calculatePixelOffsetToOptimalCenter(textItem);

		// Enable this to get a log of the textItem
		//console.log("text: " + textItem.text + " (" + textItem.predelay + ", " + textItem.postdelay + ") OLP: " + textItem.optimalletterposition);
		//console.log(textItem.text);
		
		// Add the text item to the text array
		splitTextArray.push(textItem);		
		
		i = i + wordsInChunk - 1;
	}
	
	// Remove the final post-delay on the final slide as this will result in a blank screen
	if (splitTextArray.length > 0) {
		var slide = splitTextArray[splitTextArray.length-1];
		slide.postdelay = 0;
	}
		
	return splitTextArray;
}

// Sets the individual timing for the selected text array
// based on the words per minute (WPM) setting
function getTextArrayBasicTiming(textData) {
	// Bail if we don't have a textArray
	if (textData == null || textData.length <= 0) return;
	
	// Set the timing based on the WPM
	// Basic algoritm all text items have
	// the same timing based on the following
	var duration = 1 / (WPM / 60) * 1000;
	
	for (var i = 0; i < textData.length; i++) {
		var t = textData[i];
		var wordsinslide = t.wordsinslide;
    	t.duration = duration * wordsinslide;		
		// Ensure we observe the minimum slide duration setting
		if (t.duration < madvBasicMinimumSlideDuration) t.duration = madvBasicMinimumSlideDuration;		
		// Enable this to get a log of the textItem
		//console.log("text: " + t.text + " (" + t.predelay + ", " + t.duration + ", " + t.postdelay + ") words: " + t.wordsinslide);
	}
}

// --------------------------------------------------
// SPLIT TEXT (WORD LENGTH)
// This is the word length split text algorithm.
//
// Text is split by space character and then sorted  
// into chunks based on the chunk size setting.
//
function getTextArrayWordLength(selectedText, chunkSize) {
	// The text is split using the basic algorithm which
	return getTextArrayBasic(selectedText, chunkSize);
}

// Sets the individual timing for the selected text array
// based on the words per minute (WPM) setting
function getTextArrayWordLengthTiming(textData) {
	// Bail if we don't have a textArray
	if (textData == null || textData.length <= 0) return;
	
	// Timing is based on the WPM setting and the length of the word
	var totalSegments = textData.length;
	
	// Calculate the approx duration of the text display in ms
	var totalDuration = (totalSegments / WPM) * 60000;
	
	// Get the total length of the text
	var totalLength = 0;
	for (var i = 0; i < textData.length; i++) {
    	totalLength = totalLength + textData[i].text.length;
	}
	
	// Calculate the perLetter time
	var unitTime = totalDuration / totalLength;

	// Set the individual timing based on the length of the word
	for (var i = 0; i < textData.length; i++) {
		var t = textData[i];
    	t.duration = unitTime * t.text.length;
		// Ensure we observe the minimum slide duration setting
		if (t.duration < madvWordLengthMinimumSlideDuration) t.duration = madvWordLengthMinimumSlideDuration;	
		// Enable this to get a log of the textItem
		//console.log("text: " + textData[i].text + " (" + textData[i].predelay + ", " + textData[i].duration + ", " + textData[i].postdelay + ")");
	}
}

// --------------------------------------------------
// SPLIT TEXT (WORD FREQ)
// This is the word freq split text algorithm.
//
// Text is split by space character and then sorted  
// into chunks based on the chunk size setting.
//
function getTextArrayWordFreq(selectedText, chunkSize) {
	// The text is split using the basic algorithm which
	return getTextArrayBasic(selectedText, chunkSize);
}

// Sets the individual timing for the selected text array based on Information Theory.
// This works based on how much of a surprise (information content) it is for the reader
// to encounter a certain word/phrase in the sentence. For simplicity, we assume the given context/sentence has
// the same probability model as in the "wordfrequency-en-US.js" file, which is based on movie subtitles. We do this
// since that is the data we have to work with.
// Notes:
// 1. Currently, only 1 word slides are supported. This is because the probability data we have pertains to single words.
//    Joint probabilities can be calculate as a simple extension of this for segments (=phrases=multi word slides).
//    The best would be to have a multi-word phrase database, for more a accurate probability model for segments.
//    P('word1 word2') approx= P('word1')*P('word2') =>
//    shannonInfo('word1 word2') approx= shannonInfo('word1') + shannonInfo('word2')
// 
// 2. Only en-US is currently supported. More languages would require more databases.
// 
// 3. A subtle point is that of case sensitivity. This IS case-sensitive on purpose. The assumption
//    is that the brain reads 'I' faster than 'i', since 'I' is more commonly encountered. The database
//    reflects this, by using the most common letter casing in it. This means, for example, 'i' would be treated
//    as an unknown word, and so will be displayed for a longer period of time, while 'I' will appear
//    for a very short period of time. Also, 'This' will appear for longer, while 'this' will be fast. But
//    note that 'Maybe' is more common, and so will be fast, while 'maybe' is less common and so will be displayed
//    longer. Check the 'wordfrequency-en-US.js' file compiled from its underlying database source at:
//    http://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexus/subtlexus2.zip
// 
// 4. The Shannon information calculation should be moved into the 'wordfrequency-en-US.js' file, to save the
//    machine from having to calculate them each time.
// 
// 5. In the future, different contexts can be used as if they are refined languages, and refined
//    probability model databases can be used to reflect that difference.
// 
// 6. Duration smoothing should be experimented with. This means smoothing/anti-aliasing the following function:
//    slideDuration(slide #)
//    This might help the brain anticipate the amount of time between successive words in a sentence.
// Author: Nir (geb-braid @ github.com)
// 
function getTextArrayWordFreqTiming(textData) {
	// Bail if we don't have a textArray
	if (textData == null || textData.length <= 0) return;
	
	// Set the individual timing based on the Shannon information content of the word
	for (var i = 0; i < textData.length; i++) {
		var t = textData[i];
		bitsOfInformation = -Math.log2(wordProbability[t.text]); // the Shannon information content definition
		
		// linear interpolation: 4.5 bits -> durShort msec, 25.6 bits -> durLong msec
		var lowInfo = 4.5; var highInfo = 25.6; // this numbers are empirical and are taken from the en-US database.	
		var durShort = madvWordFreqHighestFreqSlideDuration; 
		var durLong = madvWordFreqLowestFreqSlideDuration;
		
		var a = (durLong - durShort)/(highInfo - lowInfo);
		var b = durShort - lowInfo*a;
		
		if (!bitsOfInformation) bitsOfInformation = highInfo; // the maximum
		
		t.duration = a * bitsOfInformation + b; // Linear interpolation. Note: this means WPM setting has no role in this algorithm.
		
		// Ensure we observe the minimum slide duration setting
		if (t.duration < madvWordFreqMinimumSlideDuration) t.duration = madvWordFreqMinimumSlideDuration;
		
		// Enable this to get a log of the textItem
		//console.log("text: " + textData[i].text + " (" + textData[i].predelay + ", " + textData[i].duration + ", " + textData[i].postdelay + ")");
	}
}

// --------------------------------------------------
// This is the recursive function that will play the slideshow
function playSlideShow() {

	// Set the playing text flag
	playingText = true;

	// TEXT SLIDE
	if (textItemIndex == 1) {			
		// Determine where we are in the textArray
		// and print, stop, reset accordingly
		if (wordIndex >= textArray.length) {			
			divPlay.innerHTML = strRestart;
			document.getElementById('menuPlayPause').innerHTML = strPlay + " (SPACE)";
			stopSlideShow = true;
			playingText = false;
			setProgress(100);
			return;
		}
		else {
			showSlideTime = Math.max(1, textArray[wordIndex].duration + WPMTimingAdjustmentMS);
			// Set the progress
			var p = Math.round((wordIndex / textArray.length) * 100);
			setProgress(p);		
			// Display the word
			displayWord(textArray[wordIndex]);			
			// Increment to post-delay (this slide)
			if (wordIndex < textArray.length) {
				textItemIndex = 2;
			}
		}		
	}
	
	// PRE DELAY SLIDE
	// Display blank word for predelay (if timing requires)
	else if (textItemIndex == 0) {
		// Shut down the loop if we are at the end of the text array
		if (wordIndex >= textArray.length) {
			textItemIndex = 1;
			playSlideShow();
			return;
		}
		showSlideTime = textArray[wordIndex].predelay;		
		if (showSlideTime > 0) {
			displayBlankWord();
		}
		// Increment to slide text
		textItemIndex = 1;
	}
		
	// POST DELAY SLIDE
	// Display blank word for postdelay (if timing requires)
	else if (textItemIndex == 2) {
		showSlideTime = textArray[wordIndex].postdelay;		
		if (showSlideTime > 0) {
			displayBlankWord();
		}
		// Increment to slide pre delay
		textItemIndex = 0;
		// Progress the wordIndex because we are at the end of the slide
		wordIndex = wordIndex + 1;
		// If we are at the end of the text selection
		// the window can be autoclosed if we are at the end
		if (autoCloseReader == 'true') doWeAutoCloseReader();
	}

	// Determine if we stop the recursive loop
    if (!stopSlideShow) {
		//console.log("Slide delay: " + showSlideTime + " - textItemIndex: " + textItemIndex-1);
		if (wordFlicker == 'true') {
			{ setTimeout(function() { displayBlankWord(); }, showSlideTime * (100 - wordFlickerPercent) / 100); }
		}
    	{ setTimeout(function() { playSlideShow() }, showSlideTime); }
	}
	else {
		//console.log("stop command received");
		playingText = false;	
	}
}

// --------------------------------------------------
// This function will display a blank word on the display
function displayBlankWord() {
	divWord.innerHTML = " ";
	
	var orient = 'left';
	if (displayReaderRightToLeft) orient = 'right';
	
	$( "#word-container").css('padding-left', "0px");
	$( "#word-container").css('padding-right', "0px");
	$( "#word-container").css('margin-left', "0");
	$( "#word-container").css('margin-right', "0");
		
	// Optimal positioning + static focal
	// If the user has selected a static focal we should
	// display the static focal on the slide
	if (textPosition == 3) {
		divWord.innerHTML = focalCharacter;
		
		var dummyTextItem = {};
		dummyTextItem.text = focalCharacter;
		dummyTextItem.optimalletterposition = 1;
		
		var px = calculatePixelOffsetToOptimalCenter(dummyTextItem);
		var offset = leftPaddingBorderOptimised - px;

		$( "#word-container").css('padding-' + orient, offset + "px");
		$( "#word-container").css('margin-' + orient, "0");
		
		highlightTheOptimalLetter(dummyTextItem);
	}
	else {
		$( "#word-container").css('margin-left', "auto");	
		$( "#word-container").css('margin-right', "auto");
	}
}

// This function will display the word on the display
function displayWord(textItem) {	
	
	// Reverse the number section if applicable
	doWeReverseSlide(textItem);
		
	// 1. Display the word
	divWord.innerHTML = htmlEntitiesDecode(textItem.text);
	
	// 2. Abort conditions
	// 	  Do not do any extra processing
	if (textItem.text.length == 0) return;

	// 3. Letter highlighting
	highlightTheOptimalLetter(textItem);
	
	// 4. Optimal positioning
	//    - Optimal positioning
	//	  - Optimal positioning + static focal
	setWordLeftPadding(textItem);
}

// --------------------------------------------------
// Align the word left-padding
function setWordLeftPadding(textItem) {
	
	var orient = 'left';
	if (displayReaderRightToLeft) orient = 'right';
	
	$( "#word-container").css('padding-left', "0px");
	$( "#word-container").css('padding-right', "0px");
	$( "#word-container").css('margin-left', "0");
	$( "#word-container").css('margin-right', "0");
		
	if (textPosition == 2 || textPosition == 3) {		
		// The pixel offset from the left edge is provided
		// in the textItem property pixeloffsettooptimalletter
		var px = textItem.pixeloffsettooptimalletter;
		if (textItem.pixeloffsettooptimalletter <= 0) {
			px = calculatePixelOffsetToOptimalCenter(textItem);			
		}
		var offset = leftPaddingBorderOptimised - px;
		$( "#word-container").css('padding-' + orient, offset + "px");
		$( "#word-container").css('margin-' + orient, "0");
	}
	else {
		$( "#word-container").css('margin-left', "auto");
		$( "#word-container").css('margin-right', "auto");
	}
}

// --------------------------------------------------
// Do we reverse the slide because it contains a number
function doWeReverseSlide(textItem) {
	// If the slide has already been processed do not repeat
	if (textItem.hasbeenreversed) return;
	// Always return false if the text is left-to-right
	if (!displayReaderRightToLeft) return;

	// Does the slide contain at least one character
	var hasNumbers = /\d/.test(textItem.textoriginal);
	if (!hasNumbers) return;
	
	//  Contains a number whereby we need to reverse a segment
	//	This RegEx looks for numbers with decimals, currencies, percentages
	var result = textItem.textoriginal.replace(/\$?[0-9]+(\.[0-9]+\,[0-9]+)?%?/g, function(s) { 
		return reverseString(s); 
	})
	
	// Assign the reversed string
	textItem.text = result;
	
	// Flag the slide as processed
	textItem.hasbeenreversed = true;

	// At this point any number in the slide has been reversed so it will
	// display correctly with the CSS 'direction' attribute = right-to-left (rtl)

	// For the optimal plus static focal positioning model
	// we need to add the static focal character to the slide
	
	//console.log('original text ' + textItem.textoriginal);
	//console.log('processed text ' + textItem.text);
	
	// Optimal positioning and static focal
	if (textPosition == 3) {
		addStaticFocalToTextItem(textItem, true);		
	}
	
	// Set the pixel offset for the slide
	textItem.pixeloffsettooptimalletter = calculatePixelOffsetToOptimalCenter(textItem, true);
}

// --------------------------------------------------
// Highlight the optimal letter
function highlightTheOptimalLetter(textItem) {
	// Wrap in individual span (for fine-tuning adjustment)	
	if (chunkSize > 1 && !displayReaderRightToLeft) {
		// Do not apply lettering when displaying more than 1 word
		// and the text is left to right. This ensures that spaces
		// are respected between words.	
	}
	else {
		// Apply lettering only in the following circumstances
		//  - Chunk size = 1 OR
		//  - Chunk size > 1 AND word right to left
		$("#word").lettering();
		$("[class^=char]").attr('id', 'letterChar');
	}
	
	// Letter highlighting is only applied when chunking
	// a single word per slide and the option is set
	if (highlightOptimalLetter == 'true' && chunkSize == 1) {			
		// Adjust the optimal letter for text direction
		var letterPosition = textItem.optimalletterposition;
		if (textItem.hasbeenreversed) {
			var newPosition = textItem.optimalletterposition - 1;	
			if (newPosition >= 1) letterPosition = newPosition;
		}
		// Colour the Nth letter of the word		
		var charClass = ".char" + letterPosition;
		$(charClass).css('color', highlightOptimalLetterColour);
	}	
}

// --------------------------------------------------
// Assigns the optimal letter position in the word
// This is used to colour the optimal letter in the word
// to aid with comprehension
//
// Function will return the optimal letter position
// 1 based index of characters in the word
function assignOptimalLetterPosition(textItem) {
	// This algroithm will determine the letter based on word length
	var length = textItem.text.length;
	var position = 0;

	if (length == 1) position = 1;
	else if (length >= 1 && length <= 4) position = 2;
	else if (length >= 5 && length <= 9) position = 3;
	else position = 4;
		
	return position;
}

// --------------------------------------------------
// Calculates the pixel offset from the left edge of the word to the 
// centre of the optimal letter which has been determined by the algorithm.
function calculatePixelOffsetToOptimalCenter(textItem, isRightToLeft) {
	var ftUsed = font;
	var ftSize = fontSize;
	
	var canvas = document.getElementById('word-canvas');
   	var context = canvas.getContext('2d');
	context.font = ftSize + "px " + ftUsed;
	
	var index = textItem.optimalletterposition-1;
	var wordToOptimalStart = "";
	var wordOptimalLetter = "";
	var text = textItem.text;
	var length = textItem.text.length;
	
	if (length > 0) {
		if (index >= 0) {
			if (isRightToLeft) {
				wordToOptimalStart = textItem.text.substring(0, index-1);
			}
			else {
				wordToOptimalStart = textItem.text.substring(0, index);
			}
		}
		
		if (textItem.text.length == 1) {
			wordOptimalLetter = textItem.text;
		}
		else {
			if (isRightToLeft) {
				wordOptimalLetter = textItem.text.substring(index,index-1);
			}
			else {
				wordOptimalLetter = textItem.text.substring(index,index+1);
			}
		}
	}

	var pxToOptimalStart = context.measureText(wordToOptimalStart).width;
	var pxOptimalLetter = context.measureText(wordOptimalLetter).width;
	var pxOffset = pxToOptimalStart + (pxOptimalLetter/2);
	
	//console.log('wordToOptimalStart ' + wordToOptimalStart);
	//console.log('wordOptimalLetter ' + wordOptimalLetter);
	//console.log("pxOptimalLetter " + pxOptimalLetter);
	//console.log("pxToOptimalStart " + pxToOptimalStart);
	//console.log("Word: " + textItem.text + " Optimal Letter: " + textItem.optimalletterposition + " Pixel Offset: " + pxOffset);
	
	return pxOffset;
}

// --------------------------------------------------
// This function will add a static focal character at the optimal letter
// position. This adds an extra character to the displayed word
function addStaticFocalToTextItem(textItem, isRightToLeft) {	
	var text = textItem.text;	
	
	// focal character has already been set in reader.js at init()
	if (isRightToLeft) {
		var sub1 = text.substring(0, text.length - textItem.optimalletterposition);
		var sub2 = text.substring(text.length - textItem.optimalletterposition, text.length);
		textItem.optimalletterposition = textItem.optimalletterposition - 1;
	}
	else {
		var sub1 = text.substring(0, textItem.optimalletterposition);
		var sub2 = text.substring(textItem.optimalletterposition, text.length);
		textItem.optimalletterposition = textItem.optimalletterposition + 1;
	}
	
	textItem.text = sub1 + focalCharacter + sub2;
}

// --------------------------------------------------
// Display the word which is currently indexed (pointed to)
function getWord() {
	textItemIndex = 1;
	stopSlideShow = true;
	playingText = false;
	playSlideShow();
	//displayWord(textArray[wordIndex]);
	
	if (isEmpty($('#word'))) {
		textItemIndex = 1;
  		displayWord(textArray[wordIndex]);
	}
}

// --------------------------------------------------
// Set slide show data
//		totalDuration;
//		totalDurationIncPauses;
//		totalSegments;
//		minDuration;
//		maxDuration;
//		minSlideDuration;
//		realWPM;
//		realWPMAllPauses;
function setSlideShowData(textData) {
	slideShowData = {};
	
	slideShowData.totalDuration = 0;
	slideShowData.totalDurationIncPauses = 0;
	slideShowData.totalSegments = textData.length;
	slideShowData.minDuration = textData[0].duration;
	slideShowData.maxDuration = textData[0].duration;
	
	for (var i = 0; i < textData.length; i++) {
		var d = textData[i].duration;
		var pd1 = textData[i].predelay;
		var pd2 = textData[i].postdelay;
    	if (d < slideShowData.minDuration) slideShowData.minDuration = d;
		if (d > slideShowData.maxDuration) slideShowData.maxDuration = d;
		slideShowData.totalDuration = slideShowData.totalDuration + d;
		slideShowData.totalDurationIncPauses = slideShowData.totalDurationIncPauses + d + pd1 + pd2;
	}
	
	// Adjust the data for WPM adjustments
	var totalAdjustedTiming = WPMTimingAdjustmentMS * textData.length;
	slideShowData.totalDuration = slideShowData.totalDuration + totalAdjustedTiming;
	slideShowData.totalDurationIncPauses = slideShowData.totalDurationIncPauses + totalAdjustedTiming;
	
	slideShowData.realWPM = (textData.length / (slideShowData.totalDuration/1000/60)).toFixed();
	slideShowData.realWPMAllPauses = (textData.length / (slideShowData.totalDurationIncPauses/1000/60)).toFixed();
	
	slideShowData.avgDuration = slideShowData.totalDuration / slideShowData.totalSegments;
	
	//console.log('WPM: ' + WPM);
	//console.log('WPM (Real): ' + slideShowData.realWPM);
	//console.log('WPM (All): ' + slideShowData.realWPMAllPauses);
}

// --------------------------------------------------
// Calculate statistics to display to the user
function displayStatistics(textData) {
	// Set the slide show data
	setSlideShowData(textData);	
	// temp variable
	var s = slideShowData;
	// Add the statistics to the final HTML
	document.getElementById('stattotalwords')
		.innerHTML = "Total words: <b>" + totalWords + "</b>";
	document.getElementById('stattotalsegments')
		.innerHTML = "Total segments (slides): <b>" + s.totalSegments + "</b>";
	document.getElementById('statmaxduration')
		.innerHTML = "Maximum slide duration: <b>" + s.maxDuration.toFixed() + "ms</b> (" + getMinAndSecondsString(s.maxDuration) + ")";
	document.getElementById('statminduration')
		.innerHTML = "Minimum slide duration: <b>" + s.minDuration.toFixed() + "ms</b> (" + getMinAndSecondsString(s.minDuration) + ")";
	document.getElementById('statavgperslide')
		.innerHTML = "Average slide duration: <b>" + s.avgDuration.toFixed() + "ms</b> (" + getMinAndSecondsString(s.avgDuration) + ")";
	document.getElementById('statchunksize')
		.innerHTML = "Chunk size (words per slide): <b>" + chunkSize + "</b>";
	document.getElementById('statwpm')
		.innerHTML = "Words per minute (WPM): <b>" + WPM + "</b>";
	document.getElementById('stattotaldurationincpause')
		.innerHTML = "Total duration (including pauses): <b>" + s.totalDurationIncPauses.toFixed() + "ms</b> (" + getMinAndSecondsString(s.totalDurationIncPauses) + ")";
	document.getElementById('stattotalduration')
		.innerHTML = "Total duration: <b>" + s.totalDuration.toFixed() + "ms</b> (" + getMinAndSecondsString(s.totalDuration) + ")";
}

// --------------------------------------------------
// Return a string representing the minutes and seconds
function getMinAndSecondsString(milliseconds) {
	var ms = milliseconds.toFixed();
	var minFull = (ms/1000)/60;
	var minutes = Math.floor(minFull);
	var seconds = ((minFull - minutes) * 60).toFixed();
	
	if (minutes <= 0 && seconds <= 0) return "less than 1 second";
	else return "~" + minutes + "min " + seconds + "sec";
}

// --------------------------------------------------
// Check the element for empty trimming for spaces
function isEmpty( el ){
	return !$.trim(el.innerHTML())
}

// --------------------------------------------------
// Adjust the WPM timing based on the user specified amount
// 		WPMAdjusted
//		WPMAdjustedPadding
//		WPMTimingAdjustmentMS
function adjustWPM(adjustmentAmount) {
	var newPadding = WPMAdjustedPadding + adjustmentAmount;
	var newWPM = Math.max(30, WPM + newPadding);
	if (newWPM == 30) newPadding = WPMAdjustedPadding;
	
	var origTiming = 60000/WPM;
	var newTiming = 60000/newWPM;
	var newTimingAdjustment = newTiming - origTiming;
	
	//console.log('WPM Padding: ' + newPadding + ' | WPM: ' + newWPM + ' | Timing Adjustment: ' + newTimingAdjustment);
	
	WPMTimingAdjustmentMS = newTimingAdjustment;
	WPMAdjustedPadding = newPadding;
	WPMAdjusted = newWPM;

	setSlideShowData(textArray);	
	displayStatusData();
}