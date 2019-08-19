const { PassThrough } = require('stream');
const async = require('async');
const merge2 = require('merge2');
const fetch = require('node-fetch');
const CacheStream = require('./cache-stream');

module.exports = async function download(url, {limit, headers = {}, ...options} = {}) {
  const range = 2 * 1024 * 1024;
  const [size, body] = await downloadFirstRange(url, range);
  if (size <= range) return body;

  const stream = merge2(body, { end: false });
  const count = Math.ceil(size / range)

  const downloadingQ = async.queue((num, cb) => {
    const s = downloadRange(url, num * range, (num + 1) * range)
    s.once('end', cb);
    stream.add(new CacheStream(s));
  }, limit);

  for (let current = 1; current < count; current++) {
    downloadingQ.push(current);
  }

  downloadingQ.empty(() => stream.once('queueDrain', () => stream.end()))

  return stream;

  async function downloadFirstRange(size) {
    const res = await fetch(url, { ...options, headers: { ...headers, range: `bytes=0-${size - 1}` } })
    const totalSize = +(res.headers.get('content-range').split('/')[1]);
    return [totalSize, res.body];
  }

  function downloadRange(start, end) {
    const responsePromise = fetch(url, { ...options, headers: { ...headers, range: `bytes=${start}-${end - 1}` }})
    return fetchToStream(responsePromise);
  }

  function fetchToStream(responsePromise) {
    const stream = new PassThrough();
    responsePromise.then(res => res.body.pipe(stream));
    return stream;
  }
}
