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

    chrome.pageAction.onClicked.addListener(() => {
        chrome.tabs.executeScript({
            file: "content-mw-print.js"
        });
        chrome.tabs.insertCSS({
            file: "content-mw-print.css"
        });
    });
});