Faceloook: Learning User Preferences on Facebook Feeds
======================================================



Faceloook is a browser extension that learns user preference on her/his own Facebook feed. Faceloook uses click events on each posts to distinguish the interesting posts from the others, collecting labels without user’s cognitive effort. Naive Bayes classifier is used to create the user preference model out of contextual features of the posts and the click event labels.

Directory Structure
---
This repository mixes both the Google Chrome extension and the Rails-based Chinese word segmentation web service. The Chrome extension is all within the `extension` directory. Remaining files and directories are the word segmentation service.

References
---
Faceloook is derived from the following projects:

harthur/classifier https://github.com/harthur/classifier
pluskid/RMMSeg http://rmmseg.rubyforge.org/
flot http://code.google.com/p/flot/
