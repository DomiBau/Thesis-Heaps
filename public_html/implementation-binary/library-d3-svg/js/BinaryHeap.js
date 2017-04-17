var BinaryHeap = function (svgOrigin) {
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
        deselectNode();
        /*if(animated){
            var ids = Graph.instance.dekrIds();
            if(ids === 1){
                Graph.instance.getNodes().remove(ids);
                that.update();
            }else{
                var lastNode = d.id === ids;
                if(!lastNode){
                    
                }
            }
        }else{*/
            Graph.instance.removeNode(d.id);
            that.update();
        //}
    };
    
    /*this.swapNodes = function(id1,id2) {
        var g = Graph.instance;
        var nodes = g.getNodes();
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
        g.removeAllEdges(g, nodeOne);
        g.recoverEdges(nodeOne);
        g.removeAllEdges(g, nodeTwo);
        g.recoverEdges(nodeTwo);
        that.update();
        return nodeOne;
    };
    
    this.sift = function() {
        
    };
    
    this.siftDown = function() {
        
    };
    
    this.siftUp = function() {
        
    };*/

    this.removeMin = function () {
        deselectNode();
        selectNode(Graph.instance.getMin());
        this.removeSelected();
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
BinaryHeap.prototype = Object.create(GraphDrawer.prototype);
BinaryHeap.prototype.constructor = BinaryHeap;