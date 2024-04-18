// Simulate a disk setup
const diskSize = 100; // Number of blocks
const blockSize = 512; // Bytes per block
let disk = new Array(diskSize).fill(null);

class FileSystemEntry {
    constructor(name, type) {
        this.name = name;
        this.type = type; // 'D' for directory, 'U' for user file
        this.children = [];
        this.content = '';
        this.size = 0; // Size of the file in bytes
    }
}

let rootDirectory = new FileSystemEntry('root', 'D');
disk[0] = rootDirectory; // Correctly setting the root directory at disk[0]
console.log('Root Directory:', JSON.stringify(disk[0]));



let openFiles = {};

function DREAD(blockNumber) {
    return disk[blockNumber];
}

function DWRITE(blockNumber, data) {
    disk[blockNumber] = data;
}

function createFile(path, type) {
    let parts = path.split('/');
    let fileName = parts.pop();
    let parentPath = parts.join('/') || 'root'; // Default to root if no path left
    let parentDir = resolvePath(parentPath);
    if (parentDir && parentDir.type === 'D') {
        if (parentDir.children.some(child => child.name === fileName)) {
            console.error('File or directory already exists');
            return;
        }
        let newEntry = new FileSystemEntry(fileName, type);
        parentDir.children.push(newEntry);
        console.log(`Created ${type === 'D' ? 'directory' : 'file'}: ${fileName}`);
        console.log(`Updated parent directory (${parentDir.name}):`, JSON.stringify(parentDir));
    } else {
        console.error('Invalid parent directory');
    }
}
function deleteFile(path) {
    let parts = path.split('/');
    let fileName = parts.pop();
    let parentPath = parts.join('/');
    let parentDir = resolvePath(parentPath);
    if (parentDir && parentDir.type === 'D') {
        parentDir.children = parentDir.children.filter(child => child.name !== fileName);
        console.log(`Deleted: ${fileName}`);
        if (openFiles[path]) {
            closeFile(path);
        }
    } else {
        console.error('Invalid directory or file');
    }
}

function openFile(filePath, mode) {
    let file = resolvePath(filePath);
    if (file && file.type === 'U') { // Assuming 'U' is for user files
        openFiles[filePath] = { file: file, mode: mode, pointer: 0 };
        console.log('File opened:', filePath, 'Mode:', mode);

        updateDisplay(); // Update the file system visualization
        updateFileDetails(filePath); // Update details about the opened file if this function exists
    } else {
        console.error('File cannot be opened or does not exist:', filePath);
    }
}



function closeFile(path) {
    if (openFiles[path]) {
        delete openFiles[path];
        updateFileDetails();
    }
}

function seekFile(path, base, offset) {
    if (!openFiles[path]) {
        console.error('File is not open');
        return;
    }

    let fileData = openFiles[path];
    let newPosition;

    switch (base) {
        case -1: // Start of the file
            newPosition = offset;
            break;
        case 0: // Current position
            newPosition = fileData.pointer + offset;
            break;
        case 1: // End of the file
            newPosition = fileData.file.content.length + offset;
            break;
        default:
            console.error('Invalid base for SEEK command');
            return;
    }

    if (newPosition < 0 || newPosition > fileData.file.content.length) {
        console.error('Seek position out of bounds');
        return;
    }

    fileData.pointer = newPosition;
    console.log(`Pointer moved to position ${newPosition} in file ${path}`);
}

function updateDisplay() {
    const output = document.getElementById('output');
    output.textContent = JSON.stringify(rootDirectory, null, 2);
}

function updateFileDetails(filePath) {
    const details = document.getElementById('file-details');
    if (openFiles[filePath]) {
        const fileData = openFiles[filePath];
        details.textContent = `File: ${filePath}\nMode: ${fileData.mode}\nPointer: ${fileData.pointer}\nContent: "${fileData.file.content}"`;
    } else {
        details.textContent = 'No file is currently open.';
    }
}


function processCommand() {
    const commandInput = document.getElementById('command-input');
    let command = commandInput.value.trim();
    commandInput.value = ''; // Clear the input after processing

    let parts = command.match(/(?:[^\s"]+|"[^"]*")+/g);
    if (!parts) {
        console.error('Invalid command format');
        return;
    }

    let cmd = parts[0].toUpperCase();
    switch (cmd) {
        case 'OPEN':
            if (parts.length < 3) {
                console.error('Not enough arguments for OPEN command');
                return;
            }
            openFile(parts[1], parts[2]);
            break;
        case 'CREATE':
            if (parts.length < 3) {
                console.error('Not enough arguments for CREATE command');
                return;
            }
            createFile(parts[1], parts[2]);
            break;
        case 'DELETE':
            if (parts.length < 2) {
                console.error('Not enough arguments for DELETE command');
                return;
            }
            deleteFile(parts[1]);
            break;
        case 'READ':
            if (parts.length < 2) {
                console.error('Not enough arguments for READ command');
                return;
            }
            readFile(parts[1]);
            break;
        case 'WRITE':
            if (parts.length < 3) {
                console.error('Not enough arguments for WRITE command');
                return;
            }
            writeFile(parts[1], parts.slice(2).join(' '));
            break;
        case 'SEEK':
            if (parts.length < 4) {
                console.error('Not enough arguments for SEEK command');
                return;
            }
            seekFile(parts[1], parseInt(parts[2]), parseInt(parts[3]));
            break;
        case 'CLOSE':
            if (parts.length < 2) {
                console.error('Not enough arguments for CLOSE command');
                return;
            }
            closeFile(parts[1]);
            break;
        default:
            console.error('Invalid command:', cmd);
            break;
    }
    updateDisplay();
}







function resolvePath(path) {
    if (path === 'root') return rootDirectory;  // Ensures that the root directory is directly returned if specified

    let parts = path.split('/').filter(part => part.trim() !== '');
    if (parts[0] === 'root') { // Ensures that paths starting with 'root/' are handled properly
        parts.shift(); // Remove the 'root' part to start resolution from rootDirectory
    }
    let current = rootDirectory;

    for (let part of parts) {
        let found = current.children.find(child => child.name === part);
        if (!found) {
            console.error('Path not found: ' + path);
            return null;
        }
        current = found;
    }
    return current;
}





document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('command-input').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            processCommand();
        }
    });
});

function testCreateFile() {
    processCommand('CREATE U root/TestFile.txt');  // Check if the root directory is 'root/' or 'root'
}

function testCreateDirectory() {
    processCommand('CREATE D root/NewFolder');  // Same as above
}

function testWriteToFile() {
    if (resolvePath('root/TestFile.txt')) {  // Ensure path exists before testing write
        processCommand('WRITE root/TestFile.txt "Hello, world!"');
    } else {
        console.error("Can't write: Test file doesn't exist.");
    }
}


function testReadFromFile() {
    processCommand('READ root/TestFile.txt');
}

function testDeleteFile() {
    processCommand('DELETE root/TestFile.txt');
}

function testOpenFile() {
    if (resolvePath('root/TestFile.txt')) {
        openFile('root/TestFile.txt', 'O');
    } else {
        console.error("Test file doesn't exist, can't open it.");
    }
}

function testSeekFile() {
    seekFile('root/TestFile.txt', 0, 10);
}

function testCloseFile() {
    closeFile('root/TestFile.txt');
}
function writeFile(path, data) {
    let file = resolvePath(path);
    if (file && file.type === 'U') {
        file.content = data;
        file.size = data.length;
        console.log(`Written to file: ${path}, content: ${data}`);
    } else {
        console.error('File not found or is not a user file');
    }
}

function readFile(path) {
    let file = resolvePath(path);
    if (file && file.type === 'U') {
        console.log(`Read from file: ${path}, content: ${file.content}`);
    } else {
        console.error('File not found');
    }
}
async function fullFileOperationAsync() {
    try {
        await createFile('root/CompleteTestFile.txt', 'U');
        console.log('File created: root/CompleteTestFile.txt');

        await openFile('root/CompleteTestFile.txt', 'O');
        console.log('File opened for writing: root/CompleteTestFile.txt');

        await writeFile('root/CompleteTestFile.txt', "This is a test content.");
        console.log('Written to file: "This is a test content."');

        await seekFile('root/CompleteTestFile.txt', 0, 5);
        console.log('Seeked to position 5 in file.');

        await readFile('root/CompleteTestFile.txt');
        console.log('Read from file executed.');

        await closeFile('root/CompleteTestFile.txt');
        console.log('File closed.');

        await deleteFile('root/CompleteTestFile.txt');
        console.log('File deleted: root/CompleteTestFile.txt');
    } catch (error) {
        console.error('An error occurred during the full file operation:', error);
    }
}


// Replace the simple button click handler with this if using asynchronous operations:
// <button onclick="fullFileOperationAsync()">Run Full File Operation</button>
