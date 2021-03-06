/**
 * A Heap editor in a Tab
 * @augments Tab
 * @class
 */
function HeapEditorTab(algo,p_tab) {
    Tab.call(this, algo, p_tab);

    var that = this;
    
    /**
     * Wires up the events on button clicks or selection changes and listens to a Graph change event
     * @method
     */
    var clicked = false;
    this.init = function() {
        $("#tg_button_gotoAlgorithmTab").click(function() {
            $("#tabs").tabs("option","active",2);
        });
        $("#tg_select_GraphSelector").on("click.HeapDrawer",that.setGraphHandler);     // Beispielgraph auswählen
        $("#tg_select_GraphSelector").on("blur.HeapDrawer",function(){clicked = false;});
        
        //add function to be called after a new graph has been loaded.
        Heap.addChangeListener(function(){
            algo.clear();
            algo.update();
        });

        $('#fileDownloader').on('click',function(foo){
            var ahref = $(this);
            var text = Heap.stringify();
            text = "data:text/plain,"+encodeURIComponent(text);
            ahref.prop("href",text);
        });

        $('#ta_div_parseError').dialog({
            autoOpen: false,
            resizable: false,
    //      modal: true,
            buttons: {
                "Ok": function() {
                    $(this).dialog( "close" );
                } 
            }
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
    
    /**
     * A different example graph was selected. Triggers the loader
     * @method
     */
    this.setGraphHandler = function() {
        if(clicked){
            var selection = $("#tg_select_GraphSelector>option:selected").val();
            var filename = selection + ".txt";
            //console.log(filename);

            //load graph as singleton
            //calls registered event listeners when loaded
            Heap.loadInstance("graphs-new/"+filename);
        }
        clicked = !clicked;
    };
}

//Prototypal inheritance
HeapEditorTab.prototype = Object.create(Tab.prototype);
HeapEditorTab.prototype.constructor = Tab;