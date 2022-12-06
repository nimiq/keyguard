const fs = require('fs').promises;
const path = require('path');

/**
 * Replace `import type` with `import` in TS declaration files, as the Typescript version
 * used by the Keyguard (v3.5) does not support `import type`.
 * @param {string} file
 */
async function fix(file) {
    const content = await fs.readFile(path.join(process.cwd(), file), 'utf8');
    const replaced = content.replace(/import type/g, 'import');
    await fs.writeFile(file, replaced, 'utf8');
}

fix('node_modules/@ethersproject/providers/lib/ankr-provider.d.ts');
fix('node_modules/ethers/lib/ethers.d.ts');
