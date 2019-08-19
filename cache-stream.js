const { Readable } = require('stream');

class CacheStream extends Readable {
    constructor(source) {
        super();
        this.source = source;
        this.buffers = [];
        this.end = false;
        this.waiting = false;
        source.on('data', data => {
            if (this.waiting) {
                this.waiting = this.push(data);
                return;
            }
            this.buffers.push(data);
        });
        source.on('end', () => {
            if (this.waiting) {
                this.push(null);
                return;
            }
            this.end = true;
        });
    }

    _read(size) {
        while (this.buffers.length) {
            if (!this.push(this.buffers.shift())) return;
        }
        if (this.end) return void this.push(null);
        this.waiting = true;
    }
}

module.exports = CacheStream;
