FBL.ns(function() { 
	with (FBL) {
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
                               this.attachToHTMLPanel();
                           },
                           
                           getHTMLPanelContextMenuItems : function(node, target) {
                               var panel = this;
                               items = [];
                               items.push("-");
                               items.push({ 
                                              label: "extensions.firescrape.MarkContainerElement",
                                              command: function() { 
                                                  Firebug.Console.log("Marked %o", node);
                                                  panel.markedElement = node;
                                              }
                                          });
                               items.push({ 
                                              label: "extensions.firescrape.CopyRelativeXPath",
                                              command: function() {
                                                  var xpath = firescrape.relativeXPath(node, panel.markedElement);
                                                  Firebug.Console.log("Copied XPath %o", xpath);
                                                  copyToClipboard(xpath);
                                              }
                                          });
                               return items;
                           },
                           attachToHTMLPanel: function()
                           { 
                               var scapePanel = this;
                               var fbGetContextMenuItems = Firebug.HTMLPanel.prototype.getContextMenuItems;
                                   
                               Firebug.HTMLPanel.prototype.getContextMenuItems = function(node, target) {
                                   
                                   var items = fbGetContextMenuItems.call(this, node, target); 
                                   var myItems = scapePanel.getHTMLPanelContextMenuItems(node, target);
                                   return items.concat(myItems);
                               };
                           }
                       });

	    Firebug.registerPanel(FirescrapePanel);
	    Firebug.registerModule(Firebug.FirescrapeModel);

	}});
