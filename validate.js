// @ts-check

const fs = require('fs');
const Ajv = require('ajv');

const schema = JSON.parse(fs.readFileSync('./schema.json').toString());
const data = JSON.parse(fs.readFileSync('./config.json').toString());
const ajv = new Ajv();
const validate = ajv.compile(schema);

if (!validate(data)) {
  console.log(validate.errors);
  process.exit(1);
}
