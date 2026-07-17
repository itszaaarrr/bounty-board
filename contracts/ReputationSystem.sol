// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationSystem
 * @notice Tracks researcher reputation based on bounty completions
 * @dev Compatible with Armchain (PQC). Does NOT use ecrecover.
 */
contract ReputationSystem is Ownable {
    // ============================================
    // Custom Errors
    // ============================================

    error OnlyBountyBoard();
    error ZeroAddress();
    error LimitTooHigh();

    // ============================================
    // Types
    // ============================================

    struct ResearcherProfile {
        uint256 totalSubmissions;
        uint256 approvedSubmissions;
        uint256 rejectedSubmissions;
        uint256 totalEarnings;
        uint256 reputationPoints;
        uint256 firstActivityAt;
        uint256 lastActivityAt;
    }

    // Reputation levels
    uint256 public constant LEVEL_NOVICE = 0;
    uint256 public constant LEVEL_RESEARCHER = 10;
    uint256 public constant LEVEL_CRYPTOGRAPHER = 50;
    uint256 public constant LEVEL_EXPERT = 150;
    uint256 public constant LEVEL_MASTER = 500;
    uint256 public constant LEVEL_LEGEND = 1000;

    // Points per difficulty level
    uint256 public constant POINTS_BEGINNER = 1;
    uint256 public constant POINTS_INTERMEDIATE = 2;
    uint256 public constant POINTS_ADVANCED = 4;
    uint256 public constant POINTS_EXPERT = 8;

    uint256 public constant MAX_LEADERBOARD_LIMIT = 100;

    // ============================================
    // State
    // ============================================

    address public bountyBoard;
    mapping(address => ResearcherProfile) public profiles;
    address[] public researchers;
    mapping(address => bool) private isRegistered;

    // ============================================
    // Events
    // ============================================

    event ResearcherRegistered(address indexed researcher);
    event ReputationUpdated(
        address indexed researcher,
        uint256 newPoints,
        uint256 totalPoints
    );
    event SubmissionRecorded(
        address indexed researcher,
        bool approved,
        uint256 earnings
    );
    event BountyBoardUpdated(address indexed oldAddress, address indexed newAddress);

    // ============================================
    // Modifiers
    // ============================================

    modifier onlyBountyBoard() {
        if (msg.sender != bountyBoard) revert OnlyBountyBoard();
        _;
    }

    // ============================================
    // Constructor
    // ============================================

    constructor(address _bountyBoard) Ownable(msg.sender) {
        if (_bountyBoard == address(0)) revert ZeroAddress();
        bountyBoard = _bountyBoard;
    }

    // ============================================
    // Core Functions
    // ============================================

    /**
     * @notice Record an approved submission
     * @param researcher The researcher address
     * @param difficulty The bounty difficulty (1-4)
     * @param earnings The amount earned
     */
    function recordApprovedSubmission(
        address researcher,
        uint8 difficulty,
        uint256 earnings
    ) external onlyBountyBoard {
        _ensureRegistered(researcher);

        ResearcherProfile storage profile = profiles[researcher];
        profile.totalSubmissions++;
        profile.approvedSubmissions++;
        profile.totalEarnings += earnings;
        profile.lastActivityAt = block.timestamp;

        uint256 points = _getPointsForDifficulty(difficulty);
        profile.reputationPoints += points;

        emit SubmissionRecorded(researcher, true, earnings);
        emit ReputationUpdated(researcher, points, profile.reputationPoints);
    }

    /**
     * @notice Record a rejected submission
     * @param researcher The researcher address
     */
    function recordRejectedSubmission(address researcher) external onlyBountyBoard {
        _ensureRegistered(researcher);

        ResearcherProfile storage profile = profiles[researcher];
        profile.totalSubmissions++;
        profile.rejectedSubmissions++;
        profile.lastActivityAt = block.timestamp;

        emit SubmissionRecorded(researcher, false, 0);
    }

    /**
     * @notice Get the reputation level name for a researcher
     * @param researcher The researcher address
     * @return level The level number (0-5)
     * @return name The level name
     */
    function getLevel(address researcher) external view returns (uint256 level, string memory name) {
        uint256 points = profiles[researcher].reputationPoints;

        if (points >= LEVEL_LEGEND) {
            return (5, "Legend");
        } else if (points >= LEVEL_MASTER) {
            return (4, "Master");
        } else if (points >= LEVEL_EXPERT) {
            return (3, "Expert");
        } else if (points >= LEVEL_CRYPTOGRAPHER) {
            return (2, "Cryptographer");
        } else if (points >= LEVEL_RESEARCHER) {
            return (1, "Researcher");
        } else {
            return (0, "Novice");
        }
    }

    /**
     * @notice Get full profile for a researcher
     */
    function getProfile(address researcher) external view returns (ResearcherProfile memory) {
        return profiles[researcher];
    }

    /**
     * @notice Get total number of registered researchers
     */
    function getResearcherCount() external view returns (uint256) {
        return researchers.length;
    }

    /**
     * @notice Get top researchers by reputation (capped for gas safety)
     * @param limit Maximum number to return
     */
    function getTopResearchers(uint256 limit) external view returns (
        address[] memory,
        uint256[] memory
    ) {
        if (limit > MAX_LEADERBOARD_LIMIT) revert LimitTooHigh();

        uint256 count = researchers.length < limit ? researchers.length : limit;
        address[] memory topAddresses = new address[](count);
        uint256[] memory topPoints = new uint256[](count);

        if (count == 0) return (topAddresses, topPoints);

        // Selection sort for top-k (acceptable for capped limit)
        bool[] memory used = new bool[](researchers.length);
        for (uint256 i = 0; i < count; i++) {
            uint256 maxPoints = 0;
            uint256 maxIndex = 0;
            bool found = false;

            for (uint256 j = 0; j < researchers.length; j++) {
                if (used[j]) continue;
                uint256 points = profiles[researchers[j]].reputationPoints;
                if (!found || points > maxPoints) {
                    maxPoints = points;
                    maxIndex = j;
                    found = true;
                }
            }

            used[maxIndex] = true;
            topAddresses[i] = researchers[maxIndex];
            topPoints[i] = maxPoints;
        }

        return (topAddresses, topPoints);
    }

    // ============================================
    // Admin Functions
    // ============================================

    function setBountyBoard(address _bountyBoard) external onlyOwner {
        if (_bountyBoard == address(0)) revert ZeroAddress();
        address oldAddress = bountyBoard;
        bountyBoard = _bountyBoard;
        emit BountyBoardUpdated(oldAddress, _bountyBoard);
    }

    // ============================================
    // Internal Functions
    // ============================================

    function _ensureRegistered(address researcher) internal {
        if (!isRegistered[researcher]) {
            isRegistered[researcher] = true;
            researchers.push(researcher);
            profiles[researcher].firstActivityAt = block.timestamp;
            emit ResearcherRegistered(researcher);
        }
    }

    function _getPointsForDifficulty(uint8 difficulty) internal pure returns (uint256) {
        if (difficulty == 4) return POINTS_EXPERT;
        if (difficulty == 3) return POINTS_ADVANCED;
        if (difficulty == 2) return POINTS_INTERMEDIATE;
        return POINTS_BEGINNER;
    }
}
