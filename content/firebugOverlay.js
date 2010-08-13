FBL.ns(function() { 
	with (FBL) {

            function FIRESCRAPE_STR(name) {
                var good = Firescrape.strings.getString(name);
                if (good)
                    return good;
                else
                    return name;
            }
            
            var panelName = "Firescrape";

            Firebug.FirescrapeModel = 
                extend(Firebug.Module,
                       {
                           scrapers: [],
                           win: null,
                           firescrapeListeners: [],

                           initialize : function(prefDomain, prefNames) {
                               this.attachToHTMLPanel();
                           },

                           watchWindow: function(context, win)
                           {
                               this.win = win;
                           },

                           unwatchWindow: function(context, win)
                           {
                               if (this.win === win) {
                                   this.win = null;
                               }
                           },


                           addScraper : function(scraper) {
                               this.scrapers.push(scraper);
                               dispatchNoCatch(this.firescrapeListeners, "onScraperAdded", [ scraper ]);
                           },

                           removeScraper : function(scraper) {
                               this.scrapers = this.scapers.filter(
                                   function(x){
                                       return x !== scraper;
                                   });
                               dispatchNoCatch(this.firescrapeListeners, "onScraperRemoved", [ scraper ]);
                           },

                           addListener : function(listener) {
                               this.firescrapeListeners.push(listener);
                           },

                           removeListener : function(listener) {
                               this.firescrapeListeners = this.firescrapeListeners.filter(
                                   function(x){
                                       return x !== listener;
                                   });
                           },

                           showPanel: function(browser, panel) {
                               var isHwPanel = panel && panel.name == panelName;
                               var hwButtons = browser.chrome.$("fbHelloWorldButtons");
                               collapse(hwButtons, !isHwPanel);
                           },

                           getPanel : function(context) {
                               context = context || FirebugContext;
                               return context.getPanel(panelName);
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

                           onRefresh: function(context) {
                               var module = this;
                               var doc = this.win && this.win.document;
                               if (doc)
                               {
                                   this.scrapers.map(
                                       function(scraper) {
                                           return scraper.evalScraper(doc, false);
                                       });
                               }
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
                               var elementStorage = this;
                               var panel = this.getPanel();
                               
                               items = [];
                               items.push("-");
                               items.push(
                                   { 
                                       label: FIRESCRAPE_STR("extensions.firescrape.MarkContainerElement"),
                                       command: function() { 
                                           elementStorage.markedElement = node;
                                       }
                                   });
                               items.push(
                                   { 
                                       label: FIRESCRAPE_STR("extensions.firescrape.CopyRelativeXPath"),
                                       command: function() {
                                           var xpath = firescrape.relativeXPath(node, elementStorage.markedElement);
                                           copyToClipboard(xpath);
                                       }
                                   });
                               items.push(
                                   { 
                                       label: FIRESCRAPE_STR("extensions.firescrape.DefineScraperRelativeTo"),
                                       command: function() { 
                                           var xpath = firescrape.relativeXPath(node, elementStorage.markedElement);
                                           var name = prompt("Name for new scraper (xpath: " + xpath);
                                           var myPanel = panel;
                                           if (name && panel) {
                                               var scraper = new XPathScraper(xpath, name);
                                               Firebug.FirescrapeModel.addScraper(scraper);
                                           }
                                       }
                                   });
                               return items;
                           },
                           attachToHTMLPanel: function()
                           { 
                               var model = this;
                               var fbGetContextMenuItems = Firebug.HTMLPanel.prototype.getContextMenuItems;
                                   
                               Firebug.HTMLPanel.prototype.getContextMenuItems = function(node, target) {
                                   
                                   var items = fbGetContextMenuItems.call(this, node, target); 
                                   var myItems = model.getHTMLPanelContextMenuItems(node, target);
                                   return items.concat(myItems);
                               };
                           }
                       });

            /// Scraper
            function Scraper() { this.initialize.apply(this, arguments); }
            function XPathScraper() { Scraper.apply(this, arguments); }

            XPathScraper.prototype = extend(
                Scraper.prototype,
                {
                    initialize : function(xpath, name) {
                        this.children = {};
                        this.xpath = xpath;
                        this.name = name;
                        this.listeners = [];
                        this.children = {};
                    },

                    evalScraper : function(contextNode, evalChildren) {
                        var nodes = firescrape.evaluateXPath(this.xpath, contextNode);
                        
                        dispatchNoCatch(this.listeners, "onEval", [nodes]);

                        var result = {
                            "output": nodes,
                            "childOutput" : {}
                        };

                        if (evalChildren)
                        {
                            for (var childName in this.children)
                            {
                                var child = this.children[childName];
                                result.childOutput[childName] = nodes.map(
                                    function(node){
                                        child.evalScraper(node, evalChildren);
                                    });   
                            }
                            dispatchNoCatch(this.listeners, "onEvalRecursive", [result]);
                        }
                        
                        return result;
                    },

                    setName : function(n) {
                        var old = this.name;
                        this.name = n;
                        dispatchNoCatch(this.listeners, "onChangeName", [n, old]);
                    },

                    setXPath : function(n) {
                        var old = this.xpath;
                        this.xpath = n;
                        dispatchNoCatch(this.listeners, "onChangeXPath", [n, old]);
                    },


                    getTitle : function() {
                        return this.name;
                    },

                    getDetails : function() {
                        return this.xpath;
                    },
                    
                    addListener : function(listener) {
                        this.listeners.push(listener);
                    },
                    
                    removeListener : function(listener) {
                        this.listeners = this.listeners.filter(
                            function(x){
                                return x !== listener;
                            });
                    },
                    
                    addChild : function(scraper, name) {
                        var existing = this.children[name];
                        if (existing)
                            this.removeChild(existing);

                        this.children[name] = scraper;
                        dispatchNoCatch(this.listeners, "onChildAdded", [scraper]);
                    },
                    
                    removeChild : function(scraper) {
                        var removed = [];
                        for (var name in this.children) {
                            var child = this.children[name]; 
                            if (child === scraper) {
                                delete this.children[name];
                                removed.push(child);
                            }
                        }

                        var parent = this;
                        removed.map(function(child){
                                    dispatchNoCatch(parent.listeners, "onChildRemoved", [child]);
                                    });
                                    
                    }


                });

            ///////////////////////////////////////////////////////
            /////  UI
            ///////////////////////////////////////////////////////

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
                                 return scraper.name || "Scraper";
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
                                                    onclick: "$onToggleProperties"},
                                                   SPAN({"class": "scraper-title objectLink-object objectLink"},
                                                        "$scraper|getTitle"),
                                                   SPAN({"class": "scraper-details spyStatus"},
                                                        "$scraper|getDetails"))),
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
                                 return scraper.getTitle() || "Scraper Title Here!";
                             },
                             getDetails: function(scraper, context)
                             {
                                 return scraper.getDetails() || "";
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

            
            function FirescrapeSidePanel() {}
            
            FirescrapeSidePanel.prototype = extend(
                Firebug.DOMBasePanel.prototype,
                {
                    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
                    // extends Panel
                    
                    name: "scrapeSide",
                    parentPanel: panelName,
                    order: 3,
                    //title: "Scraper",
                    
                    initializeNode : function(oldPanelNode)
                    {
                        dispatch([Firebug.A11yModel], 'onInitializeNode', [this, 'console']);
                    },
                    
                    destroyNode: function()
                    {
                        dispatch([Firebug.A11yModel], 'onDestroyNode', [this, 'console']);
                    }
                });

            
	    function FirescrapePanel() {}

	    FirescrapePanel.prototype = 
                extend(Firebug.Panel.prototype,
                       {
                           // properties inherited from Firebug.Panel
                           name: panelName,
                           title: "Scrape",
                           //dependents: ["scrapeSide"],

                           // the rest...
                           scrapers: [],

                           initialize: function()
                           {
                               Firebug.Panel.initialize.apply(this, arguments);
                               Firebug.FirescrapeModel.addStyleSheet(this);
                               Firebug.FirescrapeModel.addListener(this);

                               var panel = this;
                               var parentNode = panel.panelNode;

                               

                               panel.tableNode = FSTemplates.ScraperTable.tableTag.append(
                                   {},
                                   parentNode,
                                   FSTemplates.ScraperTable
                               );
                           },
                           
                           onScraperAdded : function(scraper) {
                               var sideScrapePanel = FirebugContext.getPanel("scrapeSide", false);
                               
                               var panel = this;
                               var table = panel.tableNode;
                               if (!table)
                                   return;
                               
                               var tbody = table.getElementsByClassName("scrape-table-body")[0];
                               var trs = FSTemplates.ScraperTableRow.rowTag.insertRows(
                                   {scrapers: [ scraper ]},
                                   tbody,
                                   FSTemplates.ScraperTableRow
                               );

                               var tr = tbody.lastElementChild;

                               var valueTd = tr.getElementsByClassName("scraper-value")[0];
                               
                               valueTd.innerHTML = "";

                               scraper.addListener(
                                   {
                                       onEval: function(nodes) {
                                           valueTd.innerHTML = "";
                                           var rep = Firebug.getRep(nodes);
                                           var tag = rep.tag; //rep.shortTag ? rep.shortTag : rep.tag;
                                           tag.append({object : nodes }, valueTd, rep);
                                       }
                                   });
                               
                           }
                       });

            //Firebug.registerPanel(FirescrapeSidePanel);
	    Firebug.registerPanel(FirescrapePanel);
	    
	    Firebug.registerModule(Firebug.FirescrapeModel);

	}});
