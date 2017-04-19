/**
 * @fileOverview
 * This file contains just our basic graph model, 
 * together with methods to parse and sequentialize the graph.
 *
 * @author Dominique Bau
 *
 * @requires d3.map, an associative array similar to new Object() / {}
 */

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
    this.mainNodes = d3.map();
    
    //associative arrays of nodes and edges
    this.nodes = d3.map();
    this.edges = d3.map();
}

/**
 * Represents a graph node
 * @constructor
 * @param {number} x - the horizontal position
 * @param {number} y - the vertical position
 * @param {number} id - a unique id
 * @param {number} ele - the number representing the element (key)
 */
Graph.Node = function (x, y, id, ele, parent, parentsChild, left, right) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.ele = ele;
    this.parent = parent;
    this.parentsChild = parentsChild;
    this.left = left;
    this.right = right;

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
Graph.Node.prototype.toString = function (full, f) {
    var str = "";
    if (full)
        str += this.id + " ";
    return str;
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
    if (this.nodeIds >= 32)//32 is max capacity for nodes
        return;
    var node = new Graph.Node(-10, 550, this.nodeIds++, ele, null, null);
    this.numMainNodes++;
    node.x = node.x + this.numMainNodes*100;
    while(node.x>=700){
        node.x = node.x-700;
        node.y = node.y - 225;
    }
    this.nodes.set(node.id, node);
    return node;
};

Graph.prototype.addLast = function (ele) {
    if (!ele) {
        ele = Math.ceil(Math.random() * 100);
    }
    var node = new Graph.Node(0,0,this.nodeIds++, ele);
    node.setCoor();
    this.nodes.set(node.id, node);
    this.addEdgeToParent(node);
    return node;
};


Graph.prototype.getMin = function () {
    if(this.nodeIds===1)return null;
    var node = this.nodes.get(1);
    return node;
};


Graph.prototype.addNodeDirectly = function (node) {
    node.id = this.nodeIds++;
    node.initResources(this.getNodeResourcesSize());
    this.nodes.set(node.id, node);
    return node;
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

Graph.prototype.addEdgeDirectly = function (edge) {
    edge.id = this.edgeIds++;
    edge.start.outEdges.set(edge.id, edge);
    edge.end.inEdges.set(edge.id, edge);
    this.edges.set(edge.id, edge);
    var max = this.getEdgeResourcesSize();
    while (edge.resources.length < max)
        edge.resources.push(Math.round(Math.random() * 10));
    return edge;
};

Graph.prototype.addEdgeToParent = function (node) {
    if (node.id === 1)
        return;
    if ((node.id % 2) === 0) {
        parentNumber = node.id / 2;
    } else {
        parentNumber = (node.id - 1) / 2;
    }
    this.addEdge(parentNumber, node.id);
};

Graph.prototype.addEdgesToChildren = function (node) {
    if (node.id * 2 < this.nodeIds) {
        this.addEdge(node.id, node.id * 2);
    }
    if (((node.id * 2) + 1) < this.nodeIds) {
        this.addEdge(node.id, node.id * 2 + 1);
    }
};

Graph.prototype.decreaseKey = function (decreaseNode, input) {
    decreaseNode.ele = input.value;
};

Graph.prototype.recoverEdges = function (node) {
    this.addEdgeToParent(node);
    this.addEdgesToChildren(node);
};

Graph.prototype.recoverAllEdges = function () {
    var count = 1;
    while (count < this.nodeIds) {
        this.addEdgeToParent(this.nodes.get(count));
        count++;
    }
};

Graph.prototype.removeNode = function (id) {
    this.nodeIds--;
    if (this.nodeIds === 1) {
        this.nodes.remove(id);
        return;
    }
    if (id !== this.nodeIds) {
        this.swapNodes(id, this.nodeIds);
    }
    var node = this.nodes.get(this.nodeIds);
    var that = this;
    this.removeAllEdges(node);
    this.nodes.remove(node.id);
    if(id!== this.nodeIds){
    }
    return node;
};

Graph.prototype.getNextId = function(){
    return this.nodeIds;
};

Graph.prototype.inkrIds = function(){
    this.nodeIds++;
    return this.nodeIds;
};

Graph.prototype.dekrIds = function(){
    this.nodeIds--;
    return this.nodeIds;
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


Graph.prototype.swapNodes = function (id1, id2) {
    var nodeOne = this.nodes.get(id1);
    var nodeTwo = this.nodes.get(id2);
    this.nodes.remove(nodeOne.id);
    this.nodes.remove(nodeTwo.id);
    var temp = nodeOne.id;
    nodeOne.id = nodeTwo.id;
    nodeTwo.id = temp;
    this.nodes.set(nodeTwo.id, nodeTwo);
    this.nodes.set(nodeOne.id, nodeOne);
    nodeOne.setCoor();
    nodeTwo.setCoor();
    this.removeAllEdges(nodeOne);
    this.recoverEdges(nodeOne);
    this.removeAllEdges(nodeTwo);
    this.recoverEdges(nodeTwo);
    return nodeOne;
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
 * Style node or edge resources
 * @static
 */
Graph.styleResources = function (resources, left, right, f) {
    var f = f || function (d) {
        return d;
    };
    var str = resources.map(f).join(",");
    if (resources.length > 1)
        str = left + str + right;
    return str;
};

/**
 * Graph serializer static method
 * Serialize a graph with all resources to string, used when downloading a graph.
 * @static
 * @param {Graph} [graph] - Graph object. If not given the current Graph.instance is used
 * @return {String} text - sequentialized Graph
 */
Graph.stringify = function (graph) {
    var graph = graph || Graph.instance;
    var lines = []; //text.split("\n");

    lines.push("% Graph saved at " + new Date());

    graph.nodes.forEach(function (key, node) {
        var line = "n " + node.x + " " + node.y;
        if (node.resources.length > 0)
            line += " " + node.resources.join(" ");
        lines.push(line);
    });
    graph.edges.forEach(function (key, edge) {
        var line = "e " + edge.start.id + " " + edge.end.id;
        if (edge.resources.length > 0)
            line += " " + edge.resources.join(" ");
        lines.push(line);
    });

    var text = lines.join("\n");
    return text;
};

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
            if(animated){
                graph.addLast(nums[num]);
            }else{
                graph.addNode(nums[num]);
            }
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
        //Graph.instance.recoverAllEdges();
        document.getElementById("ArrayPre").innerHTML = "Führe eine Operation durch um die Arraydarstelung zu sehen.";
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
                Graph.setInstance(error, text, filename, exceptionFp)
            };
        })(f);
        // Read in the image file as a data URL.
        reader.readAsText(f);
    }
}

Graph.Node.prototype.setCoor = function (parentNode) {
    
    /*var nx = 0;
    var ny = 0;
    switch (this.id) {
        case 1:
            nx = 350;
            ny = 550;
            break;
        case 2:
            nx = 175;
            ny = 450;
            break;
        case 3:
            nx = 525;
            ny = 450;
            break;
        case 4:
            nx = 87, 5;
            ny = 350;
            break;
        case 5:
            nx = 262, 5;
            ny = 350;
            break;
        case 6:
            nx = 437, 5;
            ny = 350;
            break;
        case 7:
            nx = 612, 5;
            ny = 350;
            break;
        case 8:
            nx = 43, 75;
            ny = 250;
            break;
        case 9:
            nx = 131, 25;
            ny = 250;
            break;
        case 10:
            nx = 218, 75;
            ny = 250;
            break;
        case 11:
            nx = 306, 25;
            ny = 250;
            break;
        case 12:
            nx = 393, 75;
            ny = 250;
            break;
        case 13:
            nx = 481, 25;
            ny = 250;
            break;
        case 14:
            nx = 568, 75;
            ny = 250;
            break;
        case 15:
            nx = 656, 25;
            ny = 250;
            break;
        case 16:
            nx = 21, 875;
            ny = 150;
            break;
        case 17:
            nx = 65, 625;
            ny = 150;
            break;
        case 18:
            nx = 109, 375;
            ny = 150;
            break;
        case 19:
            nx = 153, 125;
            ny = 150;
            break;
        case 20:
            nx = 196, 875;
            ny = 150;
            break;
        case 21:
            nx = 240, 625;
            ny = 150;
            break;
        case 22:
            nx = 284, 375;
            ny = 150;
            break;
        case 23:
            nx = 328, 125;
            ny = 150;
            break;
        case 24:
            nx = 371, 875;
            ny = 150;
            break;
        case 25:
            nx = 415, 625;
            ny = 150;
            break;
        case 26:
            nx = 459, 375;
            ny = 150;
            break;
        case 27:
            nx = 503, 125;
            ny = 150;
            break;
        case 28:
            nx = 546, 875;
            ny = 150;
            break;
        case 29:
            nx = 590, 625;
            ny = 150;
            break;
        case 30:
            nx = 634, 375;
            ny = 150;
            break;
        case 31:
            nx = 678, 125;
            ny = 150;
            break;
        default://should not happen
            nx = 0;
            ny = 0;
    }
    this.x = nx;
    this.y = ny;*/
    if(this.parent!==-1){
        var offset = this.parentsChild*20;
        if(parentNode){
            this.x = parentNode.x - offset;
            this.y = parentNode.y - 50;
        }
    }else{
        
    }
    
};