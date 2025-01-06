QUnit.module("QTFF tests");

var BASE_URL = "./media/";
QUnit.test("meta", function(assert) {
  var done = assert.async();
  var index = 9;
  var file = MP4Box.createFile(false);

  file.onReady = function() {
    var metas = file.getBoxes("meta");
    assert.ok(metas, "metas is not null");
    assert.strictEqual(metas.length, 2, "two metas fonud");
    assert.strictEqual(metas[0].type, "meta", "Correct meta box");
    assert.strictEqual(metas[1].type, "meta", "Correct meta box");
    done();
  };

  getFile(BASE_URL + "iphone.MOV", function (buffer) {
    file.appendBuffer(buffer);
  });
});
