//------------------------------------------------------------------------------
//
// 	SPRINT READER
//	Speed Reading Extension for Google Chrome
//	Copyright (c) 2013-2015, Anthony Nosek
//	https://github.com/anthonynosek/sprint-reader-chrome/blob/master/LICENSE
//
//------------------------------------------------------------------------------

// Did you know?
// These functions display a fun fact about the selected reading speed
var factArray = [];
var strWPM = "##WPM##";
var strDuration = "##DURATION##";
function writeFact(wpm) {
	// Write a fact to the screen
	var min = 0;
	var max = factArray.length-1;
   	var i =  Math.floor(Math.random() * (max - min + 1)) + min;
	var f = factArray[i];
	
	if (f == null) return;
	
	var divFact = document.getElementById('fact');
	var divDisclaimer = document.getElementById('disclaimer');
	divDisclaimer.innerHTML = f.disclaimer;
	var d = "";
		
	// calculate the stats
	var factText = f.fact;
	var words = f.wordcount;
	var duration = f.wordcount/wpm
	
	// Add the WPM (if applicable for the fact)
	factText = factText.replace(strWPM, wpm);
	
	// Less than 3 hours
	if (duration <= 180) {
		d = duration.toFixed() + " minutes";
		factText = factText.replace(strDuration, d);		
		divFact.innerHTML = factText;
		return;	
	}
	
	duration = duration / 60;
	// Less than 48 hours
	if (duration <= 48) {
		d = duration.toFixed() + " hours";
		factText = factText.replace(strDuration, d);		
		divFact.innerHTML = factText;
		return;
	}
	
	duration = duration / 24;
	if (duration <= 370) {
		d = duration.toFixed() + " days";
		factText = factText.replace(strDuration, d);		
		divFact.innerHTML = factText;
		return;
	}
	
	duration = duration / 365;
	d = duration.toFixed() + " years";
	factText = factText.replace(strDuration, d);		
	divFact.innerHTML = factText;
}

function buildFactArray() {
	// Every object has the following properties
	// obj.wordcount
	// obj.fact
	// obj.disclaimer
	
	// Add contents to the fact array that we will use in the program
	var GreatGatsby = {};
	GreatGatsby.wordcount = 47094;
	GreatGatsby.fact = "It would take you approximately <b>" + strDuration + "</b> to read F. Scott Fitzgerald's <b>The Great Gatsby</b> at your current words per minute (WPM)! How does that make you feel?";	
	GreatGatsby.disclaimer = "Disclaimer: This is a true and fun fact."
	factArray.push(GreatGatsby);
	
	var Shaq = {};
	Shaq.wordcount = 0;
	Shaq.fact = "Legendary US basketballer Shaquille O'Neal can read at over <b>2,000 words per minute</b> with up to 85% accuracy using the rapid serial visual presentation (RSVP) method of reading.";	
	Shaq.disclaimer = "Disclaimer: We have no idea if this is true, it's probably false!"
	factArray.push(Shaq);
	
	var Shakespeare = {};
	Shakespeare.wordcount = 884421;
	Shakespeare.fact = "Want to read Shakespeare? How about reading his entire collected works? At <b>" + strWPM + "</b> words per minute you could read the entire collection in <b>" + strDuration + "</b>!";
	Shakespeare.disclaimer = "Disclaimer: This is true, the collected works of Shakespeare comprises 884,421 words.";
	factArray.push(Shakespeare);
	
	var Shakespeare1 = {};
	Shakespeare1.wordcount = 25783;
	Shakespeare1.fact = "At <b>" + strWPM + "</b> words per minute it will take you <b>" + strDuration + "</b> to read <b>Romeo and Juliet</b> by Shakespeare!";
	Shakespeare1.disclaimer = "Disclaimer: True, Romeo and Juliet contains 25,783 words.";
	factArray.push(Shakespeare1);
	
	var WarAndPeace = {};
	WarAndPeace.wordcount = 587287;
	WarAndPeace.fact = "You could read <b>War and Peace</b> from cover to cover in <b>" + strDuration + "</b> at your current reading rate of <b>" + strWPM + "</b> words per minute!";
	WarAndPeace.disclaimer = "Disclaimer: Leo Tolstoy's War and Peace comprises 587,287 words.";
	factArray.push(WarAndPeace);
	
	var CatcherRye = {};
	CatcherRye.wordcount = 73404;
	CatcherRye.fact = "With total book sales of more than 65 million and with over 250,000 copies being sold each year you could read J.D Sallinger's 1951 classic <b>The Catcher in the Rye</b> in <b>" + strDuration + "</b>!";
	CatcherRye.disclaimer = "Disclaimer: The Catcher in the Rye contains 73,404 words.";
	factArray.push(CatcherRye);
	
	var Slaughter = {};
	Slaughter.wordcount = 49459;
	Slaughter.fact = "In <b>" + strDuration + "</b> at your current rate of <b>" + strWPM + "</b> words per minute you could read <b>Slaughterhouse-Five</b> by Kurt Vonnegut.";
	Slaughter.disclaimer = "Disclaimer: Slaughterhouse-Five contains 49,459 words.";
	factArray.push(Slaughter);
	
	var LoastTime = {};
	LoastTime.wordcount = 1200000;
	LoastTime.fact = "Touted as one of the longest novels in existence <b>In Search of Lost Time</b> or <b>Remembrance of Things Past</b> by Marcel Proust contains approx 1.2 million words. At your current reading rate you could finish all 7 volumes in <b>" + strDuration + "</b>. A little long for a relaxing Sunday afternoon read!";
	LoastTime.disclaimer = "Disclaimer: The estimated word count for 'In Search of Lost Time' is ~1,200,000.";
	factArray.push(LoastTime);
	
	var Lightness = {};
	Lightness.wordcount = 85199;
	Lightness.fact = "You could read <b>The Unbearable Lightness of Being</b> by Milan Kundera from cover to cover in <b>" + strDuration + "</b> at your current reading rate of <b>" + strWPM + "</b> words per minute!";
	Lightness.disclaimer = "Disclaimer: The Unbearable Lightness of Being contains 85,199 words.";
	factArray.push(Lightness);
	
	var Nineteen = {};
	Nineteen.wordcount = 88942;
	Nineteen.fact = "You could read <b>Nineteen Eighty-Four</b> by George Orwell from cover to cover in <b>" + strDuration + "</b> at your current reading rate of <b>" + strWPM + "</b> words per minute!";
	Nineteen.disclaimer = "Disclaimer: George Orwell's Nineteen Eighty-Four comprises 88,942 words.";
	factArray.push(Nineteen);
	
	var Lord = {};
	Lord.wordcount = 733023;
	Lord.fact = "Feel like reading a trilogy? At <b>" + strWPM + "</b> words per minute you could read <b>Lord of the Rings</b>, all three books by J. R. R. Tolkien in <b>" + strDuration + "</b>. Now that sounds like a perfect way to relax!";
	Lord.disclaimer = "Disclaimer: For the nerds, The Lord of the Rings – 455,125 words, The Two Towers – 143,436 words and The Return of the King – 134,462 words.";
	factArray.push(Lord);
	
	var Potter = {};
	Potter.wordcount = 1084625;
	Potter.fact = "Attention Harry Potter fans! You could read the entire Harry Potter series (all seven books by J.K. Rowling) in <b>" + strDuration + "</b>. The entire series comprises 1,084,625 words which is a lot of text, luckiliy the story is very enthralling!";
	Potter.disclaimer = "Disclaimer: Book|Words = 1|77,325, 2|84,799, 3|106,821, 4|190,858, 5|257,154, 6|169,441, 7|198,227.";
	factArray.push(Potter);
	
	var OnRoad = {};
	OnRoad.wordcount = 116277;
	OnRoad.fact = "At your current rate of <b>" + strWPM + "</b> words per minute you could read <b>On the Road</b> by Jack Kerouac in <b>" + strDuration + "</b>.";
	OnRoad.disclaimer = "Disclaimer: On the Road contains approx 116,000 words.";
	factArray.push(OnRoad);
	
	var Catch = {};
	Catch.wordcount = 174269;
	Catch.fact = "At your current rate of <b>" + strWPM + "</b> words per minute you could read <b>Catch-22</b> by Joseph Heller in <b>" + strDuration + "</b>.";
	Catch.disclaimer = "Disclaimer: Catch-22 contains 174,269 words.";
	factArray.push(Catch);
	
	var Crime = {};
	Crime.wordcount = 211591;
	Crime.fact = "At your current rate of <b>" + strWPM + "</b> words per minute you could read <b>Crime and Punishment</b> by Fyodor Dostoyevsky in <b>" + strDuration + "</b>.";
	Crime.disclaimer = "Disclaimer: Crime and Punishment contains 211,591 words.";
	factArray.push(Crime);
	
	var TwoCities = {};
	TwoCities.wordcount = 135420;
	TwoCities.fact = "You could read <b>A Tale of Two Cities</b> by Charles Dickens in <b>" + strDuration + "</b>. That's so long as you read at <b>" + strWPM + "</b> words per minute for the whole book!";
	TwoCities.disclaimer = "Disclaimer: A Tale of Two Cities contains 135,420 words.";
	factArray.push(TwoCities);
	
	var Chrurchill = {};
	Chrurchill.wordcount = 0;
	Chrurchill.fact = "Former British prime minister Winston Churchill could read 1600+ words per minute using the rapid serial visualisation presentation method of reading! You are currently reading selected text at <b>" + strWPM + "</b> words per minute.";	
	Chrurchill.disclaimer = "Disclaimer: We have no idea if this is true, it's probably false!"
	factArray.push(Chrurchill);
	
	var Kafka = {};
	Kafka.wordcount = 21810;
	Kafka.fact = "You could read <b>The Metamorphosis</b> by Franz Kafka from cover to cover in <b>" + strDuration + "</b> at your current reading rate of <b>" + strWPM + "</b> words per minute!";
	Kafka.disclaimer = "Disclaimer: The Metamorphosis contains 21,810 words.";
	factArray.push(Kafka);
	
	var Trial = {};
	Trial.wordcount = 84114;
	Trial.fact = "You could read <b>The Trial</b> by Franz Kafka from cover to cover in <b>" + strDuration + "</b> at your current reading rate of <b>" + strWPM + "</b> words per minute!";
	Trial.disclaimer = "Disclaimer: The Trial contains 84,114 words.";
	factArray.push(Trial);
	
	var Ulysses = {};
	Ulysses.wordcount = 264861;
	Ulysses.fact = "You could read <b>Ulysses</b> by James Joyce in <b>" + strDuration + "</b> at your current reading rate of <b>" + strWPM + "</b> words per minute!";
	Ulysses.disclaimer = "Disclaimer: Ulysses contains 264,861 words.";
	factArray.push(Ulysses);
	
	var OldYeller = {};
	OldYeller.wordcount = 35968;
	OldYeller.fact = "<b>Old Yeller</b> is a 1956 children's novel by Fred Gipson. You could read this classic in <b>" + strDuration + "</b> at your current reading rate of <b>" + strWPM + "</b> words per minute!";
	OldYeller.disclaimer = "Disclaimer: Old Yeller contains 35,968 words.";
	factArray.push(OldYeller);
	
	var Scarlet = {};
	Scarlet.wordcount = 63604;
	Scarlet.fact = "<b>The Scarlet Letter</b> is a romantic novel written in 1850 by Nathaniel Hawthorne. At your current reading rate of <b>" + strWPM + "</b> words per minute you could 'absorb' this entire romantic text in <b>" + strDuration + "</b>! Sounds romantic doesn't it?";
	Scarlet.disclaimer = "Disclaimer: The Scarlet Letter contains 63,604 words.";
	factArray.push(Scarlet);
}