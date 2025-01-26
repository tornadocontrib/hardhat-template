import path from 'path';
import process from 'process';
import { glob } from 'fast-glob';
import { rm, stat, mkdir, writeFile } from 'fs/promises';
import { task, HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-ethers';

async function existsAsync(fileOrDir: string): Promise<boolean> {
    try {
        await stat(fileOrDir);

        return true;
    } catch {
        return false;
    }
}

task('flatten:all', 'Flatten all contracts under flatten directory').setAction(async (taskArgs, hre) => {
    const contracts = await glob(['./contracts/**/*.sol']);

    await rm('./flatten', { recursive: true, force: true });

    for (const contract of contracts) {
        const flattenTo = contract.replace('./contracts', './flatten');
        const dir = path.dirname(flattenTo);

        if (!(await existsAsync(dir))) {
            await mkdir(dir, { recursive: true });
        }

        try {
            const flatten = await hre.run('flatten:get-flattened-sources', { files: [contract] });
            await writeFile(flattenTo, flatten);
            console.log(`Wrote ${flattenTo} contract`);
        } catch (e) {
            // Catching circular contracts
            console.log(`Failed to write ${flattenTo} contract`);
            console.log(e);
        }
    }
});

const config: HardhatUserConfig = {
    defaultNetwork: 'hardhat',
    solidity: {
        compilers: [
            {
                version: '0.8.28',
                settings: {
                    evmVersion: 'paris',
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        develop: {
            url: process.env.RPC_URL || '',
            accounts: {
                mnemonic: process.env.MNEMONIC || 'test test test test test test test test test test test junk',
                initialIndex: Number(process.env.MNEMONIC_INDEX) || 0,
            },
        },
        sepolia: {
            url: process.env.RPC_URL || 'https://rpc.sepolia.org',
            accounts: {
                mnemonic: process.env.MNEMONIC || 'test test test test test test test test test test test junk',
                initialIndex: Number(process.env.MNEMONIC_INDEX) || 0,
            },
        },
        hardhat: {},
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN,
    },
    sourcify: {
        enabled: true,
    },
};

export default config;
