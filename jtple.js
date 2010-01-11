var myEdu = myEdu || {};
myEdu.util = myEdu.util || {};

myEdu.util.tplManager = function(settings) {
  var self = this;
  
  this._config = {
    'templateClass': '.tpl',
    'varClass': '.var'
  };
  
  if (settings) { $.extend(this._config, settings); }
  
  this.templates = [];
  
  var config = this._config;
  $(config.templateClass).each(function() {
    self.templates.push(new myEdu.util.tpl({
      'node': this, 
      'config': config,
      'manager': self
    }));
  });
  
  return this;
};

myEdu.util.tplManager.prototype = {
  
};

myEdu.util.tpl = function(o) {

  this.node = o.node;
  this.vars = [];
  var self = this;
  
  this._config = {
    'varClass': '.var'
  };

  if (o.config) { $.extend(this._config, o.config); }
  var config = this._config;
  
  // Store vars
  $(config.varClass, this.node).each(function(i) {
    self.vars.push(new myEdu.util.tplVariable({
      'node': this,
      'template': self
    }));
  });
  
  return this;
};

myEdu.util.tpl.prototype = {
  'test': function() {return 'fuckoff';}
};

myEdu.util.tplVariable = function(o) {
  this.node = o.node;
  this.attrTypes = [
    'src','href','name','id','class','title','alt','target','tabIndex',
    'style','rel','width','height'
  ];
  
  var $node = $(this.node);
  
  this._getAttrs();
  
  if (!this._id) {
    this._id = this._generateId();
    $node.attr('id', this._id);
  }
};

myEdu.util.tplVariable.prototype = {
  'attr': function(attr, val) {
    if (val) {
      this['_'+attr] = val;
      $(this.node).attr(attr, val);
    }
    return this['_'+attr];
  },
    
  '_getAttrs': function() {
    var attrTypes = this.attrTypes;
    var len = attrTypes.length;
    var type, attrs, val;
    while (len--) {
      type = attrTypes[len];
      val = $(this.node).attr(type);
      if (typeof val !== 'undefined') {
        this.attr(type, val);
      }
    }
    return this;
  },
  
  'val': function(val) {
    if (val) {
      this._val = val;
    }
    return $(this.node).html(val);
  },
  
  '_generateId': function() {
    var chars = "-abcdefghiklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ";
    var string_length = 9;
    var random_string = '';
    var random_num;
    
  	for (var i=0; i<9; i++) {
  		random_num = Math.floor(Math.random() * chars.length);
  		random_string += chars.substr(random_num,1);
  	}
    return random_string;
  }
};



$(document).ready(function() {
  var template = new myEdu.util.tplManager();
  console.log(template)
});