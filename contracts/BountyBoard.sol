// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IReputationSystem {
    function recordApprovedSubmission(address researcher, uint8 difficulty, uint256 earnings) external;
    function recordRejectedSubmission(address researcher) external;
}

/**
 * @title BountyBoard
 * @notice A platform for posting and solving cryptographic research bounties
 * @dev Compatible with Armchain (PQC). Does NOT use ecrecover for signature verification.
 *      All signature verification is handled at the transaction level by the Armchain VM.
 */
contract BountyBoard is Ownable, ReentrancyGuard {
    // ============================================
    // Custom Errors
    // ============================================

    error RewardTooLow();
    error DeadlineMustBeInFuture();
    error InvalidDifficulty();
    error TitleRequired();
    error ContentRequired();
    error BountyDoesNotExist();
    error SubmissionDoesNotExist();
    error NotBountyCreator();
    error NotReviewer();
    error BountyNotAcceptingSubmissions();
    error DeadlinePassed();
    error CreatorCannotSubmit();
    error AlreadyReviewed();
    error BountyAlreadyCompleted();
    error HasSubmissions();
    error CannotCancel();
    error RefundFailed();
    error PaymentFailed();
    error WithdrawalFailed();
    error NoFeesToWithdraw();
    error FeeTooHigh();
    error BountyNotExpired();
    error BountyNotClaimable();
    error ZeroAddress();

    // ============================================
    // Types
    // ============================================

    enum BountyStatus {
        Open,
        InProgress,
        UnderReview,
        Completed,
        Cancelled
    }

    enum SubmissionStatus {
        Pending,
        UnderReview,
        Approved,
        Rejected
    }

    struct Bounty {
        uint256 id;
        address creator;
        string title;
        string description;
        string category;
        uint8 difficulty; // 1-4: Beginner, Intermediate, Advanced, Expert
        uint256 reward;
        uint256 deadline;
        BountyStatus status;
        uint256 submissionCount;
        uint256 createdAt;
    }

    struct Submission {
        uint256 id;
        uint256 bountyId;
        address submitter;
        string content; // IPFS hash or text content
        SubmissionStatus status;
        uint256 submittedAt;
        string reviewComment;
    }

    // ============================================
    // State
    // ============================================

    uint256 public nextBountyId = 1;
    uint256 public nextSubmissionId = 1;
    uint256 public platformFeePercent = 5; // 5% fee
    uint256 public minBountyReward = 0.01 ether;
    uint256 public accumulatedFees;

    IReputationSystem public reputationSystem;

    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => Submission) public submissions;
    mapping(uint256 => uint256[]) public bountySubmissions; // bountyId => submissionIds
    mapping(address => uint256[]) public userBounties; // creator => bountyIds
    mapping(address => uint256[]) public userSubmissions; // submitter => submissionIds

    // ============================================
    // Events
    // ============================================

    event BountyCreated(
        uint256 indexed bountyId,
        address indexed creator,
        string title,
        uint256 reward,
        uint256 deadline
    );

    event BountyUpdated(uint256 indexed bountyId, BountyStatus status);

    event BountyCancelled(uint256 indexed bountyId, address indexed creator);

    event SubmissionCreated(
        uint256 indexed submissionId,
        uint256 indexed bountyId,
        address indexed submitter
    );

    event SubmissionReviewed(
        uint256 indexed submissionId,
        uint256 indexed bountyId,
        SubmissionStatus status,
        address indexed reviewer
    );

    event RewardPaid(
        uint256 indexed bountyId,
        uint256 indexed submissionId,
        address indexed recipient,
        uint256 amount
    );

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event MinBountyRewardUpdated(uint256 oldMin, uint256 newMin);
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    event ReputationSystemUpdated(address indexed oldAddress, address indexed newAddress);
    event ExpiredBountyReclaimed(uint256 indexed bountyId, address indexed creator, uint256 amount);

    // ============================================
    // Modifiers
    // ============================================

    modifier bountyExists(uint256 bountyId) {
        if (bounties[bountyId].id == 0) revert BountyDoesNotExist();
        _;
    }

    modifier onlyBountyCreator(uint256 bountyId) {
        if (bounties[bountyId].creator != msg.sender) revert NotBountyCreator();
        _;
    }

    modifier submissionExists(uint256 submissionId) {
        if (submissions[submissionId].id == 0) revert SubmissionDoesNotExist();
        _;
    }

    // ============================================
    // Constructor
    // ============================================

    constructor() Ownable(msg.sender) {}

    // ============================================
    // Bounty Management
    // ============================================

    /**
     * @notice Create a new bounty with reward
     * @param title Bounty title
     * @param description Detailed description (can be IPFS hash)
     * @param category Category identifier
     * @param difficulty Difficulty level (1-4)
     * @param deadline Unix timestamp for deadline
     */
    function createBounty(
        string calldata title,
        string calldata description,
        string calldata category,
        uint8 difficulty,
        uint256 deadline
    ) external payable nonReentrant {
        if (msg.value < minBountyReward) revert RewardTooLow();
        if (deadline <= block.timestamp) revert DeadlineMustBeInFuture();
        if (difficulty < 1 || difficulty > 4) revert InvalidDifficulty();
        if (bytes(title).length == 0) revert TitleRequired();

        uint256 bountyId = nextBountyId++;

        bounties[bountyId] = Bounty({
            id: bountyId,
            creator: msg.sender,
            title: title,
            description: description,
            category: category,
            difficulty: difficulty,
            reward: msg.value,
            deadline: deadline,
            status: BountyStatus.Open,
            submissionCount: 0,
            createdAt: block.timestamp
        });

        userBounties[msg.sender].push(bountyId);

        emit BountyCreated(bountyId, msg.sender, title, msg.value, deadline);
    }

    /**
     * @notice Cancel a bounty and refund the reward (only if no submissions)
     * @param bountyId The bounty to cancel
     */
    function cancelBounty(uint256 bountyId)
        external
        nonReentrant
        bountyExists(bountyId)
        onlyBountyCreator(bountyId)
    {
        Bounty storage bounty = bounties[bountyId];
        if (bounty.submissionCount != 0) revert HasSubmissions();
        if (bounty.status != BountyStatus.Open) revert CannotCancel();

        bounty.status = BountyStatus.Cancelled;

        (bool success, ) = msg.sender.call{value: bounty.reward}("");
        if (!success) revert RefundFailed();

        emit BountyCancelled(bountyId, msg.sender);
        emit BountyUpdated(bountyId, BountyStatus.Cancelled);
    }

    /**
     * @notice Reclaim funds from an expired bounty with no approved submission
     * @param bountyId The expired bounty to reclaim from
     */
    function reclaimExpiredBounty(uint256 bountyId)
        external
        nonReentrant
        bountyExists(bountyId)
        onlyBountyCreator(bountyId)
    {
        Bounty storage bounty = bounties[bountyId];
        if (block.timestamp <= bounty.deadline) revert BountyNotExpired();
        if (bounty.status == BountyStatus.Completed || bounty.status == BountyStatus.Cancelled) {
            revert BountyNotClaimable();
        }

        bounty.status = BountyStatus.Cancelled;

        (bool success, ) = msg.sender.call{value: bounty.reward}("");
        if (!success) revert RefundFailed();

        emit ExpiredBountyReclaimed(bountyId, msg.sender, bounty.reward);
        emit BountyUpdated(bountyId, BountyStatus.Cancelled);
    }

    // ============================================
    // Submissions
    // ============================================

    /**
     * @notice Submit a solution to a bounty
     * @param bountyId The bounty to submit to
     * @param content The solution content (text or IPFS hash)
     */
    function submitSolution(uint256 bountyId, string calldata content)
        external
        nonReentrant
        bountyExists(bountyId)
    {
        Bounty storage bounty = bounties[bountyId];
        if (bounty.status != BountyStatus.Open && bounty.status != BountyStatus.InProgress) {
            revert BountyNotAcceptingSubmissions();
        }
        if (block.timestamp > bounty.deadline) revert DeadlinePassed();
        if (bounty.creator == msg.sender) revert CreatorCannotSubmit();
        if (bytes(content).length == 0) revert ContentRequired();

        uint256 submissionId = nextSubmissionId++;

        submissions[submissionId] = Submission({
            id: submissionId,
            bountyId: bountyId,
            submitter: msg.sender,
            content: content,
            status: SubmissionStatus.Pending,
            submittedAt: block.timestamp,
            reviewComment: ""
        });

        bountySubmissions[bountyId].push(submissionId);
        userSubmissions[msg.sender].push(submissionId);
        bounty.submissionCount++;

        if (bounty.status == BountyStatus.Open) {
            bounty.status = BountyStatus.InProgress;
            emit BountyUpdated(bountyId, BountyStatus.InProgress);
        }

        emit SubmissionCreated(submissionId, bountyId, msg.sender);
    }

    /**
     * @notice Approve a submission and pay the reward
     * @dev Callable by the bounty creator OR the platform admin (contract owner)
     * @param submissionId The submission to approve
     * @param comment Review comment
     */
    function approveSubmission(uint256 submissionId, string calldata comment)
        external
        nonReentrant
        submissionExists(submissionId)
    {
        Submission storage submission = submissions[submissionId];
        Bounty storage bounty = bounties[submission.bountyId];

        if (bounty.creator != msg.sender && msg.sender != owner()) revert NotReviewer();
        if (submission.status != SubmissionStatus.Pending) revert AlreadyReviewed();
        if (bounty.status == BountyStatus.Completed) revert BountyAlreadyCompleted();

        submission.status = SubmissionStatus.Approved;
        submission.reviewComment = comment;
        bounty.status = BountyStatus.Completed;

        uint256 fee = (bounty.reward * platformFeePercent) / 100;
        uint256 payout = bounty.reward - fee;
        accumulatedFees += fee;

        (bool success, ) = submission.submitter.call{value: payout}("");
        if (!success) revert PaymentFailed();

        if (address(reputationSystem) != address(0)) {
            try reputationSystem.recordApprovedSubmission(
                submission.submitter,
                bounty.difficulty,
                payout
            ) {} catch {}
        }

        emit SubmissionReviewed(submissionId, submission.bountyId, SubmissionStatus.Approved, msg.sender);
        emit RewardPaid(submission.bountyId, submissionId, submission.submitter, payout);
        emit BountyUpdated(submission.bountyId, BountyStatus.Completed);
    }

    /**
     * @notice Reject a submission
     * @dev Callable by the bounty creator OR the platform admin (contract owner)
     * @param submissionId The submission to reject
     * @param comment Review comment explaining rejection
     */
    function rejectSubmission(uint256 submissionId, string calldata comment)
        external
        submissionExists(submissionId)
    {
        Submission storage submission = submissions[submissionId];
        Bounty storage bounty = bounties[submission.bountyId];

        if (bounty.creator != msg.sender && msg.sender != owner()) revert NotReviewer();
        if (submission.status != SubmissionStatus.Pending) revert AlreadyReviewed();

        submission.status = SubmissionStatus.Rejected;
        submission.reviewComment = comment;

        if (address(reputationSystem) != address(0)) {
            try reputationSystem.recordRejectedSubmission(submission.submitter) {} catch {}
        }

        emit SubmissionReviewed(submissionId, submission.bountyId, SubmissionStatus.Rejected, msg.sender);
    }

    // ============================================
    // View Functions
    // ============================================

    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        return bounties[bountyId];
    }

    function getSubmission(uint256 submissionId) external view returns (Submission memory) {
        return submissions[submissionId];
    }

    function getBountySubmissions(uint256 bountyId) external view returns (uint256[] memory) {
        return bountySubmissions[bountyId];
    }

    function getUserBounties(address user) external view returns (uint256[] memory) {
        return userBounties[user];
    }

    function getUserSubmissions(address user) external view returns (uint256[] memory) {
        return userSubmissions[user];
    }

    function getBountyCount() external view returns (uint256) {
        return nextBountyId - 1;
    }

    function getSubmissionCount() external view returns (uint256) {
        return nextSubmissionId - 1;
    }

    // ============================================
    // Admin Functions
    // ============================================

    function setReputationSystem(address _reputationSystem) external onlyOwner {
        address oldAddress = address(reputationSystem);
        reputationSystem = IReputationSystem(_reputationSystem);
        emit ReputationSystemUpdated(oldAddress, _reputationSystem);
    }

    function setPlatformFee(uint256 feePercent) external onlyOwner {
        if (feePercent > 20) revert FeeTooHigh();
        uint256 oldFee = platformFeePercent;
        platformFeePercent = feePercent;
        emit PlatformFeeUpdated(oldFee, feePercent);
    }

    function setMinBountyReward(uint256 minReward) external onlyOwner {
        uint256 oldMin = minBountyReward;
        minBountyReward = minReward;
        emit MinBountyRewardUpdated(oldMin, minReward);
    }

    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        if (amount == 0) revert NoFeesToWithdraw();
        accumulatedFees = 0;
        (bool success, ) = owner().call{value: amount}("");
        if (!success) revert WithdrawalFailed();
        emit FeesWithdrawn(owner(), amount);
    }

    receive() external payable {}
}
