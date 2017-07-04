/* 
 * 
 * Tab for the exercise
 * 
 * @author Dominique Bau
 * 
 */


function ExerciseTab(algo,p_tab){
    Tab.call(this, algo, p_tab);
    var that = this;
    
    /**
     * Wires up the events on button clicks or selection changes and listens to a Heap change event
     * @method
     */
    this.init = function() {
        //add function to be called after a new Heap has been loaded.
        Heap.addChangeListener(function(){
            algo.clear();
            algo.update();
        });

        
        //inheritance
        Tab.prototype.init.call(this);
    };
    
    /**
     * When Tab comes into view we update the view
     * @method
     */
    this.activate = function() {
       if(Heap.instance) algo.update();
       Tab.prototype.activate.call(this);

    };
    
    
    this.deactivate = function() {
        
    };
    
}

ExerciseTab.prototype = Object.create(HeapDrawer.prototype);
ExerciseTab.prototype.constructor = ExerciseTab;