chrome.runtime.onInstalled.addListener(function (object) {
    chrome.tabs.create({url: "https://www.slack.com/customize/emoji"}, function (tab) {
        console.log("New tab launched with http://yoursite.com/");
    });
});
