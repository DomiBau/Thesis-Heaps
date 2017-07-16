/**
 * @fileOverview
 * This file contains just our basic Heap model, 
 * together with methods to parse and sequentialize the Heap.
 *
 * @author Dominique Bau
 *
 * @requires d3.map, an associative array similar to new Object() / {}
 */

var startDistance = 130;
var mainNodeDistance = startDistance;
var maxMainNodes = Math.floor(700 / mainNodeDistance) * 2;
var needMoreSpace = false;
var squeeze = false;
var lockDistance = false;
var numOperation = 0;
var data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];//always holds 11 numbers for the Graph
var realData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var funcYRange = 20;
var func2YRange = 40;
/**
 * @classdesc
 * Represents a Heap.
 * Also acts as namespace for Heap.Node, Heap.Edge as well as static variables and functions.
 * @constructor
 */
function Heap() {
    //unique id counter for nodes and edges,
    //increased whenever a node or edge is added to the Heap.
    this.nodeIds = 0;
    this.edgeIds = 0;


    this.mainNodes = [];

    this.numNodes = 0;

    //associative arrays of nodes and edges
    this.nodes = d3.map();
    this.edges = d3.map();

    this.potential = 0;//numMainNodes+2*markedNodes
    this.markedNodes = 0;
    this.numMainNodes = 0;

    this.minPointer = null;
}


/**
 * Represents a Heap node
 * @constructor
 * @param {number} x - the horizontal position
 * @param {number} y - the vertical position
 * @param {number} id - a unique id
 * @param {number} ele - the number representing the element (key)
 */
Heap.Node = function (x, y, id, ele, parent) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.ele = ele;
    this.parent = parent;
    this.marked = false;
    this.degree = 0;
    this.children = [];
    this.min = false;
    this.isMain = true;
    this.focus = false;

    //outgoing and incoming edges are saved to facilitate handling of vertices in algorithms
    this.outEdges = d3.map();
    this.inEdges = d3.map();
};


/**
 * Incoming edges of the node.
 * @return [Heap.Edge]
 */
Heap.Node.prototype.getInEdges = function () {
    return this.inEdges.values();
};

/**
 * Outgoing edges of the node.
 * @return [Heap.Edge]
 */
Heap.Node.prototype.getOutEdges = function () {
    return this.outEdges.values();
};

/**
 * Returns a string representation of this node together with its resources
 * @param {boolean} full - wheater to include the id
 * @param {function} [f] - optional resource accessor function
 */
Heap.Node.prototype.toString = function (full) {
    var str = "";
    if (this.min)
        str += "Min";
    return str;
};



Heap.Node.prototype.setCoor = function (that, offset, start) {
    if (this.marked) {
        that.markedNodes++;
    }
    if (this.parent) {
        this.isMain = false;
        this.x = this.parent.x - offset;
        if (mainNodeDistance < start - this.x && !lockDistance) {
            needMoreSpace = true;
            return;
        }
        if ((start - this.x) * 2 > mainNodeDistance) {
            squeeze = false;
        }
        this.y = this.parent.y - 50;
    } else {//MainNode
        var index = that.mainNodes.indexOf(this);
        var x = mainNodeDistance + (index * mainNodeDistance);
        var y = 530;
        if (x > 700) {
            x = x - 700;
            x = x - (x % mainNodeDistance) + mainNodeDistance;
            y = 265;
        }
        if (x > 700) {//only possible with delete or decrease
            x = x - 700;
            x = x - (x % mainNodeDistance) + mainNodeDistance;
            y = 50;
        }
        this.x = x;
        this.y = y;
        start = this.x;
    }
    var newOffset = 0;
    if (+this.children.length > 0) {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].parentsChild = i;
            newOffset = this.children[i].setCoor(that, newOffset, start);
        }
        newOffset -= 35;
    }
    return offset + newOffset + 35;
};


/**
 * Represents a Heap edge
 * @constructor
 */
Heap.Edge = function (s, t, id) {
    this.start = s;
    this.end = t;
    this.id = id;
};

/**
 * Returns a string representation of this edge together with its resources
 * @param {boolean} full wheater to include the start and end node ids in the form start->end
 */
Heap.Edge.prototype.toString = function (full, f) {
    var str = "";
    if (full)
        str += this.start.id + "->" + this.end.id + " ";
    return str;
};

/**
 * Returns an alternative string representation of this edge
 */
Heap.Edge.prototype.toStringAlt = function (nodeLabel) {
    var str = "e=(" + nodeLabel(this.start) + "," + nodeLabel(this.end) + ")";
    return str;
};



/////////////////
//MEMBERS

/**
 * add a node to the Heap
 * @param ele {Number|String} new element to be inserted
 */
Heap.prototype.addNode = function (ele) {
            
    numOperation++;
    if (!ele) {
        ele = Math.ceil(Math.random() * 100);
    }
    if (this.numMainNodes >= maxMainNodes){//maxMainNodes is max capacity for Main nodes
        if(inExercise){
            usedExcerciseOperations--;
        }
        return;
    }
    this.numNodes++;
    var node = new Heap.Node(-10, 550, this.nodeIds++, ele, null);
    this.addToMainNodes(node);
    this.nodes.set(node.id, node);
    realData.push(realCurCost);
    realData.shift();
    realCurCost = 0;
    this.rearrangeNodes();
    this.updatePotential();
    return node;
};


Heap.prototype.updatePotential = function () {
    this.potential = this.numMainNodes + 2 * this.markedNodes;
    data.shift();
    data.push(this.potential);
    this.updateFunction();
};

Heap.prototype.updateFunction = function () {
    var str = "";
    var cur = data[0];
    str += "M " + funcSvgMargin.left + "," + (funcSvgMargin.top + funcSvgHeight - (funcSvgHeight / funcYRange) * cur) + " ";
    for (var i = 1; i <= 10; i++) {
        cur = data[i];
        str += "L " + (funcSvgMargin.left + (funcSvgWidth / 10) * i) + "," + (funcSvgMargin.top + funcSvgHeight - (funcSvgHeight / funcYRange) * cur) + " ";
    }
    d3.select("#functionGraph").attr("d", str);


    var thickness = 6;
    cur = realData[0];
    var avg = cur;
    str = "M " + (funcSvgMargin.left - (thickness / 2)) + "," + (funcSvgMargin.top + funcSvgHeight) + " ";
    str += "L " + (funcSvgMargin.left - (thickness / 2)) + "," + (funcSvgMargin.top + funcSvgHeight - (funcSvgHeight / func2YRange) * cur) + " ";
    str += "L " + (funcSvgMargin.left + (thickness / 2)) + "," + (funcSvgMargin.top + funcSvgHeight - (funcSvgHeight / func2YRange) * cur) + " ";
    str += "L " + (funcSvgMargin.left + (thickness / 2)) + "," + (funcSvgMargin.top + funcSvgHeight) + " ";
    for (var i = 1; i <= 10; i++) {
        cur = realData[i];
        avg += cur;
        str += "L " + (funcSvgMargin.left + (funcSvgWidth / 10) * i - (thickness / 2)) + "," + (funcSvgMargin.top + funcSvgHeight) + " ";
        str += "L " + (funcSvgMargin.left + (funcSvgWidth / 10) * i - (thickness / 2)) + "," + (funcSvgMargin.top + funcSvgHeight - (funcSvgHeight / func2YRange) * cur) + " ";
        str += "L " + (funcSvgMargin.left + (funcSvgWidth / 10) * i + (thickness / 2)) + "," + (funcSvgMargin.top + funcSvgHeight - (funcSvgHeight / func2YRange) * cur) + " ";
        str += "L " + (funcSvgMargin.left + (funcSvgWidth / 10) * i + (thickness / 2)) + "," + (funcSvgMargin.top + funcSvgHeight) + " ";
    }
    d3.select("#realCostGraph").attr("d", str);


    avg = avg / 11;
    str = "M " + funcSvgMargin.left + "," + (funcSvgMargin.top + funcSvgHeight) + " ";
    str += "L " + funcSvgMargin.left + "," + (funcSvgMargin.top + funcSvgHeight - (funcSvgHeight / func2YRange) * avg);
    str += "L " + (funcSvgMargin.left + funcSvgWidth) + "," + (funcSvgMargin.top + funcSvgHeight - (funcSvgHeight / func2YRange) * avg);
    str += "L " + (funcSvgMargin.left + funcSvgWidth) + "," + (funcSvgMargin.top + funcSvgHeight) + " ";
    d3.select("#averageCostGraph").attr("d", str);
};


Heap.prototype.getMin = function () {
    return this.minPointer;
};

/**
 * Add an edge to the Heap
 * @param startId {Number|String} id of start node
 * @param endId {Number|String} id of end node
 */
Heap.prototype.addEdge = function (startId, endId) {
    var s = this.nodes.get(startId);
    var t = this.nodes.get(endId);
    var edge = new Heap.Edge(s, t, this.edgeIds++);
    edge.start.outEdges.set(edge.id, edge);
    edge.end.inEdges.set(edge.id, edge);
    this.edges.set(edge.id, edge);
    return edge;
};


Heap.prototype.addEdgeToParent = function (node) {
    if (node.parent) {
        this.addEdge(parent.id, node.id);
    }
};

Heap.prototype.addEdgesToChildren = function (node) {
    var chil = node.children;
    for (var i = 0; i < chil.length; i++) {
        this.addEdge(node.id, chil[i].id);
    }
};

Heap.prototype.decreaseKey = function (decreaseNode, input) {
    decreaseNode.ele = input.value;
    if (decreaseNode.parent) {
        if (+decreaseNode.ele < +decreaseNode.parent.ele) {
            realCurCost++;
            this.cutOut(decreaseNode);
            realData.push(realCurCost);
            realData.shift();
            realCurCost = 0;
        } else {
            realData.push(1);
            realData.shift();
            realCurCost = 0;
        }
    } else {
        realData.push(1);
        realData.shift();
        realCurCost = 0;
        this.updateMinPointer();
    }
    this.updatePotential();
    this.rearrangeNodes();
};

Heap.prototype.recoverEdges = function (node) {
    this.addEdgeToParent(node);
    this.addEdgesToChildren(node);
};

Heap.prototype.recoverAllEdges = function () {//add Edge to parent for every Node
    var count = 1;
    while (count < this.nodeIds) {
        this.addEdgeToParent(this.nodes.get(count));
        count++;
    }
};

Heap.prototype.removeNode = function (id) {
    realCurCost++;
    var node = this.nodes.get(id);
    if (node.marked) {
        this.markedNodes--;
    }
    if (node.parent) {
        if (node.parent.marked) {
            this.cutOut(node.parent);
        } else {
            if (node.parent.parent) {
                node.parent.marked = true;
                this.markedNodes++;
            }

        }
        var childr = node.parent.children;
        childr.splice(childr.indexOf(node), 1);
        node.parent.degree--;
    }
    var length = node.children.length;
    for (var j = 0; j < length; j++) {
        this.addToMainNodes(node.children[0]);
    }
    this.removeAllEdges(node);
    this.nodes.remove(id);
    if (!node.parent) {
        this.numMainNodes--;
        var index = this.mainNodes.indexOf(node);
        this.mainNodes.splice(index, 1);
    }
    this.numNodes--;
    this.consolidate();
    realData.push(realCurCost);
    realData.shift();
    realCurCost = 0;
    this.updatePotential();
    return node;
};

Heap.prototype.onlyRemoveNode = function (node) {
    if (node.parent) {
        node.parent.children.splice(node.parent.children.indexOf(node), 1);
        node.parent.degree--;
    } else {
        this.numMainNodes--;
        var index = this.mainNodes.indexOf(node);
        this.mainNodes.splice(index, 1);
    }
    this.numNodes--;
    this.removeAllEdges(node);
    this.nodes.remove(node.id);
};


Heap.prototype.updateMinPointer = function () {
    if (this.minPointer) {
        this.minPointer.min = false;
    }
    var curMin = null;
    for (var i = 0; i < this.mainNodes.length; i++) {
        if (!curMin || +this.mainNodes[i].ele < +curMin.ele) {
            curMin = this.mainNodes[i];
        }
    }
    this.minPointer = curMin;
    if (this.minPointer)
        this.minPointer.min = true;
};


var consCount = 0;
var consLength = 0;

Heap.prototype.consolidate = function () {
    var map = d3.map();
    consLength = this.mainNodes.length;
    realCurCost += consLength;
    consCount = 0;
    while (consCount < consLength) {
        var curNode = this.mainNodes[consCount];
        map = this.mapHandling(map, curNode);
        consCount++;
    }
    this.numMainNodes = this.mainNodes.length;
    this.rearrangeNodes();
};

Heap.prototype.mapHandling = function (map, curNode) {
    var degree = curNode.degree;
    var newParent = map.get(degree);
    if (newParent) {
        map.remove(newParent.degree);
        if (+curNode.ele < +newParent.ele) {
            this.mainNodes.splice(this.mainNodes.indexOf(newParent), 1);
            this.addChildToParent(newParent, curNode);
            map = this.mapHandling(map, curNode);
        } else {
            this.mainNodes.splice(this.mainNodes.indexOf(curNode), 1);
            this.addChildToParent(curNode, newParent);
            map = this.mapHandling(map, newParent);
        }
        consCount--;
        consLength--;
    } else {
        map.set(degree, curNode);
    }
    return map;
};


Heap.prototype.addChildToParent = function (child, parent) {
    child.parent = parent;
    child.parentsChild = parent.children.length;
    parent.children.push(child);
    parent.degree++;
    this.addEdge(parent.id, child.id);
};


Heap.prototype.addToMainNodes = function (node) {
    realCurCost++;
    if (node.parent) {
        var index = node.parent.children.indexOf(node);
        node.parent.children.splice(index, 1);
        node.parent.degree--;
    }
    this.numMainNodes++;
    if (node.marked) {
        this.markedNodes--;
        node.marked = false;
    }
    this.mainNodes.push(node);
    var that = this;
    node.inEdges.forEach(function (key) {
        that.removeEdge(key);
    });
    node.parent = null;
};

Heap.prototype.getIdInMainNodes = function (id) {
    return this.mainNodes[id];
};

Heap.prototype.getNextId = function () {
    return this.nodeIds;
};

Heap.prototype.cutOut = function (node) {
    if (node.marked) {
        this.markedNodes--;
        node.marked = false;
    }
    var parent = node.parent;
    this.addToMainNodes(node);
    if (parent) {
        if (parent.marked) {
            this.cutOut(parent);
        } else {
            if (parent.parent) {//Not a Main Node
                parent.marked = true;
                this.markedNodes++;
            }
        }
    }
};




Heap.prototype.rearrangeNodes = function () {
    this.updateMinPointer();
    this.markedNodes = 0;
    this.numMainNodes = 0;
    squeeze = true;
    var length = this.mainNodes.length;
    for (var l = 0; l < length; l++) {
        this.numMainNodes++;
        this.mainNodes[l].setCoor(this, 0, 0);
        this.mainNodes[l].isMain = true;
    }
    if (needMoreSpace && !lockDistance) {
        needMoreSpace = false;
        mainNodeDistance = mainNodeDistance * 2;
        if (mainNodeDistance > 700) {
            mainNodeDistance = 700;
            lockDistance = true;
        }
        maxMainNodes = Math.floor(700 / mainNodeDistance) * 2;
        //data.unshift(0);
        //data.pop();
        this.rearrangeNodes();
    } else
    if (squeeze && mainNodeDistance > startDistance) {
        lockDistance = false;
        mainNodeDistance = mainNodeDistance / 2;
        maxMainNodes = Math.floor(700 / mainNodeDistance) * 2;
        this.rearrangeNodes();
    } else {
    }

};




Heap.prototype.removeAllEdges = function (node) {
    var that = this;
    node.outEdges.forEach(function (key) {
        that.removeEdge(key);
    });
    node.inEdges.forEach(function (key) {
        that.removeEdge(key);
    });
};


Heap.prototype.removeEdge = function (id) {
    return this.edges.remove(id);
};

Heap.prototype.getNodes = function () {
    return this.nodes.values();
};

Heap.prototype.getEdges = function () {
    return this.edges.values();
};


/////////////////
//STATICS



/**
 * Graph parser static factory method
 * constructs a Heap object from a textuatl representation of the Heap.
 * @static
 * @param {String} text - sequentialized Heap
 * @param {boolean} animated - if the build should be animated or not
 * @return {Heap} - parsed Heap object
 */
Heap.parse = function (text, animated) {
    var graph = new Heap();
    realData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var lines = text.split("\n");
    // Nach Zeilen aufteilen
    for (var line in lines) {
        var s = lines[line].split(" ");
        // Nach Parametern aufteilen
        if (s[0] === "%") { //comment
            continue;
        }
        if (s[0] === "n") {
            var node = graph.addNode(s[1]);
        }
        if (s[0] === "d") {
            var min = graph.getMin();
            graph.removeNode(min.id);
        }
    }

    if (graph.nodeIds === 0 && graph.edgeIds === 0) {
        throw "parse error";
    }
    return graph;
};

/**
 * Singleton to have just one Heap instance per app.
 */
Heap.instance = null;

/**
 * Add callback functions to be executed after a Heap was loaded asynchronically, e.g. to initialize the application
 */
Heap.addChangeListener = function (callbackFp) {
    Heap.onLoadedCbFP.push(callbackFp);
};
Heap.onLoadedCbFP = [];

/**
 * Replace the current Heap singleton instance and call the defined callback functions.
 * This function is both called asyncronically from within ajax loading of Heaps from servers and from local file uploads.
 */
Heap.setInstance = function (error, text, filename, exceptionFp, animated) {
    if (error !== null) {
        exceptionFp ? exceptionFp(error, text, filename) : console.log(error, text, filename);
        return;
    }
    ;
    var noErrors = false;
    try {
        Heap.instance = Heap.parse(text, animated);
        noErrors = true;
    } catch (ex) {
        if (exceptionFp)
            exceptionFp(ex, text, filename);
        else
            console.log(ex, text, filename);
    }
    if (noErrors)
        Heap.onLoadedCbFP.forEach(function (fp) {
            fp();
        });
};

/**
 * Ajax Heap file loading from a server
 * using d3.text instead of raw ajax calls
 * calls setInstance async.
 */
Heap.loadInstance = function (filename, exceptionFp, animated) {
    d3.text(filename, function (error, text) {
        Heap.setInstance(error, text, filename, exceptionFp, animated);
    });
    return true;
};


Heap.buildInstance = function (text, animated) {
    Heap.setInstance(null, text, "build", null, animated);
};

/**
 * Upload Heap file from a local computer
 * using HTML5 FileReader feature
 * calls setInstance async.
 */
Heap.handleFileSelect = function (evt, exceptionFp) {
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

        // Only process image files.
        if (!f.type.match('text/plain')) {
            exceptionFp("wrong mimetype", f.type);
            continue;
        }

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function (theFile) {
            return function (e) {
                var error = e.target.error;
                var text = e.target.result;
                var filename = theFile.name;
                Heap.setInstance(error, text, filename, exceptionFp);
            };
        })(f);
        // Read in the image file as a data URL.
        reader.readAsText(f);
    }
};

