(function() {
function nodeAncestry(elem){
  if (elem.parentNode)
     return [elem].concat(nodeAncestry(elem.parentNode));
  else
     return [elem];
}

function nname (node) {
   if (node.nodeType !== 1)
       throw("Attempted to take node name of non-element");
   return node.localName;
}

function attributeXPath (node) {
    if (node.nodeType !== 1)
        throw("Attempted to take attribute xpath of non-element");

    var relevantAttributes = [];

    function nontrivial(x) {
        return x && x.length > 0;
    }
    
    if (nontrivial(node.id)) {
        relevantAttributes.push({
                                    "attribute" : "id",
                                    "value" : node.id
                                });
    }
    
    if (nontrivial(node.className)) {
        relevantAttributes.push({
                                    "attribute" : "class",
                                    "value" : node.className
                                });
    }
    
    var xpression = relevantAttributes.map(function(x) {
                                               return "@" + x.attribute + "='" + x.value + "'";
                                               }).join(" and ");
    if (nontrivial(xpression))
        return "[" + xpression + "]";
    else
        return "";
}
        
function elemXPathRelativeToParent(elt) {
   var index = 0;
   for (var sibling = elt.previousSibling; sibling; sibling = sibling.previousSibling)
   {
       if (sibling.localName == elt.localName)
          ++index;
   }

    var tagName = nname(elt);
    var pathIndex = (index > 0 ? "[" + (index+1) + "]" : "");
    var attributeExpressions = attributeXPath(elt);
   return tagName + pathIndex + attributeExpressions;
}

function relativeXPath(elt, relative) {
    relative = relative ? relative : document;
    if (elt.ownerDocument !== relative.ownerDocument)
        relative = elt.ownerDocument;

    var ancestry = nodeAncestry(elt);
    var relAncestry = nodeAncestry(relative);

    var commonAncestor = null;
    var commonAncestorDepth = null;
    for (var i=0; i < ancestry.length && i < relAncestry.length; i++)
    {
        var eltAncestor = ancestry[ancestry.length - 1 - i];
        var relAncestor = relAncestry[relAncestry.length - 1 - i];
        if (eltAncestor === relAncestor)
        {
            commonAncestor = eltAncestor;
            commonAncestorDepth = i;    
        }
        else
            break;
    }

    //unsafeWindow.console.log("Common ancestor of %o and %o, %o", elt, relative, commonAncestor);
    //unsafeWindow.console.log("lineage: %o and %o", ancestry, relAncestry);
    
    
    var xpathStr = "";
    for (var i=0; i < ancestry.length; i++)
    {
        var node = ancestry[i];
        
        if (node.nodeType === 9)
            xpathStr = "/" + xpathStr;

        //unsafeWindow.console.log("Encountered %o and compared to %o === %o", node, relative, node === relative);
       
        if (node.nodeType !== 1)
            break;
        
        
        if (node === commonAncestor)
        {
            for (var j = commonAncestorDepth; j < relAncestry.length; j++)
            {
                xpathStr = "../" + xpathStr;
            }
            if (commonAncestor === relative) {
                xpathStr = "./" + xpathStr;
            }
            break;
        }
        else
        {
            var thisPart = elemXPathRelativeToParent(node);

            if (xpathStr.length > 0)
                xpathStr = thisPart + "/" + xpathStr;
            else
                xpathStr = thisPart;
        }
    }
    return xpathStr;
}


firescrape.relativeXPath = relativeXPath;
//unsafeWindow.relativeXPathToParent = elemXPathRelativeToParent;
//unsafeWindow.nodeAncestry = nodeAncestry;

//unsafeWindow.console.log("Set up xpath.  Try evalXpath(xpression, node?)");

 })();
