

   // load global GeneDetailsEvents
   var GeneDetailsEvents = (function(){
      // events for creating and selecting tabs   
      var _geneTabSelected = "geneDetailsGeneTabSelected";
      var _geneTabsCreated = "geneDetailsGeneTabsCreated";

      // events for the buttons template
      var _showHideCustomizeHistogramClicked = "showHideCustomizeHistogramClicked";

      // events for the Customize Histogram
      var _cancerTypeChanged = "cancerTypeChanged";

      return {
         GENE_TAB_SELECTED: _geneTabSelected,
         GENE_TABS_CREATED: _geneTabsCreated,
         SHOW_HIDE_CUSTOMIZE_HISTOGRAM_CLICKED: _showHideCustomizeHistogramClicked,
         CANCER_TYPE_CANGED: _cancerTypeChanged
      };
   })();


   var CancerSummaryMainView = Backbone.View.extend({
      el: "#pancancer_study_summary",

      initialize : function (options) {
         this.options = options || {};

         // custom event dispatcher
         //this.dispatcher = {};
         //_.extend(this.dispatcher, Backbone.Events);

         this.dispatcher = options.dispatcher;
         this.queryPresenter = options.queryPresenter;

      },

      render: function() {
         var self = this;

         // init tab view flags (for each gene)
         // why? never used?
         self.geneTabView = {};

         var content = self.generateContent();

         // create the variables for the main template
         var variables = {
            loaderImage: "images/ajax-loader.gif",
            listContent: content.listContent,
            mainContent: content.mainContent
         };

         // compile the template using underscore
         var templateFn = BackboneTemplateCache.getTemplateFn("cancertypesummary_main_template");
         var template = templateFn(variables);

         // load the compiled HTML into the Backbone "el"
         self.$el.html(template);

         //if (self.model.geneProxy.hasData()){
            self.initDefaultView();
         //}

         //apply the tabs format:
         self.format();
      },

      /**
       * Formats the contents of the view after the initial rendering.
       */

      format: function(){
        var self = this;

        var mainContent = self.$el.find(".gene-tabs-container");
        //apply the tabs function so that the items are 'formed' into tabs (jquery-ui):
        mainContent.tabs();
        //select first tab:
        mainContent.tabs("option", "active", 0);
      },

      /**
       * Refreshes the genes tab.
       * (Intended to fix a resize problem with ui.tabs.paging plugin)
       */
      refreshGenesTab: function() {
         $(window).trigger('resize');
      },

      /**
       * Generates the content structure by creating div elements for each
       * gene.
       *
       * @return {Object} content backbone with div elements for each gene
       */
      generateContent: function() {
         var self = this;
         var mainContent = "";
         var listContent = "";

         // create a test gene list for the tabs
         var geneList = self.queryPresenter.getGeneList();

         // create a div for for each gene
         //_.each(self.model.geneProxy.getGeneList(), function(gene, idx) {
         _.each(geneList, function(gene, idx) {
            // not sure what the original function returns... quick fix
            gene = gene.gene;

            // get the template for the main content and apply it
            var templateFn = BackboneTemplateCache.getTemplateFn("gene_details_main_content_template");
            mainContent += templateFn(
               {loaderImage: "images/ajax-loader.gif",
               //geneId: cbio.util.safeProperty(gene)}
               geneId: gene}
            );

            // get the template for the tab ear (tab title) and apply it
            templateFn = BackboneTemplateCache.getTemplateFn("gene_tab_ear_template");
            listContent += templateFn(
               {geneSymbol: gene,
               //geneId: cbio.util.safeProperty(gene)});
               geneId: gene}
            );
         });

         return {mainContent: mainContent, listContent: listContent};
      },

      /**
       * Initializes the gene view for the current gene data.
       * Use this function if you want to have a default view of gene
       * details composed of different backbone views (by default params).
       *
       * If you want to have more customized components, it is better
       * to initialize all the component separately.
       */
      initDefaultView: function() {
         var self = this;

         var contentSelector = self.$el.find(".gene-tabs-container");
         console.log(contentSelector);

         // bind the tabscreate event (jquery-ui even, fires when the tabs() function is called)
         // now we can init the view for the first gene
         contentSelector.bind('tabscreate', function(event, ui) {

            // when created tab is the active tab; fetch its text
            var gene = ui.tab.text().trim();

            // trigger corresponding event in the Controller
            self.dispatcher.trigger(GeneDetailsEvents.GENE_TABS_CREATED, gene);
         });

         // bind the tabsactivate event (jquery-ui even, fires upon selecting the corresponding tab) 
         contentSelector.bind('tabsactivate', function(event, ui) {
            // when activated, newTab is the active tab; fetch its text
            var gene = ui.newTab.text().trim();
            // trigger corresponding event in the Controller
            self.dispatcher.trigger(GeneDetailsEvents.GENE_TAB_SELECTED, gene);
         });
      }
   }); // end of CancerSummaryMainView


   // ButtonsView
   var ButtonsView = Backbone.View.extend({
      //el: provided bij the GeneDetailsView

      initialize: function(options){
         var templateFn = BackboneTemplateCache.getTemplateFn("buttons_template");
         this.template = templateFn();
         this.gene = options.gene;
         this.dispatcher = options.dispatcher;
      },

      // add events
      events:{
         "click .histogram-customize": "showHideCustomizeHistogram"  //strange that this should be a string...?
      },

      render: function(){
         console.log("ButtonsView Render");
         $(this.el).html(this.template);

      },

      // When the histogram-customize button is clicked, notify the dispatcher        
      showHideCustomizeHistogram: function(){
         console.log("clicked for "+this.gene);
         this.dispatcher.trigger(GeneDetailsEvents.SHOW_HIDE_CUSTOMIZE_HISTOGRAM_CLICKED+this.gene);
      }
   }); // End ButtonsView

   // CustomizeHistogramView
   var CustomizeHistogramView = Backbone.View.extend({
      //el: provided bij the GeneDetailsView

      initialize: function(options){
         this.dispatcher = options.dispatcher;
         this.gene = options.gene;
         var templateFn = BackboneTemplateCache.getTemplateFn("customize_histogram_template");
         this.template = templateFn({geneId: this.gene});

         // subscribe to the showHideCustomizeHistogram event and give "this" is the context
         this.dispatcher.bind(GeneDetailsEvents.SHOW_HIDE_CUSTOMIZE_HISTOGRAM_CLICKED+this.gene, this.showHideCustomizeHistogram, this);
         
         this.dmPresenter = options.dmPresenter;
      },

      render: function(){
         console.log("CustomizeHistogram Render");
         // add the generated template
         $(this.el).html(this.template);
         
         // add all the elements
         this.addcancerTypeSelect();
         this.addSortByYAxisSelect();
         this.addSortByXAxisSelect();
         this.addNrAlteredSamplesSlider();
         this.addShowGenomicAlterationTypesCheckbox();
         this.addcancerTypeDetailedView();
      },

      // add the Cancer Type Select
      // maybe add an event here as well to notify the SpecificCancerTypesView? So that we can update the content?       
      addcancerTypeSelect: function(){
    	 var self = this;
         // cancer types:
         var selOptions = self.dmPresenter.getCancerTypeList();
         // add "all" entry:
         selOptions.splice(0,0, "All");

         //event handler for when the Cancer Type Select is changed
         var changeCallBack = function(){
             var fields = {};
             var cancerType = $(this).val();
             fields["cancerType"] = cancerType;
             fields["cancerTypeDetailed"] = self.dmPresenter.getCancerTypeDetailedList(cancerType);
        	 self.model.set(fields);
         }
         // create the dropdown and add it
         $("#customize-cancertype-dropdown-"+this.gene).append(fnCreateSelect(
        		 "Cancer Type: ", selOptions, "All", changeCallBack));
      },

      // add the Sort by Select for the y-axis
      addSortByYAxisSelect: function(){
    	 var self = this;
         // static options: 
         var selOptions = ["Absolute Counts", "Alteration Frequency"];  //TODO could be constants
         
         // handle the event for when the Sort By Y-Axis Select is changed
         var changeCallBack = function(){
            //console.log("sortByYAxisSelect changed to "+event.currentTarget.value);
            self.model.set("sortYAxis", $(this).val());
         }
         // create the dropdown and add it
         $("#customize-sort-by-y-axis-"+this.gene).append(fnCreateSelect(
        		 "Sort Y-Axis by:", selOptions, "Absolute Counts", changeCallBack));
      },

      // add the Sort by Select for the x-axis
      addSortByXAxisSelect: function(){
    	 var self = this;
         // this will be provided at some point, but for now let's set it manually
         var selOptions = ["Y-Axis Values", "Cancer Types"];
         
         //handle the event for when the Sort By Y-Axis Select is changed
         var changeCallBack = function(){
            //console.log("sortByXAxisSelect changed to "+event.currentTarget.value);
            self.model.set("sortXAxis", $(this).val());
         }         
         // create the dropdown and add it
         $("#customize-sort-by-x-axis-"+this.gene).append(fnCreateSelect(
        		 "Sort X-Axis by:", selOptions, "Y-Axis Value", changeCallBack));
      },

      // add the slider for minimum number of altered samples
      addNrAlteredSamplesSlider: function(){
         new MinNrAlteredSamplesSliderView({
        	 gene:this.gene, 
        	 el:"#customize-min-nr-altered-samples-slider-"+this.gene, 
        	 dispatcher:this.dispatcher, 
        	 model:this.model,
        	 dmPresenter:this.dmPresenter});
      },

      // add checkbox for genomic alteration types
      addShowGenomicAlterationTypesCheckbox: function(){
    	 var self = this;    	 
    	 // handle the event for when the Show genomic alteration types checkbkox is changed
         var changeCallBack = function(){
            //console.log("showGenomicAlterationTypesChanged changed to  "+$(event.currentTarget).is(':checked'));
            self.model.set("showGenomicAlterationTypes", $(this).is(':checked'));
         }
         //create checkbox and add it
         $("#customize-show-genomic-alteration-types-"+this.gene).append(
        	$("<input/>", {type: 'checkbox', checked: true}).change(changeCallBack));
         //checkbox label:
         $("#customize-show-genomic-alteration-types-"+this.gene).append( 	
        	$("<label>Show Genomic Alteration Types</label>"));
      },

      // add view for the specific cancer types selection
      addcancerTypeDetailedView: function(){
         new SpecificCancerTypesView({gene:this.gene, 
        	 el:"#specific-cancertypes-area-"+this.gene, 
        	 dispatcher:this.dispatcher, 
        	 model:this.model,
        	 dmPresenter:this.dmPresenter});
      },
                                             
      // incoming event - change the visibility of the customize histogram part
      showHideCustomizeHistogram: function(){
         console.log("ShowHide Order Received! "+this.gene);
         $("#customize-histogram-"+this.gene).toggle();
      }  
   }); // End CustomizeHistogramView


   // View for the Samples Slider. Do we really need a view for this or should we make it part of the Customize Histogram?
   var MinNrAlteredSamplesSliderView = Backbone.View.extend({
      
      initialize: function(options){
         this.dispatcher = options.dispatcher;
         this.gene = options.gene;
         this.dmPresenter = options.dmPresenter;
         this.render();
         // call render when the model is changed
         this.model.on("change", this.updateRender, this);
      },

      events: {
         'slidechange .diagram-min-nr-altered-samples-slider': 'handleSliderChange'
      }, 
      //function for model.onchange above, it will check whether the slider max threshold needs
      //to be udpated:
      updateRender: function(){
    	  var cancerTypeChanged = this.model.hasChanged("cancerType");
    	  if (cancerTypeChanged)
    		  this.render();
      },
      
      render: function(){
    	 this.max = this.dmPresenter.getNrAlteredSamplesForCancerTypeAndGene(this.model.get("cancerType"), this.gene);
         var templateFn = BackboneTemplateCache.getTemplateFn("nr_altered_samples_slider_template");
         this.template = templateFn({min:0, max:this.max});

         // add the template
         $(this.el).html(this.template);

         // create the jQuery ui slider
         var sampleSlider = this.$el.find(".diagram-min-nr-altered-samples-slider");
         sampleSlider.slider({ 
            value: 1, 
            min: 0, 
            max: this.max 
         });
      },

      // handle change to the slider        
      handleSliderChange: function(e, ui) {
         var sampleText = this.$el.find(".diagram-min-nr-alter-samples-value");
         console.log("GENE: "+this.gene);
         // update text 
         sampleText.html(ui.value);
         // and notify the histogram 
         this.model.set("minNrAlteredSamples", ui.value);
       }

   }); // end MinNrAlteredSamplesSliderView


   // View for the Gene Histogram 
   var GeneHistogramView = Backbone.View.extend({
      //el: will be provided as it depends on the gene where we'll want to put the information
      //model: contains the settings required to generated the histogram and is provided   

      initialize: function(options){
         this.gene = options.gene;
         this.dispatcher = options.dispatcher;

         // call render when the model is changed
         this.model.on("change", this.render, this); //TODO change to this.listenTo(this.model, "change", this.updateRender)
      },

      render: function(){
         //$(this.el).html("Histogram for "+this.gene+" with the following model parameters: <br>"+);

         var templateFn = BackboneTemplateCache.getTemplateFn("debug_template");
         this.template = templateFn({
            geneId: this.gene,
            myType: this.model.get("myType"),
            cancerType:this.model.get("cancerType"),
            sortXAxis:this.model.get("sortXAxis"),
            sortYAxis: this.model.get("sortYAxis"),
            minNrAlteredSamples: this.model.get("minNrAlteredSamples"),
            showGenomicAlterationTypes: this.model.get("showGenomicAlterationTypes"),
            cancerTypeDetailed: this.model.get("cancerTypeDetailed")
         });

         $(this.el).html(this.template);
         this.drawHistogram();
      },
      
      drawHistogram: function(){
    	  alert('drawing histogram' + this.model.get("cancerTypeDetailed"));
      }
      
   }); // end of GeneHistogramView



   var HistogramSettings = Backbone.Model.extend({
      defaults: {
         myType: "HistogramSettings",
         cancerType: "All",
         cancerTypeDetailed: "All",
         sortXAxis: "Y-Axis Values",
         sortYAxis: "Absolute Counts",
         minNrAlteredSamples: "1",
         showGenomicAlterationTypes: true
      },
      initialize: function(options) {
    	  this.set("cancerTypeDetailed", options.dmPresenter.getCancerTypeList()); 
          console.log("HistogramSettings Created");
      }
  });


var SpecificCancerTypesView = Backbone.View.extend({

      initialize: function(options){
         this.gene = options.gene;
         this.dmPresenter = options.dmPresenter;
         this.dispatcher = options.dispatcher;
         this.addEventListener();
         this.render();
         // call render again when the model is changed
         this.model.on("change", this.updateRender, this);
      },

      //function for model.onchange above, it will check whether the view needs
      //to be udpated:
      updateRender: function(){
    	  var cancerTypeChanged = this.model.hasChanged("cancerType");
    	  if (cancerTypeChanged)
    		  this.render();
      },
      
      addEventListener: function(){
         var self=this;
         // when the Show/Hide Specific Cancer Types is clicked, show or hide the section and change the icon
         $("#show-hide-cancertypes-toggle-"+this.gene).click(function() {
              $("#show-hide-cancertypes-"+self.gene+" .triangle").toggle();
              $("#specific-cancertypes-area-"+self.gene).slideToggle();
         });
         // add listener for the Cancer Type changed
         // when this happens, we need to generate the items in the 

      },

      render: function() {
    	  
    	  var templateFn = BackboneTemplateCache.getTemplateFn("specific_cancertypes_area_template");
    	  this.template = templateFn();
          // add the template
          $(this.el).html(this.template);
    	  
    	  var listOfOptions = [];
    	  if (this.model.get("cancerType") == "All")
    		  listOfOptions = this.dmPresenter.getCancerTypeList(); 
    	  else
    		  listOfOptions = this.dmPresenter.getCancerTypeDetailedList(this.model.get("cancerType"));
    	  
    	  for (var i = 0; i < listOfOptions.length; i++){
    		  this.addCancerTypeCheckbox(listOfOptions[i]);
    	  }

      },
      
      // add checkbox for genomic alteration types
      addCancerTypeCheckbox: function(cancerType){
    	 var self = this;    	 
    	 // handle the event for when the Show genomic alteration types checkbkox is changed
         var changeCallBack = function(){
        	 var cancerTypeDetailedList = self.model.get("cancerTypeDetailed");
        	 //update model, which triggers a redraw of the histogram:
        	 var checked = $(this).is(":checked");
        	 if (checked) {
        		 cancerTypeDetailedList.push($(this).attr("cancerType"));
        	 }
        	 else {
            	 var indexOfType = cancerTypeDetailedList.indexOf($(this).attr("cancerType"));
            	 cancerTypeDetailedList.splice(indexOfType, 1);
        	 }
        	 //unset model value,  otherwise model.onchange is not triggered, since it is an array object:
        	 self.model.unset("cancerTypeDetailed", {silent: true});
        	 self.model.set("cancerTypeDetailed", cancerTypeDetailedList);
         }
         //create checkbox and add it
         var checkBox = $("<input/>", {type: 'checkbox', checked: true}).change(changeCallBack);
         checkBox.attr("cancerType", cancerType);
         $(this.el).append(checkBox);
         //checkbox label:
         $(this.el).append( 	
        	$("<label/>").text(cancerType));
      }
  });



   var BackboneTemplateCache = (function () {
      var _cache = {};

      /**
       * Compiles the template for the given template id
       * by using underscore template function.
       *
       * @param templateId    html id of the template content
       * @returns function    compiled template function
       */
      function compileTemplate(templateId)
      {
         return _.template($("#" + templateId).html());
      }

      /**
       * Gets the template function corresponding to the given template id.
       *
       * @param templateId    html id of the template content
       * @returns function    template function
       */
      function getTemplateFn(templateId)
      {
         // try to use the cached value first
         var templateFn = _cache[templateId];

         // compile if not compiled yet
         if (templateFn == null)
         {
            templateFn = compileTemplate(templateId);
            _cache[templateId] = templateFn;
         }

         return templateFn;
      }

   return {
      getTemplateFn: getTemplateFn
   };
})();



//utility function to create a select/drop-down box: 
fnCreateSelect = function(title, aData, defaultItem, callBack) {
	var div = $('<div/>');
	div.html(title);
	var sel = $('<select />');	
	sel.appendTo(div);
	
	for(var i = 0; i < aData.length; i++) {
	    $('<option />', {value: aData[i], text: aData[i]}).appendTo(sel);
	}
	sel.change(callBack);
	return div;
}



// Controller which glues it all together
function GeneDetailsController(cancerSummaryMainView, dispatcher, dmPresenter){
   // variable for keeping track of whether the tab has been initiliazed to prevent creating new content every time we switch to a different tab
   var geneTabGenerated = {};

   // initialize the controller
   function init(){
      dispatcher.on(GeneDetailsEvents.GENE_TABS_CREATED, geneTabCreatedHandler); // subscribe to the GENE_TAB_CREATED event
      dispatcher.on(GeneDetailsEvents.GENE_TAB_SELECTED, geneTabSelectedHandler); // subscribe to the GENE_TAB_CREATED event
   }

   // handle the content of the first tab when the tabs are created
   function geneTabCreatedHandler(gene){
      //console.log("geneTabCreated! "+gene);
      geneTabGenerated[gene] = createTabContent(gene);
   }

   // handle the content of the tab when user switches to a different tab
   function geneTabSelectedHandler(gene){
	  //if tab has not yet been created/rendered before, do it now:
      if(geneTabGenerated[gene]==null){
         //console.log("geneTabSelected! "+gene);
         geneTabGenerated[gene] = createTabContent(gene);
      }
   }

   // create the content of a tab, triggered when tab 
   function createTabContent(gene){
      var histogramSettings = new HistogramSettings({dmPresenter: dmPresenter});

      // create a ButtonsView, providing the gene, the dispatcher and the el
      var buttonsView = new ButtonsView({
         gene:gene, 
         el:"#button-container-"+gene, 
         dispatcher:dispatcher
      });
      // create a CustomizeHistogramView, providing the gene, the dispatcher and the el
      var customizeHistogramView = new CustomizeHistogramView({
         gene:gene, 
         el:"#customize-histogram-"+gene, 
         dispatcher:dispatcher,
         model: histogramSettings, 
         dmPresenter:dmPresenter
      });
      // create a GeneHistogramView, providing the gene, the dispatcher, the el and a model
      // the model contains the settings for the Histogram
      // the CustomizeHistogramView notifies the GeneHistogramView when a setting is changed
      // which triggers a change to the settings model, which triggers a render call, thereby updating the histogram
      var geneHistogramView = new GeneHistogramView({
         gene:gene, 
         el:"#histogram-"+gene, 
         model: histogramSettings, 
         dispatcher:dispatcher
      });
      buttonsView.render();
      customizeHistogramView.render();
      geneHistogramView.render();
      return true;
   }

   // when GeneDetailsController is called, initialise
   init();
}

//'presenter' layer to expose the DataManager API, formating its data for display in the views
function DataManagerPresenter()
{
	// returns the CANCER_TYPE list
	this.getCancerTypeList = function() {
		return ["breast", "lung"];
	}
	
	// returns the CANCER_TYPE_DETAILED list for the given cancerType
	this.getCancerTypeDetailedList = function(cancerType) {
		//dummy impl. for now:
		if (cancerType == "breast")
			return ["breast_det_1", "breast_det_2"];
		else if (cancerType == "lung")
			return ["lung_det_1", "lung_det_2"];
		else 
			return [];
	}
	
	//returns the total number of cancerType samples where there is one or more alterations for the given gene
	this.getNrAlteredSamplesForCancerTypeAndGene = function(cancerType, gene){
		//dummy results for now
		
		if (cancerType == "breast"){
			if (gene == "TNF")
				return 5;
			else 
				return 8;
		}
		else if (cancerType == "lung"){
			if (gene == "TNF")
				return 20;
			else 
				return 4;
		}
		else {
			if (gene == "TNF")
				return 25;
			else 
				return 12;
		}
			
	}
	
	
}

//'presenter' layer to expose the parameters from query, formating its data for display in the views
function QueryPresenter()
{
	this.getGeneList = function(){
		return [{"gene":"TNF"}, {"gene":"IFI44L"}];
	}
}
	
function PancancerStudySummary()
{
   var _cancerSummaryMainView = null;

   function init()
   {
	  console.log("init called");
      // create event dispacther
      var dispatcher = _.extend({}, Backbone.Events);
      var dmPresenter = new DataManagerPresenter();
      var queryPresenter = new QueryPresenter();

      var cancerSummaryMainView = new CancerSummaryMainView({dispatcher:dispatcher, queryPresenter:queryPresenter});
      _cancerSummaryMainView = cancerSummaryMainView;

      // init main controller...
      var controller = new GeneDetailsController(
         cancerSummaryMainView,
         dispatcher, 
         dmPresenter
      );

      // ...and let the fun begin!
      cancerSummaryMainView.render();
   }

   this.init = init;
   this.getView = function() {return _cancerSummaryMainView;};
}


