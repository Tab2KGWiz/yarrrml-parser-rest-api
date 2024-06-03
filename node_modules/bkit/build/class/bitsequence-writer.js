
module.exports = class BitsequenceWriter {
	constructor(n_bits) {
		Object.assign(this, {
			_at_contents: new Uint8Array(Math.ceil(n_bits / 8)),
			_ib_index: 0,
			_xb_pending: 0x00,
			_i_bit: -1,
			_n_bits: n_bits,
		});
	}

	close() {
		let at_contents = this._at_contents;
		if(this._ib_index > at_contents.length) throw new Error('bitsequence wrote out of range');
		at_contents[this._ib_index] = this._xb_pending;
		return at_contents;
	}
};
