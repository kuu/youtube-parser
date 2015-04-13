'use strict';

var Promise = require('bluebird'),
    XMLHttpRequest = require('xhr2'),
    URL = require('./url'),
    FORMATS = require('./format');

function getVideoID(url) {
  var urlObj = URL.parseURL(url);
  if (urlObj) {
    return urlObj.hostname === 'youtu.be' ? urlObj.path.slice(1) : urlObj.query.v;
  }
  return null;
}

function extractConfigData(html) {
  var index,
      start = 'ytplayer.config = ',
      //end = '</script>';
      end = ';ytplayer.load';

  index = html.indexOf(start);
  if (index === -1) {
    return '';
  }

  html = html.slice(index + start.length);

  index = html.indexOf(end);
  if (index === -1) {
    return '';
  }

  return html.slice(0, index);
}

function fetchMetadata(id) {
  var url = 'http://www.youtube.com/watch?v=' + id;

  return new Promise(function (fulfill, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
      var jsonStr;
      try {
        jsonStr = extractConfigData(xhr.response);
        fulfill(JSON.parse(jsonStr));
      } catch (e) {
        reject(jsonStr);
      }
    };
    xhr.onerror = function(e) {
      reject(e);
    };
    xhr.send();
  });
}

function splitValues(info) {
  [
    'keywords',
    'fmt_list',
    'fexp',
    'watermark'
  ].forEach(function(key) {
    if (!info[key]) {
      return;
    }
    info[key] = info[key].split(',').filter(function (v) {
      return v !== '';
    });
  });

  info.fmt_list = info.fmt_list ?
  info.fmt_list.map(function (format) {
    return format.split('/');
  }) : [];

  if (info.video_verticals) {
    info.video_verticals =
      info.video_verticals.slice(1, -1).split(', ').filter(function(val) {
        return val !== '';
      }).map(function (val) { return parseInt(val, 10); });
  }
}

function sortFormats(a, b) {
  var ares = a.resolution ? parseInt(a.resolution.slice(0, -1), 10) : 0;
  var bres = b.resolution ? parseInt(b.resolution.slice(0, -1), 10) : 0;
  var aabitrate = a.audioBitrate || 0;
  var babitrate = b.audioBitrate || 0;
  var afeats = ~~!!ares * 2 + ~~!!aabitrate;
  var bfeats = ~~!!bres * 2 + ~~!!babitrate;

  if (afeats === bfeats) {
    if (ares === bres) {
      var abitrate, bbitrate, s;
      if (a.bitrate) {
        s = a.bitrate.split('-');
        abitrate = parseFloat(s[s.length - 1], 10);
      } else {
        abitrate = 0;
      }
      if (b.bitrate) {
        s = b.bitrate.split('-');
        bbitrate = parseFloat(s[s.length - 1], 10);
      } else {
        bbitrate = 0;
      }
      if (abitrate === bbitrate) {
        return babitrate - aabitrate;
      } else {
        return bbitrate - abitrate;
      }
    } else {
      return bres - ares;
    }
  } else {
    return bfeats - afeats;
  }
}

function mergeObjects(a, b) {
  var obj = {};
  Object.keys(a).forEach(function (k) {
    obj[k] = a[k];
  });
  Object.keys(b).forEach(function (k) {
    obj[k] = b[k];
  });
  return obj;
}

function parseFormats(info) {
  var formats = [];

  if (info.url_encoded_fmt_stream_map) {
    formats = formats.concat(info.url_encoded_fmt_stream_map.split(','));
  }
  if (info.adaptive_fmts) {
    formats = formats.concat(info.adaptive_fmts.split(','));
  }

  formats = formats.map(function (format) {
    var data = URL.parseQuery(format);
    if (data.conn && data.conn.indexOf('rtmp') === 0) {
      data.rtmp = true;
    }

    try {
      data.url = decodeURIComponent(data.url);
      data.type = decodeURIComponent(data.type);
    } catch (err) {
      console.warn('Error occurred at decodeURIComponent: ' + err.message);
      data.url = '';
    }

    var meta = FORMATS[data.itag];
    if (!meta) {
      console.warn('No format metadata for itag ' + data.itag + ' found');
      meta = {};
    }

    return mergeObjects(data, meta);
  });

  formats.sort(sortFormats);
  return formats;
}

function isHigherQuality(quality, required) {
  if (required === 'large') {
    return (quality === 'large');
  } else if (required === 'medium') {
    return (quality === 'large' || quality === 'medium');
  }
  return true;
}

function findBestFormats(availableFormats, requestedFormat) {
  var formats = availableFormats.filter(function (format) {

    if (requestedFormat.quality !== void 0 &&
        isHigherQuality(format.quality, requestedFormat.quality) === false) {
      return false;
    }

    if (requestedFormat.container !== void 0 &&
        format.container !== requestedFormat.container) {
      return false;
    }

    if (requestedFormat.encoding !== void 0 &&
        format.encoding !== requestedFormat.encoding) {
      return false;
    }

    if (requestedFormat.audioEncoding !== void 0 &&
        format.audioEncoding !== requestedFormat.audioEncoding) {
      return false;
    }

    if (requestedFormat.videoOnly && format.audioEncoding !== null) {
      return false;
    }

    if (requestedFormat.audioOnly && format.encoding !== null) {
      return false;
    }

    return true;
  });
  return formats;
}

module.exports = {
  getMetadata: function (url) {
    return new Promise(function (fulfill, reject) {
      var videoID = getVideoID(url);
      if (!videoID) {
        reject(new Error('Unable to get video id.'));
        return;
      }
      fetchMetadata(videoID)
      .then(
        function (d) {
          var info = d.args;
          if (info.status === 'fail') {
            reject(new Error('Failed in loading metadata.'));
            return;
          }
          splitValues(info);
          info.format = parseFormats(info);
          fulfill(info);
        }
      );
    });
  },
  getURL: function (url, format) {
    return this.getMetadata(url).then(
      function (d) {
        var best = findBestFormats(d.format, format);
        if (best && best.length > 0) {
          return best;
        } else {
          throw new Error('Requested format not found.');
        }
      }
    );
  }
};
