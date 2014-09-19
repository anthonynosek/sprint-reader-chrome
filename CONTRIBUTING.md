﻿![Sprint Reader](https://raw.githubusercontent.com/anthonynosek/sprint-reader-chrome/master/src/graphics/icon128.png?raw=true)

# Contributing to the Sprint Reader Project

One of the most awesome things about open source (read: open sauce) projects is that **anyone can contribute code**. We've made the Sprint Reader code base clean and easy to read which we hope will encourage you (a developer) to help us extend the functionality of this already awesome productivity tool.

We want to encourage everyone to submit patches/fixes freely. To help you in that process, there are **several things that you should keep in mind**.

## Use Pull Requests

If you want to submit code, please use a GitHub pull request. This is the fastest way for us to evaluate your code and to merge it into the code base. Please don't file an issue with snippets of code. Doing so means we need to manually merge the changes in. That decreases the likelihood that your code is going to get included in a timely manner. **Please use pull requests**.

##### - Be Clear and Specific #####
It helps us when you communicate with us in a clear and specific manner. Carefully explain what the problem is and how your change fixes it. It’s also helpful to explain how we can recreate the problem you’re seeing. You can also include screenshots to show the tests and improvements that you have done.

##### - Keep Changes Small #####
Keep each pull request related to a single bug/feature only. If you find multiple bugs then please create multiple pull requests.

##### - Stick to Existing Conventions #####
We like the look of our source code and want to keep it that way. Please follow the example coding style we've set in our source code files.

##### - Never Copy-and-Paste Code #####
The point of pull requests is to fix bugs, not to add new ones. Copying and pasting code does nothing but add bugs. Computers can be very finicky about reading the spaces in code, and copy-paste adds new spaces you can’t even see.

## How to Submit a Pull Request ##

We employ the fork and pull method, described below:

> The fork & pull model lets anyone fork an existing repository and push changes to their personal fork without requiring access be granted to the source repository. The changes must then be pulled into the source repository by the project maintainer. This model reduces the amount of friction for new contributors and is popular with open source projects because it allows people to work independently without upfront coordination.

1. Click the “Fork” button to create your personal fork of the Sprint Reader repository.
2. Create a new branch for your new feature or fix. For example: `git checkout -b my-awesome-feature`. A dedicated branch for your pull request means you can develop multiple features at the same time, and ensures your pull request is stable even if you later decide to develop an unrelated feature.
3. Hack, fix and develop awesome new functionality. **Remember:** One (1) feature, fix per pull request.
4. Create unit tests for your new functionality or fix.
4. Complete and submit your pull request!

## What We Do with Pull Requests ##

We'll assess your pull request and **if deemed suitable, awesome or plain brilliant will merge your changes into the main branch**. We'll communicate any questions or queries we have regarding your pull request so you'll be fully informed on its progress.

## Unit Tests ###

You might notice Sprint Reader doesn't contain unit tests at the current time. We'd like to change this (undesirable) situation so if you would like to contribute unit tests please help us out. We'd appreciate it!

## Documentation ##

To contribute new documentation or add examples to the gallery, just edit the [Wiki](https://github.com/anthonynosek/sprint-reader-chrome/wiki)!