import { ethers } from 'hardhat';
import { Lock__factory } from '../typechain-types';

async function deploy() {
    const [owner] = await ethers.getSigners();

    const Lock = await new Lock__factory(owner).deploy(Math.floor(Date.now() + 600));

    await Lock.waitForDeployment();

    console.log(Lock.target);

    console.log(await Lock.owner());

    console.log(await Lock.unlockTime());
}
deploy();
