const namespaces = require('./namespaces').asMap();
const N3 = require("n3");
const { Readable } = require('stream')
const ttlRead = require('@graphy/content.ttl.read');
const ttlWrite = require('@graphy/content.ttl.write');
const dataset = require('@graphy/memory.dataset.fast');

/**
 * Log canonicalized turtle from quads and (optional) prefixes and base
 * @param {*} triples 
 * @param {*} prefixes 
 * @param {*} base 
 * @returns 
 */
async function logCanonical(triples, prefixes = {}, base = null) {
  let myPrefixes = {
    rr: namespaces.rr,
    rdf: namespaces.rdf,
    rdfs: namespaces.rdfs,
    fnml: namespaces.fnml,
    fno: namespaces.fno,
    d2rq: namespaces.d2rq,
    void: namespaces.void,
    dc: namespaces.dc,
    foaf: namespaces.foaf,
    rml: namespaces.rml,
    ql: namespaces.ql,
  };
  if (base) {
    myPrefixes[''] = base;
  }
  myPrefixes = Object.assign({}, myPrefixes, prefixes);

  let result = await quadsToTurtle(triples, myPrefixes);
  result = await canonicalize(result);

  return result;
  // Uncomment below if you want to inspect generated RML
  console.error(result)
}


/**
 * Create a turtle string from quads and (optional) prefixes
 * @param {*} triples 
 * @param {*} prefixes 
 * @returns 
 */
async function quadsToTurtle(triples = [], prefixes = {}) {
  return new Promise((resolve, reject) => {
    const writer = new N3.Writer({ prefixes });

    writer.addQuads(triples);
    writer.end(async (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
      return;
    });
  });
}

/**
 * Create a pretty-printed turtle string from an ugly turtle string
 * @param {*} ttlString 
 * @returns 
 */
async function canonicalize(ttlString) {
  const stream = Readable.from([ttlString]);
  const outStreamPretty = stream
    .pipe(ttlRead())
    .pipe(dataset({
      canonicalize: false,
    }))
    .pipe(ttlWrite());
  return streamToString(outStreamPretty);
}

function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  })
}

module.exports = {
  logCanonical,
};