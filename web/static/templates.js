(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['templates'] = template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = "  <h4>TV Shows</h4>\n";
  stack1 = helpers.each.call(depth0, ((stack1 = (depth0 != null ? depth0.processed : depth0)) != null ? stack1.tv : stack1), {"name":"each","hash":{},"fn":this.program(2, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"2":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = this.invokePartial(partials.commonRow, '    ', 'commonRow', depth0, undefined, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"4":function(depth0,helpers,partials,data) {
  var stack1, buffer = "  <h4>Movies</h4>\n";
  stack1 = helpers.each.call(depth0, ((stack1 = (depth0 != null ? depth0.processed : depth0)) != null ? stack1.movies : stack1), {"name":"each","hash":{},"fn":this.program(2, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"6":function(depth0,helpers,partials,data) {
  var stack1, buffer = "  <h4>TV Shows</h4>\n";
  stack1 = helpers.each.call(depth0, ((stack1 = (depth0 != null ? depth0.processed : depth0)) != null ? stack1.tv : stack1), {"name":"each","hash":{},"fn":this.program(7, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"7":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = this.invokePartial(partials.actorRow, '    ', 'actorRow', depth0, undefined, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"9":function(depth0,helpers,partials,data) {
  var stack1, buffer = "  <h4>Movies</h4>\n";
  stack1 = helpers.each.call(depth0, ((stack1 = (depth0 != null ? depth0.processed : depth0)) != null ? stack1.movies : stack1), {"name":"each","hash":{},"fn":this.program(7, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = " <script id=\"commonModal-template\" type=\"text/x-handlebars-template\">\n  <div class=\"row commonHeader\">\n    <div class=\"col-xs-4\">\n      <h4>\n      ";
  stack1 = ((helpers.actorLink || (depth0 && depth0.actorLink) || helperMissing).call(depth0, (depth0 != null ? depth0.actorId1 : depth0), (depth0 != null ? depth0.actorName1 : depth0), {"name":"actorLink","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n      </h4>\n    </div>\n    <div class=\"col-xs-4\">\n      <h4>\n        Title\n      </h4>\n    </div>\n    <div class=\"col-xs-4\">\n      <h4>\n      ";
  stack1 = ((helpers.actorLink || (depth0 && depth0.actorLink) || helperMissing).call(depth0, (depth0 != null ? depth0.actorId2 : depth0), (depth0 != null ? depth0.actorName2 : depth0), {"name":"actorLink","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n      </h4>\n    </div>\n  </div>\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = ((stack1 = (depth0 != null ? depth0.processed : depth0)) != null ? stack1.tv : stack1)) != null ? stack1.length : stack1), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  stack1 = helpers['if'].call(depth0, ((stack1 = ((stack1 = (depth0 != null ? depth0.processed : depth0)) != null ? stack1.movies : stack1)) != null ? stack1.length : stack1), {"name":"if","hash":{},"fn":this.program(4, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "</script>\n\n<script id=\"commonRow-partial\" type=\"text/x-handlebars-template\">\n  <div class=\"row alternateRow\">\n    <div class=\"col-xs-4\">\n    ";
  stack1 = ((helpers.characterLink || (depth0 && depth0.characterLink) || helperMissing).call(depth0, (depth0 != null ? depth0.CharacterID1 : depth0), (depth0 != null ? depth0.Character1 : depth0), {"name":"characterLink","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n    </div>\n    <div class=\"col-xs-4\">\n    ";
  stack1 = ((helpers.titleLink || (depth0 && depth0.titleLink) || helperMissing).call(depth0, (depth0 != null ? depth0.TitleID : depth0), (depth0 != null ? depth0.Title : depth0), {"name":"titleLink","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n    "
    + escapeExpression(((helpers.episodes || (depth0 && depth0.episodes) || helperMissing).call(depth0, depth0, {"name":"episodes","hash":{},"data":data})))
    + "\n    </div>\n    <div class=\"col-xs-4\">\n    ";
  stack1 = ((helpers.characterLink || (depth0 && depth0.characterLink) || helperMissing).call(depth0, (depth0 != null ? depth0.CharacterID2 : depth0), (depth0 != null ? depth0.Character2 : depth0), {"name":"characterLink","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n    </div>\n  </div>\n</script>\n\n<script id=\"actorModal-template\" type=\"text/x-handlebars-template\">\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = ((stack1 = (depth0 != null ? depth0.processed : depth0)) != null ? stack1.tv : stack1)) != null ? stack1.length : stack1), {"name":"if","hash":{},"fn":this.program(6, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  stack1 = helpers['if'].call(depth0, ((stack1 = ((stack1 = (depth0 != null ? depth0.processed : depth0)) != null ? stack1.movies : stack1)) != null ? stack1.length : stack1), {"name":"if","hash":{},"fn":this.program(9, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "</script>\n\n<script id=\"actorRow-partial\" type=\"text/x-handlebars-template\">\n  <div class=\"row alternateRow\">\n    <div class=\"col-xs-6\">\n    ";
  stack1 = ((helpers.characterLink || (depth0 && depth0.characterLink) || helperMissing).call(depth0, (depth0 != null ? depth0.CharacterID : depth0), (depth0 != null ? depth0.Character : depth0), {"name":"characterLink","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n    </div>\n    <div class=\"col-xs-6\">\n    ";
  stack1 = ((helpers.titleLink || (depth0 && depth0.titleLink) || helperMissing).call(depth0, (depth0 != null ? depth0.TitleID : depth0), (depth0 != null ? depth0.Title : depth0), {"name":"titleLink","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n    "
    + escapeExpression(((helpers.episodes || (depth0 && depth0.episodes) || helperMissing).call(depth0, depth0, {"name":"episodes","hash":{},"data":data})))
    + "\n    </div>\n  </div>\n</script>";
},"usePartial":true,"useData":true});
})();