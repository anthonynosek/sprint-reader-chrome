QUnit.test( "engine.js tests", function( assert ) {
	madvEnableSpaceInsertion = 'false';
	splitTextToArray_FirstPass("Wordone.Wordtwo", 1);
	assert.strictEqual(splitTextFirstPass[0].text, "Wordone.Wordtwo", "Tested 'Wordone.Wordtwo' remains as one word when madvEnableSpaceInsertion is false");
	
	madvEnableSpaceInsertion = 'true';
	splitTextToArray_FirstPass("Wordone.Wordtwo", 1);
	assert.strictEqual(splitTextFirstPass[0].text, "Wordone.", "Tested 'Wordone.Wordtwo' is split into two when madvEnableSpaceInsertion (word 1)");
	assert.strictEqual(splitTextFirstPass[1].text, "Wordtwo", "Tested 'Wordone.Wordtwo' is split into two when madvEnableSpaceInsertion (word 2)");
});
