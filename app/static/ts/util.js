function convertPoint(points, width, height, step) {
    for (const [x, y] of points) {
        const cell = width/height/(step);
        const cx = x*cell;
        const cy = y*cell - 0.0125;
        console.log("x:", cx.toFixed(4), "z:", cy.toFixed(4));
    }
}




function distributePoints(count, offset, a, b) {
    const delta = b - a;
    const theta = delta/(count - 1);

    for (let i = 0; i < count; i++) {
        const angle = a + theta*i;
        const nx = offset*Math.cos(angle);
        const ny = offset*Math.sin(angle);
        console.log(`${i+1} -`,"x:", nx.toFixed(4), "z:", ny.toFixed(4));
    }
}

// convertPoint([[0, 4] ], 1.5, 1.5, 7);
distributePoints(6, 3*0.1554, 0.3491, 2.0943);
