FBL.ns(function() { 
	with (FBL) {
            var panelName = "Firescrape";

            Firebug.FirescrapeModel = 
                extend(Firebug.Module,
                       {
                           initialize : function(prefDomain, prefNames) {
                               this.attachToHTMLPanel();
                           },

                           showPanel: function(browser, panel) {
                               var isHwPanel = panel && panel.name == panelName;
                               var hwButtons = browser.chrome.$("fbHelloWorldButtons");
                               collapse(hwButtons, !isHwPanel);
                           },
                           
                           onMyButton: function(context) {
                               var panel = context.getPanel(panelName);

                               var table = panel.tableNode;
                               if (!table)
                                   return;

                               var tbody = table.getElementsByClassName("scrape-table-body")[0];
                               var tr = FSTemplates.ScraperTableRow.rowTag.insertRows(
                                   {scrapers: [{isScraper: true, tooltip: "eye yam " + Math.random()}]},
                                   tbody,
                                   FSTemplates.ScraperTableRow
                               );
                           },

                           onMyButtonOld: function(context) {
                               var panel = context.getPanel(panelName);
                               var parentNode = panel.panelNode;


                               var scraper = {isScraper: true, tooltip: "eye yam"};  
                               var rep = Firebug.getRep(scraper);
                               var elem = rep.tag.append({object: scraper}, parentNode, rep);
                           },

                           addStyleSheet: function(panel)
                           {
                               // Make sure the stylesheet isn't appended twice.
                               var doc = panel.document;
                               var SSID = "firescrapeCSS";
                               if ($(SSID, doc))
                                   return;
                               
                               var styleSheet = createStyleSheet(doc, "chrome://firescrape/skin/firescrape.css");
                               styleSheet.setAttribute("SSID", SSID);
                               addStyleSheet(doc, styleSheet);
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

            /// Scraper
            function Scraper() { this.xpath = "Some silly xpath";}

            // ************************************************************************************************
            // Templates Helpers
            
            // Object with all rep templates.
            var FSTemplates = Firebug.FirescrapeModel.Templates = {};

            FSTemplates.Scraper =
                domplate(FirebugReps.Obj,
                         {
                            supportsObject: function(thing, type) {
                                var result = thing instanceof Scraper || (thing && thing.isScraper == true);
                                return result;
                            },
                             getTooltip: function(scraper) {
                                 return scraper.tooltip || "blah blah blah";
                             },
                             getTitle: function(scraper, context)
                             {
                                 return scraper.title || "Scraper";
                             }
                         });

            FSTemplates.ScraperTableRow =
                domplate(Firebug.Rep,
                         {
                             rowTag: FOR("scraper", "$scrapers",
                                         TR({"class" : "scraper-row"},
                                            TD({"class": "scraper-name"},
                                               FirebugReps.OBJECTBOX(
                                                   {_repObject: "$scraper",
                                                    $hasTwisty: "$scraper|hasChildScrapers",
                                                    onclick: "$onToggleProperties"},
                                                   SPAN({"class": "scraper-title objectLink-object objectLink"},
                                                        "$scraper|getTitle"))),
                                            //FirebugReps.OBJECTLINK(
                                            //    {object: "$object"},
                                            //                       hasTwisty: true},
                                            //    SPAN({"class": "scraper-title"}, "$object|getTitle"))),
                                            TD({"class": "scraper-value"},
                                               "--"))),
                             hasChildScrapers: function (scraper) {
                                 return true;
                             },
                             onToggleProperties: function(event, scraper) {
                                 var row = getAncestorByClass(event.target, "scraper-row");
                                 this.toggleRow(row);
                             },
                             toggleRow: function(row, forceOpen)
                             {
                                 var opened = hasClass(row, "opened");
                                 if (opened && forceOpen)
                                     return;
                                 
                                 toggleClass(row, "opened");
                             },
                             getTitle: function(scraper, context)
                             {
                                 return scraper.title || "Scraper Title Here!";
                             }
                         });


            FSTemplates.ScraperTable =
                domplate(Firebug.Rep,
                         {
                             tableTag:
                             TABLE({"class": "scrape-table", cellpadding: 0, cellspacing: 0, hiddenCols: ""},
                                   THEAD({},
                                         TR({"class": "scrape-table-header"},
                                            TD({id: "colName", "class": "cookieHeaderCell", "width" : "50%"},
                                               DIV({"class": "cookieHeaderCellBox", title: "title"}, 
                                                   "Scraper instance name"
                                                  )),
                                            TD({id: "colValue", "class": "cookieHeaderCell alphaValue"},
                                               DIV({"class": "cookieHeaderCellBox", title: "title"}, 
                                                   "Output")
                                              )
                                           )),
                                   TBODY({"class" : "scrape-table-body"})),

                            supportsObject: function(thing, type) {
                                var result = (thing && thing.isScraperTable == true);
                                return result;
                            },
                             getTooltip: function(scraper) {
                                 return null;
                             },
                             getTitle: function(scraper, context)
                             {
                                 return scraper.title || "Scraper";
                             }
                         });


            Firebug.registerRep(FSTemplates.Scraper);
            //FSTemplates.ScraperTable,
            //FSTemplates.ScraperTableRow
            //);
            
	    function FirescrapePanel() {}

	    FirescrapePanel.prototype = 
                extend(Firebug.Panel,
                       {
                           name: panelName,
                           title: "Scrape",

                           initialize: function()
                           {
                               Firebug.Panel.initialize.apply(this, arguments);
                               Firebug.FirescrapeModel.addStyleSheet(this);

                               var panel = this;
                               var parentNode = panel.panelNode;

                               panel.tableNode = FSTemplates.ScraperTable.tableTag.append(
                                   {},
                                   parentNode,
                                   FSTemplates.ScraperTable
                               );
                           }
                       });

	    Firebug.registerPanel(FirescrapePanel);
	    Firebug.registerModule(Firebug.FirescrapeModel);

	}});
