# youtube-parser
A tool to extract URLs and format info from YouTube page.
This is almost based on the node-ytdl-core by @fent, but I just wanted to learn something from it.

##Install

```
$ npm install -g youtube-parser
```

##CLI

```
Usage:
  $ youtube-parser url [options]

Examples:
  $ youtube-parser https://www.youtube.com/watch?v=C_vqnySNhQ0 --container mp4
  $ youtube-parser https://youtu.be/C_vqnySNhQ0 --quality medium

Options:
  -h, --help           Print help
  -v, --version        Print version
  -d, --dump           Print the whole metadata (including metadata other than URLs.)
  -q, --quality        List URLs of video with the specified quality {small | medium | large}
  -c, --container      List URLs of video with the specified container format {mp4 | webm | flv | 3gp}
  -e, --encoding       List URLs of video with the specified video encoding {VP8 | H.264 | Sorenson H.283 | MPEG-4 Visual}
  -a, --audioEncoding  List URLs of video with the specified audio encoding {mp3 | aac | vorbis}
  --videoOnly          List URLs of video that consists of only a video track
  --audioOnly          List URLs of video that consists of only an audio track
```

##API

### getMetadata
```
Promise getMetadata(string url)
```

* url - 'watch video' page on YouTube.
* return value - A promise object to resolve with an object containing actual URLs and format info of the page's video.

### getURL
```
Promise getURL(string url, object format)
```

* url - 'watch video' page on YouTube.
* format - Desired format of the video.
* return value - A promise object to resolve with an array of URL/format info objects that matche the requested format.

###Example
```js
var youTubeParser = require('youtube-parser');

youTubeParser.getMetadata('https://www.youtube.com/watch?v=C_vqnySNhQ0')
.then(
  function (metadata) {
    // Access video info.
    console.log(metadata.keywords);
  }
);

youTubeParser.getURL('https://youtu.be/C_vqnySNhQ0', {quality: 'medium', container: 'mp4'})
.then(
  function (urlList) {
    // Access URLs.
    console.log(urlList[0]);
  }
);
```
