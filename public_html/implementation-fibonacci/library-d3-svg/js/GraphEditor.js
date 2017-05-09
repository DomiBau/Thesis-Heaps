var status = 0;
var DELETE = 1;
var INSERT = 2;
var DECREASE = 3;
var CUTOUT = 4;
var CONSOLIDATE = 10;
var COMBINE = 11;
var FINISHED = 20;
var cutOutNode = null;
var nextConId = 0;
var childrenToAdd = [];
var animated = false;
var inAnimation = false;
var conMap = d3.map();
var combineNodeOne = null;
var combineNodeTwo = null;

var GraphEditor = function (svgOrigin) {
    GraphDrawer.call(this, svgOrigin, null, 0);

    this.type = "GraphEditor";
    
    var margin = {top: 30, right: 20, bottom: 20, left: 20};
    var width = 380 - margin.left - margin.right;
    var height = 180 - margin.top - margin.bottom;
    
    var container = d3.select("#tg_canvas_function")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      
      
    var xAxisScale = d3.scale.linear().domain([0, 10]).range([0, 340]);
    var xAxis = d3.svg.axis().scale(xAxisScale);
    var xAxisGroup = container.append("g")
            .attr("class","xAxis")
            .attr("transform", "translate(" + (margin.left) + "," + (height+margin.top) + ")")
            .call(xAxis);
    
    var yAxisScale = d3.scale.linear().domain([0, funcYRange]).range([130,0]);
    var yAxis = d3.svg.axis().scale(yAxisScale).ticks(5);//.orient("left");
    var yAxisGroup = container.append("g")
            .attr("class","yAxis")
            .attr("transform", "rotate(90),translate(30,-20)")
            .call(yAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("dx","-.6em")
            .attr("dy","-.35em");
    
    
    container.append("text")
            .attr("x","33")
            .attr("y","30")
            .attr("fill","black")
            .attr("text-anchor", "middle")
            .attr("transform","rotate(-20)")
            .text("Potenzial");
    
    
    container.append("text")
            .attr("x","360")
            .attr("y","158")
            .attr("fill","black")
            .attr("text-anchor", "front")
            .attr("transform","rotate(-20,360,158)")
            .text("Zeit");
    
    
    container.append("path")
            .attr("id","functionGraph")
            .attr("d","")
            .attr("stroke","#0065BD")
            .attr("stroke-width","2px")
            .attr("fill","none");
    
    
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
                })
                .style("fill", function (d) {
                    if (d.marked) {
                        return const_Colors.NodeFillingHighlight;
                    } else {
                        return const_Colors.NodeFilling;
                    }
                });
        selection.selectAll(".markerLeft")
                .attr("d",function(d){
                    if(d.isMain){
                        return "M -11.5,-0.5 L -24,3.5 L -24,-4.5 Z";
                    }else{
                        return "M 0,0 Z";
                    }
                });
                
        selection.selectAll(".markerRight")
                .attr("d",function(d){
                    if(d.isMain){
                        return "M 11.5,-0.5 L 24,3.5 L 24,-4.5 Z";
                    }else{
                        return "M 0,0 Z";
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
            childrenToAdd = d.children;
            cutOutNode = d.parent;
            Graph.instance.onlyRemoveNode(d);
            that.update();
            this.changeDescriptWindow(DELETE);
            $('#describtionOfOperation').css({'display': "block"});
            $('#tg_div_statusWindow').css({'display': "none"});
        } else {
            Graph.instance.removeNode(oldId);
            that.update();
        }
    };

    this.addChildrenToMainNodes = function () {
        for (var i = 0; i < childrenToAdd.length; i++) {
            var child = childrenToAdd[i];
            child.parent = null;
            Graph.instance.addToMainNodes(child);
            Graph.instance.rearrangeNodes();
        }
        that.update();
        this.changeDescriptWindow(CUTOUT);
    };

    this.insertNode = function (ele) {
        deselectNode();
        if (animated) {
            this.changeDescriptWindow(INSERT);
            $('#describtionOfOperation').css({'display': "block"});
            $('#tg_div_statusWindow').css({'display': "none"});
            Graph.instance.addNode(ele);
        } else {
            Graph.instance.addNode(ele);
        }
        that.update();
    };

    this.decreaseKey = function (input) {
        var d = selectedNode;
        deselectNode();
        if (animated) {
            d.ele = input.value;
            $('#describtionOfOperation').css({'display': "block"});
            $('#tg_div_statusWindow').css({'display': "none"});
            if (d.parent) {
                if (d.parent.ele > d.ele) {
                    this.changeDescriptWindow(CUTOUT);
                    cutOutNode = d;
                } else {
                    d.parent.marked = true;
                    this.changeDescriptWindow(DECREASE);
                }
            } else {
                this.changeDescriptWindow(DECREASE);
            }
        } else {
            Graph.instance.decreaseKey(d, input);
        }
        that.update();
    };


    this.animatedCutOut = function () {
        var newCutOutNode = null;
        if (!cutOutNode) {
            this.changeDescriptWindow(CONSOLIDATE);
            return;
        }
        if (cutOutNode.parent) {
            if (cutOutNode.parent.marked) {
                newCutOutNode = cutOutNode.parent;
            }
        }
        Graph.instance.addToMainNodes(cutOutNode);
        Graph.instance.rearrangeNodes();
        that.update();
        if (newCutOutNode !== null) {
            cutOutNode = newCutOutNode;
            this.changeDescriptWindow(CUTOUT);
        } else {
            nextConId = 0;
            this.changeDescriptWindow(CONSOLIDATE);
        }
    };


    this.animatedConsolidate = function () {
        var node = Graph.instance.getIdInMainNodes(nextConId);
        if (!node) {
            this.changeDescriptWindow(FINISHED);
            return;
        }
        if (conMap.get(node.degree)) {
            combineNodeOne = conMap.get(node.degree);
            combineNodeTwo = node;
            conMap.remove(node.degree);
            this.changeDescriptWindow(COMBINE);

        } else {
            conMap.set(node.degree, node);
            nextConId++;
            this.changeDescriptWindow(CONSOLIDATE);
        }
        that.update();

    };

    this.combineNodes = function () {
        var child = combineNodeOne;
        var parent = combineNodeTwo;
        if (+combineNodeOne.ele < +combineNodeTwo.ele) {
            child = combineNodeTwo;
            parent = combineNodeOne;
        }
        Graph.instance.mainNodes.splice(Graph.instance.mainNodes.indexOf(child), 1);
        child.parent = parent;
        child.parentsChild = parent.children.length;
        parent.children.push(child);
        parent.degree++;
        Graph.instance.addEdge(parent.id, child.id);
        combineNodeOne = null;
        combineNodeTwo = null;
        if (conMap.get(parent.degree)) {
            combineNodeOne = parent;
            combineNodeTwo = conMap.get(parent.degree);
            conMap.remove(parent.degree);
            nextConId--;
            this.changeDescriptWindow(COMBINE);
        } else {
            conMap.set(parent.degree, parent);
            this.changeDescriptWindow(CONSOLIDATE);
        }
        Graph.instance.rearrangeNodes();
        that.update();
    };

    this.nextOperation = function () {
        switch (+status) {
            case + FINISHED:
                $('#describtionOfOperation').css({'display': "none"});
                $('#tg_div_statusWindow').css({'display': "block"});
                break;
            case + INSERT:
                $('#describtionOfOperation').css({'display': "none"});
                $('#tg_div_statusWindow').css({'display': "block"});
                break;
            case + DELETE:
                this.addChildrenToMainNodes();
                break;
            case + CONSOLIDATE:
                this.animatedConsolidate();
                break;
            case + CUTOUT:
                this.animatedCutOut();
                break;
            case + DECREASE:
                $('#describtionOfOperation').css({'display': "none"});
                $('#tg_div_statusWindow').css({'display': "block"});
                break;
            case + COMBINE:
                this.combineNodes();
                break;
        }
        that.update();
    };


    this.changeAnimated = function () {
        animated = !animated;
    };



    this.changeDescriptWindow = function (newStatus) {
        switch (+newStatus) {
            case + FINISHED:
                $('#firstTest').css({'display': "none"});
                $('#fourthTest').css({'display': "block"});
                break;
            case + INSERT:
                $('#firstTest').css({'display': "none"});
                $('#secondTest').css({'display': "block"});
                break;
            case + DELETE:
                break;
            case + CONSOLIDATE:
                break;
            case + CUTOUT:
                break;
            case + DECREASE:
                break;
            case + COMBINE:
                break;
        }
        status = newStatus;
    };


    this.removeMin = function () {
        var node = Graph.instance.getMin();
        if (node === null)
            return;
        selectNode(node);
        this.removeSelected();
        that.update();
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
        if (!inAnimation) {
            selectedNode = selection;
            var x = selectedNode.x + "px";
            var y = selectedNode.y + "px";
            $("#DeleteMenu").css({'bottom': y, 'left': x, 'display': "inline"});
        }

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
