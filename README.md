# tfs-bug-printer
This Google Chrome extension allows the user to show a HTML **page formatted for print** with data from any _TFS/Azure DevOps Server_ workitems query or a workitem page.

## Features
* Scrum-board friendly format
* Print from query
* Print from workitem page
* Print hierarchical queries (shows item's parent)
* Any text in print view can be live edited
* Individual items in print view can be removed from view

## Supported attributes
### Shown by default
* Work Item Id
* Work Item Title
* Parent Id with Parent Title
* Tags
* Severity
* Effort
* Assignee
* (non-standard) Segment
* (non-standard) SD Code
### Hidden by default
* Work Item Type
* Parent Id
* State

## Instalation
1) Clone repository or _Download as ZIP_ directly from GitHub.
1) Add new extension to Chrome as a folder via sideloading.

## Usage
Just click on the extension's icon in browser's toolbar to toggle view when on a query page or a workitem page.

## Limitations
Extension **can use only data shown on page**! Query must contain all listed attributes, otherwise those omitted attributes won't be shown in the print view.

## Customizations
Visual apperance is controlled exclusively by CSS styles in `content-tfs-print.css`. Items are using CSS Grid for its internal layout, which can be changed easily. Also this way some attributes can hidden or show or entire layout can be reformatted.