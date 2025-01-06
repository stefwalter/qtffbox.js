function extendQTFF(BoxParser) {
  var BEHAVIOR_QT = 0x01;

  var ftypParse = BoxParser.ftypBox.prototype.parse;
  BoxParser.createBoxCtor("ftyp", function(stream) {
    ftypParse.call(this, stream);
    if (this.major_brand && this.major_brand.indexOf("qt") >= 0)
      stream.behavior = BEHAVIOR_QT;
  });

  // The meta Box is different between QTFF and ISOMBFF
  BoxParser.metaBox = function(size) {
    // Although no flags or header in QTFF meta box, fine for them to be zero here
    BoxParser.FullBox.call(this, "meta", size);
  }
  BoxParser.metaBox.prototype = new BoxParser.FullBox();
  BoxParser.metaBox.prototype.parse = function(stream) {
    this.boxes = [];
    // The QTFF "meta" box does not have a flags/version header
    if (stream.behavior != BEHAVIOR_QT)
      this.parseFullHeader(stream);
    BoxParser.ContainerBox.prototype.parse.call(this, stream);
  };
}

console.log(module, exports);

if (typeof exports !== 'undefined')
  exports.extendQTFF = extendQTFF;
