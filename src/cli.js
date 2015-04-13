'use strict';

var argv = require('yargs').boolean(['dump', 'd', 'videoOnly', 'audioOnly']).argv,
    pkg = require('../package.json'),
    youTubeParser = require('./index.js');

var url, format, quality, container, encoding, audioEncoding,
    printHelp = function () {
      var message = 'Usage:\n';
      message += '    youtube-parser url [options]\n\n';
      message += 'Examples:\n';
      message += '    youtube-parser https://www.youtube.com/watch?v=C_vqnySNhQ0 --container mp4\n';
      message += '    youtube-parser https://youtu.be/C_vqnySNhQ0 --quality medium\n\n';
      message += 'Options:\n';
      message += '  -h, --help           Print help\n';
      message += '  -v, --version        Print version\n';
      message += '  -d, --dump           Print the whole metadata\n';
      message += '  -q, --quality        List all URLs of video with the specified quality {small | medium | large}\n';
      message += '  -c, --container      List all URLs of video with the specified container format {mp4 | webm | flv | 3gp}\n';
      message += '  -e, --encoding       List all URLs of video with the specified video encoding {VP8 | H.264 | Sorenson H.283 | MPEG-4 Visual}\n';
      message += '  -a, --audioEncoding  List all URLs of video with the specified audio encoding {mp3 | aac | vorbis}\n';
      message += '  --videoOnly          List all URLs of video that consists of only a video track\n';
      message += '  --audioOnly          List all URLs of video that consists of only an audio track';
      console.info(message);
    },
    printVersion = function () {
      var message = 'v';
      message += pkg.version;
      console.info(message);
    };

if (argv.h || argv.help) {
  printHelp();
  return;
}

if (argv.v || argv.version) {
  printVersion();
  return;
}

url = argv._[0];

if (!url) {
  printHelp();
  return;
}

if (argv.d || argv.dump) {

  youTubeParser.getMetadata(url)
  .then(
    function (result) {
      console.log(JSON.stringify(result, null, 4)); // Dump JSON object.
    },
    function (error) {
      console.error(error);
    }
  );

} else {

  quality = (argv.q || argv.quality);
  container = (argv.c || argv.container);
  encoding = (argv.e || argv.encoding);
  audioEncoding = (argv.a || argv.audioEncoding);

  format = {
    quality: quality,
    container: container,
    encoding: encoding,
    audioEncoding: audioEncoding,
    videoOnly: !!argv.videoOnly,
    audioOnly: !!argv.audioOnly
  };

  youTubeParser.getURL(url, format)
  .then(
    function (results) {
      results.forEach(function (result) {
        console.log('-----');
        console.log(JSON.stringify(result, null, 4)); // Dump JSON object.
      });
    },
    function (error) {
      console.error(error);
    }
  );
}
