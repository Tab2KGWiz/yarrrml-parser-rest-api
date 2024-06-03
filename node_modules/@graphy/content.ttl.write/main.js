


// queueMicrotask shim
{
	// not defined or not a function
	if('function' !== typeof queueMicrotask) {
		// create resolved promise
		let dp_resolve = Promise.resolve();

		// try to redefine
		try {
			// eslint-disable-next-line no-global-assign
			queueMicrotask = fk => dp_resolve.then(fk)
				.catch(e_callback => setTimeout(() => {
					throw e_callback;
				}, 0));
		}
		// oh well, at least we tried
		catch(e_define) {}
	}
}



const factory = require('@graphy/core.data.factory');
const Writable = require('@graphy/core.class.writable');

// eslint-disable-next-line no-misleading-character-class
const RT_PREFIXED_NAME_NAMESPACE_VALID = /^([A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u{02ff}\u{0370}-\u{037d}\u{037f}-\u{1fff}\u{200c}-\u{200d}\u{2070}-\u{218f}\u{2c00}-\u{2fef}\u{3001}-\u{d7ff}\u{f900}-\u{fdcf}\u{fdf0}-\u{fffd}\u{10000}-\u{effff}]([A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u{02ff}\u{0370}-\u{037d}\u{037f}-\u{1fff}\u{200c}-\u{200d}\u{2070}-\u{218f}\u{2c00}-\u{2fef}\u{3001}-\u{d7ff}\u{f900}-\u{fdcf}\u{fdf0}-\u{fffd}\u{10000}-\u{effff}_\-0-9\xb7\u{0300}-\u{036f}\u{203f}-\u{2040}.]*[A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u{02ff}\u{0370}-\u{037d}\u{037f}-\u{1fff}\u{200c}-\u{200d}\u{2070}-\u{218f}\u{2c00}-\u{2fef}\u{3001}-\u{d7ff}\u{f900}-\u{fdcf}\u{fdf0}-\u{fffd}\u{10000}-\u{effff}_\-0-9\xb7\u{0300}-\u{036f}\u{203f}-\u{2040}])?)?$/u;
const N_MAX_STRING_BUFFER = 1 << 12;

const XC_DIRECTIVES_TYPE_SPARQL = 0b001;
const XC_DIRECTIVES_CASE_PASCAL = 0b010;
const XC_DIRECTIVES_CASE_UPPER = 0b100;



class Turtle_Writer extends Writable {
	constructor(gc_writer={}) {
		super(gc_writer);

		let {
			prefixes: h_prefixes={},
			lists: gc_lists=null,
			debug: b_debug=false,
			style: gc_style=null,
		} = gc_writer;

		Object.assign(this, {
			_b_debug: b_debug,
			_s_indent: '\t',
			_b_simplify_default_graph: false,
			_xc_directives: 0,
			_s_token_prefix: '@prefix',
		});


		// style config
		if(gc_style) {
			// indent
			if(gc_style.indent) {
				this._s_indent = gc_style.indent.replace(/[^\s]/g, '');
			}

			// use sparql directives
			let z_directives = gc_style.directives || gc_style.directives;
			if(z_directives) {
				switch(z_directives) {
					case 'sparql': {
						this._xc_directives = XC_DIRECTIVES_TYPE_SPARQL;
						this._s_token_prefix = 'prefix';
						break;
					}

					case 'Sparql': {
						this._xc_directives = XC_DIRECTIVES_TYPE_SPARQL | XC_DIRECTIVES_CASE_PASCAL;
						this._s_token_prefix = 'Prefix';
						break;
					}

					case 'SPARQL': {
						this._xc_directives = XC_DIRECTIVES_TYPE_SPARQL | XC_DIRECTIVES_CASE_UPPER;
						this._s_token_prefix = 'PREFIX';
						break;
					}

					case 'turtle': {
						break;
					}

					case 'Turtle': {
						this._xc_directives = XC_DIRECTIVES_CASE_PASCAL;
						this._s_token_prefix = '@Prefix';
						break;
					}

					case 'TURTLE': {
						this._xc_directives = XC_DIRECTIVES_CASE_UPPER;
						this._s_token_prefix = '@PREFIX';
						break;
					}

					default: {
						throw new Error(`Value not understood for 'directives' option: ${z_directives}`);
					}
				}
			}
		}



		// custom list keys
		if(gc_lists) {
			// serialize list object
			this._serialize_list_object = function(a_list, n_nest_level) {
				// transcode list object
				let hc2_transcoded = this._transcode_list(a_list);

				// serialize object
				return this._encode_objects(hc2_transcoded, n_nest_level);
			};
		}

		// serialize initial prefix mappings
		let s_token_prefix = this._s_token_prefix;
		let s_prefix_eol = (this._xc_directives & XC_DIRECTIVES_TYPE_SPARQL)? '\n': ' .\n';
		let s_prefixes = '';
		try {
			// each user-defined prefix
			for(let s_prefix_id in h_prefixes) {
				// invalid prefix id
				if(!RT_PREFIXED_NAME_NAMESPACE_VALID.test(s_prefix_id)) {
					throw new Error(`Invlalid prefix id for text/turtle RDF serialization format: '${s_prefix_id}'`);
				}

				// append to string
				s_prefixes += `${s_token_prefix} ${s_prefix_id}: ${factory.namedNode(h_prefixes[s_prefix_id]).verbose()}${s_prefix_eol}`;
			}
		}
		// serialization error
		catch(e_serialize) {
			queueMicrotask(() => {
				this.emit('error', e_serialize);
			});
		}

		// push prefixes
		if(s_prefixes) this.push(s_prefixes);
	}

	// serialize prefixes
	_serialize_prefixes(h_prefixes) {
		// build prefixes string
		let s_prefixes = (2 === this._xc_state)? '\n\n': '';

		// update state
		this._xc_state = 0;

		// clone prefixes
		this._h_prefixes = {...this._h_prefixes};

		// ref prefix token
		let s_token_prefix = this._s_token_prefix;

		// prep eol string
		let s_prefix_eol = (this._xc_directives & XC_DIRECTIVES_TYPE_SPARQL)? '\n': ' .\n';

		// each user-defined prefix
		for(let s_prefix_id in h_prefixes) {
			// invalid prefix id
			if(!RT_PREFIXED_NAME_NAMESPACE_VALID.test(s_prefix_id)) {
				throw new Error(`Invlalid prefix id for text/turtle RDF serialization format: '${s_prefix_id}'`);
			}

			// append to string
			s_prefixes += `${s_token_prefix} ${s_prefix_id}: ${factory.namedNode(h_prefixes[s_prefix_id]).verbose()}${s_prefix_eol}`;

			// set prefix
			this._h_prefixes[s_prefix_id] = h_prefixes[s_prefix_id];
		}

		// recache
		factory.cache_prefixes(this._h_prefixes);

		// return prefix string
		return s_prefixes;
	}



	// serialize c3 hash
	_serialize_c3(hc3_triples) {
		let {
			_h_prefixes: h_prefixes,
			_s_indent: s_indent,

		} = this;
		// break line if non-data state
		let s_write = 2 !== this._xc_state? '\n': '';
		// update state
		this._xc_state = 2;

		// triple delimiter
		let s_delim_triples = '';
		// subject exit listener
		let f_exit_subject = null;
		// each subject
		for(let sc1_subject in hc3_triples) {
			// directive
			if('`' === sc1_subject[0]) {
				let g_apply = this._apply_directive(sc1_subject, hc3_triples[sc1_subject]);
				// write data
				if(g_apply.write) {
					s_write += s_delim_triples+g_apply.write;
					// do not break next line
					s_delim_triples = '';
				}
				// save exit listener
				if(g_apply.exit) f_exit_subject = g_apply.exit;
				continue;
			}
			// position before subject
			let i_triples = s_write.length;
			// serialize subject
			s_write += s_delim_triples+factory.c1_node(sc1_subject, h_prefixes).terse(h_prefixes)+' ';
			// pair indent & terminator
			let s_indent_pairs = '';
			let s_term_pairs = '';
			// ref pairs
			let hc2_pairs = hc3_triples[sc1_subject];
			// position before pairs
			let i_pairs = s_write.length;
			// were objects written?
			let b_empty = true;
			// predicate exit listener
			let f_exit_predicate = null;
			// each predicate
			for(let sc1_predicate in hc2_pairs) {
				// directive
				if('`' === sc1_predicate[0]) {
					// apply directive
					let g_apply = this._apply_directive(sc1_predicate, hc2_pairs[sc1_predicate]);
					// write data
					if(g_apply.write) {
						// break line
						s_write += (s_indent_pairs? s_term_pairs: '\n')+s_indent+g_apply.write;
						// pair already terminated
						s_term_pairs = '';
						// indent next pair
						s_indent_pairs = s_indent;
					}
					// save exit listener
					if(g_apply.exit) f_exit_predicate = g_apply.exit;
					continue;
				}
				// ref objects
				let z_objects = hc2_pairs[sc1_predicate];
				// serialize objects
				let st_objects = this._encode_objects(z_objects);
				// no objects; skip pair
				if(!st_objects) continue;
				// not empty
				b_empty = false;
				// cannot use blank node in predicate position
				if('_' === sc1_predicate[0] && ':' === sc1_predicate[1]) {
					throw new Error(`Cannot use blank node in predicate position of c3 hash; subject:'${sc1_subject}', predicate:'${sc1_predicate}'`);
				}
				// create predicate
				let kt_predicate = factory.c1_named_node(sc1_predicate, h_prefixes);
				// tersify rdf:type
				let st_predicate = kt_predicate.isRdfTypeAlias? 'a': kt_predicate.terse(h_prefixes);
				// serialize predicate and object(s)
				s_write += s_term_pairs+s_indent_pairs+st_predicate+' '+st_objects;
				// update state
				this._xc_state = 2;
					// // string buffer became too large
					// if(s_write.length >= N_MAX_STRING_BUFFER) {
					// 	debugger;
					// }
				// terminate next pair
				s_term_pairs = ' ;\n';
				// indent next pair
				s_indent_pairs = s_indent;
				// call exit predicate listener
				if(f_exit_predicate) f_exit_predicate();
			}
			// empty triples; cut out
			if(b_empty) {
				s_write = s_write.slice(0, i_triples)+s_write.slice(i_pairs);
				continue;
			}
			// delimit triple(s)
			s_delim_triples = '\n';
			// close triple
			s_write += `${s_term_pairs? ' ': s_indent_pairs}.\n`; //
			// call exit subject listener
			if(f_exit_subject) f_exit_subject();
		}

		s_write += '\n';
		return s_write;
	}


	// write objects
	_encode_objects(z_objects, n_nest_level=1) {
		let {
			_h_prefixes: h_prefixes,
			_s_indent: s_indent,
			_hm_coercions: hm_coercions,
		} = this;

		// deduce object value type
		switch(typeof z_objects) {
			// concise-term string
			case 'string': return factory.c1(z_objects, h_prefixes).terse(h_prefixes);

			// numeric type
			case 'number': return factory.number(z_objects).terse(h_prefixes);

			// boolean type
			case 'boolean': return factory.boolean(z_objects).terse(h_prefixes);

			// object
			case 'object': {
				// null; reject
				if(null === z_objects) throw new Error('Refusing to serialize null value given as an object of quad');

				// array, list of objects
				if(Array.isArray(z_objects) || z_objects instanceof Set) {
					let s_write = '';

					// object terminator
					let s_term_object = '';

					// each object
					for(let z_item of z_objects) {
						// item is an array; serialize list
						if(Array.isArray(z_item)) {
							s_write += s_term_object + this._serialize_list_object(z_item, n_nest_level);
						}
						// non-array
						else {
							// recurse on item
							s_write += s_term_object + this._encode_objects(z_item, n_nest_level);
						}

						// terminate next object
						s_term_object = ', ';
					}

					return s_write;
				}
				// plain object, blank node
				else if(Object === z_objects.constructor) {
					// open blank node block
					let s_write = '[';

					// whether the block is empty
					let b_empty = true;

					// object exit listener
					let f_exit_object = null;

					// each pair
					for(let sc1_predicate in z_objects) {
						// block is not empty
						b_empty = false;

						// terminate previous pair
						s_write += '\n'+s_indent.repeat(1+n_nest_level);

						// directive; serialize it
						if('`' === sc1_predicate[0]) {
							let g_apply = this._apply_directive(sc1_predicate, z_objects[sc1_predicate]);

							// write data
							if(g_apply.write) s_write += g_apply.write;

							// save exit listener
							if(g_apply.exit) f_exit_object = g_apply.exit;
							continue;
						}

						// write predicate and object(s)
						s_write += factory.c1(sc1_predicate, h_prefixes).terse(h_prefixes) + ' '
							+ this._encode_objects(z_objects[sc1_predicate], n_nest_level+1) +' ;';
					}

					// close blank node block
					s_write += (b_empty? '': '\n'+s_indent.repeat(n_nest_level))+']';

					// call exit object listener
					if(f_exit_object) f_exit_object();

					// serialize current predicate to blank node
					return s_write;
				}
				// coercable instance
				else if(hm_coercions.has(z_objects.constructor)) {
					// convert javascript object to term object
					let kt_converted = hm_coercions.get(z_objects.constructor).apply(this, [z_objects, n_nest_level]);

					// serialize
					return kt_converted.terse(h_prefixes);
				}
				// graphy term
				else if(z_objects.isGraphyTerm) {
					return z_objects.terse(h_prefixes);
				}
				// RDFJS term
				else if(z_objects.termType) {
					return factory.from.term(z_objects).terse(h_prefixes);
				}
			}

			// fallthrough: other
			default: {
				throw new Error(`Bad type for RDF object: [${typeof z_objects}] ${z_objects? z_objects.constructor: z_objects}`);
			}
		}
	}

	// serialize collection object
	_serialize_collection_object(a_collection, n_nest_level) {
		let s_indent = this._s_indent;

		// open collection block
		let s_write = '(';

		// each item
		for(let z_item of a_collection) {
			let s_objects = '';

			// item is array; serialize as sub-collection
			if(Array.isArray(z_item)) {
				s_objects = this._serialize_collection_object(z_item, n_nest_level+1);
			}
			// non-array item
			else {
				s_objects = this._encode_objects(z_item, n_nest_level+1);
			}

			// serialize collection
			s_write += '\n'+s_indent.repeat(1+n_nest_level)+s_objects;
		}

		// break line if anything was written (including comments)
		if(a_collection.length) s_write += '\n'+s_indent.repeat(n_nest_level);

		// close collection block
		s_write += ')';

		return s_write;
	}

	// rdfjs quad
	_serialize_quad(g_quad) {
		let h_prefixes = this._h_prefixes;
		let kq_quad = factory.from.quad(g_quad);


		// serialize quad
		this._s_push += (2 !== this._xc_state? '\n': '')
						+kq_quad.subject.terse(h_prefixes)+' '
			+kq_quad.predicate.terse(h_prefixes)+' '
			+kq_quad.object.terse(h_prefixes)+' .\n\n';


		// update state
		this._xc_state = 2;
	}
}

Object.assign(Turtle_Writer.prototype, {
	anonymous_blank_nodes: true,
	_serialize_c3r: Turtle_Writer.prototype._serialize_c3,
	_serialize_c4r: Turtle_Writer.prototype._serialize_c4,
	_serialize_comment: Writable.prototype._serialize_hash_comment,
	_serialize_list_object: Turtle_Writer.prototype._serialize_collection_object,
});

module.exports = function(gc_writer) {
	return new Turtle_Writer(gc_writer);
};
