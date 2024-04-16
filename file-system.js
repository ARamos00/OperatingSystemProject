// Simulated disk setup
const diskSize = 100;
const blockSize = 512;
let disk = new Array(diskSize).fill(null);

function DREAD(blockNumber) {
    return disk[blockNumber] ? JSON.parse(disk[blockNumber]) : null;
}

function DWRITE(blockNumber, data) {
    disk[blockNumber] = JSON.stringify(data, (key, value) => {
        if (key === 'parent') return undefined; // Avoid circular references
        return value;
    });
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
DWRITE(0, rootDirectory);

function resolvePath(path) {
    let current = rootDirectory;
    console.log("Resolving path:", path);
    if (path === 'root') return current;
    const parts = path.split('/').filter(Boolean);
    for (const part of parts) {
        current = current instanceof Directory ? current.findEntry(part) : null;
        if (!current) {
            console.error("Path not found: " + path + " at segment: " + part);
            return null;
        }
    }
    return current;
}



function updateDisk() {
    DWRITE(0, rootDirectory);
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
    let file = resolvePath(path);
    if (!file || !(file instanceof File)) {
        console.log("File not found, creating new file at: " + path);
        const parts = path.split('/');
        const fileName = parts.pop();
        const parentPath = parts.join('/');
        const parentDir = resolvePath(parentPath);
        if (parentDir && parentDir instanceof Directory) {
            file = new File(fileName);
            parentDir.addEntry(file);
            updateDisk();
        } else {
            console.error('Parent directory not found for new file: ' + parentPath);
            return;
        }
    }
    file.writeData(data);
    updateDisk();
}


function setupEventListeners() {
    const createDirButton = document.getElementById('create-directory-button');
    if (createDirButton) {
        createDirButton.addEventListener('click', function() {
            createEntry('root', 'Documents', 'D');
        });
    }

    const createFileButton = document.getElementById('create-file-button');
    if (createFileButton) {
        createFileButton.addEventListener('click', function() {
            createEntry('Documents', 'TestFile.txt', 'U');
        });
    }

    const writeFileButton = document.getElementById('write-file-button');
    if (writeFileButton) {
        writeFileButton.addEventListener('click', function() {
            writeToFile('Documents/TestFile.txt', 'Hello World');
        });
    }

    const readFileButton = document.getElementById('read-file-button');
    if (readFileButton) {
        readFileButton.addEventListener('click', function() {
            const content = readFromFile('Documents/TestFile.txt');
            alert('Read from file: ' + content);
        });
    }

    const deleteFileButton = document.getElementById('delete-file-button');
    if (deleteFileButton) {
        deleteFileButton.addEventListener('click', function() {
            deleteEntry('Documents/TestFile.txt');
        });
    }

    const deleteDirButton = document.getElementById('delete-directory-button');
    if (deleteDirButton) {
        deleteDirButton.addEventListener('click', function() {
            deleteEntry('Documents');
        });
    }
}
function handleCreate(event) {
    event.preventDefault();
    const parentDir = document.getElementById('parent-dir').value;
    const entryName = document.getElementById('entry-name').value;
    const type = document.getElementById('type-select').value;
    createEntry(parentDir, entryName, type);
    updateDisplay();
}

function handleDelete(event) {
    event.preventDefault();
    const path = document.getElementById('delete-path').value;
    deleteEntry(path);
    updateDisplay();
}

function handleWrite(event) {
    event.preventDefault();
    const path = document.getElementById('write-file-name').value;
    const data = document.getElementById('file-content').value;
    writeToFile(path, data);
    updateDisplay();
}

function handleRead() {
    const filePath = document.getElementById('read-file-name').value;
    const content = readFromFile(filePath);
    alert('Content of ' + filePath + ': ' + content);
}
function updateDisplay() {
    const output = document.getElementById('output');
    if (output) {
        output.textContent = JSON.stringify(rootDirectory, (key, value) => {
            if (key === 'parent') return undefined;  // Exclude the parent property to prevent circular references
            return value;
        }, 2);
    } else {
        console.error("Display element not found!");
    }
}

