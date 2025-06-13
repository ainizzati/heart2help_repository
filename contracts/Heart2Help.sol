// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Heart2Help {
    address public admin;
    uint public campaignCount;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    struct Campaign {
        uint id;
        string name;
        address payable receiver;
        uint goal;
        uint collected;
        bool isActive;
        uint deadline; // ⬅️ NEW
    }

    struct Donor {
        bool isRegistered;
        uint totalDonated;
    }

    mapping(uint => Campaign) public campaigns;
    mapping(address => Donor) public donors;

    event CampaignCreated(uint id, string name, uint goal, uint deadline);
    event Donated(address donor, uint campaignId, uint amount);
    event Withdrawn(uint campaignId, uint amount);

    // ========== Admin Functions ==========

    function createCampaign(string memory _name, uint _goal, uint _durationInDays) external onlyAdmin {
        require(_goal > 0, "Goal must be more than 0");
        require(_durationInDays > 0, "Campaign must have a duration");

        uint deadline = block.timestamp + (_durationInDays * 1 days); // ⏱️ set due date

        campaigns[campaignCount] = Campaign(
            campaignCount, _name, payable(admin), _goal, 0, true, deadline
        );
        emit CampaignCreated(campaignCount, _name, _goal, deadline);
        campaignCount++;
    }

    function withdrawFunds(uint _campaignId) external onlyAdmin {
        Campaign storage c = campaigns[_campaignId];

        bool goalReached = c.collected >= c.goal;
        bool isPastDeadline = block.timestamp >= c.deadline;

        require(c.isActive, "Campaign inactive");
        require(goalReached || isPastDeadline, "Goal not reached and deadline not passed");

        uint amount = c.collected;
        c.collected = 0;
        c.isActive = false;
        c.receiver.transfer(amount);

        emit Withdrawn(_campaignId, amount);
    }

    // ========== Donor Functions ==========

    function register() external {
        require(!donors[msg.sender].isRegistered, "Already registered");
        donors[msg.sender] = Donor(true, 0);
    }

    function donate(uint _campaignId) external payable {
        uint minWei = 5 ether / 1000;
        uint maxWei = 1000 ether / 1000;

        require(donors[msg.sender].isRegistered, "Donor not registered");
        require(msg.value >= minWei && msg.value <= maxWei, "Donation must be between RM5 and RM1000 in wei");

        Campaign storage c = campaigns[_campaignId];
        require(c.isActive, "Campaign not active");
        require(c.collected + msg.value <= c.goal, "Target reached");

        c.collected += msg.value;
        donors[msg.sender].totalDonated += msg.value;

        if (c.collected >= c.goal) {
            c.isActive = false;
        }

        emit Donated(msg.sender, _campaignId, msg.value);
    }

    // ========== View Functions ==========

    function getCampaign(uint _campaignId) external view returns (
        string memory, uint, uint, bool, uint
    ) {
        Campaign storage c = campaigns[_campaignId];
        return (c.name, c.goal, c.collected, c.isActive, c.deadline);
    }

    function isDonorRegistered(address _addr) external view returns (bool) {
        return donors[_addr].isRegistered;
    }
}
