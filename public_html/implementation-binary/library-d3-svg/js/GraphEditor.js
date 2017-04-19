var status = 0;
var REMOVE_LAST = 1;
var SIFT_UP = 2;
var SIFT_DOWN = 3;
var SIFT_DOWN_ALL = 10;
var FINISHED = 20;
var nextIdToSift;
var siftNode = null;
var animated = false;

var GraphEditor = function (svgOrigin) {
    GraphDrawer.call(this, svgOrigin, null, 0);

    this.type = "GraphEditor";

    this.svgOrigin
            .on("mousedown", mousedown)
            .on("contextmenu", function (d) {
                d3.event.stopPropagation();
                d3.event.preventDefault()
            });

    this.onNodesEntered = function (selection) {
        selection
                .on("mousedown", mousedownNode)
                .on("mouseup", mouseupNode);
    };

    this.onNodesUpdated = function (selection) {
        selection
                .style("cursor", "pointer")
                .selectAll("circle")
                .style("stroke", function (d) {
                    if (d === selectedNode) {
                        return const_Colors.NodeBorderHighlight;
                    } else {
                        return global_NodeLayout['borderColor'];
                    }
                });
    };

    this.onEdgesEntered = function (selection) {

    };

    this.onEdgesUpdated = function (selection) {

    };

    this.doUpdate = function () {
        that.update();
    };

    this.removeSelected = function () {
        var d = selectedNode;
        var oldId = d.id;
        deselectNode();
        if (animated) {//animated
            var ids = Graph.instance.dekrIds();
            var nodes = Graph.instance.nodes;
            if (ids === 1) {
                nodes.remove(ids);
                that.update();
            } else {
                var lastNode = oldId === ids;
                if (!lastNode)this.swapNodes(oldId,ids);
                var node = nodes.get(oldId);
                that.update();
                siftNode = node;
                this.changeDescriptWindow(REMOVE_LAST);
                $('#describtionOfOperation').css({'display': "block"});
                $('#tg_div_statusWindow').css({'display': "none"});
            }
        } else {
            Graph.instance.removeNode(oldId);
            that.update();
        }
    };
    
    this.insertNode = function(ele) {
        if(animated){
            siftNode = Graph.instance.addLast(ele);
            this.changeDescriptWindow(SIFT_UP);
            $('#describtionOfOperation').css({'display': "block"});
            $('#tg_div_statusWindow').css({'display': "none"});
        } else {
            var insNode = Graph.instance.addNode(ele);
            Graph.instance.addEdgeToParent(insNode);
        }
        that.update();
    };
    
    this.decreaseKey = function(input){
        var d = selectedNode;
        d.ele = input.value;
        $('#describtionOfOperation').css({'display': "block"});
        $('#tg_div_statusWindow').css({'display': "none"});
        this.changeDescriptWindow(SIFT_UP);
    };
    
    this.removeLastNode = function(){//nodeIds is already decreased (number of stil existing nodes)
        var node = Graph.instance.nodes.get(Graph.instance.nodeIds);
        Graph.instance.removeAllEdges(node);
        Graph.instance.nodes.remove(node.id);
        this.changeDescriptWindow(SIFT_DOWN);
    };
    
    this.nextOperation = function() {
        switch(+status){
            case +FINISHED:
                $('#describtionOfOperation').css({'display': "none"});
                $('#tg_div_statusWindow').css({'display': "block"});
                break;
            case +REMOVE_LAST:
                this.removeLastNode();
                break;
            case +SIFT_UP:
                siftNode = this.siftUp(siftNode);
                break;
            case +SIFT_DOWN:
                siftNode = this.siftDown(siftNode);
                break;
            case +SIFT_DOWN_ALL:
                if(siftNode)siftNode = this.siftDown(siftNode);
                else this.changeDescriptWindow(FINISHED);
                if(+status===+FINISHED&&+nextIdToSift>1){
                    nextIdToSift--;
                    siftNode=Graph.instance.nodes.get(nextIdToSift);
                    this.changeDescriptWindow(SIFT_DOWN_ALL);
                }
                break;
        }
        that.update();
    };
    
    
    this.changeAnimated = function(){
        animated = !animated;
    };
    
    this.buildHeap = function (text){
        Graph.buildInstance(text,animated);
        if(animated){
            var nextId = Math.floor((Graph.instance.nodeIds-1)/2);
            siftNode = Graph.instance.nodes.get(nextId);
            nextIdToSift = nextId;
            this.changeDescriptWindow(SIFT_DOWN_ALL);
            $('#describtionOfOperation').css({'display': "block"});
            $('#tg_div_statusWindow').css({'display': "none"});
        }
        that.update();
    };
    
    
    
    this.changeDescriptWindow = function (newStatus) {
        switch (newStatus){
            case FINISHED:
                $('#firstTest').css({'display': "none"});
                $('#fourthTest').css({'display': "block"});
                break;
            case SIFT_UP:
                $('#firstTest').css({'display': "none"});
                $('#secondTest').css({'display': "block"});
                break;
            case SIFT_DOWN:
                break;
            case REMOVE_LAST:
                break;
            case SIFT_DOWN_ALL:
                break;
            /*case :
                break;
            case :
                break;
            case :
                break;
            */
        }
        status = newStatus;
    };

    this.swapNodes = function (id1, id2) {
        var nodes = Graph.instance.nodes;
        var nodeOne = nodes.get(id1);
        var nodeTwo = nodes.get(id2);
        nodes.remove(nodeOne.id);
        nodes.remove(nodeTwo.id);
        var temp = nodeOne.id;
        nodeOne.id = nodeTwo.id;
        nodeTwo.id = temp;
        nodes.set(nodeTwo.id, nodeTwo);
        nodes.set(nodeOne.id, nodeOne);
        nodeOne.setCoor();
        nodeTwo.setCoor();
        Graph.instance.removeAllEdges(nodeOne);
        Graph.instance.recoverEdges(nodeOne);
        Graph.instance.removeAllEdges(nodeTwo);
        Graph.instance.recoverEdges(nodeTwo);
        return nodeOne;
    };

    this.siftUp = function (node) {
        if(node.id === 1){
            this.changeDescriptWindow(FINISHED);
            return node;
        }
        var parentId;
        if (node.id % 2 === 0)parentId = node.id / 2; 
        else parentId = (node.id - 1) / 2;
        var parent = Graph.instance.nodes.get(parentId);
        if (+node.ele < +parent.ele) {
            node = this.swapNodes(node.id, parent.id);
        }else{
            this.changeDescriptWindow(FINISHED);
        }
        return node;
    };

    this.siftDown = function (node) {
        var nodes = Graph.instance.nodes;
        if (node.id * 2 + 1 < +Graph.instance.nodeIds) {
            var lefChild = nodes.get(node.id * 2);
            var rigChild = nodes.get(node.id * 2 + 1);
            if (+lefChild.ele <= +rigChild.ele && +lefChild.ele < +node.ele) {
                node = this.swapNodes(node.id, lefChild.id);
            } else if (+rigChild.ele <= +lefChild.ele && +rigChild.ele < +node.ele) {
                node = this.swapNodes(node.id, rigChild.id);
            }else{
                this.changeDescriptWindow(FINISHED);
            }
        } else if (node.id * 2 < +Graph.instance.nodeIds) {
            var child = nodes.get(node.id * 2);
            if (+child.ele < +node.ele) {
                node = this.swapNodes(node.id, child.id);
            }
            this.changeDescriptWindow(FINISHED);
        }else{
            this.changeDescriptWindow(FINISHED);
        }
        return node;
    };


    this.removeMin = function () {
        var node = Graph.instance.getMin();
        if(node===null)return;
        selectNode(node);
        this.removeSelected();
    };
    
    this.updateArray = function(){
        var str = "[";
        var nodes = Graph.instance.nodes;
        var ids = Graph.instance.nodeIds;
        if(ids>1)str = str + nodes.get(1).ele;
        for(i = 2; i<ids; i++){
            str = str + ", " + nodes.get(i).ele;
        }
        /*for(i = ids; i<31; i++){
            str = str + ",";
        }*/
        str = str + "]";
        document.getElementById("ArrayPre").innerHTML = str;
    };

    var that = this;


    /**
     * Der aktuell ausgewählte Knoten
     */
    var selectedNode = null;
    this.getSelectedNode = function () {
        return selectedNode;
    };


    var deselectNode = function () {
        if (selectedNode !== null) {
            selectedNode = null;
        }
        that.svgOrigin.style("cursor", "default");
        that.update();
        $("#DeleteMenu").css({'display': "none"});
    };

    var selectNode = function (selection) {
        selectedNode = selection;
        var x = selectedNode.x + "px";
        var y = selectedNode.y + "px";
        $("#DeleteMenu").css({'bottom': y, 'left': x, 'display': "inline"});
    };

    /**
     * End of mouseclick on a node
     * @method
     */
    function mouseupNode() {
        if (selectedNode) {
            svgOrigin.create();
        }
        hasDragged = false;
        d3.event.stopPropagation(); //we dont want svg to receive the event
        that.updateNodes();
    }

    function mousedownNode(d, id) {
        if (selectedNode === d) {// Falls wir wieder auf den selben Knoten geklickt haben, hebe Auswahl auf.
            deselectNode();
        } else if (selectedNode === null) { // Falls wir nichts ausgewählt hatten, wähle den Knoten aus
            selectNode(d);
        } else {
            deselectNode();
            selectNode(d);
            that.updateEdges();
        }
        that.update();
        d3.event.stopPropagation(); //we dont want svg to receive the event
    }
    //oder ein neuer erstellt (wenn grade kante gezeichnet wird),
// Wir haben nicht auf einem Knoten gestoppt 
// -> Falls etwas ausgewählt war, erstelle Knoten und zeichne Kante
    function mousedown(a, b, c) {
        if (selectedNode !== null) {
            deselectNode();
            that.updateNodes();
        }
    }
};

//inheritance
GraphEditor.prototype = Object.create(GraphDrawer.prototype);
GraphEditor.prototype.constructor = GraphEditor;

//Effective JavaScript, Item 38: Call Superclass Constructors from Subclass Constructors
//
// function SpaceShip(scene, x, y) {
//   Actor.call(this, scene, x, y);
//   this.points = 0;
// }
// SpaceShip.prototype = Object.create(Actor.prototype);
// SpaceShip.prototype.scorePoint = function() { this.points++};
//
// Calling the Actor constructor first ensures that all the instance properties created by Actor are added to the new object. After that, SpaceShip can define its own instance properties such as the ship’s current points count.
// In order for SpaceShip to be a proper subclass of Actor, its prototype must inherit from Actor.prototype. The best way to do the extension is with ES5’s Object.create:
// SpaceShip.prototype = Object.create(Actor.prototype);

// Things to Remember
// - Call the superclass constructor explicitly from subclass construc- tors, passing this as the explicit receiver.
// - Use Object.create to construct the subclass prototype object to avoid calling the superclass constructor.
