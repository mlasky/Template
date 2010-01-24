/**
 * MyEdu Template Manager
 * @author: Michael Lasky
 * @requires: jQuery v1.3.2
 **/
var jTpl = {};

/**
 * Main Template Management object.
 * Upon Init it checks for any DOM nodes with the templateClass class.  It 
 * creates a template (tpl) instance for each and stores them in it's template
 * index.
 *
 * @param settings - object of config keys / values to override def config
 * @return Obj - tplManager instance (this).
 **/
jTpl.tplManager = function(settings) {
  var self = this;
  this.templates = []; // Array containing all the templates being used.
  this._rawNodes = {}; // Array containing scrubbed versions of each template 
  
  // Attributes that we care about when cloning dom nodes for new templates.
  this.attrTypes = [
    'src','href','name','id','class','title','alt','target','tabIndex',
    'style','rel','width','height', 'type', 'value'
  ];
  
  // Base config for the manager.  Can be overridden with settings arg.
  this._config = {
    'templateClass': '.tpl',
    'varClass': '.var'
  };
  
  // Override config with settings arg
  if (settings) { $.extend(this._config, settings); }
  
  // Alias this._config to config to save keystrokes
  var config = this._config; 
  
  // Each node with class config.templateClass
  $(config.templateClass).each(function() {
    var name = $(this).attr('name');
    if (!self.hasTemplate(name)) {
      // Create a new template and push it onto the index.
      new jTpl.tpl({
        'node': this, 
        'config': config,
        'manager': self
      });
    }
  });
  return this;
};

jTpl.tplManager.prototype = {
  
  /**
   * Looks through the template index and finds one with a matching name.
   * It then scrubs it clean (removes instance data / var values).
   * If vars is set, it looks through the template's variables and puts in the 
   * values from vars.  
   *
   * @param name - String name of template to get
   * @param vars - Object hash containing variable names and values.
   * @return Mixed - jTpl.tpl instance on success, Boolean false otherwise
   **/
  'getNew': function(name, vars) {
    var tpl;
    var cleanTpl = false;
    
    // Check to see if we've created a scrubbed version of this template before
    // If so, use that instead of recreating a scrubbed DOM
    if (this._rawNodes[name] !== undefined) {
      cleanTpl = this._rawNodes[name].clone();
    }
    if (!cleanTpl) {
      var j = this.templates.length;
      
      // Loop through current templates and look for one with a matching name
      while (j--) {
        tpl = this.templates[j];
        if (tpl.name === name) {
          // Get a scrubbed version of it's DOM
          cleanTpl = tpl.scrubbed();
    
          // Store this DOM for later use
          this._rawNodes[name] = cleanTpl.clone();
          break;
        }
      }
    }
    
    // Seems something went awry, abort for now.
    // TODO: Better error handling.  
    if (!cleanTpl) {
      return false;
    }
    
    // This is a new template so we'll reset it's ID.
    cleanTpl.attr('id', null);
    
    // Initiate a new instance of jTpl.tpl with the scrubbed DOM
    cleanTpl = new jTpl.tpl({
      'node': cleanTpl.get(0), 
      'manager': this,
      'config': this._config
    });
    
    // If vars were passed in apply them to the template's variables
    if (vars) {
      cleanTpl.set(vars);
    }
    return $(cleanTpl.node);
  },
  
  /**
   * Registers a template with the template manager  
   *
   * @param tpl - Template object to register
   * @return bool - true on success, false otherwise 
   *
   * TODO: Check type of incoming template object before pushing it on stack
   **/
  'register': function(tpl) {
    if (tpl) {
      this.templates.push(tpl);
    }
    return true;
  },
  
  /**
   * Gets a tpl object from the manager based on the root node's id.    
   *
   * @param id - Id of the root node of the template's DOM nodes.
   * @return Mixed - template object on success, false if template not found
   **/
  'get': function(id) {
    var i = this.templates.length;
    var tpl;
    while (i--) {
      tpl = this.templates[i];
      if (tpl._id === id) {
        return tpl;
      }
    }
    return false;
  },
  
  /**
   * Checks to see if the manager currently has any templates with the given
   * name.
   *
   * @param name - Name of the template to look for
   * @return bool - true if the manager has that template, false if not
   **/
  'hasTemplate': function(name) {
    var i = this.templates.length;
    var tpl;
    while (i--) {
      tpl = this.templates[i];
      if (tpl.name === name) {
        return true;
      }
    }
    return false;
  },
  
  /**
   * Generates a unique string of length len (default: 9)
   * This is here to generate unique id's for DOM nodes.   The functionality
   * should probably be in another place (not in the template code), but 
   * it's here to reduce external dependencies.
   *
   * @param len - Integer length of string to produce
   * @return String - String of random characaters of length len || 9
   **/ 
  '_generateId': function(len) {
    len = len || 9;
    var chars = "-abcdefghiklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ";
    var random_string = '';
    var random_num;
    
    for (var i=0; i<len; i++) {
        random_num = Math.floor(Math.random() * chars.length);
        random_string += chars.substr(random_num,1);
    }
    return random_string;
  }
};

/**
 * Template object.  Holds various properties and methods for working with 
 * instantiated templates.  
 *
 * @param o - Keyword object arguments for the template. Including: 
 *                  node: DOM node to instantiate template upon   REQUIRED
 *                  manager: Template manager object              REQUIRED
 *                  config: Config settings overrides             OPTIONAL
 * @return Obj - tpl instance (this).
 **/
jTpl.tpl = function(o) {

  this.node = o.node;                 // DOM node to instantiate template upon
  this.vars = [];                     // Array of template vars
  this.manager = o.manager || {};     // tplManager object
  this._subTemplates = {};            // Holds any sub-templates in this tpl
  
  var $node = $(this.node);
  this.name = $node.attr('name');  // Name of the template
    
  // So we don't need to bind current scope into each() below
  var self = this;
  
  // Give this template a unique id if it doesn't already have one
  if (!$node.attr('id')) {
    $node.attr('id', this.manager._generateId());
  }
  
  this._id = $node.attr('id');
  
  // Configuration.  Can be overidden by o.config vars
  this._config = {
    'varClass': '.var'
  };

  // Override config with settings
  if (o.config) { $.extend(this._config, o.config); } 
  var config = this._config; // Alias this._config to config to save keystrokes
  
  // Store vars
  $(config.varClass, this.node).each(function(i) {
    
    // Get the id of the first parent with the template class.  Compare that
    // id against this template's id to make sure this variable is a direct
    // template var and not a sub-template var.
    var parent_id = $(this).parents(config.templateClass).get(0).id;
    if (parent_id === $node.attr('id')) {
      
      // Instantiate a new variable object for this node
      self.vars.push(new jTpl.tplVariable({
        'node': this,
        'template': self
      }));
    }
  });

  // Look for any sub-templates within this one and do stuff to them.
  $(config.templateClass, this.node).each(function() {
    var name = $(this).attr('name');
    if (!self.manager.hasTemplate(name)) {
      var tpl = new jTpl.tpl({
        'node': this,
        'manager': self.manager,
        'config': self._config
      });
    }
    
    self._subTemplates[name] = self.manager.getNew(name);
    
    self._subTemplates[name].insertAfter(this);
    $(this).remove();
  });
  
  this.manager.register(this);
  return this;
};

jTpl.tpl.prototype = {
  
  /**
   * Clones a DOM tree and scrubs it of values.  Looks at children of passed in
   * node and calls itself recursively on them.  The result is a DOM tree that
   * mirrors the original but does not === the original and that does not have
   * values for it's variable nodes.
   * 
   * @param node - HTMLElement Parent node.  Defaults to this.node (tpl root)
   * @return HTMLElement - DOM tree similar to the passed node but without 
   *                        variable node values.
   **/
  'scrubbed': function(node) {

    node = node || this.node;   // Use either the passed node or tpl root
    var tagName = node.tagName;     // Node type (div, span, etc)
    var sNode = $('<' + node.tagName + '/>');   // New node of type tagName
    var i = this.manager.attrTypes.length;  // Len of attr types we care about
    var attr_types = this.manager.attrTypes; // Localize the attr types array
    var attr, cNode;  // Local vars for the current attribute and child node
    var self = this;  
    var $node = $(node);
    
    // Check if the node has a value for each attribute in attr_types.  If so, 
    // apply that name and val to the new node
    while (i--) {
      attr = attr_types[i];
      if ($node.attr(attr)) {
        sNode.attr(attr, $node.attr(attr));
      }
    }
    
    // If it already has an ID give it a new one so we don't have a duplicate
    // id in the DOM
    if (sNode.attr('id')) {
      sNode.attr('id', this.manager._generateId()); 
    }
    
    // If this node is a variable then empty it
    if (sNode.hasClass(this._config.varClass)) {
      sNode.empty();
      // Some nodes don't have innerHTML
      if (sNode.get(0).innerHTML) {
        sNode.get(0).innerHTML = '';
      }
      
    }
    
    // Look at the children of the current node and call scrubbed recursively 
    // on each.  Then append them to the current scrubbed node
    var child;
    var cNodes = node.childNodes;
    var cLen = cNodes.length;
    
    for (i=0; i < cLen; i++) {
      child = cNodes[i];
      // Check if this is a text node, if so just append it
      if (child.nodeName === '#text') {
        $(child).clone().appendTo(sNode);
      }
      else {
        // If it's not a text node then call scrubbed on it, then append it
        cNode = self.scrubbed(child);
        cNode.appendTo(sNode);
      }
    };
    
    // Return a scrubbed DOM tree
    return sNode;
  },

  /**
   * Checks to see if this template has a sub template with the given name.
   *
   * @param name  - String name of the sub template you're searching for.
   * @return bool - true if this template has the given subtemplate, otherwise
   *                false
   **/
  'hasSubTemplate': function (name) {
    return typeof this._subTemplates[name] !== 'undefined';
  },
  
  /**
   * Adds a sub template to this template.  Finds the DOM node of the last 
   * sub-template of the passed template type and appends the passed template
   * after that.  So if your "blog_post" template has many "comment" 
   * sub-templates, and you add a new "comment" sub-template to the "blog_post"
   * it'll look through the blog post's DOM to find the last node corresponding
   * to the root node of the passed sub-template's type ("comment") and append 
   * the passed sub-template after that.    
   *
   * @param tpl  - String name of the sub-template type to append.
   * @param vars - Obj of values to apply to the sub template vars.
   * @return Mixed - tpl instance (this), false if there's a problem
   **/
  'addTpl': function(tpl, vars) {
    if (!tpl) {
      return false;
    }
    
    // Make sure this template even has one of these sub-templates
    if (!this.hasSubTemplate(tpl)) {
      return false;
    }
    
    var tc = this._config.templateClass;
    
    // Since we're adding a template we (for now) just want to append it after
    // the last node which has the same template name.
    
    // Get the last template element with this name 
    var sub_template = $(tc + '[name="'+tpl+'"]:last', this.node);
    
    // Create a new template instance and append it after.
    var newTpl = this.manager.getNew(tpl, vars);
    sub_template.after(newTpl.show());
    
    return this;
  },
  
  /**
   * Applies a set of events to the nodes of the template's DOM  
   *
   * @param events -  Array of event objects.  Event Objects take the form of:
   *                  { 'selector': 'div', 'ev': 'click', 'fn': function(){} }
   * @return bool - true on success, false otherwise
   *
   * TODO: Probably shouldn't be using live to bind.  Look into another 
   * solution without adding too much overall complexity.
   *
   * FIXME: There's a slight bug here wherein if you repeatedly bind events 
   * to various selectors the _tplEvents will only contain the latest set of 
   * events even tough the DOM might have previous events bound (nothing is 
   * unbound unless a new event specifically comes in and overrides it.)
   **/
  '_applyEvents': function(events) {
    
    if (!events) {
      return false;
    }
  
    var ev;
    var k = events.length;
    while (k--) {
      ev = events[k];
      $(ev.selector, this.node).unbind().live(ev.ev, ev.fn);
    }
    
    // Store the current events
    this._tplEvents = events;
    return true;
  },
  
  /**
   * Loops through object vars passed in and sets the values / attributes for
   * the template variables accordingly.
   *
   * @param vars - Object of variables to set
   * @return Obj - tpl instance (this).
   **/
  'set': function(vars) {
    var vbl, cVar;
    var self = this;
    
    // Each var
    for (i in vars) {
      cVar = vars[i];
      
      var j = self.vars.length; // Len of current template var array
      
      if (i === 'tplEvents') {
        self._applyEvents(cVar);
      }
      
      // Look at each template var to see if it matches the current (i)
      while (j--) {
        vbl = self.vars[j];
        if (vbl._name === i) {
          vbl.set(cVar); // Set the data
        }
      }
     
     // If "this" is an object (but not the DOMWindow) and we have a template
     // corresponding to it's key value (i) then apply the values to the sub-
     // template and show it. 
      if (cVar && cVar.toString() !== '[object DOMWindow]' && 
          typeof self._subTemplates[i] !== 'undefined') 
      {
        this.manager.get(self._subTemplates[i].attr('id')).set(cVar).show();
      }
    };
    return $(this.node);
  }
};

/**
 * Template Variable object.  Holds various properties and methods for working 
 * with instantiated template variables.  
 *
 * @param o - Keyword object arguments for the variable. Including: 
 *                  node: DOM node to instantiate variable upon   REQUIRED
 *                  template: Template which contains var         REQUIRED
 * @return Obj - tplVariable instance (this).
 **/
jTpl.tplVariable = function(o) {
  this.node = o.node || {};
  this.template = o.template || {};
  var $node = $(this.node); // Cache jQuery obj for this.node locally

  // Attribute types (href, class, src, etc)
  var attrTypes = this.template.manager.attrTypes;
  var i = attrTypes.length;
   
  // Local variables for current type and node value
  var type, val; 
  
  // Look through the attributes we care about and set them as object 
  // properties
  while (i--) {
    type = attrTypes[i];
    val = $node.attr(type); // Current node value for that type
    
    // If the node has a value for this attribute type set the attribute 
    // for the object
    if (typeof val !== 'undefined') {
      this.attr(type, val);
    }
  }
  
  // Check if this node already has an ID.  If not generate a unique one and 
  // set it
  if (!this._id) {
    this._id = this.template.manager._generateId();
    $node.attr('id', this._id);
  }
  return this;
};

jTpl.tplVariable.prototype = {
  
  /** 
   * Mirrors the jquery attr() method but also sets object properties.
   * If just attr is passed then it returns the value for that attribute. 
   * If attr and val are passed it sets attr to the new val and returns it.
   * 
   * @param attr - String Attribute name to get or set
   * @param val - String Optional value to set attribute to
   * @return String - Current value of attr
   **/
  'attr': function(attr, val) {
    var property_attr = '_' + attr;
    if (val) {
      this[property_attr] = val;        // Set object property
      $(this.node).attr(attr, val);     // Set it on the DOM node itself
    }
    
    // Return the current value for attr
    return this[property_attr];
  },
  

  /**
   * Gets and sets vals for variable nodes.
   * Works like jQuery's val() method.  If a value is passed in it sets 
   * the object property for that value sets the node value to it.  
   * If val isn't passed in (null) then it just returns the node's value.
   *
   * @param val - String Optional value to set the node to.
   * @return String - Current value of the node.   
   **/
  'val': function(val) {
    if (val) {
      this._val = val; // Set the variable object property
      this.node.innerHTML = val; // Set the value in the actual DOM node
    }
    return $(this.node).html(); // Return the current node value
  },
  
  /** 
   * Sets values and attributes of the variable.
   * If val is just a string it sets the variables value to val.  
   * If val is an object it sets the corresponding attributes and values
   *
   * @param val -  String: Sets variables value.  
   *               Object: Sets value and attributes
   * @return Obj - tplVariable instance (this).                     
   **/
   'set': function(val) {
     var self = this;
     // If val is an object then length will be undefined
     if (val.length === undefined) {
       
       // Each obj hash property
       $.each(val, function(i) {
         // Check for 'value' specifically because we need to call val instead
         // of attr in that case
         if (i === 'value') {
           self.val(this);
         }
         else {
           self.attr(i, this);
         }
       });
     }
     else {
       // They just passed a string in for a value so just set it
       this.val(val);
     }
     return this;
   }
};