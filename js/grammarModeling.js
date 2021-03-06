/***
 * Trying to use prototypal pattern for inheritance
 */

 /**
  * A rule for a context-free formal grammar
  */
var Rule = {
  /**
   * Constructor function
   * @param result:String - The non-terminal symbol that the rule produces
   * @param production:[String] - The list of terminal and non-terminal symbols
   *
   * @return an instance of Rule
   */
   create: function(result,production) {
     var instance = Object.create(this);
     instance.result = result;
     instance.production = production;
     return instance;
   },

   /**
    * Show function
    * @return a string representation of the rule
    */
   show: function() {
     ret = `${this.result} : ${this.production.join(" ")} `;
     return ret;
   },

   /**
    * equals function
    * @param other:Rule - rule to check equality against
    *
    * @return a string representation of the rule
    */
   equals: function(other) {
     return this.show() == other.show();
   }

}



/**
 * A rule for a context-free formal grammar with a cursor to track production state
 */
var Item = {
  /**
   * Constructor function
   * @param rule:Rule - The non-terminal symbol that the item produces
   * @param position:Number - The position of the cursor in the production
   *
   * @return an instance of Item
   */
   create: function(rule,position) {
     var instance = Object.create(this);
     instance.result = rule.result;
     instance.production = rule.production;
     instance.cursor = position || 0;
     return instance;
   },

   /**
    * Show function
    * @return a string representation of the item
    */
   show: function() {
     ret = `${this.result} : ${this.production.slice(0,this.cursor).join(" ")} • ${this.production.slice(this.cursor).join(" ")}`;
     return ret;
   },

   /**
    * equality function
    * @param other:Rule - rule to check equality against
    */
   equals: function(other) {
     var res = this.show() == other.show();
     //console.log(this.show()+" == "+other.show()+" is "+res);
     return res;
   }

}

/**
 * A set of items that represent a state
 */
var State = {
  /**
   * Constructor function
   * @param number:Number - The state number for the goto table
   * @param items:[items] - The position of the cursor in the production
   *
   * @return an instance of Item
   */
  create: function(number,items) {
    var instance = Object.create(this);
    instance.number = number;
    instance.items = items;
    return instance;
  },

  /**
   * equality function
   * @param other:State - state to check equality against
   */
  equals: function(other) {
    var ret = this.items.every(function(i){console.log(other.contains(i));return other.contains(i)});
    return other.items.length == this.items.length && ret;
  },

  contains: function(item) {
    return this.items.some(function(i){return item.equals(i)});
  },

  show: function() {
    console.log("State number "+this.number);
    this.items.forEach( (i) => console.log(i.show()))
  },


  createNext: function(number,symbol,grammar) {
    var filtered = this.items.filter((i) => {return i.production[i.cursor] == symbol});
    console.log(filtered);
    var ret = State.create(number, filtered.map((i) => {return Item.create(i,(i.cursor +1))}));
    ret.createClosure(grammar);
    return ret;
  },

  createClosure: function(grammar) {
    //looping function to generate total closure
    var finished = false;
    var nTsExpanded = new Set();
    var par = this;
    while(!finished) {
      finished = true;
      this.items.forEach(function(item) {
        var next = item.production[item.cursor];
        if(next && isNonTerminal(next) && !nTsExpanded.has(next)) {
          console.log("adding new expansion for "+next);
          finished = false;
          var toAdd = grammar.productions.filter(function(r){return r.result == next});
          toAdd.forEach(function(r){
            console.log(Item.create(r,0).show());
            par.items.push(Item.create(r,0));
          });
          nTsExpanded.add(next);
        }
      })
    }
  }
}

/**
 * A formal grammar that is currently implemented with context-free rules
 */
var Grammar = {
  /**
   * Constructor function
   * @param startSymbol:String - The non-terminal symbol that the grammar produces
   * @param terminals:Set<String> - The list of terminal symbols (all lowercase)
   * @param nonTerminals:Set<String> - The list of non-terminal symbols (all uppercase)
   * @param productions:[Rule] - the list of all production rules
   *
   * @return an instance of a Grammar
   */
  create: function(startSymbol, terminals, nonTerminals, productions) {
    var instance = Object.create(this);
    instance.startSymbol = startSymbol;
    instance.terminals = terminals;
    instance.nonTerminals = nonTerminals;
    instance.productions = productions;
    instance.updateFirstSet();
    instance.updateFollowSet();
    return instance;
  },

  updateFirstSet: function() {
    var finished = false;
    //clear first set
    this.firstSet = {};
    var par = this;
    this.productions.forEach(function(rl) {
      par.firstSet[rl.result] = new Set();
    })
    while(!finished) {
      // if nothing changes fixed point generation has finished
      finished = true;
      this.productions.forEach(function(rl) {
        //Check to see if first is a non-terminal
        if(isNonTerminal(rl.production[0])) {
          //non-terminal, add first set of non-terminal
          for(var fterm of par.firstSet[rl.production[0]]) {
            if(!par.firstSet[rl.result].has(fterm)) {
              finished = false;
              par.firstSet[rl.result].add(fterm);
            }
          }
        } else {
          //terminal, add to follow set
          if(!par.firstSet[rl.result].has(rl.production[0])) {
            finished = false;
            par.firstSet[rl.result].add(rl.production[0]);
          }
        }
      })
    }
  },

  updateFollowSet: function() {
    var finished = false;
    //clear first set
    this.followSet = {};
    var par = this;
    this.productions.forEach(function(rl) {
      par.followSet[rl.result] = new Set();
    })

    // Add end of input to startSymbol follow set
    this.followSet[this.startSymbol].add("$");

    /*
     * There are three cases when encountering a non-terminal
     * - The following item is terminal
     *   - Add the terminal to the follow set
     * - The following item is a non-terminal
     *   - TODO: check to see if the non-terminal could be epsilon
     *   - Add the non-terminal's first set to the follow set
     * - The non-terminal is at the end of the production
     *   - Add the result's follow set to the non-terminal's follow set
     */
    while(!finished) {
      finished = true;
      //Loop over all productions
      this.productions.forEach(function(rl) {
        //Loop over every symbol in the production
        //Old fashioned because we need lookahead
        for(var i = 0; i < rl.production.length; i++) {
          //Check to see if we're looking at a non terminal
          if(isNonTerminal(rl.production[i])) {
            var symbol = rl.production[i];
            //console.log("Found non-terminal "+symbol);
            if(i == (rl.production.length-1)) {
              //console.log("End of production, adding follow set of: "+rl.result)
              //End of production: add result's follow set to non-terminals follow set
              for(var fterm of par.followSet[rl.result]) {
                if(!par.followSet[symbol].has(fterm)) {
                  finished = false;
                  par.followSet[symbol].add(fterm);
                }
              }

            } else if(isNonTerminal(rl.production[i+1])) {
              var next = rl.production[i+1];
              //console.log("Non-terminal: "+next)
              //Next symbol is a non-terminal: add first set to follow set
              for(var fterm of par.firstSet[next].values()) {
                if(!par.followSet[symbol].has(fterm)) {
                  finished = false;
                  par.followSet[symbol].add(fterm);
                }
              }

            } else {
              var next = rl.production[i+1];
              //console.log("terminal: "+next)
              //Next symbol is a terminal: add to follow set
              if(!par.followSet[symbol].has(next)) {
                finished = false;
                par.followSet[symbol].add(next);
              }
            }
          }
        }
      })
    }
  },

  hasState: function(state) {
    return this.states.findIndex((s) => s.equals(state)) != -1;
  },

  updateStates: function() {
    var par = this;
    this.states = [];
    var firstRules = this.productions.filter((prod) => {return prod.result == par.startSymbol});
    firstRules.forEach((e) => {console.log(e.show())});
    this.states[0] = State.create(0,firstRules.map(function(prod){return Item.create(prod)}))
    var state;
    //Create rules while unprocessed rules exist
    let rulesProcessed = 0;
    while(this.states.length != rulesProcessed) {
      state = this.states[rulesProcessed];
      symbolsToCheck = new Set();
      state.items.forEach((i) => {if(i.cursor < i.production.length){symbolsToCheck.add(i.production[i.cursor])}});
      console.log(symbolsToCheck);
      symbolsToCheck.forEach((s) => {
        let newS = state.createNext(this.states.length,s,par);
        if(!par.hasState(newS)) {
          par.states.push(newS);
        }
      });
      rulesProcessed += 1;
    }

  }


}


function generateGrammar(input) {
  var lines = input.split("\n");
  var terminals = new Set(); //Set mapping terminals to true
  var nonTerminals = new Set(); //Set mapping non-terminals to true
  var firstProduction; //First non-terminal seen
  var productions = [];
  //Loop state information
  var currentNonTerm = "";

  lines.forEach( function(ln) {
    chars = ln.trim().split(" ");
    var prod;
    //See if production has a new nonTerminal
    if( (isNonTerminal(chars[0]) && chars[1] == ":") || chars[0] == "|" ) {
      if(isNonTerminal(chars[0])) {
        currentNonTerm = chars[0];
        nonTerminals.add(currentNonTerm);
        if(!firstProduction) {
          firstProduction = currentNonTerm;
          console.log("First production: "+currentNonTerm);
        }
        prod = chars.slice(2);
      } else {
        prod = chars.slice(1);
      }
      productions.push(Rule.create(currentNonTerm,prod));
      prod.forEach(function(symbol) {
        if(isNonTerminal(symbol)) {
          nonTerminals.add(symbol);
        } else {
          terminals.add(symbol);
        }
      });
    } else {
      console.log("Unexpected input! "+chars)
    }

  });



  console.log("Terminals: "+Array.from(terminals.values()));
  console.log("Non-Terminals: "+Array.from(nonTerminals.values()));
  productions.forEach(function(p) {
    console.log(p.show());
  })
  ret = Grammar.create(firstProduction,terminals,nonTerminals,productions)
  return ret;
}

function isNonTerminal(str) {
  return str != str.toLowerCase() && str == str.toUpperCase();
}
