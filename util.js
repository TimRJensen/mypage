// Constants for cell size in x and y
const cellWidth = 2 / 13;  // 2/26 for x axis
const cellHeight = 2 / 13; // 1/26 for y axis

// Function to calculate object position
function calculatePosition(row, column, objectSize) {
    // Calculate the x and y position based on the row, column, and object size
    const xPos = cellWidth/2 +(column * cellWidth) + (cellHeight/2) + (objectSize / 2);
    const yPos = cellHeight/2 + (row * cellHeight) + (cellHeight/2) + (objectSize / 2);
    
    // Print the result
    console.log(`Position of object at row ${row}, column ${column}:`);
    console.log(`x: ${xPos.toFixed(4)}, y: ${yPos.toFixed(4)}`);
}

// Get arguments from command line
const [row, column, objectSize] = process.argv.slice(2).map(Number);

// Ensure valid arguments
if (isNaN(row) || isNaN(column) || isNaN(objectSize)) {
    console.error('Please provide valid row, column, and object size values.');
    process.exit(1);
}

// Call function with provided arguments
calculatePosition(row, column, objectSize);
