// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DonationTracker
 * @dev A blockchain-based donation tracking system for NGOs
 * @notice This contract allows NGOs to register, receive donations, and track impact
 */
contract DonationTracker {

    // Structs
    struct NGO {
        address wallet;
        string name;
        string metadataCID;
        bool approved;
        uint256 totalReceived;
        uint256 totalWithdrawn;
        string description;
        string website;
        string contact;
        bool exists;
    }

    struct Donation {
        uint256 id;
        address donor;
        address ngo;
        uint256 amount;
        uint256 timestamp;
        string message;
        string proofCID;
    }

    // State variables
    address public owner;
    uint256 public nextDonationId;

    mapping(address => NGO) public ngos;
    mapping(uint256 => Donation) public donations;
    mapping(address => uint256) public pendingWithdrawals;

    address[] public ngoAddresses;
    uint256[] public donationIds;

    // Events
    event NGORegistered(address indexed ngoWallet, string name);
    event NGOApproved(address indexed ngoWallet, bool approved);
    event DonationMade(
        uint256 indexed donationId,
        address indexed donor,
        address indexed ngo,
        uint256 amount,
        string message
    );
    event ProofAdded(uint256 indexed donationId, string cid);
    event WithdrawalMade(address indexed ngo, uint256 amount);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier ngoExists(address ngoWallet) {
        require(ngos[ngoWallet].exists, "NGO does not exist");
        _;
    }

    modifier onlyNGO() {
        require(ngos[msg.sender].exists, "Only registered NGOs can call this");
        _;
    }

    modifier onlyApprovedNGO() {
        require(ngos[msg.sender].exists && ngos[msg.sender].approved, "NGO not approved");
        _;
    }

    constructor() {
        owner = msg.sender;
        nextDonationId = 1;
    }

    // NGO Management Functions

    /**
     * @dev Register a new NGO
     * @param name Name of the NGO
     * @param metadataCID IPFS CID for additional metadata
     * @param description Description of the NGO
     * @param website Website URL
     * @param contact Contact information
     */
    function registerNGO(
        string memory name,
        string memory metadataCID,
        string memory description,
        string memory website,
        string memory contact
    ) external {
        require(!ngos[msg.sender].exists, "NGO already registered");
        require(bytes(name).length > 0, "Name cannot be empty");

        NGO memory newNGO = NGO({
            wallet: msg.sender,
            name: name,
            metadataCID: metadataCID,
            approved: false,
            totalReceived: 0,
            totalWithdrawn: 0,
            description: description,
            website: website,
            contact: contact,
            exists: true
        });

        ngos[msg.sender] = newNGO;
        ngoAddresses.push(msg.sender);

        emit NGORegistered(msg.sender, name);
    }

    /**
     * @dev Approve or reject an NGO (only owner)
     * @param ngoWallet Address of the NGO
     * @param approved Approval status
     */
    function approveNGO(address ngoWallet, bool approved)
        external
        onlyOwner
        ngoExists(ngoWallet)
    {
        ngos[ngoWallet].approved = approved;
        emit NGOApproved(ngoWallet, approved);
    }

    /**
     * @dev Get NGO details
     * @param ngoWallet Address of the NGO
     * @return NGO struct
     */
    function getNGO(address ngoWallet)
        external
        view
        ngoExists(ngoWallet)
        returns (NGO memory)
    {
        return ngos[ngoWallet];
    }

    /**
     * @dev Get all NGO addresses
     * @return Array of NGO addresses
     */
    function getAllNGOs() external view returns (address[] memory) {
        return ngoAddresses;
    }

    // Donation Functions

    /**
     * @dev Make a donation to an approved NGO
     * @param ngoWallet Address of the NGO
     * @param message Optional message from donor
     */
    function donate(address ngoWallet, string memory message)
        external
        payable
        ngoExists(ngoWallet)
    {
        require(ngos[ngoWallet].approved, "NGO is not approved");
        require(msg.value > 0, "Donation amount must be greater than 0");

        uint256 donationId = nextDonationId++;

        Donation memory newDonation = Donation({
            id: donationId,
            donor: msg.sender,
            ngo: ngoWallet,
            amount: msg.value,
            timestamp: block.timestamp,
            message: message,
            proofCID: ""
        });

        donations[donationId] = newDonation;
        donationIds.push(donationId);

        ngos[ngoWallet].totalReceived += msg.value;
        pendingWithdrawals[ngoWallet] += msg.value;

        emit DonationMade(donationId, msg.sender, ngoWallet, msg.value, message);
    }

    /**
     * @dev Get donation details
     * @param donationId ID of the donation
     * @return Donation struct
     */
    function getDonation(uint256 donationId)
        external
        view
        returns (Donation memory)
    {
        require(donations[donationId].id != 0, "Donation does not exist");
        return donations[donationId];
    }

    /**
     * @dev Get all donation IDs
     * @return Array of donation IDs
     */
    function getAllDonations() external view returns (uint256[] memory) {
        return donationIds;
    }

    /**
     * @dev Get donations by NGO
     * @param ngoWallet Address of the NGO
     * @return Array of donation IDs
     */
    function getDonationsByNGO(address ngoWallet)
        external
        view
        returns (uint256[] memory)
    {
        uint256 count = 0;

        // Count donations for this NGO
        for (uint256 i = 0; i < donationIds.length; i++) {
            if (donations[donationIds[i]].ngo == ngoWallet) {
                count++;
            }
        }

        // Create array of matching donation IDs
        uint256[] memory ngodonationIds = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < donationIds.length; i++) {
            if (donations[donationIds[i]].ngo == ngoWallet) {
                ngodonationIds[index++] = donationIds[i];
            }
        }

        return ngodonationIds;
    }

    /**
     * @dev Add proof of impact for a donation (only NGO)
     * @param donationId ID of the donation
     * @param cid IPFS CID of the proof
     */
    function addProof(uint256 donationId, string memory cid)
        external
        onlyApprovedNGO
    {
        require(donations[donationId].id != 0, "Donation does not exist");
        require(donations[donationId].ngo == msg.sender, "Only recipient NGO can add proof");
        require(bytes(donations[donationId].proofCID).length == 0, "Proof already added");

        donations[donationId].proofCID = cid;
        emit ProofAdded(donationId, cid);
    }

    // Withdrawal Functions

    /**
     * @dev Withdraw funds (only approved NGOs)
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external onlyApprovedNGO {
        require(amount > 0, "Amount must be greater than 0");
        require(pendingWithdrawals[msg.sender] >= amount, "Insufficient balance");

        pendingWithdrawals[msg.sender] -= amount;
        ngos[msg.sender].totalWithdrawn += amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit WithdrawalMade(msg.sender, amount);
    }

    /**
     * @dev Get pending withdrawal balance for an NGO
     * @param ngoWallet Address of the NGO
     * @return Pending withdrawal amount
     */
    function getPendingWithdrawal(address ngoWallet)
        external
        view
        returns (uint256)
    {
        return pendingWithdrawals[ngoWallet];
    }

    // Owner Functions

    /**
     * @dev Transfer ownership
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }

    /**
     * @dev Get contract balance
     * @return Contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
