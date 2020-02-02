//@ts-check
"use strict";

/**
 * @typedef {{
 *  id?: string,
 *  type?: string,
 *  title?: string,
 *  parent?: string,
 *  state?: string,
 *  assignedTo?: string,
 *  tags?: string,
 *  effort?: string,
 * }} WIData
 * 
 * @typedef {{[key: string]: number}} ColumnData
 */

chrome.runtime.onMessage.addListener(message => {
    if (message.type == "TOGGLE_PRINT_VIEW")
        toggleView();
});

function toggleView() {
    document.body.classList.toggle("tfs-print-view");

    if (!document.body.classList.contains("tfs-print-view"))
        return;

    let printContainer = document.querySelector(".tfs-print-view__container");
    if (printContainer) {
        printContainer.innerHTML = "";
    } else {
        printContainer = document.createElement("div");
        printContainer.classList.add("tfs-print-view__container");
        document.body.appendChild(printContainer);
    }

    const workItems = findWorkItems();

    renderWIs(printContainer, workItems);
}

/**
 * @param {Element} printContainer 
 * @param {WIData[]} workItems 
 */
function renderWIs(printContainer, workItems) {
    workItems.forEach(wi => printContainer.appendChild(createWIElement(wi)));
}

/**
 * @param {WIData} data 
 * @returns {Element}
 */
function createWIElement(data) {
    const container = document.createElement("div");
    container.classList.add("tfs-print-item");

    container.appendChild(createWISubElement("parent", data.parent));
    container.appendChild(createWISubElement("id", data.id));
    container.appendChild(createWISubElement("title", data.title));
    container.appendChild(createWISubElement("state", data.state));
    container.appendChild(createWISubElement("tags", data.tags));
    container.appendChild(createWISubElement("type", data.type));
    container.appendChild(createWISubElement("assigned-to", data.assignedTo));
    container.appendChild(createWISubElement("effort", data.effort));

    return container;
}

function createWISubElement(key, data) {
    const item = document.createElement("div");
    item.classList.add(`tfs-print-item__${key}`);
    item.contentEditable = true.toString();
    if (data != null && data !== "" && data !== " " && data !== " ") // last one is &nbsp;
        item.textContent = data;
    return item;
}

/**
 * @returns {WIData[]}
 */
function findWorkItems() {
    const resultsContainer = document.querySelector(".query-results-view-container");
    if (!resultsContainer)
        return [];

    const columns = getColumns(resultsContainer);

    const workItems = [];
    const rows = resultsContainer.querySelectorAll(".grid-row");
    for (const row of rows)
        workItems.push({
            id: getCellValue(row, getColumnIndex(columns, "ID")),
            type: getCellValue(row, getColumnIndex(columns, "Work Item Type")),
            title: getCellValue(row, getColumnIndex(columns, "Title")),
            //parent: getCellValue(row, "System.AsignedTo"),
            state: getCellValue(row, getColumnIndex(columns, "State")),
            assignedTo: getCellValue(row, getColumnIndex(columns, "Asigned To")),
            tags: getCellValue(row, getColumnIndex(columns, "Tags")),
            effort: getCellValue(row, getColumnIndex(columns, "Effort")),
        });

    return workItems;
}

/**
 * @param {Element} resultsContainer 
 * @returns {ColumnData}
 */
function getColumns(resultsContainer) {
    const headerColumns = Array.from(resultsContainer.querySelectorAll(".grid-header-column"));
    return headerColumns.reduce((columns, current, index) => {
        columns[current.getAttribute("aria-label")] = index;
        return columns;
    }, {});
}

/**
 * @param {Element} row 
 * @param {number?} cellIndex 
 */
function getCellValue(row, cellIndex) {
    if (cellIndex == null)
        return "";

    const cell = row.querySelector(`.grid-cell:nth-of-type(${cellIndex + 1})`);
    return cell ? cell.textContent : "";
}

/**
 * @param {ColumnData} columns 
 * @param {string} cellKey 
 * @returns {number?}
 */
function getColumnIndex(columns, cellKey) {
    return columns[cellKey];
}