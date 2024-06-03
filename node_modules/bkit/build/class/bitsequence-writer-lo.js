const BitsequenceWriter = require('../class/bitsequence-writer.js');

module.exports = class BitsequenceWriterLo extends BitsequenceWriter {
	advance(n_bits) {
		let i_bit = n_bits + this._i_bit;
		let nb_move = i_bit >> 3;
		if(nb_move) {
			if(this._xb_pending) {
				this._at_contents[this._ib_index] = this._xb_pending;
				this._xb_pending = 0;
			}
			this._ib_index += nb_move;
		}

		let i_pos = this._i_bit = i_bit % 8;
		this._xb_pending |= 1 << i_pos;
	}
};
