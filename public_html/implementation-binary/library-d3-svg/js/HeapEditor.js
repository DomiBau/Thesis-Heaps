var status = 0;
var REMOVE_LAST = 1;
var SIFT_UP = 2;
var SIFT_DOWN = 3;
var DEC_SIFT_DEL = 4;
var SIFT_DEL = 5;
var DEL = 6;
var SIFT_DOWN_ALL = 10;
var FINISHED = 20;
var nextIdToSift;
var siftNode = null;
var animated = false;
var inAnimation = false;
var minInf = -8928917577;//Telefonnummer der Mathe-/Informatikfakultät

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

    this.removeSelected = function () {//first decrease-Key to -inf then sift up then remove-min...
        var d = selectedNode;
        var oldId = d.id;
        deselectNode();
        if (animated) {//animated
            siftNode = d;
            this.changeDescriptWindow(DEC_SIFT_DEL);
            $('#describtionOfOperation').css({'display': "block"});
            $('#tg_div_statusWindow').css({'display': "none"});
        } else {
            Heap.instance.removeNode(oldId);
            that.update();
        }
    };
    
    this.insertNode = function(ele) {
        deselectNode();
        if(animated){
            siftNode = Heap.instance.addLast(ele);
            this.changeDescriptWindow(SIFT_UP);
            $('#describtionOfOperation').css({'display': "block"});
            $('#tg_div_statusWindow').css({'display': "none"});
        } else {
            var insNode = Heap.instance.addNode(ele);
            Heap.instance.addEdgeToParent(insNode);
        }
        that.update();
    };
    
    this.decreaseKey = function(input){
        var d = selectedNode;
        deselectNode();      
        if(animated){
            window.alert(input.value + ", " + d.ele);
            d.ele = input.value;
            $('#describtionOfOperation').css({'display': "block"});
            $('#tg_div_statusWindow').css({'display': "none"});
            if(+status === +DEC_SIFT_DEL){
                this.changeDescriptWindow(SIFT_DEL);
            }else{
                this.changeDescriptWindow(SIFT_UP);
            }
            siftNode = d;
        }else{
            Heap.instance.decreaseKey(d,input);
        }
        
    };
    
    this.removeLastNode = function(){//nodeIds is already decreased (number of still existing nodes)
        var node = Heap.instance.nodes.get(Heap.instance.nodeIds);
        Heap.instance.removeAllEdges(node);
        Heap.instance.nodes.remove(node.id);
        this.changeDescriptWindow(SIFT_DOWN);
    };
    
    this.nextOperation = function() {
        switch(+status){
            case +FINISHED:
                inAnimation = false;
                this.disableAllHeader();
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
                    siftNode=Heap.instance.nodes.get(nextIdToSift);
                    this.changeDescriptWindow(SIFT_DOWN_ALL);
                }
                break;
            case +DEC_SIFT_DEL:
                window.alert(siftNode.ele);
                var input = document.getElementById('decreaseNum');
                input.value = +minInf;
                selectedNode = siftNode;
                this.decreaseKey(input);
                input.value = "";
                break;
            case +SIFT_DEL:
                siftNode = this.siftUp(siftNode);
                break;
            case +DEL:
                this.removeMin();
                break;
        }
        that.update();
    };
    
    
    this.changeAnimated = function(){
        animated = !animated;
    };
    
    this.buildHeap = function (text){
        deselectNode();
        Heap.buildInstance(text,animated);
        if(animated){
            var nextId = Math.floor((Heap.instance.nodeIds-1)/2);
            siftNode = Heap.instance.nodes.get(nextId);
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
                $('#doneHeader').css({'display': "block"});
                break;
            case SIFT_UP:
                inAnimation = true;
                $('#siftUpHeader').css({'display': "block"});
                $('#firstTest').css({'display': "none"});
                $('#secondTest').css({'display': "block"});
                break;
            case SIFT_DOWN:
                inAnimation = true;
                $('#siftDownHeader').css({'display': "block"});
                break;
            case REMOVE_LAST:
                inAnimation = true;
                $('#deleteHeader').css({'display': "block"});
                break;
            case SIFT_DOWN_ALL:
                inAnimation = true;
                $('#siftDownHeader').css({'display': "block"});
                break;
            case +DEC_SIFT_DEL:
                inAnimation = true;
                break;
            case +SIFT_DEL:
                $('#siftUpHeader').css({'display': "block"});
                break;
            case +DEL:
                break;
            
        }
        status = newStatus;
    };
    
    this.disableAllHeader = function(){
        $('#doneHeader').css({'display': "none"});
        $('#siftDownHeader').css({'display': "none"});
        $('#deleteHeader').css({'display': "none"});
        $('#siftUpHeader').css({'display': "none"});
    };

    this.swapNodes = function (id1, id2) {
        var nodes = Heap.instance.nodes;
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
        Heap.instance.removeAllEdges(nodeTwo);
        Heap.instance.recoverEdges(nodeTwo);
        Heap.instance.removeAllEdges(nodeOne);
        Heap.instance.recoverEdges(nodeOne);
        return nodeOne;
    };

    this.siftUp = function (node) {
        if(node.id === 1){
            if(+status === +SIFT_DEL){
                this.changeDescriptWindow(DEL);
            }else{
                this.changeDescriptWindow(FINISHED);
            }
            return node;
        }
        var parentId;
        if (node.id % 2 === 0)parentId = node.id / 2; 
        else parentId = (node.id - 1) / 2;
        var parent = Heap.instance.nodes.get(parentId);
        if (+node.ele < +parent.ele) {
            node = this.swapNodes(node.id, parent.id);
        }else{
            if(+status === +SIFT_DEL){
                this.changeDescriptWindow(DEL);
            }else{
                this.changeDescriptWindow(FINISHED);
            }
        }
        return node;
    };

    this.siftDown = function (node) {
        var nodes = Heap.instance.nodes;
        if (node.id * 2 + 1 < +Heap.instance.nodeIds) {
            var lefChild = nodes.get(node.id * 2);
            var rigChild = nodes.get(node.id * 2 + 1);
            if (+lefChild.ele <= +rigChild.ele && +lefChild.ele < +node.ele) {
                node = this.swapNodes(node.id, lefChild.id);
            } else if (+rigChild.ele <= +lefChild.ele && +rigChild.ele < +node.ele) {
                node = this.swapNodes(node.id, rigChild.id);
            }else{
                this.changeDescriptWindow(FINISHED);
            }
        } else if (node.id * 2 < +Heap.instance.nodeIds) {
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
        var node = Heap.instance.getMin();
        if(node===null)return;
        var d = node;
        var oldId = d.id;
        if (animated) {//animated
            var ids = Heap.instance.dekrIds();
            var nodes = Heap.instance.nodes;
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
            Heap.instance.removeNode(oldId);
            that.update();
        }
    };
    
    this.updateArray = function(){
        var str = "[";
        var nodes = Heap.instance.nodes;
        var ids = Heap.instance.nodeIds;
        if(ids>1){
            if(+(nodes.get(1).ele)===+minInf){
                str = str + "-inf";
            }else{
                str = str + nodes.get(1).ele;
            }
        }
        for(i = 2; i<ids; i++){
            if(+(nodes.get(i).ele)===+minInf){
                str = str + ", -inf";
            }else{
                str = str + ", " + nodes.get(i).ele;
            }
            
        }
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
        if(!inAnimation){
           selectedNode = selection;
            var x = selectedNode.x + "px";
            var y = selectedNode.y + "px";
            $("#DeleteMenu").css({'bottom': y, 'left': x, 'display': "inline"}); 
        }
        
    };


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
