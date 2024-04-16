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

// Root directory initialization
let rootDirectory = new FileSystemEntry('root', 'D');
disk[0] = rootDirectory; // Placing the root directory at the first block of the disk

function DREAD(blockNumber) {
    return disk[blockNumber];
}

function DWRITE(blockNumber, data) {
    disk[blockNumber] = data;
}

function createFile(path, type) {
    let parts = path.split('/');
    let fileName = parts.pop();
    let parentPath = parts.join('/');
    let parentDir = resolvePath(parentPath);
    if (parentDir && parentDir.type === 'D') {
        let newEntry = new FileSystemEntry(fileName, type);
        parentDir.children.push(newEntry);
        console.log(`Created ${type === 'D' ? 'directory' : 'file'}: ${fileName}`);
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
    } else {
        console.error('Invalid directory or file');
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

function updateDisplay() {
    const output = document.getElementById('output');
    output.textContent = JSON.stringify(rootDirectory, (key, value) => {
        if (key === 'parent') return undefined;
        return value;
    }, 2);
}

function testCommands() {
    // Sample commands to test the file system functionality
    processCommand('CREATE D root/Documents');
    processCommand('CREATE U root/Documents/TestFile.txt');
    processCommand('WRITE root/Documents/TestFile.txt Hello World');
    processCommand('READ root/Documents/TestFile.txt');
    processCommand('DELETE root/Documents/TestFile.txt');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('command-input').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            processCommand();
        }
    });
});
// Additional JavaScript to handle button clicks for specific commands

function testCreateFile() {
    processCommand('CREATE U root/TestFile.txt');
}

function testCreateDirectory() {
    processCommand('CREATE D root/NewFolder');
}

function testWriteToFile() {
    processCommand('WRITE root/TestFile.txt "Hello, world!"');
}

function testReadFromFile() {
    processCommand('READ root/TestFile.txt');
}

function testDeleteFile() {
    processCommand('DELETE root/TestFile.txt');
}



// This function processes a given string as a command
function processCommand(command = null) {
    if (!command) {
        const commandInput = document.getElementById('command-input');
        if (!commandInput) {
            console.error('Command input field not found');
            return;
        }
        command = commandInput.value;
        if (!command) {
            console.error('No command entered');
            return;
        }
    }

    let parts = command.match(/(?:[^\s"]+|"[^"]*")+/g);  // Improved splitting that respects quotes
    if (!parts) {
        console.error('Invalid command format');
        return;
    }

    let cmd = parts[0].toUpperCase();
    let args = parts.slice(1).map(arg => arg.replace(/^"|"$/g, '')); // Remove quotes

    switch (cmd) {
        case 'CREATE':
            handleCreateCommand(args[0], args[1]);  // Assuming type comes first, then path
            break;
        case 'DELETE':
            handleDeleteCommand(args.join(' '));
            break;
        case 'READ':
            handleReadCommand(args.join(' '));
            break;
        case 'WRITE':
            let filePath = args[0];
            let data = args.slice(1).join(' ');  // Joining all parts after the filepath as data
            handleWriteCommand(filePath, data);
            break;
        default:
            console.error('Invalid command');
            break;
    }
    updateDisplay();
}




// Ensure `resolvePath` is accurately following the directory structure
function resolvePath(path) {
    let parts = path.split('/');
    let current = rootDirectory; // Assuming rootDirectory is the starting point
    for (let i = 1; i < parts.length; i++) {
        let found = current.children.find(child => child.name === parts[i]);
        if (!found) {
            console.error('Path not found: ' + path);
            return null;
        }
        current = found;
    }
    return current;
}

// Function to handle creation of directories and files
function handleCreateCommand(type, path) {
    if (!path || !type) {
        console.error('Type or path missing in CREATE command');
        return;
    }
    createFile(path, type);
}

// Function to handle deletion of directories and files
function handleDeleteCommand(path) {
    deleteFile(path);  // Assuming deleteFile takes a path
}

// Function to handle reading from files
function handleReadCommand(path) {
    readFile(path);  // Assuming readFile takes a path
}

// Function to handle writing to files
function handleWriteCommand(path, data) {
    writeFile(path, data);  // Assuming writeFile takes a path and data
}
