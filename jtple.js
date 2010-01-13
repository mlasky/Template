/**
 * MyEdu Template Manager
 * @author: Michael Lasky
 * @requires: jQuery v1.3.2
 **/
var myEdu = myEdu || {};
myEdu.util = myEdu.util || {};

/**
 * Main Template Management object.
 * Upon Init it checks for any DOM nodes with the templateClass class.  It 
 * creates a template (tpl) instance for each and stores them in it's template
 * index.
 *
 * @param settings - object of config keys / values to override def config
 * @return Obj - tplManager instance (this).
 **/
myEdu.util.tplManager = function(settings) {
  var self = this;
  this.templates = []; // Array containing all the templates being used.
  this._rawNodes = {}; // Array containing scrubbed versions of each template 
  this.hasTemplate = {}; // Index for tpl name set true once one is processed
  
  // Attributes that we care about when cloning dom nodes for new templates.
  this.attrTypes = [
    'src','href','name','id','class','title','alt','target','tabIndex',
    'style','rel','width','height'
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
    if (typeof self.hasTemplate[$(this).attr('name')] === 'undefined') {
      
      self.hasTemplate[$(this).attr('name')] = true;
      // Create a new template and push it onto the index.
      self.templates.push(new myEdu.util.tpl({
        'node': this, 
        'config': config,
        'manager': self
      }));
    }
  });
  return this;
};

myEdu.util.tplManager.prototype = {
  
  /**
   * Looks through the template index and finds one with a matching name.
   * It then scrubs it clean (removes instance data / var values).
   * If vars is set, it looks through the template's variables and puts in the 
   * values from vars.  
   *
   * @param name - String name of template to get
   * @param vars - Object hash containing variable names and values.
   * @return Mixed - myEdu.util.tpl instance on success, Boolean false otherwise
   *
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
    
    // Initiate a new instance of myEdu.util.tpl with the scrubbed DOM
    cleanTpl = new myEdu.util.tpl({
      'node': cleanTpl.get(0), 
      'manager': this,
      'config': this._config
    });

    // If vars were passed in apply them to the template's variables
    if (vars) {
      cleanTpl.set(vars);
    }
    
    return cleanTpl;
  },
  
  /**
   * Generates a unique string of length len (default: 9)
   * This is here to generate unique id's for DOM nodes.   The functionality
   * should probably be in another place (not in the template code), but 
   * it's here to reduce external dependancies.
   *
   * @param len - Integer length of string to produce
   * @return String - String of random characaters of length len || 9
   **/ 
  '_generateId': function(len) {
    var chars = "-abcdefghiklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ";
    var string_length = len || 9;
    var random_string = '';
    var random_num;
    
    for (var i=0; i<string_length; i++) {
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
myEdu.util.tpl = function(o) {

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
      self.vars.push(new myEdu.util.tplVariable({
        'node': this,
        'template': self
      }));
    }
  });

  // Look for any sub-templates within this one and do stuff to them.
  $(config.templateClass, this.node).each(function() {
    var name = $(this).attr('name');
    if (typeof self.manager.hasTemplate[name] === 'undefined') {
      var tpl = new myEdu.util.tpl({
        'node': this,
        'manager': self.manager,
        'config': self._config
      });
      self.manager.templates.push(tpl);
    }
    
    self._subTemplates[name] = self.manager.getNew(name);
    
    var parent = $(this).parent();
    $(this).remove();
    self._subTemplates[name].appendTo(parent);
  });
  return this;
};

myEdu.util.tpl.prototype = {
  
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
    
    // If this is the root node for the template then we'll set display:none
    // so the user can show the template at their leisure
    if (node === this.node) {
      sNode.css({'display': 'none'});
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
    $.each(node.childNodes, function() {
      // Check if this is a text node, if so just append it
      if (this.nodeName === '#text') {
        $(this).clone().appendTo(sNode);
      }
      else {
        // If it's not a text node then call scrubbed on it, then append it
        cNode = self.scrubbed(this);
        cNode.appendTo(sNode);
      }
    });
    
    // Return a scrubbed DOM tree
    return sNode;
  },
  
  /**
   * Wraps jQuery appendTo but works on this.node.
   * 
   * TODO: Wrap other jquery manipulation methods or rethink if the template
   * objects need to be special or can they just be jQuery objects
   *
   * @param node: DOM Node, jQuery object, or selector. 
   * @return Obj - jQuery object
   **/
   'appendTo': function(node) {
     return $(this.node).appendTo(node);
   },
  
  'show': function() {
    return $(this.node).show();
  },
  
  /**
   * Loops through object vars passed in and sets the values / attributes for
   * the template variables accordingly.
   *
   * @param vars - Object of variables to set
   * @return Obj - tpl instance (this).
   **/
  'set': function(vars) {
    var j, vbl;
    var self = this;
    // Each var
    $.each(vars, function(i) {
      j = self.vars.length; // Len of current template var array
      
      // Look at each template var to see if it matches the current (i)
      while (j--) {
        vbl = self.vars[j];
        if (vbl._name === i) {
          vbl.set(this); // Set the data
        }
      }
     
      if (this.toString() !== '[object DOMWindow]' && 
          typeof self._subTemplates[i] !== 'undefined') 
      {
        self._subTemplates[i].set(this).show();
      }
    });
    return this;
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
myEdu.util.tplVariable = function(o) {
  this.node = o.node || {};
  this.template = o.template || {};
  var $node = $(this.node); // Cache jQuery obj for this.node locally

  // Look through the attributes we care about and set them as object 
  // properties
  this._setAttrs(); 
  
  // Check if this node already has an ID.  If not generate a unique one and 
  // set it
  if (!this._id) {
    this._id = this.template.manager._generateId();
    $node.attr('id', this._id);
  }
  
  return this;
};

myEdu.util.tplVariable.prototype = {
  
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
   * This function should be removed, it's used for some ugly setup but could 
   * be deprecated soon and functionality handled better.
   * 
   * Loops through the attribute types from the manager and checks to see 
   * if the this.node has that attribute.  If so it sends it through this.attr
   * to set the property val.
   *
   * @return Obj - tplVariable instance (this). 
   **/
  '_setAttrs': function() {
    
    // Attribute types (href, class, src, etc)
    var attrTypes = this.template.manager.attrTypes;
    var i = attrTypes.length;
     
    // Local variables for current type and node value
    var type, val; 
    
    // Loop through the attribute types
    while (i--) {
      type = attrTypes[i];
      val = $(this.node).attr(type); // Current node value for that type
      
      // If the node has a value for this attribute type set the attribute 
      // for the object
      if (typeof val !== 'undefined') {
        this.attr(type, val);
      }
    }
    return this;
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
   *                      
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