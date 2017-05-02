/**
 * @fileOverview
 * This file contains just our basic graph model, 
 * together with methods to parse and sequentialize the graph.
 *
 * @author Dominique Bau
 *
 * @requires d3.map, an associative array similar to new Object() / {}
 */


var mainNodeDistance = 125;
var maxMainNodes = Math.floor(700/mainNodeDistance)*2;
var needMoreSpace = false;
/**
 * @classdesc
 * Represents a graph.
 * Also acts as namespace for Graph.Node, Graph.Edge as well as static variables and functions.
 * @constructor
 */
function Graph() {
    //unique id counter for nodes and edges,
    //increased whenever a node or edge is added to the graph.
    this.nodeIds = 0;
    this.edgeIds = 0;

    this.numMainNodes = 0;
    this.mainNodes = [];
    
    this.numNodes = 0;

    //associative arrays of nodes and edges
    this.nodes = d3.map();
    this.edges = d3.map();

    this.minPointer = null;

}


/**
 * Represents a graph node
 * @constructor
 * @param {number} x - the horizontal position
 * @param {number} y - the vertical position
 * @param {number} id - a unique id
 * @param {number} ele - the number representing the element (key)
 */
Graph.Node = function (x, y, id, ele, parent, parentsChild) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.ele = ele;
    this.parent = parent;
    this.marked = false;
    this.degree = 0;
    this.children = [];
    this.min = false;

    //outgoing and incoming edges are saved to facilitate handling of vertices in algorithms
    this.outEdges = d3.map();
    this.inEdges = d3.map();
};


/**
 * Incoming edges of the node.
 * @return [Graph.Edge]
 */
Graph.Node.prototype.getInEdges = function () {
    return this.inEdges.values();
};

/**
 * Outgoing edges of the node.
 * @return [Graph.Edge]
 */
Graph.Node.prototype.getOutEdges = function () {
    return this.outEdges.values();
};

/**
 * Returns a string representation of this node together with its resources
 * @param {boolean} full - wheater to include the id
 * @param {function} [f] - optional resource accessor function
 */
Graph.Node.prototype.toString = function (full) {
    var str = "";
    if (this.min)
        str += "Min";
    return str;
};



Graph.Node.prototype.setCoor = function (that, offset) {
    if (this.parent) {
        this.x = this.parent.x - offset;
        if(+this.x<0){
            needMoreSpace = true;
            return;
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
        if(x>700){//only possible with delete or decrease 
            x = x - 700;
            x = x - (x % mainNodeDistance) + mainNodeDistance;
            y = 50;
        }
        this.x = x;
        this.y = y;
    }
    var newOffset = 0;
    if (+this.children.length > 0) {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].parentsChild = i;
            newOffset = this.children[i].setCoor(that, newOffset);
        }
        newOffset-=35;
    }
    return offset + newOffset + 35;
};


/**
 * Represents a graph edge
 * @constructor
 */
Graph.Edge = function (s, t, id) {
    this.start = s;
    this.end = t;
    this.id = id;
    this.resources = [];

    this.state = {}; //changes during algorithm runtime
};

/**
 * Returns a string representation of this edge together with its resources
 * @param {boolean} full wheater to include the start and end node ids in the form start->end
 */
Graph.Edge.prototype.toString = function (full, f) {
    var str = "";
    if (full)
        str += this.start.id + "->" + this.end.id + " ";
    return str;
};

/**
 * Returns an alternative string representation of this edge
 */
Graph.Edge.prototype.toStringAlt = function (nodeLabel) {
    var str = "e=(" + nodeLabel(this.start) + "," + nodeLabel(this.end) + ")";
    return str;
};



/////////////////
//MEMBERS

/**
 * add a node to the graph
 * @param ele {Number|String} new element to be inserted
 */
Graph.prototype.addNode = function (ele) {
    if (!ele) {
        ele = Math.ceil(Math.random() * 100);
    }
    if (this.numMainNodes >= maxMainNodes)//maxMainNodes is max capacity for Main nodes
        return;
    this.numNodes++;
    var node = new Graph.Node(-10, 550, this.nodeIds++, ele, null, null);
    this.addToMainNodes(node);
    this.nodes.set(node.id, node);
    this.rearrangeNodes();
    return node;
};





Graph.prototype.getMin = function () {
    return this.minPointer;
};

/**
 * Add an edge to the graph
 * @param startId {Number|String} id of start node
 * @param endId {Number|String} id of end node
 */
Graph.prototype.addEdge = function (startId, endId) {
    var s = this.nodes.get(startId);
    var t = this.nodes.get(endId);
    var edge = new Graph.Edge(s, t, this.edgeIds++);
    edge.start.outEdges.set(edge.id, edge);
    edge.end.inEdges.set(edge.id, edge);
    this.edges.set(edge.id, edge);
    return edge;
};


Graph.prototype.addEdgeToParent = function (node) {
    if (node.parent) {
        this.addEdge(parent.id, node.id);
    }
};

Graph.prototype.addEdgesToChildren = function (node) {
    var chil = node.children;
    for (var i = 0; i < chil.length; i++) {
        this.addEdge(node.id, chil[i].id);
    }
};

Graph.prototype.decreaseKey = function (decreaseNode, input) {
    decreaseNode.ele = input.value;
    if(decreaseNode.parent){
        if (+decreaseNode.ele < +decreaseNode.parent.ele) {
            this.cutOut(decreaseNode);
            this.consolidate();
        }
    }else{
        this.updateMinPointer();
    }
        
};

Graph.prototype.recoverEdges = function (node) {
    this.addEdgeToParent(node);
    this.addEdgesToChildren(node);
};

Graph.prototype.recoverAllEdges = function () {//add Edge to parent for every Node
    var count = 1;
    while (count < this.nodeIds) {
        this.addEdgeToParent(this.nodes.get(count));
        count++;
    }
};

Graph.prototype.removeNode = function (id) {
    var node = this.nodes.get(id);
    if (node.parent) {
        if (node.parent.marked) {
            this.cutOut(node.parent);
        } else {
            if (node.parent.parent) {
                node.parent.marked = true;
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
    return node;
};

Graph.prototype.onlyRemoveNode = function(node){
    if(node.parent){
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


Graph.prototype.updateMinPointer = function () {
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
    if(this.minPointer)this.minPointer.min = true;
};


var consCount = 0;
var consLength = 0;

Graph.prototype.consolidate = function () {
    var map = d3.map();
    consLength = this.mainNodes.length;
    consCount = 0;
    while (consCount < consLength) {
        var curNode = this.mainNodes[consCount];
        map = this.mapHandling(map, curNode);
        consCount++;
    }
    this.numMainNodes = this.mainNodes.length;
    this.rearrangeNodes();
};

Graph.prototype.mapHandling = function (map, curNode) {
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


Graph.prototype.addChildToParent = function (child, parent) {
    child.parent = parent;
    child.parentsChild = parent.children.length;
    parent.children.push(child);
    parent.degree++;
    this.addEdge(parent.id, child.id);
};


Graph.prototype.addToMainNodes = function (node) {
    if(node.parent){
        var index = node.parent.children.indexOf(node);
        node.parent.children.splice(index,1);
        node.parent.degree--;
    }
    this.numMainNodes++;
    node.marked = false;
    this.mainNodes.push(node);
    var that = this;
    node.inEdges.forEach(function (key) {
        that.removeEdge(key);
    });
    node.parent = null;
};

Graph.prototype.getIdInMainNodes = function (id) {
    return this.mainNodes[id];
};

Graph.prototype.getNextId = function () {
    return this.nodeIds;
};

Graph.prototype.cutOut = function (node) {
    node.marked = false;
    var parent = node.parent;
    this.addToMainNodes(node);
    if(parent){
        if (parent.marked) {
            this.cutOut(parent);
        } else {
            if(parent.parent){//Not a Main Node
                parent.marked = true;
            }
        }
    }
};


Graph.prototype.rearrangeNodes = function () {
    this.updateMinPointer();
    var length = this.mainNodes.length;
    for (var l = 0; l < length; l++) {
        this.mainNodes[l].setCoor(this,0);
    }
    if(needMoreSpace){
        needMoreSpace = false;
        mainNodeDistance = mainNodeDistance*2;
        if(mainNodeDistance>700)mainNodeDistance = 700;
        maxMainNodes = Math.floor(700/mainNodeDistance)*2;
        this.rearrangeNodes();
    }
};




Graph.prototype.removeAllEdges = function (node) {
    var that = this;
    node.outEdges.forEach(function (key) {
        that.removeEdge(key);
    });
    node.inEdges.forEach(function (key) {
        that.removeEdge(key);
    });
};


Graph.prototype.removeEdge = function (id) {
    return this.edges.remove(id);
};

Graph.prototype.getNodes = function () {
    return this.nodes.values();
};

Graph.prototype.getEdges = function () {
    return this.edges.values();
};


/////////////////
//STATICS



/**
 * Graph parser static factory method
 * constructs a Graph object from a textuatl representation of the graph.
 * @static
 * @param {String} text - sequentialized Graph
 * @param {boolean} animated - if the build should be animated or not
 * @return {Graph} - parsed Graph object
 */
Graph.parse = function (text, animated) {
    var graph = new Graph();
    var lines = text.split("\n");
    // Nach Zeilen aufteilen
    if (lines[0].split(" ")[0] === "%") {//files
        for (var line in lines) {
            var s = lines[line].split(" ");
            // Nach Parametern aufteilen
            if (s[0] === "%") { //comment
                continue;
            }
            //x y r1 r2 ...
            if (s[0] === "n") {
                var node = graph.addNode(s[1]);
            }
            //s t r1 r2 ... 
            if (s[0] === "e") {
                //graph.addEdge(s[1], s[2]);
            }
        }
    } else {//Build
        var nums = lines[0].split(",");
        for (var num in nums) {
            graph.addNode(nums[num]);
        }
    }
    if (graph.nodeIds === 0 && graph.edgeIds === 0) {
        throw "parse error";
    }
    return graph;
};

/**
 * Singleton to have just one Graph instance per app.
 */
Graph.instance = null;

/**
 * Add callback functions to be executed after a graph was loaded asynchronically, e.g. to initialize the application
 */
Graph.addChangeListener = function (callbackFp) {
    Graph.onLoadedCbFP.push(callbackFp);
};
Graph.onLoadedCbFP = [];

/**
 * Replace the current graph singleton instance and call the defined callback functions.
 * This function is both called asyncronically from within ajax loading of graphs from servers and from local file uploads.
 */
Graph.setInstance = function (error, text, filename, exceptionFp, animated) {
    if (error !== null) {
        exceptionFp ? exceptionFp(error, text, filename) : console.log(error, text, filename);
        return;
    }
    ;
    var noErrors = false;
    try {
        Graph.instance = Graph.parse(text, animated);
        noErrors = true;
    } catch (ex) {
        if (exceptionFp)
            exceptionFp(ex, text, filename);
        else
            console.log(ex, text, filename);
    }
    if (noErrors)
        Graph.onLoadedCbFP.forEach(function (fp) {
            fp();
        });
};

/**
 * Ajax graph file loading from a server
 * using d3.text instead of raw ajax calls
 * calls setInstance async.
 */
Graph.loadInstance = function (filename, exceptionFp, animated) {
    d3.text(filename, function (error, text) {
        Graph.setInstance(error, text, filename, exceptionFp, animated);
    });
};


Graph.buildInstance = function (text, animated) {
    Graph.setInstance(null, text, "build", null, animated);
};

/**
 * Upload graph file from a local computer
 * using HTML5 FileReader feature
 * calls setInstance async.
 */
Graph.handleFileSelect = function (evt, exceptionFp) {
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
                Graph.setInstance(error, text, filename, exceptionFp);
            };
        })(f);
        // Read in the image file as a data URL.
        reader.readAsText(f);
    }
};

