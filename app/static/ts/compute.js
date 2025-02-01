function computePoints(
    count,
    cx,
    cz,
    a,
    b,
    radius
) {
    const points = [];
    const step = Math.abs(a - b)/count;

    for (let i = 0; i < count; i++) {
        const angle = a + (i*step); 
        const x = cx + Math.cos(angle) * radius;
        const z = cz + Math.sin(angle) * radius;
        points.push({ x, z });
        console.log(`${i+1}:`, (x-cx).toFixed(4), (z-cz).toFixed(4));
    }


    return points;
}

computePoints(5, 0.315, 0.105, 0, 1.91986218  , 0.315);
