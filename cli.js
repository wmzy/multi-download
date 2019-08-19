const fs = require('fs');
const download = require('./download');

const [url, filename] = process.argv.slice(2);

//
download(url)
  .then(file => file.pipe(fs.createWriteStream(filename || getFilename(url))));

function getFilename(url) {
  const {URL} = require('url');
  return new URL(url).pathname.split('/').pop();
}
