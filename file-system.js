// Simulated disk setup
const diskSize = 100;
const blockSize = 512;
let disk = new Array(diskSize).fill(null);

function DREAD(blockNumber) {
    if (!disk[blockNumber]) {
        console.error("Disk read error: Block", blockNumber, "is empty.");
        return null;
    }
    return JSON.parse(disk[blockNumber]);
}

function DWRITE(blockNumber, data) {
    try {
        const dataToWrite = JSON.stringify(data, (key, value) => {
            if (key === 'parent') return undefined; // Prevent circular reference issues
            return value;
        });
        disk[blockNumber] = dataToWrite;
    } catch (error) {
        console.error("Failed to write to disk:", error);
    }
}

class FileSystemEntry {
    constructor(name, type) {
        this.name = name;
        this.type = type;
    }
}

class Directory extends FileSystemEntry {
    constructor(name) {
        super(name, 'D');
        this.children = [];
    }

    addEntry(entry) {
        this.children.push(entry);
    }

    removeEntry(entryName) {
        this.children = this.children.filter(child => child.name !== entryName);
    }

    findEntry(entryName) {
        return this.children.find(e => e.name === entryName);
    }
}

class File extends FileSystemEntry {
    constructor(name, size = 0) {
        super(name, 'U');
        this.size = size;
        this.content = "";
    }

    writeData(data) {
        this.content += data;
        this.size = this.content.length;
    }

    readData() {
        return this.content;
    }
}

let rootDirectory = new Directory('root');
DWRITE(0, rootDirectory); // Initial write to set up the root directory on the disk

function resolvePath(path) {
    let current = rootDirectory;
    if (path === 'root') return current;
    const parts = path.split('/').filter(Boolean);
    for (const part of parts) {
        current = current instanceof Directory ? current.findEntry(part) : null;
        if (!current) {
            console.error("Path not found: " + path);
            return null;
        }
    }
    return current;
}

function updateDisk() {
    DWRITE(0, rootDirectory);
    updateDropdowns();
}

function createEntry(parentDirName, entryName, type) {
    let parentDir = resolvePath(parentDirName);
    if (!parentDir || !(parentDir instanceof Directory)) {
        console.error('Parent directory not found or is not a directory');
        return;
    }
    if (parentDir.findEntry(entryName)) {
        console.error('Entry already exists');
        return;
    }
    let newEntry = type === 'D' ? new Directory(entryName) : new File(entryName);
    parentDir.addEntry(newEntry);
    updateDisk();
}

function deleteEntry(path) {
    const parts = path.split('/');
    const entryName = parts.pop();
    const parentPath = parts.join('/');
    const parentDir = resolvePath(parentPath);
    if (parentDir && parentDir instanceof Directory) {
        parentDir.removeEntry(entryName);
        updateDisk();
    } else {
        console.error('Parent directory not found');
    }
}

function readFromFile(path) {
    const file = resolvePath(path);
    if (file && file instanceof File) {
        return file.readData();
    } else {
        console.error('File not found or is not a user file');
        return '';
    }
}

function writeToFile(path, data) {
    const file = resolvePath(path);
    if (file && file instanceof File) {
        file.writeData(data);
        updateDisk();
    } else {
        console.error('File not found or is not a user file');
    }
}

function getAllPaths(directory = rootDirectory, prefix = '') {
    let paths = [directory.name ? prefix + (prefix ? '/' : '') + directory.name : 'root'];
    if (directory instanceof Directory) {
        directory.children.forEach(child => {
            paths = paths.concat(getAllPaths(child, paths[0]));
        });
    }
    return paths;
}

function updateDropdowns() {
    const paths = getAllPaths();
    const selectElements = document.querySelectorAll('.filesystem-select');
    selectElements.forEach(select => {
        select.innerHTML = '';  // Clear existing options
        paths.forEach(path => {
            const option = document.createElement('option');
            option.value = option.textContent = path;
            select.appendChild(option);
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    updateDropdowns();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('create-documents-dir').addEventListener('click', function() {
        createEntry('root', 'Documents', 'D');
        updateDisplay();
    });
}

function updateDisplay() {
    const output = document.getElementById('output');
    output.textContent = JSON.stringify(rootDirectory, (key, value) => {
        if (key === 'parent') return undefined;  // Ignore parent properties to prevent circular references.
        return value;
    }, 2);
}
