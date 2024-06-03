const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { logCanonical } = require('./utils/rdfUtils');
const convertYAMLtoRML = require('@rmlio/yarrrml-parser/lib/rml-generator');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});

app.post('/yarrrml', upload.single('yamlFile') , (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }


  fs.readFile(req.file.path, 'utf8', async (err, yamlContent) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read the file' });
    }

    //const y2r = new yarrrml();
    const y2r = new convertYAMLtoRML();

    const triples = y2r.convert(yamlContent);
    //const jsonldObj = JSON.parse(JSON.stringify(jsonld));

    const canonicalTurtle = await logCanonical(triples, y2r.getPrefixes(), y2r.getBaseIRI());

    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error('Failed to delete the file:', req.file.path);
      }
    });

    if (y2r.getLogger().has('error')) {
      const logs = y2r.getLogger().getAll();
      return res.status(400).json(logs);
    }

    return res.status(200).json(canonicalTurtle);
  });
});