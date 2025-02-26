function convertPoint(points, width, height, step) {
    for (const [x, y] of points) {
        const cell = width/height/(step);
        const cx = x*cell + (cell/2 + 0.0125);
        const cy = y*cell + (cell/2 + 0.0125);
        console.log("x:", cx.toFixed(4), "z:", cy.toFixed(4));
    }
}




function distributeAtPoint(x, y, width, height, step, count, offset, a, b) {




}

convertPoint([[0, -7], [3, -4] ], 1.5, 1.2, 10);
