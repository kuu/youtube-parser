'use strict';

function parseQuery(url) {
  var parts, subpart, name, value, index,
      obj = {};

  if (!url) {
    return obj;
  }

  if (url[0] === '?') {
    url = url.substring(1);
  }

  parts = url.split('&');

  for (var i = 0, il = parts.length; i < il; i++) {
    subpart = parts[i];
    index = subpart.indexOf('=');
    if (index === -1) {
      obj[decodeURIComponent(subpart)] = '';
      continue;
    }
    name = subpart.substring(0, index);
    if (name) {
      value = subpart.substring(index + 1);
      obj[decodeURIComponent(name)] = value || '';
    }
  }
  return obj;
}

function parseURL(url) {
  var isRelative = /^(ftp|file|gopher|https?|wss?)(:|$)/.test(url),
      urlRegex, urlMatch, authorityRegex, authorityMatch;

  var ALPHA = 'a-zA-Z';
  var DIGIT = '0-9';
  var SUB_DELIMITERS = '\!\$&\'\(\)\*\+\,;\=\\[\\]';
  var UNRESERVED = ALPHA + DIGIT + '\-\._~';
  var SCHEME = '(([' + ALPHA + ']+[' + ALPHA + DIGIT + '\+\-\.' + ']*):)';
  var PATH = '([' + SUB_DELIMITERS + UNRESERVED + '@%\:\/ ' + ']*)';
  var QUERY = '(\\?([' + SUB_DELIMITERS + UNRESERVED + '@%\:\/\? ' + ']*))?';
  var FRAGMENT = '(#([' + SUB_DELIMITERS + UNRESERVED + '@%\:\/\? ' + ']*))?';

  if (isRelative) {
    urlRegex = new RegExp('^' + SCHEME + '(\/\/([^/?#]*))?' + PATH + QUERY + FRAGMENT + '$');
    authorityRegex = new RegExp('^((([' + SUB_DELIMITERS + UNRESERVED + '%' + ']+)?(:([' +
      SUB_DELIMITERS + UNRESERVED + '%\:' + ']*))?)@)?' + '([' + SUB_DELIMITERS +
      UNRESERVED + '%' + ']*)?(:([' + DIGIT + ']+))?$');
  } else {
    urlRegex = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/;
    authorityRegex = /^((([^:/?#@]+)?(:([^/?#@]*))?)@)?([^/?#:]*)?(:([0-9]+))?$/;
  }

  urlMatch = url.match(urlRegex);
  if (!urlMatch) {
    return null;
  }

  authorityMatch = urlMatch[4] && urlMatch[4].match(authorityRegex);
  if (!authorityMatch) {
    return null;
  }

  return {
    scheme: urlMatch[2] || '',
    path: urlMatch[5] || '',
    search: urlMatch[7] || '',
    fragment: urlMatch[9] || '',
    query: parseQuery(urlMatch[7]),
    username: authorityMatch[3] || '',
    password: authorityMatch[5] || '',
    hostname: authorityMatch[6] || '',
    port: authorityMatch[8] || '',
    host: authorityMatch[6] + (authorityMatch[8] ? ':' + authorityMatch[8] : ''),
    schemeData: url.slice(urlMatch[2].length + 1)
  };
}

module.exports = {
  parseURL: parseURL,
  parseQuery: parseQuery
};
