import path from 'path';
import process from 'process';
import { readdir, stat, mkdir, rm, writeFile } from 'fs/promises';
import { task, HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-ethers';

task('flatten:all', 'Flatten all contracts under flatten directory').setAction(async (taskArgs, hre) => {
    const dirFiles = (await readdir('contracts', { recursive: true })) as string[];
    const directories = (
        await Promise.all(
            dirFiles.map(async (f) => {
                const isDirectory = (await stat(path.join('contracts', f))).isDirectory();

                return isDirectory ? f : null;
            }),
        )
    ).filter((f) => f) as string[];
    const contracts = dirFiles.filter((f) => !directories.includes(f));

    await rm('flatten', { force: true, recursive: true });
    await mkdir('flatten');
    await Promise.all(directories.map((f) => mkdir(path.join('flatten', f), { recursive: true })));

    await Promise.all(
        contracts.map(async (f) => {
            const contract = path.join('contracts', f);
            const contractTo = path.join('flatten', f);
            try {
                const flatten = await hre.run('flatten:get-flattened-sources', { files: [contract] });
                await writeFile(contractTo, flatten);
                console.log(`Wrote ${contractTo} contract`);
            } catch (e) {
                // Catching circular contracts
                console.log(`Failed to write ${contractTo} contract`);
                console.log(e);
            }
        }),
    );
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
