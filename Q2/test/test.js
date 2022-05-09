const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const { groth16, plonk } = require("snarkjs");

function unstringifyBigInts(o) {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return BigInt(o);
    } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
        return BigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        if (o===null) return null;
        const res = {};
        const keys = Object.keys(o);
        keys.forEach( (k) => {
            res[k] = unstringifyBigInts(o[k]);
        });
        return res;
    } else {
        return o;
    }
}

describe("HelloWorld", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2"}, "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm","contracts/circuits/HelloWorld/circuit_final.zkey"); // generates the proof and circuit output

        console.log('1x2 =',publicSignals[0]); // print the circuit output

        const editedPublicSignals = unstringifyBigInts(publicSignals); // unstringify the circuit output
        const editedProof = unstringifyBigInts(proof); // unstringify the proof
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals); // reformat and extract the signal and inputs
    
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString()); // reformat into array
    
        const a = [argv[0], argv[1]]; // extract encrypted parameters using a
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]]; // extract encrypted parameters using b
        const c = [argv[6], argv[7]]; // extract encrypted parameters using c
        const Input = argv.slice(8); // extract input

        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true; // run verifier and assert true
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with Groth16", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("Multiplier3Verifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2","c":"3"}, "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3/circuit_final.zkey"); // generates the proof and circuit output

        console.log('1x2x3 =',publicSignals[0]); // print the circuit output

        const editedPublicSignals = unstringifyBigInts(publicSignals); // unstringify the circuit output
        const editedProof = unstringifyBigInts(proof); // unstringify the proof
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals); // reformat and extract the signal and inputs
    
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString()); // reformat into array
    
        const a = [argv[0], argv[1]]; // extract encrypted parameters using a
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]]; // extract encrypted parameters using b
        const c = [argv[6], argv[7]]; // extract encrypted parameters using c
        const Input = argv.slice(8); // extract input

        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true; // run verifier and assert true
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with PLONK", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("PlonkVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        const { proof, publicSignals } = await plonk.fullProve({"a":"1","b":"2","c":"3"}, "contracts/circuits/Multiplier3_plonk/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3_plonk/circuit_final.zkey"); // generates the proof and circuit output

        console.log('1x2x3 =',publicSignals[0]); // print the circuit output

        const editedPublicSignals = unstringifyBigInts(publicSignals); // unstringify the circuit output
        const editedProof = unstringifyBigInts(proof); // unstringify the proof
        const calldata = await plonk.exportSolidityCallData(editedProof, editedPublicSignals); // reformat and extract the signal and inputs
    
        const a1 = calldata.replace(/["[\]\s]/g, "").split(',');

        const a2 = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());

        expect(await verifier.verifyProof(a1[0], [a2[1]])).to.be.true; // run verifier and assert true
    });
    it("Should return false for invalid proof", async function () {
        let a = [0];
        let d = [0];
        expect(await verifier.verifyProof(a, d)).to.be.false;
    });
});