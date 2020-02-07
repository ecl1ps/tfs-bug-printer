//@ts-check
"use strict";

/**
 * @typedef {{
 *  id?: string,
 *  type?: string,
 *  title?: string,
 *  parent?: string,
 *  parentWithTitle?: string,
 *  state?: string,
 *  assignedTo?: string,
 *  tags?: string,
 *  effort?: string,
 *  severity?: string,
 *  segment?: string,
 *  sd?: string,
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
    if (!workItems) {
        console.warn("[TFS Bug Printer] No workitems found.")
        return;
    }

    console.info("[TFS Bug Printer] Found workitems: ", workItems);

    renderWIs(printContainer, workItems);
}

/**
 * @param {Element} printContainer 
 * @param {WIData[]} workItems 
 */
function renderWIs(printContainer, workItems) {
    workItems.forEach(wi => printContainer.appendChild(createDeleteElement(createWIElement(wi))));
}

/**
 * @param {WIData} data 
 * @returns {Element}
 */
function createWIElement(data) {
    const container = document.createElement("div");
    container.classList.add("tfs-print-item");

    container.appendChild(createWISubElement("parent", data.parent));
    container.appendChild(createWISubElement("parent-with-title", data.parentWithTitle));
    container.appendChild(createWISubElement("id", data.id));
    container.appendChild(createWISubElement("title", data.title));
    container.appendChild(createWISubElement("type", data.type));
    container.appendChild(createWISubElement("tags", data.tags));
    container.appendChild(createWISubElement("effort", data.effort));
    container.appendChild(createWISubElement("severity", data.severity));
    container.appendChild(createWISubElement("assigned-to", data.assignedTo));
    container.appendChild(createWISubElement("state", data.state));
    container.appendChild(createWISubElement("segment", data.segment));
    container.appendChild(createWISubElement("sd", data.sd));

    return container;
}

/**
 * @param {string} key 
 * @param {string?} data 
 * @returns {Element}
 */
function createWISubElement(key, data) {
    const item = document.createElement("div");
    item.classList.add(`tfs-print-item__${key}`);
    item.contentEditable = true.toString();
    if (!isNullOrEmptyOrWhitespace(data))
        item.textContent = data;
    return item;
}

/**
 * @param {string | null | undefined} data 
 * @returns {boolean}
 */
function isNullOrEmptyOrWhitespace(data) {
    return !(data != null && data !== "" && data !== " " && data !== String.fromCharCode(160)); // the last one is &nbsp;
}
/**
 * @param {Element} wrappedElement 
 * @returns {Element}
 */
function createDeleteElement(wrappedElement) {
    const wrapper = document.createElement("div");
    wrapper.classList.add(`tfs-print-item__wrapper`);
    wrapper.appendChild(wrappedElement);

    const deleteElement = document.createElement("div");
    deleteElement.classList.add(`tfs-print-item__delete-button`);
    deleteElement.addEventListener("click", () => wrapper.remove());
    wrapper.appendChild(deleteElement);

    return wrapper;
}

/**
 * @returns {WIData[] | null}
 */
function findWorkItems() {
    if (findQueryResultContainerElement())
        return findWorkItemsFromQuery();
    if (findWorkItemContainerElement())
        return findWorkItemsFromWorkItemPage();
    return null;
}


/**
 * @returns {WIData[]}
 */
function findWorkItemsFromQuery() {
    const resultsContainer = findQueryResultContainerElement();
    if (!resultsContainer)
        return [];

    const columns = getColumns(resultsContainer);

    const workItems = [];
    const levels = new Map();

    const rows = resultsContainer.querySelectorAll(".grid-row");
    for (const row of rows) {
        const level = parseInt(row.getAttribute("aria-level"));
        const id = parseInt(getCellValue(row, getColumnIndex(columns, "ID")));
        const title = getCellValue(row, getColumnIndex(columns, "Title"));
        let parent = null;
        if (level > 1)
            parent = levels.get(level - 1);
        levels.set(level, { id, title });

        workItems.push({
            id: id.toString(),
            parent: parent ? parent.id : null,
            parentWithTitle: parent ? `${parent.id} - ${parent.title}` : null,
            title: title,
            type: getCellValue(row, getColumnIndex(columns, "Work Item Type")),
            state: getCellValue(row, getColumnIndex(columns, "State")),
            assignedTo: getCellValue(row, getColumnIndex(columns, "Assigned To")),
            tags: getCellValue(row, getColumnIndex(columns, "Tags"), cell => {
                const tagCell = cell.querySelector(".tags-items-container");
                return tagCell ? tagCell.getAttribute("aria-label") : "";
            }),
            effort: getCellValue(row, getColumnIndex(columns, "Effort")) || getCellValue(row, getColumnIndex(columns, "Remaining Work")),
            severity: getCellValue(row, getColumnIndex(columns, "Severity")),
            segment: getCellValue(row, getColumnIndex(columns, "Segment")),
            sd: getCellValue(row, getColumnIndex(columns, "SDCode")),
        });
    }

    return workItems;
}

/**
 * @returns {WIData[]}
 */
function findWorkItemsFromWorkItemPage() {
    const container = findWorkItemContainerElement();

    let parentId = "";
    let parentWithTitle = "";
    const parentItemContainer = getGenericContentContainer(container, "Parent", ".la-group-title", ".la-list-group-showheader");
    if (parentItemContainer) {
        parentId = getTextContent(parentItemContainer, ".la-primary-data-id").trim();
        parentWithTitle = getTextContent(parentItemContainer, ".la-primary-data");
    }

    /** @type {WIData} */
    const wi = {
        id: getTextContent(container, ".work-item-form-id"),
        parent: parentId,
        parentWithTitle: parentWithTitle,
        title: getInputContent(container, ".work-item-form-title input"),
        type: container.querySelector(".work-item-type-icon").getAttribute("aria-label"),
        state: getGenericInputContent(container, "State", ".work-item-header-control-container"),
        assignedTo: getTextContent(container, ".work-item-form-assignedTo .identity-picker-resolved-name"),
        tags: Array.from(container.querySelectorAll(".tags-items-container .tag-box")).map(element => element.textContent).filter(text => !isNullOrEmptyOrWhitespace(text)).join(", "),
        effort: getGenericInputContent(container, "Effort") || getGenericInputContent(container, "Remaining Work"),
        severity: getGenericInputContent(container, "Severity"),
        segment: getGenericInputContent(container, "Segment"),
        sd: getGenericInputContent(container, "Code"),
    };

    return [wi];
}

/**
 * @param {Element} root 
 * @param {string} selector 
 */
function getTextContent(root, selector) {
    const element = root.querySelector(selector);
    return element ? element.textContent : "";
}

/**
 * @param {Element} root 
 * @param {string} selector 
 */
function getInputContent(root, selector) {
    const input = /** @type {HTMLInputElement} */(root.querySelector(selector));
    return input ? input.value : "";
}

/**
 * @param {Element} root 
 * @param {string} title 
 * @param {string} containerSelector 
 */
function getGenericInputContent(root, title, containerSelector = ".control") {
    const containerElement = getGenericContentContainer(root, title, ".workitemcontrol-label", containerSelector);
    if (!containerElement)
        return "";

    return getInputContent(containerElement, "input");
}

/**
 * @param {Element} root
 * @param {string} title
 * @param {string} valueContainerSelector
 * @param {string} titleContainerSelector
 */
function getGenericContentContainer(root, title, titleContainerSelector, valueContainerSelector) {
    const titleElement = Array.from(root.querySelectorAll(`${valueContainerSelector} ${titleContainerSelector}`)).find(element => element.textContent === title);
    if (!titleElement)
        return "";

    return findParentElement(titleElement, valueContainerSelector);

}

/**
 * @param {Element} startElement
 * @param {string | ((el: Element) => boolean)} comparePredicate Porovnávací predikát nebo selector, první vyhovující rodič je vrácen nebo null
 * @returns {Element | null}
 */
function findParentElement(startElement, comparePredicate) {
    if (startElement.parentElement == null)
        return null;

    if (typeof comparePredicate === 'string') {
        if (startElement.parentElement.matches(comparePredicate))
            return startElement.parentElement;
    } else {
        if (comparePredicate(startElement.parentElement))
            return startElement.parentElement;
    }

    return findParentElement(startElement.parentElement, comparePredicate);
}


/** @returns {Element} */
function findQueryResultContainerElement() {
    return document.querySelector(".query-results-view-container");
}

/** @returns {Element} */
function findWorkItemContainerElement() {
    return document.querySelector(".work-item-form");
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
 * @param {((cell: Element) => string)=} valueSelectorFunc
 */
function getCellValue(row, cellIndex, valueSelectorFunc) {
    if (cellIndex == null)
        return "";

    const cell = row.querySelector(`.grid-cell:nth-of-type(${cellIndex + 1})`);
    return cell ? (valueSelectorFunc ? valueSelectorFunc(cell) : cell.textContent) : "";
}

/**
 * @param {ColumnData} columns 
 * @param {string} cellKey 
 * @returns {number?}
 */
function getColumnIndex(columns, cellKey) {
    return columns[cellKey];
}