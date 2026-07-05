import { test } from "tap";
import fs from "fs";
import Stream from "stream"; // "node:stream"
import { Open } from "../index.js";

const version = +process.version.replace("v", "").split(".")[0];

function createS3ClientMock(buffer) {
  return {
    send: async function(command) {
      if (command.constructor.name == "HeadObjectCommand") {
        return {
          ContentLength: buffer.length,
        };
      }

      if (command.constructor.name == "GetObjectCommand") {
        const match = command.input.Range.match(/^bytes=(\d+)-(\d*)$/);
        const offset = Number(match[1]);
        const end = match[2] ? Number(match[2]) + 1 : undefined;
        const stream = Stream.PassThrough();

        stream.end(buffer.slice(offset, end));

        return {
          Body: stream,
        };
      }

      throw new Error("Unexpected command: " + command.constructor.name);
    },
  };
}

test(
  "get content of a single file entry out of a zip",
  { skip: version < 16 },
  function (t) {
    const archive = "./testData/compressed-standard/archive.zip";
    const buffer = fs.readFileSync(archive);
    const client = createS3ClientMock(buffer);

    return Open.s3_v3(client, {
      Bucket: "test",
      Key: "archive.zip",
    }).then(function (d) {
      const file = d.files.filter(function (file) {
        return file.path == "file.txt";
      })[0];

      return file.buffer().then(function (str) {
        const fileStr = fs.readFileSync("./testData/compressed-standard/inflated/file.txt", "utf8");
        t.equal(str.toString(), fileStr);
        t.end();
      });
    });
  }
);
