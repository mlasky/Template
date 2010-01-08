(function($) {
  $.fn.template = function(settings) {
    var templates;              // Array of templates
    var tpl, vbl;               // Local var for current template or variable
    var tpl_class, var_class;   // Local vars for respective config classes 
    var c;                      // Alias to config, to save keystrokes  
    var $this;                  // Local var for $(this)
    var _raw_templates;         // Array of "scrubbed" (empty vals) templates
    var self = this;
    
    var config = {
      'tplClass': 'tpl',
      'varClass': 'var'
    };
    
    this.getNew = function(name, values) {
      var tpl = this._getRaw(name);
      tpl.set(values);
      return tpl;
    };
        
    this.get = function(name) {
      var tpl;
      var i = templates.length;
      
      while(i--) {
        tpl = templates[i];
        if (tpl.name === name) {
          return tpl;
        }
      }
      return false;
    };
    
    this._register = function(tpl) {
      return this._createRaw(tpl);
    };
    
    // clone method from 
    // http://keithdevens.com/weblog/archive/2007/Jun/07/javascript.clone
    this._clone = function(obj) {
        if(obj == null || typeof(obj) != 'object')
            return obj;
          
        var temp = new obj.constructor(); 
        for(var key in obj)
            temp[key] = this.constructor(obj[key]);
          
        return temp;
    };
    
    this._getRaw = function(name) {
      var tpl;
      var i = _raw_templates.length;
      while(i--) {
        tpl = _raw_templates[i];
        if (tpl.name == name) {
          return self._clone(tpl);
        }
      }
      return false;
    };
    
    this._createRaw = function(tpl) {
      tpl = this._scrub(tpl);
      
      tpl.set = function(data) {
        var tpl = this;
        $.each(data, function(key, val) {
          var idx = tpl.getIdx(key);
          if (idx !== false) {
            tpl.vars[idx].set(val);
            return true;
          }
        });
        return false;
      }
      
      tpl.getIdx = function(key) {
        var vars = this.vars;
        var i = vars.length;
        var vbl;
        while(i--) {
          vbl = vars[i];
          if (vbl.name === key) {
            return i;
          }
        }
        return false;
      }
            
      _raw_templates.push(this._scrub(tpl));
      return this;
    };
    
    this._scrub = function(tpl) {
      tpl = self._clone(tpl);
      var vbl;
      var vars = tpl.vars;
      var i = vars.length;
      
      tpl.domNode = $(tpl.domNode).clone(true).get(0);
      while(i--) {
          vbl = vars[i];
          vbl.domNode = $(vbl.domNode).clone(true).empty().get(0);
      }
      
      return tpl;
    };
    
    
    if (settings) { $.extend(config, settings); }
    c = config;
                                                                                                                                                            
    // Clean up the var and tpl name strings... adding a "." if needed
    tpl_class = (c.tplClass.substr(0,1) === '.')? c.tplClass: '.' + c.tplClass;
    var_class = (c.varClass.substr(0,1) === '.')? c.varClass: '.' + c.varClass;

    templates = [];
    _raw_templates = [];
    $(tpl_class, this).each(function(i) {
      $this = $(this);
      
      tpl = templates[i] = {};
      tpl.domNode = this;
      tpl.name = $this.attr('name');
      
      if (!tpl.name) { throw new TypeError('Template must have a name.'); }
      
      tpl.vars = [];
      $(var_class, this).each(function(j) {
        $this = $(this);
        vbl = tpl.vars[j] = {};
        vbl.domNode = this;
        vbl.defaultVal = ($this.hasClass('default-val'))?$this.val():null;
        vbl.name = $this.attr('name');
        vbl._val = $this.text();
        
        if (!vbl.name) { throw new TypeError('Variables must have a name.'); }
        
        vbl.set = function(val) {
          this._val = val;
          $(this.domNode).text(val);
        }
        
      });
      
      self._register(tpl);
    });
    
    return this;
  };
})(jQuery);