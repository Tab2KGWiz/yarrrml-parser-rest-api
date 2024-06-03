const fs = require('fs');
const path = require('path');
const detective = require('detective');
const jmacs = require('jmacs');

// for run commands to lint js files
const eslint = () => /* syntax: bash */ `
	npx eslint --fix --color --rule 'no-debugger: off' $@
	eslint_exit=$?
	# do not fail on warnings
	if [ $eslint_exit -eq 2 ]; then
		exit 0
	fi
	exit $eslint_exit
`;

// recipe to build jmacs file
const jmacs_lint = (a_deps=[], a_deps_strict=[]) => ({
	deps: [
		...a_deps,
		...a_deps_strict,
		...(a_deps.reduce((a_requires, p_dep) => {
			// skip directories
			if(fs.statSync(p_dep).isDirectory()) return a_requires;

			// load script into jmacs
			let g_compiled = jmacs.load(p_dep);

			return [
				...detective(g_compiled.meta.code),
				...g_compiled.meta.deps,
			].filter(s => s.startsWith('/'))
				.map(p => path.relative(process.cwd(), p));
		}, [])),
	],
	run: /* syntax: bash */ `
		npx jmacs $1 > $@ \
			&& ${eslint()}
	`,
});

// recipe to build gen file
const gen_lint = (a_deps=[]) => ({
	deps: a_deps,
	run: /* syntax: bash */ `
		node $1 > $@ \
			&& ${eslint()}
	`,
});

const build = (prd_dir, h_recipe={}, prd_prefix='build/') => {
	// scan directory
	let a_files = fs.readdirSync(prd_dir);

	// deps
	let a_deps = [];
	let a_direct = [];

	// each file
	for(let s_file of a_files) {
		let pr_src = `${prd_dir}/${s_file}`;

		// *.js files
		if(s_file.endsWith('.js')) {
			h_recipe[s_file] = () => ({copy:pr_src});
			a_deps.push(`${prd_prefix}${s_file}`);
		}
		// *.jmacs files
		else if(s_file.endsWith('.js.jmacs')) {
			let s_dst = s_file.slice(0, -'.jmacs'.length);
			h_recipe[s_dst] = () => jmacs_lint([pr_src]);
			a_deps.push(`${prd_prefix}${s_dst}`);
		}
		// *.gen files
		else if(s_file.endsWith('.js.gen')) {
			let s_dst = s_file.slice(0, -'.gen'.length);
			h_recipe[s_dst] = () => gen_lint([pr_src]);
			a_deps.push(`${prd_prefix}${s_dst}`);
		}
		// subdirectory
		else if(fs.statSync(pr_src).isDirectory()) {
			// make subrecipe; put in this recipe
			let h_subrecipe = h_recipe[s_file] = {};

			// recurse
			a_deps.push(...build(pr_src, h_subrecipe, prd_prefix));

			// simple deps
			a_direct.push(`${prd_prefix}${s_file}/**`);
		}
	}

	return a_direct.length? a_direct: a_deps;
};

let h_build_src = {};
build('src', h_build_src);

module.exports = {
	tasks: {
		all: 'build/**',
	},

	outputs: {
		build: {
			...h_build_src,
		},
	},
};

