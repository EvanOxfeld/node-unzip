import { test } from 'tap';
import { Open } from '../index.js';

test("get content a docx file without errors", async function () {
  const archive = './testData/office/testfile.docx';

  const directory = await Open.file(archive);
  await Promise.all(directory.files.map(file => file.buffer()));
});

test("get content a xlsx file without errors", async function () {
  const archive = './testData/office/testfile.xlsx';

  const directory = await Open.file(archive);
  await Promise.all(directory.files.map(file => file.buffer()));
});
