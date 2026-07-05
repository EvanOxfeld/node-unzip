// Creates a `package.json` file in the CommonJS `build` folder.
// That marks that whole folder as CommonJS so that Node.js doesn't complain
// about `require()`-ing those files.

// import fs from 'fs'; // 'node:fs'
const fs = require('fs'); // 'node:fs'

fs.writeFileSync('./dist/package.json', JSON.stringify({
  name: 'unzipper/dist',
  type: 'commonjs',
  private: true
}, null, 2), 'utf8');
