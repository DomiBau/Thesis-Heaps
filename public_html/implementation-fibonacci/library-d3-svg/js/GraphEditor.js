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
var inExercise = false;
var conMap = d3.map();
var focusedNode = null;
var combineNodeOne = null;
var combineNodeTwo = null;
var funcSvgMargin = {top: 30, right: 20, bottom: 30, left: 20};
var funcSvgWidth = 380 - funcSvgMargin.left - funcSvgMargin.right;
var funcSvgHeight = 180 - funcSvgMargin.top - funcSvgMargin.bottom;
var usedExcerciseOperations = 0;
var maxExerciseOperations = 15;
var realCurCost = 0;

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
                .on("mousedown", mousedownNode);
    };

    this.onNodesUpdated = function (selection) {
        selection
                .style("cursor", "pointer")
                .selectAll("circle")
                .style("stroke", function (d) {
                    if (d === selectedNode || d.focus) {
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
                .attr("d", function (d) {
                    if (d.isMain) {
                        return "M -11.5,-0.5 L -24,3.5 L -24,-4.5 Z";
                    } else {
                        return "M 0,0 Z";
                    }
                });

        selection.selectAll(".markerRight")
                .attr("d", function (d) {
                    if (d.isMain) {
                        return "M 11.5,-0.5 L 24,3.5 L 24,-4.5 Z";
                    } else {
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
            realCurCost++;
            that.update();
            this.changeDescriptWindow(DELETE);
            $('#describtionOfOperation').css({'display': "block"});
            $('#tg_div_statusWindow').css({'display': "none"});
            inAnimation = true;
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
        document.getElementById('insertedEl').innerHTML = ele;
        if (animated) {
            this.changeDescriptWindow(INSERT);
            $('#describtionOfOperation').css({'display': "block"});
            $('#tg_div_statusWindow').css({'display': "none"});
            inAnimation = true;
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
            inAnimation = true;
            if (d.parent) {
                if (+d.parent.ele > +d.ele) {
                    d.marked = true;
                    this.changeDescriptWindow(CUTOUT);
                    cutOutNode = d;
                } else {
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
            nextConId = 0;
            this.changeDescriptWindow(CONSOLIDATE);
            realCurCost += Graph.instance.mainNodes.length;
            return;
        }
        if (cutOutNode.marked) {
            if (cutOutNode.parent) {
                newCutOutNode = cutOutNode.parent;
            }
            if (!cutOutNode.isMain && cutOutNode) {
                Graph.instance.addToMainNodes(cutOutNode);
            }
        } else if (!cutOutNode.isMain) {
            cutOutNode.marked = true;
            realCurCost++;
        }

        Graph.instance.rearrangeNodes();
        that.update();
        if (newCutOutNode !== null) {
            cutOutNode = newCutOutNode;
            this.changeDescriptWindow(CUTOUT);
        } else {
            nextConId = 0;
            this.changeDescriptWindow(CONSOLIDATE);
            realCurCost += Graph.instance.mainNodes.length;
        }
    };


    this.animatedConsolidate = function () {
        var node = Graph.instance.getIdInMainNodes(nextConId);
        if (!node) {
            this.changeDescriptWindow(FINISHED);
            focusedNode.focus = false;
            focusedNode = null;
            return;
        }
        node.focus = true;
        if (focusedNode) {
            focusedNode.focus = false;
        }
        focusedNode = node;
        if (conMap.get(node.degree)) {
            combineNodeOne = conMap.get(node.degree);
            combineNodeTwo = node;
            conMap.remove(node.degree);
            if (node.degree <= 8) {
                document.getElementById("degree" + node.degree + "El").innerHTML = "-";
            }
            this.changeDescriptWindow(COMBINE);
        } else {
            conMap.set(node.degree, node);
            if (node.degree <= 8) {
                document.getElementById("degree" + node.degree + "El").innerHTML = node.ele;
            }
            nextConId++;
            this.changeDescriptWindow(CONSOLIDATE);
        }
        Graph.instance.rearrangeNodes();
        that.update();
        //node.focus = false;
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
            if (parent.degree <= 8) {
                document.getElementById("degree" + parent.degree + "El").innerHTML = "-";
            }
            nextConId--;
            this.changeDescriptWindow(COMBINE);
        } else {
            conMap.set(parent.degree, parent);
            if (parent.degree <= 8) {
                document.getElementById("degree" + parent.degree + "El").innerHTML = parent.ele;
            }
            this.changeDescriptWindow(CONSOLIDATE);
        }
        Graph.instance.rearrangeNodes();
        that.update();
    };

    this.nextOperation = function () {
        //this.logMainNodes();
        switch (+status) {
            case + FINISHED:
                $('#describtionOfOperation').css({'display': "none"});
                $('#tg_div_statusWindow').css({'display': "block"});
                inAnimation = false;
                conMap = d3.map();
                for (var i = 0; i <= 8; i++) {
                    document.getElementById("degree" + i + "El").innerHTML = "-"
                }
                document.getElementById("descTable").style = "display:none";
                realData.push(realCurCost);
                realData.shift();
                realCurCost = 0;
                Graph.instance.updatePotential();
                break;
            case + INSERT:
                $('#insertHeader').css({'display': "none"});
                $('#insertText').css({'display': "none"});
                $('#describtionOfOperation').css({'display': "none"});
                $('#tg_div_statusWindow').css({'display': "block"});

                inAnimation = false;
                break;
            case + DELETE:
                $('#deleteHeader').css({'display': "none"});
                $('#deleteText').css({'display': "none"});
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
                realData.push(realCurCost);
                realData.shift();
                realCurCost = 0;
                Graph.instance.updatePotential();
                inAnimation = false;
                break;
            case + COMBINE:
                this.combineNodes();
                break;
        }
        that.update();
    };



    this.logMainNodes = function () {
        var nodes = Graph.instance.mainNodes;
        var str = "["
        for (var i = 0; i < nodes.length; i++) {
            str += nodes[i].ele + " ,"
        }
        str += "]";
        console.log(str);
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
                $('#insertHeader').css({'display': "block"});
                $('#insertText').css({'display': "block"});
                break;
            case + DELETE:
                $('#deleteHeader').css({'display': "block"});
                $('#deleteText').css({'display': "block"});
                break;
            case + CONSOLIDATE:
                document.getElementById("descTable").style = "display:default";
                break;
            case + CUTOUT:
                $('#cutOutHeader').css({'display': "block"});
                $('#cutOutText').css({'display': "block"});
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

    this.checkFinished = function () {
        var done = true;
        var nodes = Graph.instance.mainNodes;
        if (nodes.length !== 1) {
            done = false;
        }
        for (var i = 0; i < 3; i++) {
            if (nodes && nodes.length > 0) {
                if (nodes[0].children.length !== 1 || nodes[0].marked) {
                    done = false;
                }
                nodes = nodes[0].children;
            } else {
                done = false;
            }
        }
        if (nodes && nodes.length > 0) {
            if (nodes[0].children.length !== 0 || nodes[0].marked) {
                done = false;
            }
        }
        if (done) {
            $('#exerciseWindow').css({'display': "none"});
            $('#gratulationWindow').css({'display': "block"});
        } else
        if (+usedExcerciseOperations > +maxExerciseOperations) {
            $('#exerciseWindow').css({'display': "none"});
            $('#youLostWindow').css({'display': "block"});
            inAnimation = true;
        }
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
        $("#DeleteMenuEx").css({'display': "none"});
    };

    var selectNode = function (selection) {
        if (!inAnimation && !inExercise) {
            selectedNode = selection;
            var x = selectedNode.x + "px";
            var y = selectedNode.y + "px";
            $("#DeleteMenu").css({'bottom': y, 'left': x, 'display': "inline"});
        }
        if (!inAnimation && inExercise) {
            selectedNode = selection;
            var x = selectedNode.x + "px";
            var y = selectedNode.y + "px";
            $("#DeleteMenuEx").css({'bottom': y, 'left': x, 'display': "inline"});
        }

    };

    /**
     * End of mouseclick on a node
     * @method
     */

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
