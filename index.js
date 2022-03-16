const defaultMinX = 0;
const defaultMaxX = 10;
const minN = 1;
const maxN = 5000;

// Retrieve DOM elements
const originalGraph = new Graph(document.getElementsByClassName("original-graph-container")[0], document.getElementsByClassName("original-graph")[0]);
const integralGraph = new Graph(document.getElementsByClassName("integral-graph-container")[0], document.getElementsByClassName("integral-graph")[0]);
const functionInput = document.getElementsByClassName("function-input")[0];
const ruleInput = document.getElementsByClassName("rule-input")[0];
const minXInput = document.getElementsByClassName("number-input")[0];
const maxXInput = document.getElementsByClassName("number-input")[1];
const minYInput = document.getElementsByClassName("number-input")[2];
const maxYInput = document.getElementsByClassName("number-input")[3];
const nInput = document.getElementsByClassName("number-input")[4];
const integralOutput = document.getElementsByClassName("integral-output")[0];

// Set graph colors
originalGraph.setColor("blue");
integralGraph.setColor("red");

// Evaluate a function with error handling
function evalFunction(f, x) {
    var y;
    try {
        y = f(x);
    } catch {
        y = null;
    }
    if (isNaN(y)) {
        y = null;
    }
    return y;
}

// Evaluates the function and updates the data for both graphs
function updateData() {
    var f;
    try {
        f = new Function("x", "return " + functionInput.value);
    } catch {
        f = () => null;
    }

    var minX, maxX, minY, maxY;
    try {
        minX = new Function("return " + minXInput.value);
    } catch {
        minX = () => defaultMinX;
    }
    try {
        maxX = new Function("return " + maxXInput.value);
    } catch {
        maxX = () => defaultMaxX;
    }
    try {
        minY = new Function("return " + minYInput.value);
    } catch {
        minX = () => null;
    }
    try {
        maxY = new Function("return " + maxYInput.value);
    } catch {
        maxX = () => null;
    }

    // Update ranges
    var xRange = [
        minXInput.value == "" ? defaultMinX : Number(evalFunction(minX, undefined)),
        maxXInput.value == "" ? defaultMaxX : Number(evalFunction(maxX, undefined))
    ];
    var yRange = [
        minYInput.value == "" ? null : Number(evalFunction(minY, undefined)),
        maxYInput.value == "" ? null : Number(evalFunction(maxY, undefined))
    ];
    originalGraph.setYRange(yRange);
    originalGraph.setXRange(xRange);
    integralGraph.setXRange(xRange);

    // Generate original data
    var pixelSize = originalGraph.getPixelSize();
    var functionXData = [];
    var functionYData = [];
    var x = xRange[0];
    if (pixelSize != Infinity) {
        while (x < xRange[1]) {
            functionXData.push(x);
            var y = evalFunction(f, x);
            if (y == null || (yRange[0] != null && y < yRange[0]) || (yRange[1] != null && y > yRange[1])) {
                functionYData.push(null);
            } else {
                functionYData.push(y);
            }
            x += pixelSize;
        }
    }
    originalGraph.setData(functionXData, functionYData);

    // Generate integral
    var n = Number(nInput.value);
    if (n < minN) n = minN;
    if (n > maxN) n = maxN;
    var deltaX = (xRange[1] - xRange[0]) / n;
    var x = xRange[0];
    var integral = 0;
    var integralXData = [xRange[0]];
    var integralYData = [0];
    var shapes = [];
    var i = 0;
    while (i < n) {
        
        // Generate data based on the selected rule
        switch (ruleInput.value) {
            case "Left Hand Rule":
                if (evalFunction(f, x) != null) {
                    shapes.push({
                        xRange: [x, x + deltaX],
                        yRange: [evalFunction(f, x), evalFunction(f, x)]
                    });
                    integral += evalFunction(f, x) * deltaX;
                }
                break;

            case "Right Hand Rule":
                if (evalFunction(f, x + deltaX) != null) {
                    shapes.push({
                        xRange: [x, x + deltaX],
                        yRange: [evalFunction(f, x + deltaX), evalFunction(f, x + deltaX)]
                    });
                    integral += evalFunction(f, x + deltaX) * deltaX;
                }
                break;

            case "Midpoint Rule":
                if (evalFunction(f, x + (deltaX / 2.0)) != null) {
                    shapes.push({
                        xRange: [x, x + deltaX],
                        yRange: [evalFunction(f, x + (deltaX / 2.0)), evalFunction(f, x + (deltaX / 2.0))]
                    });
                    integral += evalFunction(f, x + (deltaX / 2.0)) * deltaX;
                }
                break;

            case "Trapezoidal Rule":
                if (evalFunction(f, x) != null && evalFunction(f, x + deltaX) != null) {
                    shapes.push({
                        xRange: [x, x + deltaX],
                        yRange: [evalFunction(f, x), evalFunction(f, x + deltaX)]
                    });
                    integral += deltaX * (0.5 * (evalFunction(f, x) + evalFunction(f, x + deltaX)));
                }
                break;
        }

        // Add integral data from calculation
        integralXData.push(x + deltaX);
        integralYData.push(integral);
        x += deltaX;
        i++;
    }
    
    // Send data to graphs (and update numerical result)
    originalGraph.setShapes(shapes);
    integralGraph.setData(integralXData, integralYData);
    integralOutput.innerText = integral.toFixed(5);
}

// Manage min and max n values
nInput.min = minN;
nInput.max = maxN;
nInput.addEventListener("change", () => {
    var n = Number(nInput.value);
    if (n < minN) {
        nInput.value = minN;
    }
    if (n > maxN) {
        nInput.value = maxN;
    }
});

// Initialize data and event listeners
minXInput.value = defaultMinX;
maxXInput.value = defaultMaxX;
updateData();
functionInput.addEventListener("change", updateData);
ruleInput.addEventListener("change", updateData);
minXInput.addEventListener("change", updateData);
maxXInput.addEventListener("change", updateData);
minYInput.addEventListener("change", updateData);
maxYInput.addEventListener("change", updateData);
nInput.addEventListener("change", updateData);
window.setInterval(updateData, 1000);
window.setInterval(() => {
    originalGraph.render();
    integralGraph.render();
}, 15);