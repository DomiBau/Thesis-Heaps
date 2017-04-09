/**
 * @fileOverview
 * This file contains a basic binary heap model.
 *
 * @author Dominique Bau
 *
 * @requires d3.map, an associative array similar to new Object() / {}
 */


/*
 * @constructor
 */
function BinaryHeap(){
    this.nodeIds=0;
    this.edgeIds=0;
    
    this.nodes=d3.map();
    this.edges=d3.map();
}

BinaryHeap.Node = function(x,y,id,ele){
    this.x=x;
    this.y=y;
    this.id=id;
    this.ele=ele;
    
    //outgoing and incoming edges are saved to facilitate handling of vertices in algorithms
    this.outEdges=d3.map();
    this.inEdges=d3.map();
}

/**
 * Incoming edges of the node.
 * @return [BinaryHeap.Edge]
 */
BinaryHeap.Node.prototype.getInEdges = function(){
  return this.inEdges.values();
};

/**
 * Outgoing edges of the node.
 * @return [BinaryHeap.Edge]
 */
BinaryHeap.Node.prototype.getOutEdges = function(){
  return this.outEdges.values();
};

/**
 * Represents an edge
 * @constructor
 */
BinaryHeap.Edge = function(s,t,id){
  this.start=s;
  this.end=t;
  this.id=id;
};



BinaryHeap.prototype.addNode = function(ele){
  var node = new BinaryHeap.Node(x,y,this.nodeIds++,ele);
  this.nodes.set(node.id,node);
  setCoor(node);
  return node;
};

/**
 * Add callback functions to be executed after a graph was loaded asynchronically, e.g. to initialize the application
 */
BinaryHeap.addChangeListener = function(callbackFp){
  BinaryHeap.onLoadedCbFP.push(callbackFp);
}
BinaryHeap.onLoadedCbFP = [];


BinaryHeap.prototype.addNodeDirectly = function(node){
  node.id = this.nodeIds++;
  this.nodes.set(node.id,node);
  setCoor(node);
  return node;
};


BinaryHeap.prototype.addEdge = function(startId,endId){
  var s = this.nodes.get(startId);
  var t = this.nodes.get(endId);
  var edge = new BinaryHeap.Edge(s,t,this.edgeIds++);
  edge.start.outEdges.set(edge.id,edge);
  edge.end.inEdges.set(edge.id,edge);
  this.edges.set(edge.id,edge);
  return edge;
};


BinaryHeap.prototype.addEdgeDirectly = function(edge){
  edge.id = this.edgeIds++;
  edge.start.outEdges.set(edge.id,edge);
  edge.end.inEdges.set(edge.id,edge);
  this.edges.set(edge.id,edge);
  return edge;
};


BinaryHeap.prototype.removeNode = function(id){
    if(id!==this.nodeIds){
        var delNode = this.nodes.get(id);
        var lastNode = this.nodes.get(this.nodeIds);
        this.nodes.remove(delNode.id);
        this.nodes.remove(lastNode.id);
        var temp = delNode.id;
        delNode.id=lastNode.id;
        lastNode.id = temp;
        this.nodes.set(lastNode.id,lastNode);
        this.nodes.set(delNode.id,delNode);
    }
    //TODO!!
    this.nodeIds--;
};

BinaryHeap.instance = null;

BinaryHeap.prototype.removeEdge = function(id){
    return this.edges.remove(id);
};


BinaryHeap.prototype.getNodes = function(){
  return this.nodes.values();
};

BinaryHeap.prototype.getEdges = function(){
  return this.edges.values();
};

BinaryHeap.prototype.replace = function(oldGraph){
  this.nodeIds = oldGraph.nodeIds;
  this.edgeIds = oldGraph.edgeIds;
  this.nodes = oldGraph.nodes;
  this.edges = oldGraph.edges;
};

BinaryHeap.prototype.toString = function(){
    
}



var setCoor = function(node){
    var nx=0;
    var ny=0;
    switch(node.id){
        case 1:
            nx=350;
            ny=550;
            break;
        case 2:
            nx=175;
            ny=450;
            break;
        case 3:
            nx=525;
            ny=450;
            break;
        case 4:
            nx=87,5;
            ny=350;
            break;
        case 5:
            nx=262,5;
            ny=350;
            break;
        case 6:
            nx=437,5;
            ny=350;
            break;
        case 7:
            nx=612,5;
            ny=350;
            break;
        case 8:
            nx=43,75;
            ny=250;
            break;
        case 9:
            nx=131,25;
            ny=250;
            break;
        case 10:
            nx=218,75;
            ny=250;
            break;
        case 11:
            nx=306,25;
            ny=250;
            break;
        case 12:
            nx=393,75;
            ny=250;
            break;
        case 13:
            nx=481,25;
            ny=250;
            break;
        case 14:
            nx=568,75;
            ny=250;
            break;
        case 15:
            nx=656,25;
            ny=250;
            break;
        case 16:
            nx=21,875;
            ny=150;
            break;
        case 17:
            nx=65,625;
            ny=150;
            break;
        case 18:
            nx=109,375;
            ny=150;
            break;
        case 19:
            nx=153,125;
            ny=150;
            break;
        case 20:
            nx=196,875;
            ny=150;
            break;
        case 21:
            nx=240,625;
            ny=150;
            break;
        case 22:
            nx=284,375;
            ny=150;
            break;
        case 23:
            nx=328,125;
            ny=150;
            break;
        case 24:
            nx=371,875;
            ny=150;
            break;
        case 25:
            nx=415,625;
            ny=150;
            break;
        case 26:
            nx=459,375;
            ny=150;
            break;
        case 27:
            nx=503,125;
            ny=150;
            break;
        case 28:
            nx=546,875;
            ny=150;
            break;
        case 29:
            nx=590,625;
            ny=150;
            break;
        case 30:
            nx=634,375;
            ny=150;
            break;
        case 31:
            nx=678,125;
            ny=150;
    }
    node.x=nx;
    node.y=ny;
}