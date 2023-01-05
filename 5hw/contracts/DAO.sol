// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract DAO is ERC20 {

    constructor() ERC20("DAO", "DAO") {
        _mint(msg.sender, 100);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    event ProposalCreated(uint256 id, address recipient, uint256 amount);
    event Voted(uint256 id, address voter, bool inFavor);
    event ProposalAccepted(uint256 id);
    event ProposalRejected(uint256 id);
    event ProposalCanceled(uint256 id);
    event Transfer(address indexed from, address indexed to, uint256 value);

    enum VoteType {ABSTAIN, YES, NO}
    enum Result {CANCELLED, ACCEPTED, REJECTED, ONGOING}

    struct Proposal {
        address proposer;
        uint256 hash;
        uint256 id;
        uint256 start;
        uint256 end;
        uint256 yesVotes;
        uint256 noVotes;
        Result result;
        mapping(address => VoteType) votes;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    function getProposalCount() public view returns (uint256) {
        return proposalCount;
    }

    uint256[] public proposalQueue;

    uint256 public votingPeriod = 3 days;

    function getVotingPeriod() public view returns (uint256) {
        return votingPeriod;
    }

    uint8 public MAX_PROPOSALS_ON_VOTING = 3;

    function getMaxProposalsOnVoting() public view returns (uint8) {
        return MAX_PROPOSALS_ON_VOTING;
    }

    function createProposal(uint256 hash) public {
        checkAndClearQueue();
        require(proposalQueue.length < MAX_PROPOSALS_ON_VOTING, "DAO: Too many proposals on voting");
        // create proposal
        Proposal storage newProposal = proposals[proposalCount];
        newProposal.proposer = msg.sender;
        newProposal.hash = hash;
        newProposal.id = proposalCount;
        newProposal.start = block.timestamp;
        newProposal.end = block.timestamp + votingPeriod;
        newProposal.result = Result.ONGOING;
        proposalQueue.push(proposalCount);
        emit ProposalCreated(proposalCount, msg.sender, hash);
        proposalCount++;
    }

    function checkProposalInQueueById(uint256 proposal_id) public view returns (bool) {
        for (uint256 i = 0; i < proposalQueue.length; i++) {
            if (proposalQueue[i] == proposal_id) {
                return true;
            }
        }
        return false;
    }

    function checkProposalInQueueByHash(uint256 hash) public view returns (bool) {
        for (uint256 i = 0; i < proposalQueue.length; i++) {
            if (proposals[proposalQueue[i]].hash == hash) {
                return true;
            }
        }
        return false;
    }

    function hashToPosInQueue(uint256 hash) public view returns (uint8) {
        for (uint8 i = 0; i < proposalQueue.length; i++) {
            if (proposals[proposalQueue[i]].hash == hash) {
                return i;
            }
        }
        return 0;
    }

    function remove(uint8 index) internal {
        require(index < proposalQueue.length, "DAO: Index out of bounds");
        proposalQueue[index] = proposalQueue[proposalQueue.length - 1];
        proposalQueue.pop();
    }

    function voteImpl(address sender, uint8 proposal_id, uint256 powerOfVote, bool voteFor) internal {
        Proposal storage proposal = proposals[proposal_id];
        require(proposal.result == Result.ONGOING, "DAO: Proposal is not ongoing");
        require(proposal.votes[sender] == VoteType.ABSTAIN, "DAO: Already voted");
        require(block.timestamp < proposal.end, "DAO: Voting period is over");
        if (voteFor) {
            proposal.yesVotes += powerOfVote;
            proposal.votes[sender] = VoteType.YES;
        } else {
            proposal.noVotes += powerOfVote;
            proposal.votes[sender] = VoteType.NO;
        }
        if (proposal.yesVotes > totalSupply() / 2) {
            proposal.result = Result.ACCEPTED;
            emit ProposalAccepted(proposal_id);
            remove(proposal_id);
        } else if (proposal.noVotes > totalSupply() / 2) {
            proposal.result = Result.REJECTED;
            emit ProposalRejected(proposal_id);
            remove(proposal_id);
        }
    }

    function vote(uint256 hash, bool voteIsYes) public {
        require(balanceOf(msg.sender) > 0, "You need to have DAO tokens to vote");
        require(checkProposalInQueueByHash(hash), "Proposal not in queue");
        uint8 proposal_id = hashToPosInQueue(hash);
        voteImpl(msg.sender, proposal_id, balanceOf(msg.sender), voteIsYes);
        emit Voted(proposal_id, msg.sender, voteIsYes);
    }

    function yesVotes(uint256 hash) public view returns (uint256) {
        require(checkProposalInQueueByHash(hash), "Proposal not in queue");
        uint256 proposal_id = hashToPosInQueue(hash);
        return proposals[proposal_id].yesVotes;
    }

    function noVotes(uint256 hash) public view returns (uint256) {
        require(checkProposalInQueueByHash(hash), "Proposal not in queue");
        uint256 proposal_id = hashToPosInQueue(hash);
        return proposals[proposal_id].noVotes;
    }

    function proposalStatus(uint256 proposal_id) public view returns (Result) {
        return proposals[proposal_id].result;
    }

    function checkAndClearQueue() public {
        for (uint8 i = 0; i < proposalQueue.length; i++) {
            if (proposals[proposalQueue[i]].end < block.timestamp) {
                proposals[proposalQueue[i]].result = Result.CANCELLED;
                remove(i);
            }
        }
    }

    function revertVoteImpl(address sender, uint8 proposal_id, uint256 powerOfVote, bool voteFor) internal {
        Proposal storage proposal = proposals[proposal_id];
        require(proposal.result == Result.ONGOING, "DAO: Proposal is not ongoing");
        require(proposal.votes[sender] != VoteType.ABSTAIN, "DAO: You haven't voted");
        require(block.timestamp < proposal.end, "DAO: Voting period is over");
        if (voteFor) {
            proposal.yesVotes -= powerOfVote;
            proposal.votes[sender] = VoteType.ABSTAIN;
        } else {
            proposal.noVotes -= powerOfVote;
            proposal.votes[sender] = VoteType.ABSTAIN;
        }
    }

    function revertVote(uint256 hash) public {
        require(checkProposalInQueueByHash(hash), "Proposal not in queue");
        uint8 proposal_id = hashToPosInQueue(hash);
        revertVoteImpl(msg.sender, proposal_id, balanceOf(msg.sender), proposals[proposal_id].votes[msg.sender] == VoteType.YES);
    }

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        _transfer(_msgSender(), recipient, amount);
        for (uint8 i = 0; i < proposalQueue.length; i++) {
            if (proposals[proposalQueue[i]].votes[msg.sender] != VoteType.ABSTAIN) {
                bool saveVote = proposals[proposalQueue[i]].votes[msg.sender] == VoteType.YES;
                revertVoteImpl(msg.sender, i, amount, saveVote);
                if (balanceOf(msg.sender) > 0) {
                    voteImpl(msg.sender, i, balanceOf(msg.sender), saveVote);
                }
            }
            if (proposals[proposalQueue[i]].votes[recipient] != VoteType.ABSTAIN) {
                bool saveVote = proposals[proposalQueue[i]].votes[recipient] == VoteType.YES;
                revertVoteImpl(recipient, i, balanceOf(recipient) - amount, saveVote);
                voteImpl(recipient, i, balanceOf(recipient), saveVote);
            }
        }
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }


}
