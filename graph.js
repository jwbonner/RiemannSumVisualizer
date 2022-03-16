// Manages a single graph on a canvas, with methods to update data and render the canvas
function Graph(canvasContainer, canvas) {
    const dataMargin = 0.25;
    const maxYValue = 100000;

    // Graph pixel boundaries
    var graphLeft = 0;
    var graphTop = 0;
    var graphWidth = 0;
    var graphHeight = 0;

    var color = "blue";
    var xRange = [0, 1];
    var yRange = [0, 1];
    var lockedYRange = [null, null];
    var xData = [];
    var yData = [];
    var shapes = [];

    // Set the x range (always locked)
    this.setXRange = range => {
        if (range[1] <= range[0]) {
            range[1] = range[0] + 1;
        }
        xRange = range;
    }

    // Set the y range (min and/or max are locked if not null)
    this.setYRange = range => {
        lockedYRange = range
    }

    // Sets the data for the line to render (xy coordinates)
    this.setData = (newXData, newYData) => {
        xData = newXData;
        yData = newYData;

        // Set the calculated y range based on the data
        if (yData.length == 0) { // Use default range if no data
            yRange = [-1, 1];
        } else {
            var min = Math.min(...yData);
            var max = Math.max(...yData);

            // Always include zero
            if (min > 0 && max > 0) {
                min = 0;
            } else if (min < 0 && max < 0) {
                max = 0;
            }

            // Add margin on the top and bottom
            var range = max - min;
            yRange = [min - (range * dataMargin), max + (range * dataMargin)];

            // Keep min and max within acceptable range
            if (yRange[0] == 0 && yRange[1] == 0) {
                yRange = [-1, 1];
            }
            if (yRange[0] < -maxYValue) {
                yRange = [-maxYValue, yRange[1]];
            }
            if (yRange[1] > maxYValue) {
                yRange = [yRange[0], maxYValue];
            }
        }

        // Lock min and/or max if not null
        if (lockedYRange[0] != null) {
            yRange[0] = lockedYRange[0];
        }
        if (lockedYRange[1] != null) {
            yRange[1] = lockedYRange[1];
        }
        if (yRange[1] <= yRange[0]) {
            yRange[1] = yRange[0] + 1;
        }
    }

    // Set the list of shapes to render
    this.setShapes = newShapes => {
        shapes = newShapes;
    }

    // Set the rendering color
    this.setColor = newColor => {
        color = newColor;
    }

    // Get the size of the x range represented by a single pixel (including subpixels on high density displays)
    this.getPixelSize = () => {
        return (xRange[1] - xRange[0]) / (graphWidth * window.devicePixelRatio);
    }

    // Calculates appropriate step size for an axis based on its range
    function calcStepSize(lengthPx, targetStepPx, range) {
        // Approximate step size
        var stepCount = lengthPx / targetStepPx;
        var stepValueApprox = (range[1] - range[0]) / stepCount;

        // Clean up step size
        var roundBase = 10 ** Math.floor(Math.log10(stepValueApprox));
        var multiplierLookup = [0, 1, 2, 2, 5, 5, 5, 5, 5, 10, 10];
        var stepValue = roundBase * multiplierLookup[Math.round(stepValueApprox / roundBase)];

        return stepValue;
    }

    // Utility function to scale value between two ranges
    function scaleValue(value, oldMin, oldMax, newMin, newMax) {
        return (((value - oldMin) / (oldMax - oldMin)) * (newMax - newMin)) + newMin;
    }

    // Utility function to clean up floating point errors
    function cleanFloat(float) {
        var output = Math.round(float * 10000) / 10000;
        if (output == -0) output = 0;
        return output;
    }

    // Render the current data to the canvas
    this.render = () => {
        // Reset canvas
        const devicePixelRatio = window.devicePixelRatio;
        var context = canvas.getContext("2d");
        var width = canvasContainer.clientWidth;
        var height = canvasContainer.clientHeight;
        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;
        context.scale(devicePixelRatio, devicePixelRatio);
        context.clearRect(0, 0, width, height);

        // Calculate canvas dimensions
        graphLeft = 50;
        graphTop = 15;
        graphWidth = width - graphLeft - 20;
        if (graphWidth < 1) graphWidth = 1;
        graphHeight = height - graphTop - 30;
        if (graphHeight < 1) graphHeight = 1;

        // Render data
        context.globalAlpha = 1;
        context.lineWidth = 2;
        context.strokeStyle = color;
        context.beginPath();
        var firstData = true;
        for (let i = 0; i < xData.length; i++) {
            if (yData[i] == null) { // Restart stroke if no data available at this coorindate
                context.stroke();
                context.beginPath();
                firstData = true;
            } else {
                var x = scaleValue(xData[i], xRange[0], xRange[1], graphLeft, graphLeft + graphWidth);
                var y = scaleValue(yData[i], yRange[0], yRange[1], graphTop + graphHeight, graphTop);
                if (firstData) {
                    context.moveTo(x, y);
                    firstData = false;
                } else {
                    context.lineTo(x, y);
                }
            }
        }
        context.stroke();

        // Render shapes
        context.fillStyle = color;
        context.strokeStyle = color;
        context.lineWidth = 1;
        shapes.forEach(shape => {
            var x0 = scaleValue(shape.xRange[0], xRange[0], xRange[1], graphLeft, graphLeft + graphWidth);
            var x1 = scaleValue(shape.xRange[1], xRange[0], xRange[1], graphLeft, graphLeft + graphWidth);
            var y0 = scaleValue(0, yRange[0], yRange[1], graphTop + graphHeight, graphTop);
            var y1 = scaleValue(shape.yRange[0], yRange[0], yRange[1], graphTop + graphHeight, graphTop);
            var y2 = scaleValue(shape.yRange[1], yRange[0], yRange[1], graphTop + graphHeight, graphTop);
            context.beginPath();
            context.moveTo(x0, y0);
            context.lineTo(x0, y1);
            context.lineTo(x1, y2);
            context.lineTo(x1, y0);
            context.lineTo(x0, y0);

            context.globalAlpha = 0.25;
            context.fill();
            context.globalAlpha = 1;
            context.stroke();
        })

        // Clear overflow & draw graph outline
        context.lineWidth = 1;
        context.strokeStyle = "#222";
        context.fillStyle = "#222";
        context.clearRect(0, 0, width, graphTop);
        context.clearRect(0, graphTop + graphHeight, width, height - graphTop - graphHeight);
        context.clearRect(0, graphTop, graphLeft, graphHeight);
        context.clearRect(graphLeft + graphWidth, graphTop, width - graphLeft - graphWidth, graphHeight);
        context.strokeRect(graphLeft, graphTop, graphWidth, graphHeight);

        // Prepare to render axes
        var xStep = calcStepSize(graphWidth, 100, xRange);
        var yStep = calcStepSize(graphHeight, 50, yRange);
        context.textBaseline = "middle";
        context.font = "12px sans-serif";

        // Draw x axis
        context.textAlign = "center";
        var xStepPos = Math.ceil(cleanFloat(xRange[0] / xStep)) * xStep;
        while (true) {
            var x = scaleValue(xStepPos, xRange[0], xRange[1], graphLeft, graphLeft + graphWidth);
            if (x > graphLeft + graphWidth + 1) break;

            context.globalAlpha = 1;
            context.fillText(cleanFloat(xStepPos).toString(), x, graphTop + graphHeight + 15);
            context.beginPath();
            context.moveTo(x, graphTop + graphHeight);
            context.lineTo(x, graphTop + graphHeight + 5);
            context.stroke();

            context.globalAlpha = cleanFloat(xStepPos) == 0.0 ? 1.0 : 0.1; // Render dark line for y axis
            context.beginPath();
            context.moveTo(x, graphTop);
            context.lineTo(x, graphTop + graphHeight);
            context.stroke();

            xStepPos += xStep;
        }

        // Draw y axis
        context.textAlign = "right";
        var yStepPos = Math.ceil(cleanFloat(yRange[0] / yStep)) * yStep;
        while (true) {
            var y = scaleValue(yStepPos, yRange[0], yRange[1], graphTop + graphHeight, graphTop);
            if (y < graphTop - 1) break;

            context.globalAlpha = 1;
            context.fillText(cleanFloat(yStepPos).toString(), graphLeft - 15, y);
            context.beginPath();
            context.moveTo(graphLeft, y);
            context.lineTo(graphLeft - 5, y);
            context.stroke();

            context.globalAlpha = cleanFloat(yStepPos) == 0.0 ? 1.0 : 0.1; // Render dark line for x axis
            context.beginPath();
            context.moveTo(graphLeft, y);
            context.lineTo(graphLeft + graphWidth, y);
            context.stroke();

            yStepPos += yStep;
        }
    }
}