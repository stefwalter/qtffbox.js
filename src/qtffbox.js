/*
 * itif data types
 * https://developer.apple.com/documentation/quicktime-file-format/well-known_types
 */
var ItifTypes = {
  RESERVED: 0,
  UTF8: 1,
  UTF16: 2,
  SJIS: 3,
  UTF8_SORT: 4,
  UTF16_SORT: 5,
  JPEG: 13,
  PNG: 14,
  BE_SIGNED_INT: 21,
  BE_UNSIGNED_INT: 22,
  BE_FLOAT32: 23,
  BE_FLOAT64: 24,
  BMP: 27,
  QT_ATOM: 28,
  BE_SIGNED_INT8: 65,
  BE_SIGNED_INT16: 66,
  BE_SIGNED_INT32: 67,
  BE_FLOAT32_POINT: 70,
  BE_FLOAT32_DIMENSIONS: 71,
  BE_FLOAT32_RECT: 72,
  BE_SIGNED_INT64: 74,
  BE_UNSIGNED_INT8: 75,
  BE_UNSIGNED_INT16: 76,
  BE_UNSIGNED_INT32: 77,
  BE_UNSIGNED_INT64: 78,
  BE_FLOAT64_AFFINE_TRANSFORM: 79,
};

function extendQTFF(BoxParser) {
  var BEHAVIOR_QT = 0x01;

  var ftypParse = BoxParser.ftypBox.prototype.parse;
  BoxParser.createBoxCtor("ftyp", function(stream) {
    ftypParse.call(this, stream);
    if (this.major_brand && this.major_brand.indexOf("qt") >= 0)
      stream.behavior = BEHAVIOR_QT;
  });

  /*
   * The meta Box/Atom is different between QTFF and ISOMBFF
   * https://developer.apple.com/documentation/quicktime-file-format/metadata_atom
   */
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

  /*
   * The keys Atom is typically in a meta Box.
   * https://developer.apple.com/documentation/quicktime-file-format/metadata_item_keys_atom
   * key indexes are 1-based and so we store them in a Object, not an array..
   */
  BoxParser.createFullBoxCtor("keys", function(stream) {
    this.count = stream.readUint32();
    this.keys = {};
    for (var i = 0; i < this.count; i++) {
      var len = stream.readUint32();
      this.keys[i + 1] = stream.readString(len - 4);
    }
  });

  /*
   * Parses the types above. Only implement the ones we actually
   * have real world test data for. Add a test case, as you implement them.
   */
  function parseItifData(type, data) {
    if (type == ItifTypes.UTF8) {
      return new TextDecoder("utf-8").decode(data);
    }

    var view = new DataView(data.buffer);
    if (type == ItifTypes.BE_UNSIGNED_INT) {
      if (data.length == 1) {
        return view.getUint8(0);
      } else if (data.length == 2) {
        return view.getUint16(0, false);
      } else if (data.length == 4) {
        return view.getUint32(0, false);
      } else if (data.length == 8) {
        return view.getBigUint64(0, false);
      } else {
        throw new Error("Unsupported ITIF_TYPE_BE_UNSIGNED_INT length " + data.length);
      }
    } else if (type == ItifTypes.BE_SIGNED_INT) {
      if (data.length == 1) {
        return view.getInt8(0);
      } else if (data.length == 2) {
        return view.getInt16(0, false);
      } else if (data.length == 4) {
        return view.getInt32(0, false);
      } else if (data.length == 8) {
        return view.getBigInt64(0, false);
      } else {
        throw new Error("Unsupported ITIF_TYPE_BE_SIGNED_INT length " + data.length);
      }
    } else if (type == ItifTypes.BE_FLOAT32) {
      return view.getFloat32(0, false);
    }

    Log.warn("BoxParser", "Unsupported or unimplemented itif data type: " + type);
    return undefined;
  }

  /*
   * The data Atom is typically in an ilst Box.
   * https://developer.apple.com/documentation/quicktime-file-format/data_atom
   */
  BoxParser.createBoxCtor("data", function(stream) {
    this.type  = stream.readUint32();
    this.country = stream.readUint16();
    if (this.country > 255) {
      stream.position -= 2;
      this.countryString = stream.readString(2);
    }
    this.language = stream.readUint16();
    if (this.language > 255) {
      stream.position -= 2;
      this.parseLanguage(stream);
    }
    this.raw = stream.readUint8Array(this.size - this.hdr_size - 8);
    this.value = parseItifData(this.type, this.raw);
  });

  /*
   * The ilst Box typically follows a keys Box within a meta Box.
   * https://developer.apple.com/documentation/quicktime-file-format/metadata_item_list_atom
   */
  BoxParser.createBoxCtor("ilst", function(stream) {
    var total = this.size - this.hdr_size;
    this.boxes = { };
    while (total > 0) {
      var size = stream.readUint32();

      /* The index into the keys box */
      var index = stream.readUint32();
      var res = BoxParser.parseOneBox(stream, false, size - 8);
      if (res.code == BoxParser.OK)
        this.boxes[index] = res.box;
      total -= size;
    }
  });
}

/*
function hexBuffer(buffer) {
    return [...new Uint8Array(buffer)].map(x => "0x" + x.toString(16).padStart(2, '0')).join(', ');
}
*/

if (typeof exports !== 'undefined') {
  exports.extendQTFF = extendQTFF;
  exports.ItifTypes = ItifTypes;
}
