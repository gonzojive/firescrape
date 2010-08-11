FBL.ns(function() { 
	with (FBL) {
            function addMenuItems() {
                var fbGetContextMenuItems = Firebug.HTMLPanel.prototype.getContextMenuItems;
                
                Firebug.HTMLPanel.prototype.getContextMenuItems = function(node, target) {
                    
                    var items = fbGetContextMenuItems.call(this, node, target); 

                    items.push("-");
                    items.push({ label: "extensions.firescrape.MarkContainerElement",
                                 command: function() { 
                                     alert("");
                                     }
                                 });
                    return items; 
                };
            }

            var panelName = "Firescrape";
            Firebug.FirescrapeModel = 
                extend(Firebug.Module,
                       {
                           showPanel: function(browser, panel) {
                               var isHwPanel = panel && panel.name == panelName;
                               var hwButtons = browser.chrome.$("fbHelloWorldButtons");
                               collapse(hwButtons, !isHwPanel);
                           },
                           onMyButton: function(context) {
                               var helloWorldRep = domplate({
                                       myTag:
                                       DIV( {"class": "MyDiv"},
                                            "Hello World, tada!"
                                           )
                                   });
                               addMenuItems();
                               var panel = context.getPanel(panelName);
                               var parentNode = panel.panelNode;
                               var rootTemplateElement = helloWorldRep.myTag.append({}, parentNode, helloWorldRep);
                           }
                       });

	    function FirescrapePanel() {}
	    FirescrapePanel.prototype = 
                extend(Firebug.Panel,
                       {
                           name: panelName,
                           title: "Scrape",

                           initialize: function()
                           {
                               Firebug.Panel.initialize.apply(this, arguments);
                               addMenuItems();
                           }
                       });

	    Firebug.registerPanel(FirescrapePanel);
	    Firebug.registerModule(Firebug.FirescrapeModel);

	}});
