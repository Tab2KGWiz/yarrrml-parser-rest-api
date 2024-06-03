const {
	D_TEXT_DECODER,
	H_ENCODING_TO_TYPED_ARRAY,
} = require('../main/locals.js');

function BufferDecoder$decode_vuint(k_self) {
	let {
		_at_contents: at,
		_ib_read: ib,
	} = k_self;

	// 1 byte value
	let x = at[ib];

	// first byte is end of int
	if(x < 0x80) {
		k_self._ib_read += 1;
		return x;
	}

	// set vuint value to lower value
	let x_value = x & 0x7f;


	// 2 bytes; keep going
	x = at[ib+1];

	// last byte of number
	if(x < 0x80) {
		k_self._ib_read += 2;
		return x_value | (x << 7);
	}

	// add lower value
	x_value |= (x & 0x7f) << 7;


	// 3 bytes; keep going
	x = at[ib+2];

	// last byte of number
	if(x < 0x80) {
		k_self._ib_read += 3;
		return x_value | (x << 14);
	}

	// add lower value
	x_value |= (x & 0x7f) << 14;


	// 4 bytes; keep going
	x = at[ib+3];

	// last byte of number
	if(x < 0x80) {
		k_self._ib_read += 4;
		return x_value | (x << 21);
	}

	// add lower value
	x_value |= (x & 0x7f) << 21;


	// 5 bytes; be cautious
	x = at[ib+4];

	// safe to shift
	let x_hi = (x & 0x7f);
	if(x_hi < 0x07) {
		// add lower value
		x_value |= x_hi << 28;
	}
	// cannot shift
	else {
		// shift by means of float multiplication
		x_value += (x_hi * 0x10000000);
	}

	// last byte of number
	if(x < 0x80) {
		k_self._ib_read += 5;
		return x_value;
	}



	// // 6 bytes (or more)
	// throw new Error(`decoding integers of 6 bytes or more not supported by '.vuint()'; try using '.vbigint()' instead`);
}



function BufferDecoder$decode_vbigint(k_self, xb_limit=36) {
	let {
		_at_contents: at,
		_ib_read: ib,
	} = k_self;

	// 1 byte value
	let x = at[ib];

	// first byte is end of int
	if(x < 0x80) {
		k_self._ib_read += 1;
		return BigInt(x);
	}

	// set pint value to lower value
	let x_value = x & 0x7f;


	// 2 bytes; keep going
	x = at[ib+1];

	// add lower value
	x_value |= (x & 0x7f) << 7;

	// last byte of number
	if(x < 0x80) {
		k_self._ib_read += 2;
		return BigInt(x_value);
	}


	// 3 bytes; keep going
	x = at[ib+2];

	// add lower value
	x_value |= (x & 0x7f) << 14;

	// last byte of number
	if(x < 0x80) {
		k_self._ib_read += 3;
		return BigInt(x_value);
	}


	// 4 bytes; keep going
	x = at[ib+3];

	// add lower value
	x_value |= (x & 0x7f) << 21;

	// last byte of number
	if(x < 0x80) {
		k_self._ib_read += 4;
		return BigInt(x_value);
	}


	// continue with BigInt
	let xn_value = BigInt(x_value);


	// 5 bytes; keep going
	x = at[ib+4];

	// add lower value
	xn_value |= (BigInt(x) & 0x7fn) << 28n;

	// last byte of number
	if(x < 0x80) {
		k_self._ib_read += 5;
		return xn_value;
	}


	// 6 bytes; keep going
	x = at[ib+5];

	// add lower value
	xn_value |= (BigInt(x) & 0x7fn) << 35n;

	// last byte of number
	if(x < 0x80) {
		k_self._ib_read += 6;
		return xn_value;
	}


	// 7 bytes; keep going
	x = at[ib+6];

	// add lower value
	xn_value |= (BigInt(x) & 0x7fn) << 42n;

	// last byte of number
	if(x < 0x80) {
		k_self._ib_read += 7;
		return xn_value;
	}


	// 8 bytes; keep going
	x = at[ib+7];

	// add lower value
	xn_value |= (BigInt(x) & 0x7fn) << 49n;

	// last byte of number
	if(x < 0x80) {
		k_self._ib_read += 8;
		return xn_value;
	}


	// 9 bytes
	ib += 8;

	// use loop
	for(let c_bytes=8, xn_shift=56n; c_bytes<=xb_limit; xn_shift+=7n, c_bytes++) {
		x = at[ib++];

		// add lower value
		xn_value |= (BigInt(x) & 0x7fn) << xn_shift;

		// last byte of number
		if(x < 0x80) {
			k_self._ib_read += c_bytes;
			return xn_value;
		}
	}

	throw new Error(`reached max bytes limit while decoding vbigint`);
}


class BufferDecoder {
	constructor(at_contents) {
		Object.assign(this, {
			_at_contents: at_contents,
			_ib_read: 0,
			_b_referenced: false,
		});
	}

	get read() {
		return this._ib_read;
	}

	seek(ib_seek) {
		this._ib_read = ib_seek;
	}

	skip(nb_skip) {
		this._ib_read += nb_skip;
	}

	peek() {
		return this._at_contents[this._ib_read];
	}

	byte() {
		return this._at_contents[this._ib_read++];
	}

	vuint() {
		return BufferDecoder$decode_vuint(this);
	}

	vbigint() {
		return BufferDecoder$decode_vbigint(this);
	}

	ntu8String() {
		let {
			_at_contents: at_contents,
			_ib_read: ib_read,
		} = this;

		let ib_end = at_contents.indexOf(0, ib_read);
		if(-1 === ib_end) throw new RangeError('buffer decoder found no null-terminated utf8-encoded string');

		let s_ntu8 = D_TEXT_DECODER.decode(at_contents.subarray(ib_read, ib_end));
		this._ib_read = ib_end + 1;
		return s_ntu8;
	}

	lpu8String() {
		let {
			_at_contents: at_contents,
			_ib_read: ib_read,
		} = this;

		let nb_string = BufferDecoder$decode_vuint(this);

		let ib_end = ib_read + nb_string;
		let s_lpu8 = D_TEXT_DECODER.decode(at_contents.subarray(ib_read, ib_end));
		this._ib_read = ib_end;
		return s_lpu8;
	}

	// extract typed array and intelligently conserve memory when mem-aligning
	typedArray() {
		let at_contents = this._at_contents;

		// type of array
		let x_type = at_contents[this._ib_read++];

		// number of elements in array
		let nl_values = this.vuint();

		// offet of typed array's start
		let ib_offset = at_contents.byteOffset + this._ib_read;

		// typed array class
		let dc_typed_array = H_ENCODING_TO_TYPED_ARRAY[x_type];

		// prep typed array instance
		let at_values;

		// not mem-aligned!
		if(ib_offset % dc_typed_array.BYTES_PER_ELEMENT) {
			// contents are referenced
			if(this._b_referenced) {
				throw new Error(`cannot safely extract typed array into new allocated memory segment since older array buffer is still referenced by previous call to 'buffer_decoder#sub'`);
			}

			// allocate new mem-aligned segment
			let ab_contents = new ArrayBuffer(at_contents.byteLength - ib_offset);

			// create byte-view over segment
			let at8_contents = new Uint8Array(ab_contents);

			// copy contents over
			at8_contents.set(at_contents.subarray(ib_offset));

			// discard ref to previous memory segment
			this._b_contents = at8_contents;

			// reset read head
			this._ib_read = 0;

			// create typed array instance
			at_values = new dc_typed_array(ab_contents, 0, nl_values);
		}
		else {
			// create typed array instance
			at_values = new dc_typed_array(at_contents.buffer, ib_offset, nl_values);
		}

		// increment read offset
		this._ib_read += at_values.byteLength;

		return at_values;
	}

	// extract typed array and possibly waste tons of memory
	typed_array_grow() {
		let at_contents = this._at_contents;

		// type of array
		let x_type = at_contents[this._ib_read++];

		// number of elements in array
		let nl_values = this.vuint();

		// offet of typed array's start
		let ib_offset = at_contents.byteOffset + this._ib_read;

		// typed array class
		let dc_typed_array = H_ENCODING_TO_TYPED_ARRAY[x_type];

		// prep typed array instance
		let at_values;

		// not mem-aligned!
		if(ib_offset % dc_typed_array.BYTES_PER_ELEMENT) {
			// allocate new mem-aligned segment
			let ab_values = new ArrayBuffer(nl_values*dc_typed_array.BYTES_PER_ELEMENT);

			// create typed array instance
			at_values = new dc_typed_array(ab_values, 0, nl_values);
		}
		else {
			// create typed array instance
			at_values = new dc_typed_array(at_contents.buffer, ib_offset, nl_values);
		}

		// increment read offset
		this._ib_read += at_values.byteLength;

		return at_values;
	}

	/**
	 * copy contents of the subarray of the given length (remainder if omitted) to new memory.
	 *   if unreferenced and read to entirety, free the original buffer in the process
	 * @param  {ByteSize} nb_sub - size of subarray to 'grab'
	 * @return {[type]}        [description]
	 */
	grab(nb_sub=null) {
		let {
			_at_contents: at_contents,
			_ib_read: ib_read,
		} = this;
		if(null === nb_sub) nb_sub = at_contents.length - ib_read;

		// beyond this grab
		let i_beyond = ib_read + nb_sub;

		// create new buffer for sub
		let ab_sub = new ArrayBuffer(nb_sub);

		// create byte-view over segment
		let at_sub = new Uint8Array(ab_sub);

		// copy contents over
		at_sub.set(at_contents.subarray(ib_read, ib_read+nb_sub));

		// end-of-buffer
		if(at_contents.length === i_beyond) {
			// not referenced
			if(!this._b_referenced) {
				// free buffer
				this._at_contents = new Uint8Array(0);

				// update read index
				this._ib_read = at_contents.length;

				// return new contents
				return at_sub;
			}
		}

		// create new buffer for contents
		let ab_contents = new ArrayBuffer(at_contents.length - i_beyond);

		// create byte-view over segment
		let at8_contents = new Uint8Array(ab_contents);

		// copy contents over
		at8_contents.set(at_contents.subarray(i_beyond));

		// update buffer
		this._at_contents = at8_contents;

		// update read index
		this._ib_read = 0;

		// return new contents
		return at_sub;
	}

	/**
	 * create a view on the next region and advance the read pointer.
	 *   NOTE: consider using '.grab()' if you intend to hold onto the select memory
	 *   region long after the underlying buffer is no longer needed. if you use this
	 *   method to store some data, the GC will not be able to collect the underlying
	 *   buffer's memory region until all pointers are freed.
	 * @param  {[type]} nb_sub [description]
	 * @return {[type]}        [description]
	 */
	sub(nb_sub=null) {
		let {
			_at_contents: at_contents,
			_ib_read: ib_read,
		} = this;
		if(null === nb_sub) nb_sub = at_contents.length - ib_read;
		this._ib_read += nb_sub;

		// record that the underlying buffer is still referenced
		this._b_referenced = true;

		return at_contents.subarray(ib_read, ib_read+nb_sub);
	}
}

module.exports = Object.assign(BufferDecoder, {
	$_decode_vuint: BufferDecoder$decode_vuint,
	$_decode_vbigint: BufferDecoder$decode_vbigint,
});
