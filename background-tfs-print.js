//@ts-check
"use strict";

chrome.runtime.onInstalled.addListener(() => {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: { hostPrefix: "tfs" },
            })],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        },{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: { hostEquals: "dev.azure.com" },
            })],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        },{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: { hostSuffix: "visualstudio.com" },
            })],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
        
    });
});

chrome.pageAction.onClicked.addListener(() => {
    chrome.tabs.query({ currentWindow: true, active: true }, (tabArray) => {
        if (tabArray.length === 0) {
            console.error("Unable to find current active window. Print view cannot be toggled.");
            return;
        }
        chrome.tabs.sendMessage(tabArray[0].id, { type: "TOGGLE_PRINT_VIEW" })
    });
});