
const bkit = require('../build/main.js');

let x_range = 1 << 8;
let i_triangle = 22;
let k_bs_writer = new bkit.bitsequence_writer(x_range);


for(let i_adv=1; i_adv<=i_triangle; i_adv++) {
	k_bs_writer.advance(i_adv);
}

let at_bs = k_bs_writer.close();

let k_bs_reader = new bkit.bitsequence_reader(at_bs);

for(let i_rank=0; i_rank<x_range; i_rank++) {
	console.log(i_rank.toString(16)+': '+k_bs_reader.rank_1(i_rank));
}

for(let i_select=0; i_select<=i_triangle; i_select++) {
	console.log('#'+i_select+': '+k_bs_reader.select_1(i_select));
}

