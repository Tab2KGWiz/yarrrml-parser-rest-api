const {
	popcount_uint32,
} = require('../main/locals.js');

module.exports = class BitsequenceReader {
	constructor(at_sequence, f_popcount=popcount_uint32) {
		let ab_contents = ArrayBuffer.isView(at_sequence)? at_sequence.buffer: at_sequence;

		Object.assign(this, {
			_f_popcount: f_popcount,
			_ab_contents: ab_contents,
			_atu8_view_u8: new Uint8Array(ab_contents),
			_atu16_view_u16: new Uint16Array(ab_contents),
			_atu32_view_u32: new Uint32Array(ab_contents),
			_ib_read: 0,
		});
	}

	select_1(i_item) {
		let {
			_atu8_view_u8: atu8_view,
			_atu16_view_u16: atu16_view,
			_f_popcount: f_popcount,
		} = this;

		let c_pop = 0;
		let i16_scan = 0;
		for(;; i16_scan++) {
			let n_popcount = f_popcount(atu16_view[i16_scan]);
			c_pop += n_popcount;
			if(c_pop >= i_item) {
				c_pop -= n_popcount;
				break;
			}
		}

		let ib_target = i16_scan << 1;
		let xb_char = atu8_view[ib_target];
		let ii_bit = 0;
		for(; c_pop<i_item; ii_bit++) {
			if(xb_char & 0x80) c_pop += 1;
			xb_char <<= 1;

			if(7 === ii_bit) xb_char = atu8_view[ib_target+1];
		}

		return (i16_scan << 4) + ii_bit;
	}

	rank_1(ii_target) {
		let {
			_atu8_view_u8: atu8_view,
			_atu16_view_u16: atu16_view,
			_f_popcount: f_popcount,
		} = this;

		let c_pop = 0;
		let i16_target = ii_target >> 4;
		for(let i16_scan=0; i16_scan<i16_target; i16_scan++) {
			c_pop += f_popcount(atu16_view[i16_scan]);
		}

		let ii_intra = ii_target % 16;
		let ib_target = i16_target << 1;
		let xb_char = atu8_view[ib_target];
		for(let ii_bit=0; ii_bit<ii_intra; ii_bit++) {
			if(xb_char & 0x80) c_pop += 1;
			xb_char <<= 1;

			if(7 === ii_bit) xb_char = atu8_view[ib_target+1];
		}

		return c_pop;
	}
};
