var status = 0;
var DELETE = 1;
var INSERT = 2;
var DECREASE = 3;
var CUTOUT = 4;
var ONLYCUTOUT = 5;
var DELETE_MIN = 6;
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

var HeapEditor = function (svgOrigin) {
    HeapDrawer.call(this, svgOrigin, null, 0);

    this.type = "HeapEditor";



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
                
        
        //the following markers are the arrows on the left and right side of a main node
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

    this.removeSelected = function () {//removes the selected node... To remove a given node select it (with selectNode(node)) and then call this function
        var d = selectedNode;
        var oldId = d.id;
        deselectNode();
        if (animated) {//animated
            childrenToAdd = d.children;
            cutOutNode = d.parent;
            Heap.instance.onlyRemoveNode(d);
            realCurCost++;
            that.update();
            this.changeDescriptWindow(DELETE);
            $('#describtionOfOperation').css({'display': "block"});
            $('#tg_div_statusWindow').css({'display': "none"});
            inAnimation = true;
        } else {
            Heap.instance.removeNode(oldId);
            that.update();
        }
    };

    this.addChildrenToMainNodes = function () {//if a node is deleted the children of the node are added to the main nodes with this function
        for (var i = 0; i < childrenToAdd.length; i++) {
            var child = childrenToAdd[i];
            child.parent = null;
            Heap.instance.addToMainNodes(child);
        }
        Heap.instance.rearrangeNodes();
        that.update();
        this.changeDescriptWindow(CUTOUT);
    };

    this.insertNode = function (ele) {//inserts a new node with the given element in the Heap
        deselectNode();
        document.getElementById('insertedEl').innerHTML = ele;
        if (animated) {
            this.changeDescriptWindow(INSERT);
            $('#describtionOfOperation').css({'display': "block"});
            $('#tg_div_statusWindow').css({'display': "none"});
            inAnimation = true;
            Heap.instance.addNode(ele);
        } else {
            Heap.instance.addNode(ele);
        }
        that.update();
    };

    this.decreaseKey = function (input) {//changes the element of a node to a smaller value
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
                    this.changeDescriptWindow(ONLYCUTOUT);
                    cutOutNode = d;
                } else {
                    this.changeDescriptWindow(DECREASE);
                }
            } else {
                this.changeDescriptWindow(DECREASE);
            }
        } else {
            Heap.instance.decreaseKey(d, input);
        }
        that.update();
    };


    this.animatedCutOut = function () {//cuts out nodes using the scheme of the fibonacci heap. This function is especially for the step-by-step visualisation
        var newCutOutNode = null;
        if (!cutOutNode) {
            nextConId = 0;
            if(+status === +CUTOUT){
                this.changeDescriptWindow(CONSOLIDATE);
                realCurCost += Heap.instance.mainNodes.length;
            }else{
                this.changeDescriptWindow(FINISHED);
            }
            return;
        }
        if (cutOutNode.marked) {
            if (cutOutNode.parent) {
                newCutOutNode = cutOutNode.parent;
            }
            if (!cutOutNode.isMain && cutOutNode) {
                Heap.instance.addToMainNodes(cutOutNode);
            }
        } else if (!cutOutNode.isMain) {
            cutOutNode.marked = true;
            realCurCost++;
        }

        Heap.instance.rearrangeNodes();
        that.update();
        if (newCutOutNode !== null) {
            cutOutNode = newCutOutNode;
            if(+status===+ONLYCUTOUT){
                this.changeDescriptWindow(ONLYCUTOUT);
            }else{
                this.changeDescriptWindow(CUTOUT);
            }
        } else {
            if(+status === +CUTOUT){
                nextConId = 0;
                this.changeDescriptWindow(CONSOLIDATE);
                realCurCost += Heap.instance.mainNodes.length;
            }else{
                this.changeDescriptWindow(FINISHED);
            }
        }
    };


    this.animatedConsolidate = function () {//consolidates the fibonacci heap in the step-by-step visualisation with the help of combineNodes()
        var node = Heap.instance.getIdInMainNodes(nextConId);
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
        Heap.instance.rearrangeNodes();
        that.update();
    };

    this.combineNodes = function () {//combines the two nodes which are stored in combineNodeOne and combineNodeTwo. The smaller elements becomes the parent of the bigger one
        var child = combineNodeOne;
        var parent = combineNodeTwo;
        if (+combineNodeOne.ele < +combineNodeTwo.ele) {
            child = combineNodeTwo;
            parent = combineNodeOne;
        }
        Heap.instance.mainNodes.splice(Heap.instance.mainNodes.indexOf(child), 1);
        child.parent = parent;
        child.parentsChild = parent.children.length;
        parent.children.push(child);
        parent.degree++;
        Heap.instance.addEdge(parent.id, child.id);
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
        Heap.instance.rearrangeNodes();
        that.update();
    };


/*
 * 
 * clicking the "Weiter" button in the step-by-step visualisation starts this function. 
 * Depending on the status variable this function starts a different function for the current situation.
 */
    this.nextOperation = function () {
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
                Heap.instance.updatePotential();
                this.disableAllHeader();
                this.disableAllText();
                break;
            case + INSERT:
                $('#insertHeader').css({'display': "none"});
                $('#insertText').css({'display': "none"});
                $('#describtionOfOperation').css({'display': "none"});
                $('#tg_div_statusWindow').css({'display': "block"});

                inAnimation = false;
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
            case +ONLYCUTOUT:
                this.animatedCutOut();
                break;
            case + DECREASE:
                this.disableAllHeader();
                this.disableAllText();
                $('#describtionOfOperation').css({'display': "none"});
                $('#tg_div_statusWindow').css({'display': "block"});
                realData.push(realCurCost);
                realData.shift();
                realCurCost = 0;
                Heap.instance.updatePotential();
                inAnimation = false;
                break;
            case + COMBINE:
                this.combineNodes();
                break;
            case +DELETE_MIN:
                this.addChildrenToMainNodes();
                nextConId=0;
                this.changeDescriptWindow(CONSOLIDATE);
                break;
        }
        that.update();
    };
    
    this.disableAllHeader = function () {//Vanishes all headers in the step-by-step descriptionwindow
        $('#deleteHeader').css({'display': "none"});
        $('#decreaseHeader').css({'display': "none"});
        $('#deleteMinHeader').css({'display': "none"});
        $('#cutOutHeader').css({'display': "none"});
        $('#consolidateHeader').css({'display': "none"});
        $('#combineHeader').css({'display': "none"});
        $('#finishedHeader').css({'display': "none"});
    };
    
    this.disableAllText = function () {//Vanishes all texts in the step-by-step descriptionwindow
        $('#deleteText').css({'display': "none"});
        $('#decreaseText').css({'display': "none"});
        $('#deleteMinText').css({'display': "none"});
        $('#cutOutText').css({'display': "none"});
        $('#consolidateText').css({'display': "none"});
        $('#combineText').css({'display': "none"});
        $('#finishedText').css({'display': "none"});
        $('#decrease2Text').css({'display': "none"});
        $('#cutOut2Text').css({'display': "none"});
    };


    this.logMainNodes = function () {//Only for debug purpose
        var nodes = Heap.instance.mainNodes;
        var str = "["
        for (var i = 0; i < nodes.length; i++) {
            str += nodes[i].ele + " ,"
        }
        str += "]";
        console.log(str);
    };

    this.changeAnimated = function () {//changes the stored boolean variable, which indicates if the next operation should be step-by-step (true) or all-in-one (false) visualisated, to the opposite.
        animated = !animated;
    };



    this.changeDescriptWindow = function (newStatus) {//changes the headers and texts in the descriptionwindow such that only the current move is descripted and the window is not full of texts
        this.disableAllText();
        switch (+newStatus) {
            case + FINISHED:
                $('#finishedText').css({'display': "block"});
                $('#finishedHeader').css({'display': "block"});
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
                $('#combineHeader').css({'display': "none"});
                $('#consolidateText').css({'display': "block"});
                $('#consolidateHeader').css({'display': "block"});
                document.getElementById("descTable").style = "display:default";
                break;
            case + CUTOUT:
                $('#cutOut2Text').css({'display': "block"});
                break;
            case + DECREASE:
                $('#decreaseHeader').css({'display': "block"});
                $('#decreaseText').css({'display': "block"});
                $('#finishedHeader').css({'display': "block"});
                $('#finishedText').css({'display': "block"});
                break;
            case + COMBINE:
                document.getElementById('combNode1').innerHTML = combineNodeOne.ele;
                document.getElementById('combNode2').innerHTML = combineNodeTwo.ele;
                $('#consolidateText').css({'display': "block"});
                $('#combineText').css({'display': "block"});
                $('#combineHeader').css({'display': "block"});
                break;
            case +ONLYCUTOUT:
                $('#decreaseHeader').css({'display': "block"});
                $('#decrease2Text').css({'display': "block"});
                $('#cutOutHeader').css({'display': "block"});
                break;
            case +DELETE_MIN:
                $('#deleteMinHeader').css({'display': "block"});
                $('#deleteMinText').css({'display': "block"});
                break;
        }
        status = newStatus;
    };


    this.removeMin = function () {//removes the node with the smallest element
        var node = Heap.instance.getMin();
        if (!node){
            return;
        }
        deselectNode();
        var d = node;
        var oldId = d.id;
        if (animated) {//animated
            childrenToAdd = d.children;
            Heap.instance.onlyRemoveNode(d);
            realCurCost++;
            that.update();
            this.changeDescriptWindow(DELETE_MIN);
            $('#describtionOfOperation').css({'display': "block"});
            $('#tg_div_statusWindow').css({'display': "none"});
            inAnimation = true;
        } else {
            Heap.instance.removeNode(oldId);
            that.update();
        }
    };

    this.checkFinished = function () {//checks if the task in the exercisetab is accomplished
        var done = true;
        var nodes = Heap.instance.mainNodes;
        if (+nodes.length !== 1) {
            done = false;
        }
        for (var i = 0; i < 3; i++) {
            if (nodes && +nodes.length > 0) {
                if (nodes[0].children.length !== 1 || nodes[0].marked) {
                    done = false;
                }
                nodes = nodes[0].children;
            } else {
                done = false;
            }
        }
        if (nodes && +nodes.length > 0) {
            if (+nodes[0].children.length !== 0 || nodes[0].marked) {
                done = false;
            }
        }
        if (done) {
            $('#exerciseWindow').css({'display': "none"});
            $('#gratulationWindow').css({'display': "block"});
        } else
        if (+usedExcerciseOperations >= +maxExerciseOperations) {
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


    var deselectNode = function () {//deselects the selected node if there is any and makes the DeleteMenu disappear
        if (selectedNode !== null) {
            selectedNode = null;
        }
        that.svgOrigin.style("cursor", "default");
        that.update();
        $("#DeleteMenu").css({'display': "none"});
        $("#DeleteMenuEx").css({'display': "none"});
    };

    var selectNode = function (selection) {//selectes the node on which was clicked and lets the DeleteMenu appear next to the selected node
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
HeapEditor.prototype = Object.create(HeapDrawer.prototype);
HeapEditor.prototype.constructor = HeapEditor;

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
