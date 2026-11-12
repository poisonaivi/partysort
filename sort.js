const canvas = document.getElementById("visualizer");
const sizeInput = document.getElementById('sizeToInit');
const sleepInput = document.getElementById('sleepTime');
var chartHeight = canvas.height;
var chartWidth = canvas.width;
var marginTop = 0;
var marginLeft = 0;

var sortArr = [];
var numElements = 0;
var sleepTime = 0;

var readCount = 0;
var writeCount = 0;
var startTime = 0;

document.addEventListener('keydown', function(event) {
    if (event.key == "Enter") {
        initAndShuffle();
        document.activeElement.blur() 
    }
  });

async function initAndShuffle() {
    await initialize();
    await shuffle();
}

function output(message) {
    const outputContainer = document.getElementById("output");
    const newMessage = document.createElement('p');
    newMessage.innerHTML = message;
    if (message.includes("...")) {
        newMessage.classList.add("action");
    } else if (message.charAt(0) == "[") {
        newMessage.classList.add("result");
        if (message.includes("error")) {
            newMessage.classList.add("error");
        }
    }
    outputContainer.appendChild(newMessage);
}

function render() {
    const canvas = document.getElementById("visualizer");
    var ctx = canvas.getContext("2d");
    const absoluteBarWidth = chartWidth / numElements;
    const visualBarWidth = Math.max(1, absoluteBarWidth);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < sortArr.length; i++) {
        ctx.fillStyle = "hsl(" + (sortArr[i] / numElements * 270) + ", 100%, 50%)";
        ctx.fillRect(i * absoluteBarWidth + marginLeft, chartHeight + marginTop, visualBarWidth, 0 - (sortArr[i] + 1) / numElements * chartHeight);
    }
}

async function initialize() {
    input = parseInt(sizeInput.value);
    output("Initializing " + input.toLocaleString() + " elements...");
    await sleep(1);
    numElements = input;
    startTime = Date.now();
    sortArr = new Array(numElements);
    for (let i = 0; i < numElements; i++) {
        sortArr[i] = i;
    }
    render();
    output("[done] Initialized in " + ((Date.now() - startTime) / 1000).toLocaleString({minimumFractionDigits: 3}) + "s.");
}

async function shuffle() {
    output("Shuffling " + numElements.toLocaleString() + " elements...");
    await sleep(1);
    startTime = Date.now();
    for (let i = 0; i < numElements; i++) {
        swapIndex = i + Math.floor(Math.random() * (numElements - i));
        swap(i, swapIndex);
    }
    render();
    output("[done] Shuffled in " + ((Date.now() - startTime) / 1000).toLocaleString({minimumFractionDigits: 3}) + "s.");
}

function reverse() {
    for (let i = 0; i < Math.floor(numElements / 2); i++) {
        swap(i, numElements - 1 - i);        
    }
    render();
    output("Reversed order of elements.");
}

function skip() {
    sleepTime = 0;
    minorSleepTime = 0;
    output("Skipped sleep delay.");
}

function swap(first, second) {
    let temp = sortArr[first];
    sortArr[first] = sortArr[second];
    sortArr[second] = temp;
    writeCount += 2;
}

async function sleep(ms) {
    if (ms == 0) {
        return;
    }
    render();
    await new Promise(res => setTimeout(res, ms));
}

function isSorted() {
    let prevVal = 0;
    for (let i = 0; i < sortArr.length; i++) {
        if (sortArr[i] < prevVal) {
            return false
        }
        prevVal = sortArr[i];
    }
    return true;
}

async function prepareForSort(name) {
    sleepTime = document.getElementById("sleepTime").value;
    minorSleepTime = document.getElementById("minorSleepTime").value;
    output("Sorting " + numElements.toLocaleString() + " elements with " + name + " at " + sleepTime + "*" + minorSleepTime + "ms...");
    if (isSorted()) {
        output("[error] Array already sorted. Press ENTER to initialize and shuffle.");
        return false;
    }
    readCount = 0;
    writeCount = 0;
    await sleep(1);
    startTime = Date.now();
    return true;
}

function outputComplete() {
    output("[done] Sorted in " + ((Date.now() - startTime) / 1000).toLocaleString({minimumFractionDigits: 3}) + "s using " + readCount.toLocaleString() +" reads and " + writeCount.toLocaleString() +" writes.");
    render();
}

async function radixSort() {
    if (!await prepareForSort("radixSort")) {
        return;
    }
    const maxNumber = numElements - 1;
    for (let exp = 1; Math.floor(maxNumber / exp) > 0; exp *= 10) {
        let output = Array(numElements);
        let count = Array(10).fill(0, 0);
        for (let i = 0; i < numElements; i++) {
            const digit = Math.floor(sortArr[i] / exp) % 10;
            readCount++;
            count[digit]++;
        }
        for (let i = 1; i < 10; i++) {
            count[i] += count[i - 1];
        }
        for (let i = numElements - 1; i >= 0; i--) {
            const digit = Math.floor(sortArr[i] / exp) % 10;
            output[count[digit] - 1] = sortArr[i];
            readCount += 2;
            count[digit]--;
        }
        for (let i = 0; i < numElements; i++) {
            sortArr[i] = output[i];
            writeCount++;
            await sleep(minorSleepTime);
        }
            await sleep(sleepTime);
    }
    outputComplete();
}

async function mergeSort() {
    if (!await prepareForSort("mergeSort")) {
        return;
    }
    await mergeSorter(0, numElements - 1);
    outputComplete();
}

async function mergeSorter(min, max) {
    if (min >= max) {
        return;
    }
    let midpoint = Math.floor((min + max) / 2);
    await sleep(sleepTime);
    await mergeSorter(min, midpoint);
    await mergeSorter(midpoint + 1, max);
    let leftSize = midpoint - min + 1;
    var left = new Array(leftSize);
    for (let i = 0; i < leftSize; i++) {
        left[i] = sortArr[min + i];
        readCount++;
    }
    let rightSize = max - midpoint;
    var right = new Array(rightSize);
    for (let i = 0; i < rightSize; i++) {
        right[i] = sortArr[midpoint + 1 + i];
        readCount++;
    }
    let leftIndex = 0;
    let rightIndex = 0;
    let insertionIndex = min;
    while (leftIndex < leftSize && rightIndex < rightSize) {
        if (left[leftIndex] < right[rightIndex]) {
            sortArr[insertionIndex] = left[leftIndex];
            leftIndex++;
        } else {
            sortArr[insertionIndex] = right[rightIndex];
            rightIndex++;
        }
        writeCount++;
        insertionIndex++;
        await sleep(minorSleepTime);
    }
    while (leftIndex < leftSize) {
        sortArr[insertionIndex] = left[leftIndex];
        writeCount++;
        leftIndex++;
        insertionIndex++;
        await sleep(minorSleepTime);
    }
    while (rightIndex < rightSize) {
        sortArr[insertionIndex] = right[rightIndex];
        writeCount++;
        rightIndex++;
        insertionIndex++;
        await sleep(minorSleepTime);
    }
}

async function quickSort() {
    if (!await prepareForSort("quickSort")) {
        return;
    }
    await quickSorter(0, numElements - 1);
    outputComplete();
}

async function quickSorter(min, max) {
    if (min < max) {
        let pivotIndex = Math.floor(min + Math.random() * (max - min));
        let pivot = sortArr[pivotIndex];
        readCount++;
        swap(pivotIndex, max);
        let partitionIndex = min - 1;
        for (let i = min; i <= max - 1; i++) {
            if (sortArr[i] < pivot) {
                partitionIndex++;
                swap(i, partitionIndex);
            }
            readCount++;
            await sleep(minorSleepTime);
        }
        swap(partitionIndex + 1, max);
        await sleep(sleepTime);
        await quickSorter(min, partitionIndex);
        await quickSorter(partitionIndex + 2, max);
    }
}

async function bubbleSort() {
    if (!await prepareForSort("bubbleSort")) {
        return;
    }
    let endIndex = sortArr.length;
    while (true) {
        endIndex--;
        nextValue = sortArr[0];
        readCount++;
        let swaps = 0;
        for (let i = 0; i < endIndex; i++) {
            thisValue = nextValue;
            nextValue = sortArr[i + 1];
            readCount++;
            if (thisValue > nextValue) {
                swap(i, i + 1);
                swaps++;
                nextValue = thisValue;
            }
            await sleep(minorSleepTime);
        }
        if (swaps == 0) {
            outputComplete();
            return;
        }
        await sleep(sleepTime);
    }
}

async function selectionSort() {
    if (!await prepareForSort("selectionSort")) {
        return;
    }
    for (let i = 0; i < sortArr.length; i++) {
        let minIndex = i;
        let minValue = Number.MAX_SAFE_INTEGER;
        for (let j = i; j < sortArr.length; j++) {
            thisValue = sortArr[j];
            readCount++;
            if (thisValue < minValue) {
                minIndex = j;
                minValue = thisValue;
            }
            await sleep(minorSleepTime);
        }
        swap(i, minIndex);
        await sleep(sleepTime);
    }
    outputComplete();
}

async function bogoSort() {
    if (!await prepareForSort("bogoSort")) {
        return;
    }
    while (!isSorted()) {
        for (let i = 0; i < numElements; i++) {
            swapIndex = i + Math.floor(Math.random() * (numElements - i));
            swap(i, swapIndex);
            await sleep(minorSleepTime);
        }
        await sleep(sleepTime);
    }
    outputComplete();
}