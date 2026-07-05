const test = require('tap').test;
const unzipper = require('../index.cjs');

test("get content a docx file without errors", async function () {
  const archive = './testData/office/testfile.docx';

  const directory = await unzipper.Open.file(archive);
  await Promise.all(directory.files.map(file => file.buffer()));
});

test("get content a xlsx file without errors", async function () {
  const archive = './testData/office/testfile.xlsx';

  const directory = await unzipper.Open.file(archive);
  await Promise.all(directory.files.map(file => file.buffer()));
});
