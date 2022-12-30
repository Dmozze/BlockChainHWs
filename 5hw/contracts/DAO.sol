import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

pragma solidity ^0.8.9;

contract DAO is ERC20 {

    constructor(uint256 totalSupply) ERC20("DAO", "DAO") {
        _mint(msg.sender, totalSupply);
    }

    function decimals() public view override returns (uint8) {
        return 0;
    }

    // proposal struct
    struct Proposal {
        uint256 id;
        address recipient;
        uint256 amount;
        uint256 againstVotes;
        uint256 forVotes;
        uint256 end;
        bool completed;
        bool expired;
        mapping(address => bool) hasVoted;
        mapping(address => bool) forOrAgainst;
    }


    event NewProposal(uint256 id, address recipient, uint256 amount, uint256 end);
    event Voted(uint256 id, bool forOrAgainst, address voter);
    event Completed(uint256 id, bool passed);
    event DropProposal(uint256 id);

    // proposal array
    Proposal[] public proposals;

    // valid proposal id array
    uint256[] public validProposals;

    // proposal count
    uint256 public proposalCount;

    // max valid proposals count
    uint256 public maxValidProposals = 3;

    // voting period
    uint256 public votingPeriod = 86400 * 3; // 3 days

    function createProposal(uint256 hash) public returns (uint256){
        // create proposal
        Proposal storage proposal = proposals.push();
        proposal.id = proposalCount;
        proposal.recipient = msg.sender;
        proposal.end = block.timestamp + votingPeriod;
        proposal.amount = hash;
        proposal.completed = false;
        proposal.expired = false;

        if (validProposals.length == maxValidProposals) {
            proposals[validProposals[0]].expired;
            delete validProposals[0];
        }

        // find the oldest proposal
        validProposals.push(proposal.id);
        emit NewProposal(proposal.id, proposal.recipient, proposal.amount, proposal.end);
        // increment proposal count
        proposalCount++;
        return proposal.id;
    }

    function getProposal(uint256 id) public view returns (Proposal) {
        return proposals[id];
    }


    function isValidProposal(uint256 proposalId) public returns (bool){
        for (uint8 i = 0; i < validProposals.length; i++){
            if (validProposals[i] == proposalId){
                return true;
            }
        }
        return false;
    }

    function vote(uint256 _id, bool _vote) public {
        // get proposal
        Proposal storage proposal = proposals[_id];

        /// check if proposal is valid
        bool validProposal = false;
        for (uint256 i = 0; i < validProposals.length; i++) {
            if (validProposals[i] == _id) {
                validProposal = true;
            }
        }
        require(validProposal, "Proposal is not valid");

        // check if proposal exists
        require(proposal.id == _id, "Proposal does not exist");

        // check if proposal has ended
        require(block.timestamp < proposal.end, "Proposal has ended");

        // check if user has voted
        require(!proposal.hasVoted[msg.sender], "You have already voted");

        // check if user has enough voting power
        require(balanceOf(msg.sender) > 0, "You do not have enough voting power");

        // add user to voted mapping
        proposal.hasVoted[msg.sender] = true;

        // add voting power to for or against votes
        if (_vote) {
            proposal.forOrAgainst[msg.sender] = true;
            proposal.forVotes = proposal.forVotes + balanceOf(msg.sender);
        } else {
            proposal.forOrAgainst[msg.sender] = false;
            proposal.againstVotes = proposal.againstVotes + balanceOf(msg.sender);
        }
        if (2 * proposal.forVotes >= totalSupply()) {
            proposal.completed = true;
            emit Completed(proposal.id, true);
        }
        if (2 * proposal.againstVotes >= totalSupply()) {
            proposal.completed = true;
            emit Completed(proposal.id, false);
        }
    }

    function revertVote(uint256 _id) public {
        // get proposal
        Proposal storage proposal = proposals[_id];

        // check if proposal exists
        require(proposal.id == _id, "Proposal does not exist");

        // check if proposal has ended
        require(block.timestamp < proposal.end, "Proposal has ended");

        // check if user has voted
        require(proposal.hasVoted[msg.sender], "You have not voted");

        // remove user from voted mapping
        proposal.hasVoted[msg.sender] = false;

        // remove voting power from for or against votes
        if (proposal.forOrAgainst[msg.sender]) {
            proposal.forVotes = proposal.forVotes - balanceOf(msg.sender);
        } else {
            proposal.againstVotes = proposal.againstVotes - balanceOf(msg.sender);
        }
    }


    function changeVote(uint256 _id, bool _vote) public {
        revertVote(_id);
        vote(_id, _vote);
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        // check proposal votes by this address
        for (uint256 i = 0; i < proposalCount; i++) {
            if (proposals[i].completed) continue;

            if (proposals[i].hasVoted[msg.sender]) {
                if (proposals[i].forOrAgainst[msg.sender]) {
                    proposals[i].forVotes = proposals[i].forVotes - amount;
                } else {
                    proposals[i].againstVotes = proposals[i].againstVotes - amount;
                }
            }

            if (proposals[i].hasVoted[recipient]) {
                if (proposals[i].forOrAgainst[recipient]) {
                    proposals[i].forVotes = proposals[i].forVotes + amount;
                } else {
                    proposals[i].againstVotes = proposals[i].againstVotes + amount;
                }
            }


        }
        _transfer(_msgSender(), recipient, amount);
        return true;
    }


}