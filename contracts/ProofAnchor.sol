// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProofAnchor {
    struct Record {
        address submitter;
        uint256 agentId;
        uint256 timestamp;
        bool exists;
    }

    mapping(bytes32 => Record) public proofs;

    event ProofAnchored(bytes32 indexed proofHash, address indexed submitter, uint256 indexed agentId, uint256 timestamp);

    function anchorProof(bytes32 proofHash, uint256 agentId) external {
        require(!proofs[proofHash].exists, "Already anchored");
        proofs[proofHash] = Record({
            submitter: msg.sender,
            agentId: agentId,
            timestamp: block.timestamp,
            exists: true
        });
        emit ProofAnchored(proofHash, msg.sender, agentId, block.timestamp);
    }

    function verifyProof(bytes32 proofHash) external view returns (bool exists, address submitter, uint256 agentId, uint256 timestamp) {
        Record memory p = proofs[proofHash];
        return (p.exists, p.submitter, p.agentId, p.timestamp);
    }
}
