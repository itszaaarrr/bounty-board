const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BountyBoard", function () {
  let bountyBoard, reputationSystem;
  let owner, creator, researcher1, researcher2;
  let oneWeek;

  beforeEach(async function () {
    [owner, creator, researcher1, researcher2] = await ethers.getSigners();

    const BountyBoard = await ethers.getContractFactory("BountyBoard");
    bountyBoard = await BountyBoard.deploy();
    await bountyBoard.waitForDeployment();

    const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
    reputationSystem = await ReputationSystem.deploy(await bountyBoard.getAddress());
    await reputationSystem.waitForDeployment();

    await bountyBoard.connect(owner).setReputationSystem(await reputationSystem.getAddress());

    oneWeek = 7 * 24 * 60 * 60;
  });

  // ============================================
  // Deployment
  // ============================================

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await bountyBoard.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct default values", async function () {
      expect(await bountyBoard.platformFeePercent()).to.equal(5);
      expect(await bountyBoard.minBountyReward()).to.equal(ethers.parseEther("0.01"));
      expect(await bountyBoard.getBountyCount()).to.equal(0);
      expect(await bountyBoard.getSubmissionCount()).to.equal(0);
      expect(await bountyBoard.accumulatedFees()).to.equal(0);
    });

    it("Should have ReputationSystem linked", async function () {
      expect(await bountyBoard.reputationSystem()).to.equal(await reputationSystem.getAddress());
    });
  });

  // ============================================
  // Bounty Creation
  // ============================================

  describe("Bounty Creation", function () {
    it("Should create a bounty with correct data", async function () {
      const reward = ethers.parseEther("1.0");
      const deadline = (await time.latest()) + oneWeek;

      await expect(
        bountyBoard.connect(creator).createBounty(
          "Test Bounty",
          "Implement a hash function",
          "implementation",
          2,
          deadline,
          { value: reward }
        )
      ).to.emit(bountyBoard, "BountyCreated")
        .withArgs(1, creator.address, "Test Bounty", reward, deadline);

      const bounty = await bountyBoard.getBounty(1);
      expect(bounty.title).to.equal("Test Bounty");
      expect(bounty.creator).to.equal(creator.address);
      expect(bounty.reward).to.equal(reward);
      expect(bounty.difficulty).to.equal(2);
      expect(bounty.status).to.equal(0); // Open
    });

    it("Should reject bounty with reward below minimum", async function () {
      const deadline = (await time.latest()) + oneWeek;

      await expect(
        bountyBoard.connect(creator).createBounty(
          "Test", "Description", "category", 1, deadline,
          { value: ethers.parseEther("0.001") }
        )
      ).to.be.revertedWithCustomError(bountyBoard, "RewardTooLow");
    });

    it("Should reject bounty with past deadline", async function () {
      const pastDeadline = (await time.latest()) - 100;

      await expect(
        bountyBoard.connect(creator).createBounty(
          "Test", "Description", "category", 1, pastDeadline,
          { value: ethers.parseEther("1.0") }
        )
      ).to.be.revertedWithCustomError(bountyBoard, "DeadlineMustBeInFuture");
    });

    it("Should reject bounty with difficulty 0", async function () {
      const deadline = (await time.latest()) + oneWeek;

      await expect(
        bountyBoard.connect(creator).createBounty(
          "Test", "Description", "category", 0, deadline,
          { value: ethers.parseEther("1.0") }
        )
      ).to.be.revertedWithCustomError(bountyBoard, "InvalidDifficulty");
    });

    it("Should reject bounty with difficulty above 4", async function () {
      const deadline = (await time.latest()) + oneWeek;

      await expect(
        bountyBoard.connect(creator).createBounty(
          "Test", "Description", "category", 5, deadline,
          { value: ethers.parseEther("1.0") }
        )
      ).to.be.revertedWithCustomError(bountyBoard, "InvalidDifficulty");
    });

    it("Should reject bounty with empty title", async function () {
      const deadline = (await time.latest()) + oneWeek;

      await expect(
        bountyBoard.connect(creator).createBounty(
          "", "Description", "category", 1, deadline,
          { value: ethers.parseEther("1.0") }
        )
      ).to.be.revertedWithCustomError(bountyBoard, "TitleRequired");
    });

    it("Should increment bounty ID correctly", async function () {
      const deadline = (await time.latest()) + oneWeek;
      const reward = ethers.parseEther("0.1");

      await bountyBoard.connect(creator).createBounty("B1", "D", "c", 1, deadline, { value: reward });
      await bountyBoard.connect(creator).createBounty("B2", "D", "c", 2, deadline, { value: reward });
      await bountyBoard.connect(creator).createBounty("B3", "D", "c", 3, deadline, { value: reward });

      expect(await bountyBoard.getBountyCount()).to.equal(3);

      const b1 = await bountyBoard.getBounty(1);
      const b2 = await bountyBoard.getBounty(2);
      const b3 = await bountyBoard.getBounty(3);
      expect(b1.title).to.equal("B1");
      expect(b2.title).to.equal("B2");
      expect(b3.title).to.equal("B3");
    });
  });

  // ============================================
  // Bounty Cancellation
  // ============================================

  describe("Bounty Cancellation", function () {
    beforeEach(async function () {
      const deadline = (await time.latest()) + oneWeek;
      await bountyBoard.connect(creator).createBounty(
        "Test Bounty", "Description", "category", 2, deadline,
        { value: ethers.parseEther("1.0") }
      );
    });

    it("Should allow creator to cancel bounty with no submissions", async function () {
      const balanceBefore = await ethers.provider.getBalance(creator.address);

      const tx = await bountyBoard.connect(creator).cancelBounty(1);
      await expect(tx).to.emit(bountyBoard, "BountyCancelled").withArgs(1, creator.address);
      await expect(tx).to.emit(bountyBoard, "BountyUpdated");

      const balanceAfter = await ethers.provider.getBalance(creator.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);

      const bounty = await bountyBoard.getBounty(1);
      expect(bounty.status).to.equal(4); // Cancelled
    });

    it("Should reject cancellation by non-creator", async function () {
      await expect(
        bountyBoard.connect(researcher1).cancelBounty(1)
      ).to.be.revertedWithCustomError(bountyBoard, "NotBountyCreator");
    });

    it("Should reject cancellation if submissions exist", async function () {
      await bountyBoard.connect(researcher1).submitSolution(1, "My solution");

      await expect(
        bountyBoard.connect(creator).cancelBounty(1)
      ).to.be.revertedWithCustomError(bountyBoard, "HasSubmissions");
    });

    it("Should reject cancellation of non-existent bounty", async function () {
      await expect(
        bountyBoard.connect(creator).cancelBounty(999)
      ).to.be.revertedWithCustomError(bountyBoard, "BountyDoesNotExist");
    });
  });

  // ============================================
  // Expired Bounty Reclaim
  // ============================================

  describe("Expired Bounty Reclaim", function () {
    beforeEach(async function () {
      const deadline = (await time.latest()) + oneWeek;
      await bountyBoard.connect(creator).createBounty(
        "Test Bounty", "Description", "category", 2, deadline,
        { value: ethers.parseEther("1.0") }
      );
    });

    it("Should allow creator to reclaim funds from expired bounty", async function () {
      await time.increase(oneWeek + 1);

      const balanceBefore = await ethers.provider.getBalance(creator.address);

      const tx = await bountyBoard.connect(creator).reclaimExpiredBounty(1);
      await expect(tx).to.emit(bountyBoard, "ExpiredBountyReclaimed");
      await expect(tx).to.emit(bountyBoard, "BountyUpdated");

      const balanceAfter = await ethers.provider.getBalance(creator.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);

      const bounty = await bountyBoard.getBounty(1);
      expect(bounty.status).to.equal(4); // Cancelled
    });

    it("Should allow reclaim on expired bounty even with submissions", async function () {
      await bountyBoard.connect(researcher1).submitSolution(1, "Solution");
      await time.increase(oneWeek + 1);

      await expect(
        bountyBoard.connect(creator).reclaimExpiredBounty(1)
      ).to.emit(bountyBoard, "ExpiredBountyReclaimed");
    });

    it("Should reject reclaim before deadline", async function () {
      await expect(
        bountyBoard.connect(creator).reclaimExpiredBounty(1)
      ).to.be.revertedWithCustomError(bountyBoard, "BountyNotExpired");
    });

    it("Should reject reclaim on completed bounty", async function () {
      await bountyBoard.connect(researcher1).submitSolution(1, "Solution");
      await bountyBoard.connect(creator).approveSubmission(1, "Good");
      await time.increase(oneWeek + 1);

      await expect(
        bountyBoard.connect(creator).reclaimExpiredBounty(1)
      ).to.be.revertedWithCustomError(bountyBoard, "BountyNotClaimable");
    });

    it("Should reject reclaim on already cancelled bounty", async function () {
      await bountyBoard.connect(creator).cancelBounty(1);
      await time.increase(oneWeek + 1);

      await expect(
        bountyBoard.connect(creator).reclaimExpiredBounty(1)
      ).to.be.revertedWithCustomError(bountyBoard, "BountyNotClaimable");
    });

    it("Should reject reclaim by non-creator", async function () {
      await time.increase(oneWeek + 1);

      await expect(
        bountyBoard.connect(researcher1).reclaimExpiredBounty(1)
      ).to.be.revertedWithCustomError(bountyBoard, "NotBountyCreator");
    });
  });

  // ============================================
  // Submissions
  // ============================================

  describe("Submissions", function () {
    beforeEach(async function () {
      const deadline = (await time.latest()) + oneWeek;
      await bountyBoard.connect(creator).createBounty(
        "Test Bounty", "Description", "category", 3, deadline,
        { value: ethers.parseEther("1.0") }
      );
    });

    it("Should allow researcher to submit solution", async function () {
      await expect(
        bountyBoard.connect(researcher1).submitSolution(1, "ipfs://solution")
      ).to.emit(bountyBoard, "SubmissionCreated")
        .withArgs(1, 1, researcher1.address);

      const submission = await bountyBoard.getSubmission(1);
      expect(submission.submitter).to.equal(researcher1.address);
      expect(submission.content).to.equal("ipfs://solution");
      expect(submission.status).to.equal(0); // Pending

      const bounty = await bountyBoard.getBounty(1);
      expect(bounty.status).to.equal(1); // InProgress
      expect(bounty.submissionCount).to.equal(1);
    });

    it("Should reject submission from bounty creator", async function () {
      await expect(
        bountyBoard.connect(creator).submitSolution(1, "My solution")
      ).to.be.revertedWithCustomError(bountyBoard, "CreatorCannotSubmit");
    });

    it("Should reject submission with empty content", async function () {
      await expect(
        bountyBoard.connect(researcher1).submitSolution(1, "")
      ).to.be.revertedWithCustomError(bountyBoard, "ContentRequired");
    });

    it("Should reject submission after deadline", async function () {
      await time.increase(oneWeek + 1);

      await expect(
        bountyBoard.connect(researcher1).submitSolution(1, "Solution")
      ).to.be.revertedWithCustomError(bountyBoard, "DeadlinePassed");
    });

    it("Should reject submission to non-existent bounty", async function () {
      await expect(
        bountyBoard.connect(researcher1).submitSolution(999, "Solution")
      ).to.be.revertedWithCustomError(bountyBoard, "BountyDoesNotExist");
    });

    it("Should reject submission to completed bounty", async function () {
      await bountyBoard.connect(researcher1).submitSolution(1, "Solution 1");
      await bountyBoard.connect(creator).approveSubmission(1, "Good");

      await expect(
        bountyBoard.connect(researcher2).submitSolution(1, "Solution 2")
      ).to.be.revertedWithCustomError(bountyBoard, "BountyNotAcceptingSubmissions");
    });

    it("Should reject submission to cancelled bounty", async function () {
      await bountyBoard.connect(creator).cancelBounty(1);

      await expect(
        bountyBoard.connect(researcher1).submitSolution(1, "Solution")
      ).to.be.revertedWithCustomError(bountyBoard, "BountyNotAcceptingSubmissions");
    });

    it("Should track multiple submissions", async function () {
      await bountyBoard.connect(researcher1).submitSolution(1, "Solution 1");
      await bountyBoard.connect(researcher2).submitSolution(1, "Solution 2");

      const submissionIds = await bountyBoard.getBountySubmissions(1);
      expect(submissionIds.length).to.equal(2);

      const bounty = await bountyBoard.getBounty(1);
      expect(bounty.submissionCount).to.equal(2);
    });

    it("Should allow multiple submissions from same researcher", async function () {
      await bountyBoard.connect(researcher1).submitSolution(1, "Attempt 1");
      await bountyBoard.connect(researcher1).submitSolution(1, "Attempt 2");

      const userSubs = await bountyBoard.getUserSubmissions(researcher1.address);
      expect(userSubs.length).to.equal(2);
    });
  });

  // ============================================
  // Submission Review
  // ============================================

  describe("Submission Review", function () {
    beforeEach(async function () {
      const deadline = (await time.latest()) + oneWeek;
      await bountyBoard.connect(creator).createBounty(
        "Test Bounty", "Description", "category", 3, deadline,
        { value: ethers.parseEther("1.0") }
      );
      await bountyBoard.connect(researcher1).submitSolution(1, "Solution");
    });

    it("Should allow creator to approve submission and pay reward", async function () {
      const balanceBefore = await ethers.provider.getBalance(researcher1.address);

      const tx = await bountyBoard.connect(creator).approveSubmission(1, "Great work!");
      await expect(tx).to.emit(bountyBoard, "SubmissionReviewed");
      await expect(tx).to.emit(bountyBoard, "RewardPaid");
      await expect(tx).to.emit(bountyBoard, "BountyUpdated");

      const balanceAfter = await ethers.provider.getBalance(researcher1.address);
      const expectedPayout = ethers.parseEther("0.95"); // 1.0 - 5% fee
      expect(balanceAfter - balanceBefore).to.equal(expectedPayout);

      const submission = await bountyBoard.getSubmission(1);
      expect(submission.status).to.equal(2); // Approved
      expect(submission.reviewComment).to.equal("Great work!");

      const bounty = await bountyBoard.getBounty(1);
      expect(bounty.status).to.equal(3); // Completed
    });

    it("Should accumulate platform fees correctly", async function () {
      await bountyBoard.connect(creator).approveSubmission(1, "Good");

      const accFees = await bountyBoard.accumulatedFees();
      expect(accFees).to.equal(ethers.parseEther("0.05")); // 5% of 1.0
    });

    it("Should update reputation on approval", async function () {
      await bountyBoard.connect(creator).approveSubmission(1, "Good");

      const profile = await reputationSystem.getProfile(researcher1.address);
      expect(profile.approvedSubmissions).to.equal(1);
      expect(profile.reputationPoints).to.equal(4); // Advanced difficulty = 4 points
    });

    it("Should allow creator to reject submission", async function () {
      const tx = await bountyBoard.connect(creator).rejectSubmission(1, "Does not meet requirements");
      await expect(tx).to.emit(bountyBoard, "SubmissionReviewed");

      const submission = await bountyBoard.getSubmission(1);
      expect(submission.status).to.equal(3); // Rejected
      expect(submission.reviewComment).to.equal("Does not meet requirements");
    });

    it("Should update reputation on rejection", async function () {
      await bountyBoard.connect(creator).rejectSubmission(1, "Bad");

      const profile = await reputationSystem.getProfile(researcher1.address);
      expect(profile.rejectedSubmissions).to.equal(1);
      expect(profile.reputationPoints).to.equal(0);
    });

    it("Should reject review by non-creator and non-admin", async function () {
      await expect(
        bountyBoard.connect(researcher2).approveSubmission(1, "Approved")
      ).to.be.revertedWithCustomError(bountyBoard, "NotReviewer");
    });

    it("Should reject reviewing already approved submission", async function () {
      await bountyBoard.connect(creator).approveSubmission(1, "Approved");

      await expect(
        bountyBoard.connect(creator).approveSubmission(1, "Again")
      ).to.be.revertedWithCustomError(bountyBoard, "AlreadyReviewed");
    });

    it("Should reject reviewing already rejected submission", async function () {
      await bountyBoard.connect(creator).rejectSubmission(1, "Rejected");

      await expect(
        bountyBoard.connect(creator).rejectSubmission(1, "Again")
      ).to.be.revertedWithCustomError(bountyBoard, "AlreadyReviewed");
    });

    it("Should reject approval after bounty completed by another submission", async function () {
      await bountyBoard.connect(researcher2).submitSolution(1, "Solution 2");
      await bountyBoard.connect(creator).approveSubmission(1, "Winner");

      await expect(
        bountyBoard.connect(creator).approveSubmission(2, "Also good")
      ).to.be.revertedWithCustomError(bountyBoard, "BountyAlreadyCompleted");
    });

    it("Should reject reviewing non-existent submission", async function () {
      await expect(
        bountyBoard.connect(creator).approveSubmission(999, "Good")
      ).to.be.revertedWithCustomError(bountyBoard, "SubmissionDoesNotExist");
    });
  });

  // ============================================
  // Admin (Owner) Review
  // ============================================

  describe("Admin (Owner) Review", function () {
    beforeEach(async function () {
      const deadline = (await time.latest()) + oneWeek;
      await bountyBoard.connect(creator).createBounty(
        "Test Bounty", "Description", "category", 3, deadline,
        { value: ethers.parseEther("1.0") }
      );
      await bountyBoard.connect(researcher1).submitSolution(1, "Solution");
    });

    it("Should allow admin (owner) to approve submission and pay reward", async function () {
      const balanceBefore = await ethers.provider.getBalance(researcher1.address);

      const tx = await bountyBoard.connect(owner).approveSubmission(1, "Admin approved");
      await expect(tx).to.emit(bountyBoard, "SubmissionReviewed");
      await expect(tx).to.emit(bountyBoard, "RewardPaid");

      const balanceAfter = await ethers.provider.getBalance(researcher1.address);
      const expectedPayout = ethers.parseEther("0.95");
      expect(balanceAfter - balanceBefore).to.equal(expectedPayout);

      const submission = await bountyBoard.getSubmission(1);
      expect(submission.status).to.equal(2); // Approved
      expect(submission.reviewComment).to.equal("Admin approved");

      const bounty = await bountyBoard.getBounty(1);
      expect(bounty.status).to.equal(3); // Completed
    });

    it("Should allow admin (owner) to reject submission", async function () {
      const tx = await bountyBoard.connect(owner).rejectSubmission(1, "Admin rejected - insufficient quality");
      await expect(tx).to.emit(bountyBoard, "SubmissionReviewed");

      const submission = await bountyBoard.getSubmission(1);
      expect(submission.status).to.equal(3); // Rejected
      expect(submission.reviewComment).to.equal("Admin rejected - insufficient quality");
    });

    it("Should update reputation when admin approves", async function () {
      await bountyBoard.connect(owner).approveSubmission(1, "Admin approved");

      const profile = await reputationSystem.getProfile(researcher1.address);
      expect(profile.approvedSubmissions).to.equal(1);
      expect(profile.reputationPoints).to.equal(4); // Advanced = 4 points
    });

    it("Should update reputation when admin rejects", async function () {
      await bountyBoard.connect(owner).rejectSubmission(1, "Rejected");

      const profile = await reputationSystem.getProfile(researcher1.address);
      expect(profile.rejectedSubmissions).to.equal(1);
      expect(profile.reputationPoints).to.equal(0);
    });

    it("Should emit reviewer as admin address in event", async function () {
      await expect(
        bountyBoard.connect(owner).approveSubmission(1, "Good")
      ).to.emit(bountyBoard, "SubmissionReviewed")
        .withArgs(1, 1, 2, owner.address); // SubmissionStatus.Approved = 2
    });

    it("Admin can approve even when they are not the bounty creator", async function () {
      // owner != creator, this must still work
      expect(owner.address).to.not.equal(creator.address);

      await bountyBoard.connect(owner).approveSubmission(1, "Admin override");
      const bounty = await bountyBoard.getBounty(1);
      expect(bounty.status).to.equal(3); // Completed
    });

    it("Random user (not creator, not admin) cannot review", async function () {
      await expect(
        bountyBoard.connect(researcher2).approveSubmission(1, "Trying")
      ).to.be.revertedWithCustomError(bountyBoard, "NotReviewer");

      await expect(
        bountyBoard.connect(researcher2).rejectSubmission(1, "Trying")
      ).to.be.revertedWithCustomError(bountyBoard, "NotReviewer");
    });

    it("Admin cannot approve already reviewed submission", async function () {
      await bountyBoard.connect(creator).approveSubmission(1, "Creator approved");

      await expect(
        bountyBoard.connect(owner).approveSubmission(1, "Admin also approves")
      ).to.be.revertedWithCustomError(bountyBoard, "AlreadyReviewed");
    });
  });

  // ============================================
  // Fee Accounting & Withdrawal
  // ============================================

  describe("Fee Accounting & Withdrawal", function () {
    it("Should only withdraw accumulated fees, not locked rewards", async function () {
      const deadline = (await time.latest()) + oneWeek;
      const reward = ethers.parseEther("1.0");

      // Create 2 bounties, approve only 1
      await bountyBoard.connect(creator).createBounty("B1", "D", "c", 1, deadline, { value: reward });
      await bountyBoard.connect(creator).createBounty("B2", "D", "c", 1, deadline, { value: reward });

      await bountyBoard.connect(researcher1).submitSolution(1, "Sol");
      await bountyBoard.connect(creator).approveSubmission(1, "Good");

      // Contract balance = 1.0 (bounty 2 locked) + 0.05 (fee from bounty 1)
      const contractBalance = await ethers.provider.getBalance(await bountyBoard.getAddress());
      expect(contractBalance).to.equal(ethers.parseEther("1.05"));

      // Accumulated fees should be only 0.05
      expect(await bountyBoard.accumulatedFees()).to.equal(ethers.parseEther("0.05"));

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      await bountyBoard.connect(owner).withdrawFees();
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      // Owner received ~0.05 (minus gas)
      const received = ownerBalanceAfter - ownerBalanceBefore;
      expect(received).to.be.greaterThan(ethers.parseEther("0.04"));
      expect(received).to.be.lessThan(ethers.parseEther("0.06"));

      // Contract still holds bounty 2 reward
      const remainingBalance = await ethers.provider.getBalance(await bountyBoard.getAddress());
      expect(remainingBalance).to.equal(ethers.parseEther("1.0"));
      expect(await bountyBoard.accumulatedFees()).to.equal(0);
    });

    it("Should reject withdrawal when no fees accumulated", async function () {
      await expect(
        bountyBoard.connect(owner).withdrawFees()
      ).to.be.revertedWithCustomError(bountyBoard, "NoFeesToWithdraw");
    });

    it("Should emit FeesWithdrawn event", async function () {
      const deadline = (await time.latest()) + oneWeek;
      await bountyBoard.connect(creator).createBounty("B1", "D", "c", 1, deadline, { value: ethers.parseEther("1.0") });
      await bountyBoard.connect(researcher1).submitSolution(1, "Sol");
      await bountyBoard.connect(creator).approveSubmission(1, "Good");

      await expect(bountyBoard.connect(owner).withdrawFees())
        .to.emit(bountyBoard, "FeesWithdrawn")
        .withArgs(owner.address, ethers.parseEther("0.05"));
    });
  });

  // ============================================
  // Admin Functions
  // ============================================

  describe("Admin Functions", function () {
    it("Should allow owner to set platform fee", async function () {
      await expect(bountyBoard.connect(owner).setPlatformFee(10))
        .to.emit(bountyBoard, "PlatformFeeUpdated")
        .withArgs(5, 10);
      expect(await bountyBoard.platformFeePercent()).to.equal(10);
    });

    it("Should reject fee above 20%", async function () {
      await expect(
        bountyBoard.connect(owner).setPlatformFee(25)
      ).to.be.revertedWithCustomError(bountyBoard, "FeeTooHigh");
    });

    it("Should allow owner to set minimum reward", async function () {
      await expect(bountyBoard.connect(owner).setMinBountyReward(ethers.parseEther("0.1")))
        .to.emit(bountyBoard, "MinBountyRewardUpdated")
        .withArgs(ethers.parseEther("0.01"), ethers.parseEther("0.1"));
      expect(await bountyBoard.minBountyReward()).to.equal(ethers.parseEther("0.1"));
    });

    it("Should allow owner to set reputation system", async function () {
      const newAddr = researcher1.address;
      await expect(bountyBoard.connect(owner).setReputationSystem(newAddr))
        .to.emit(bountyBoard, "ReputationSystemUpdated");
      expect(await bountyBoard.reputationSystem()).to.equal(newAddr);
    });

    it("Should reject admin calls from non-owner", async function () {
      await expect(
        bountyBoard.connect(creator).setPlatformFee(10)
      ).to.be.revertedWithCustomError(bountyBoard, "OwnableUnauthorizedAccount");

      await expect(
        bountyBoard.connect(creator).setMinBountyReward(0)
      ).to.be.revertedWithCustomError(bountyBoard, "OwnableUnauthorizedAccount");

      await expect(
        bountyBoard.connect(creator).setReputationSystem(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(bountyBoard, "OwnableUnauthorizedAccount");

      await expect(
        bountyBoard.connect(creator).withdrawFees()
      ).to.be.revertedWithCustomError(bountyBoard, "OwnableUnauthorizedAccount");
    });
  });

  // ============================================
  // View Functions
  // ============================================

  describe("View Functions", function () {
    beforeEach(async function () {
      const deadline = (await time.latest()) + oneWeek;
      await bountyBoard.connect(creator).createBounty("Bounty 1", "Description", "category", 1, deadline, { value: ethers.parseEther("0.5") });
      await bountyBoard.connect(creator).createBounty("Bounty 2", "Description", "analysis", 2, deadline, { value: ethers.parseEther("1.0") });
    });

    it("Should return user bounties", async function () {
      const ids = await bountyBoard.getUserBounties(creator.address);
      expect(ids.length).to.equal(2);
      expect(ids[0]).to.equal(1);
      expect(ids[1]).to.equal(2);
    });

    it("Should return user submissions", async function () {
      await bountyBoard.connect(researcher1).submitSolution(1, "Sol 1");
      await bountyBoard.connect(researcher1).submitSolution(2, "Sol 2");

      const ids = await bountyBoard.getUserSubmissions(researcher1.address);
      expect(ids.length).to.equal(2);
    });

    it("Should return correct bounty and submission counts", async function () {
      expect(await bountyBoard.getBountyCount()).to.equal(2);

      await bountyBoard.connect(researcher1).submitSolution(1, "Solution");
      expect(await bountyBoard.getSubmissionCount()).to.equal(1);
    });

    it("Should return empty arrays for users with no activity", async function () {
      const bountyIds = await bountyBoard.getUserBounties(researcher1.address);
      expect(bountyIds.length).to.equal(0);

      const subIds = await bountyBoard.getUserSubmissions(researcher1.address);
      expect(subIds.length).to.equal(0);
    });

    it("Should return zero struct for non-existent bounty", async function () {
      const bounty = await bountyBoard.getBounty(999);
      expect(bounty.id).to.equal(0);
    });
  });

  // ============================================
  // Graceful Reputation Failure
  // ============================================

  describe("Graceful Reputation Handling", function () {
    it("Should still approve submission if reputation system is not set", async function () {
      // Deploy a new BountyBoard without setting reputation system
      const BountyBoard = await ethers.getContractFactory("BountyBoard");
      const bb = await BountyBoard.deploy();
      await bb.waitForDeployment();

      const deadline = (await time.latest()) + oneWeek;
      await bb.connect(creator).createBounty("Test", "D", "c", 1, deadline, { value: ethers.parseEther("1.0") });
      await bb.connect(researcher1).submitSolution(1, "Sol");

      await expect(
        bb.connect(creator).approveSubmission(1, "Good")
      ).to.emit(bb, "RewardPaid");
    });

    it("Should still reject submission if reputation system is not set", async function () {
      const BountyBoard = await ethers.getContractFactory("BountyBoard");
      const bb = await BountyBoard.deploy();
      await bb.waitForDeployment();

      const deadline = (await time.latest()) + oneWeek;
      await bb.connect(creator).createBounty("Test", "D", "c", 1, deadline, { value: ethers.parseEther("1.0") });
      await bb.connect(researcher1).submitSolution(1, "Sol");

      await expect(
        bb.connect(creator).rejectSubmission(1, "Bad")
      ).to.emit(bb, "SubmissionReviewed");
    });
  });
});
