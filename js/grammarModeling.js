
/***
 * Trying to use prototypal pattern for inheritance
 */

 /***
  * A rule for a context-free formal grammar
  */
var Rule = {
  /**
   * Constructor function
   * @param result:String - The non-terminal symbol that the rule produces
   * @param production:[String] - The list of terminal and nonTerminal symbols
   */
   create: function(result,production) {
     var instance = Object.create(this);
     instance.result = result;
     instance.production = production;
     return instance;
   },

   show: function() {
     ret = `${this.result} : ${this.production} `;
     return ret;
   }

}

/***
 * A formal grammar that is currently implemented with context-free rules
 */
var Grammar = {
  /**
   * Constructor function
   * @param startSymbol:String - The non-terminal symbol that the grammar produces
   * @param terminals:Set<String> - The list of terminal symbols (all lowercase)
   * @param nonTerminals:Set<String> - The list of non-terminal symbols (all uppercase)
   * @param productions:[Rule] - the list of all production rules
   */
  create: function(startSymbol, terminals, nonTerminals, productions) {
    var instance = Object.create(this);
    instance.startSymbol = startSymbol;
    instance.terminals = terminals;
    instance.nonTerminals = nonTerminals;
    instance.productions = productions;
    return instance;
  },


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
        console.log("Non Terminal: "+currentNonTerm);
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
      console.log("Production: "+prod);
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
}

function isNonTerminal(str) {
  return str != str.toLowerCase() && str == str.toUpperCase();
}
