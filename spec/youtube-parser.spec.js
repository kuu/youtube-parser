describe('youtube-parser', function () {
  var youTubeParser = require('../');
  it('returns actual video url for the given url', function (done) {
    youTubeParser.getURL('https://youtu.be/C_vqnySNhQ0', {container: 'mp4'})
    .then(
      function (list) {
        expect(list.length).toBeGreaterThan(0);
        done();
      },
      function (e) {
        expect(e).toBeFalsy();
        done();
      }
    );
  });
});
