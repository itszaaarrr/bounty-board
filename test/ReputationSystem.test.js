const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReputationSystem", function () {
  let bountyBoard, reputationSystem;
  let owner, researcher1, researcher2, researcher3;

  beforeEach(async function () {
    [owner, researcher1, researcher2, researcher3] = await ethers.getSigners();

    const BountyBoard = await ethers.getContractFactory("BountyBoard");
    bountyBoard = await BountyBoard.deploy();
    await bountyBoard.waitForDeployment();

    const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
    reputationSystem = await ReputationSystem.deploy(await bountyBoard.getAddress());
    await reputationSystem.waitForDeployment();
  });

  // ============================================
  // Deployment
  // ============================================

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await reputationSystem.owner()).to.equal(owner.address);
    });

    it("Should set the correct bountyBoard address", async function () {
      expect(await reputationSystem.bountyBoard()).to.equal(await bountyBoard.getAddress());
    });

    it("Should have zero researchers initially", async function () {
      expect(await reputationSystem.getResearcherCount()).to.equal(0);
    });

    it("Should reject deployment with zero address", async function () {
      const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
      await expect(
        ReputationSystem.deploy(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(reputationSystem, "ZeroAddress");
    });
  });

  // ============================================
  // Recording Submissions
  // ============================================

  describe("Recording Submissions", function () {
    beforeEach(async function () {
      await reputationSystem.connect(owner).setBountyBoard(owner.address);
    });

    it("Should record approved submission and update profile", async function () {
      const tx = await reputationSystem.recordApprovedSubmission(
        researcher1.address, 3, ethers.parseEther("1.0")
      );

      await expect(tx).to.emit(reputationSystem, "ResearcherRegistered").withArgs(researcher1.address);
      await expect(tx).to.emit(reputationSystem, "SubmissionRecorded").withArgs(researcher1.address, true, ethers.parseEther("1.0"));
      await expect(tx).to.emit(reputationSystem, "ReputationUpdated");

      const profile = await reputationSystem.getProfile(researcher1.address);
      expect(profile.totalSubmissions).to.equal(1);
      expect(profile.approvedSubmissions).to.equal(1);
      expect(profile.rejectedSubmissions).to.equal(0);
      expect(profile.totalEarnings).to.equal(ethers.parseEther("1.0"));
      expect(profile.reputationPoints).to.equal(4); // Advanced = 4 points
    });

    it("Should record rejected submission", async function () {
      await reputationSystem.recordRejectedSubmission(researcher1.address);

      const profile = await reputationSystem.getProfile(researcher1.address);
      expect(profile.totalSubmissions).to.equal(1);
      expect(profile.approvedSubmissions).to.equal(0);
      expect(profile.rejectedSubmissions).to.equal(1);
      expect(profile.reputationPoints).to.equal(0);
    });

    it("Should reject calls from non-BountyBoard", async function () {
      await expect(
        reputationSystem.connect(researcher1).recordApprovedSubmission(
          researcher1.address, 1, ethers.parseEther("0.5")
        )
      ).to.be.revertedWithCustomError(reputationSystem, "OnlyBountyBoard");

      await expect(
        reputationSystem.connect(researcher1).recordRejectedSubmission(researcher1.address)
      ).to.be.revertedWithCustomError(reputationSystem, "OnlyBountyBoard");
    });

    it("Should not re-register an already registered researcher", async function () {
      const tx1 = await reputationSystem.recordApprovedSubmission(researcher1.address, 1, 0);
      await expect(tx1).to.emit(reputationSystem, "ResearcherRegistered");

      const tx2 = await reputationSystem.recordApprovedSubmission(researcher1.address, 2, 0);
      await expect(tx2).to.not.emit(reputationSystem, "ResearcherRegistered");

      expect(await reputationSystem.getResearcherCount()).to.equal(1);
    });

    it("Should track firstActivityAt and lastActivityAt", async function () {
      await reputationSystem.recordApprovedSubmission(researcher1.address, 1, 0);

      const profile1 = await reputationSystem.getProfile(researcher1.address);
      expect(profile1.firstActivityAt).to.be.greaterThan(0);
      expect(profile1.lastActivityAt).to.be.greaterThan(0);
      expect(profile1.firstActivityAt).to.equal(profile1.lastActivityAt);
    });
  });

  // ============================================
  // Reputation Points
  // ============================================

  describe("Reputation Points", function () {
    beforeEach(async function () {
      await reputationSystem.connect(owner).setBountyBoard(owner.address);
    });

    it("Should award correct points for each difficulty", async function () {
      // Beginner = 1 point
      await reputationSystem.recordApprovedSubmission(researcher1.address, 1, 0);
      let profile = await reputationSystem.getProfile(researcher1.address);
      expect(profile.reputationPoints).to.equal(1);

      // Intermediate = 2 points (total: 3)
      await reputationSystem.recordApprovedSubmission(researcher1.address, 2, 0);
      profile = await reputationSystem.getProfile(researcher1.address);
      expect(profile.reputationPoints).to.equal(3);

      // Advanced = 4 points (total: 7)
      await reputationSystem.recordApprovedSubmission(researcher1.address, 3, 0);
      profile = await reputationSystem.getProfile(researcher1.address);
      expect(profile.reputationPoints).to.equal(7);

      // Expert = 8 points (total: 15)
      await reputationSystem.recordApprovedSubmission(researcher1.address, 4, 0);
      profile = await reputationSystem.getProfile(researcher1.address);
      expect(profile.reputationPoints).to.equal(15);
    });

    it("Should accumulate earnings correctly", async function () {
      await reputationSystem.recordApprovedSubmission(researcher1.address, 1, ethers.parseEther("0.5"));
      await reputationSystem.recordApprovedSubmission(researcher1.address, 2, ethers.parseEther("1.0"));

      const profile = await reputationSystem.getProfile(researcher1.address);
      expect(profile.totalEarnings).to.equal(ethers.parseEther("1.5"));
    });

    it("Should not award points for rejected submissions", async function () {
      await reputationSystem.recordRejectedSubmission(researcher1.address);
      await reputationSystem.recordRejectedSubmission(researcher1.address);

      const profile = await reputationSystem.getProfile(researcher1.address);
      expect(profile.reputationPoints).to.equal(0);
      expect(profile.rejectedSubmissions).to.equal(2);
    });

    it("Should default to POINTS_BEGINNER for unknown difficulty", async function () {
      await reputationSystem.recordApprovedSubmission(researcher1.address, 0, 0);
      const profile = await reputationSystem.getProfile(researcher1.address);
      expect(profile.reputationPoints).to.equal(1); // Defaults to POINTS_BEGINNER
    });
  });

  // ============================================
  // Levels
  // ============================================

  describe("Levels", function () {
    beforeEach(async function () {
      await reputationSystem.connect(owner).setBountyBoard(owner.address);
    });

    it("Should return Novice for 0 points", async function () {
      const [level, name] = await reputationSystem.getLevel(researcher1.address);
      expect(level).to.equal(0);
      expect(name).to.equal("Novice");
    });

    it("Should return Researcher for 10+ points", async function () {
      for (let i = 0; i < 10; i++) {
        await reputationSystem.recordApprovedSubmission(researcher1.address, 1, 0);
      }

      const [level, name] = await reputationSystem.getLevel(researcher1.address);
      expect(level).to.equal(1);
      expect(name).to.equal("Researcher");
    });

    it("Should return Cryptographer for 50+ points", async function () {
      for (let i = 0; i < 7; i++) {
        await reputationSystem.recordApprovedSubmission(researcher1.address, 4, 0);
      }

      const [level, name] = await reputationSystem.getLevel(researcher1.address);
      expect(level).to.equal(2);
      expect(name).to.equal("Cryptographer");
    });

    it("Should return Expert for 150+ points", async function () {
      for (let i = 0; i < 19; i++) {
        await reputationSystem.recordApprovedSubmission(researcher1.address, 4, 0);
      }

      const [level, name] = await reputationSystem.getLevel(researcher1.address);
      expect(level).to.equal(3);
      expect(name).to.equal("Expert");
    });

    it("Should return Master for 500+ points", async function () {
      for (let i = 0; i < 63; i++) {
        await reputationSystem.recordApprovedSubmission(researcher1.address, 4, 0);
      }

      const [level, name] = await reputationSystem.getLevel(researcher1.address);
      expect(level).to.equal(4);
      expect(name).to.equal("Master");
    });

    it("Should return Legend for 1000+ points", async function () {
      for (let i = 0; i < 125; i++) {
        await reputationSystem.recordApprovedSubmission(researcher1.address, 4, 0);
      }

      const [level, name] = await reputationSystem.getLevel(researcher1.address);
      expect(level).to.equal(5);
      expect(name).to.equal("Legend");
    });
  });

  // ============================================
  // Leaderboard
  // ============================================

  describe("Leaderboard", function () {
    beforeEach(async function () {
      await reputationSystem.connect(owner).setBountyBoard(owner.address);
    });

    it("Should return top researchers in correct order", async function () {
      await reputationSystem.recordApprovedSubmission(researcher1.address, 1, 0); // 1 point
      await reputationSystem.recordApprovedSubmission(researcher2.address, 4, 0); // 8 points
      await reputationSystem.recordApprovedSubmission(researcher2.address, 4, 0); // 16 points total

      const [addresses, points] = await reputationSystem.getTopResearchers(10);

      expect(addresses[0]).to.equal(researcher2.address);
      expect(addresses[1]).to.equal(researcher1.address);
      expect(points[0]).to.equal(16);
      expect(points[1]).to.equal(1);
    });

    it("Should return researcher count", async function () {
      await reputationSystem.recordApprovedSubmission(researcher1.address, 1, 0);
      await reputationSystem.recordApprovedSubmission(researcher2.address, 1, 0);

      expect(await reputationSystem.getResearcherCount()).to.equal(2);
    });

    it("Should limit results to requested amount", async function () {
      await reputationSystem.recordApprovedSubmission(researcher1.address, 1, 0);
      await reputationSystem.recordApprovedSubmission(researcher2.address, 1, 0);

      const [addresses] = await reputationSystem.getTopResearchers(1);
      expect(addresses.length).to.equal(1);
    });

    it("Should return empty arrays when no researchers", async function () {
      const [addresses, points] = await reputationSystem.getTopResearchers(10);
      expect(addresses.length).to.equal(0);
      expect(points.length).to.equal(0);
    });

    it("Should reject limit above MAX_LEADERBOARD_LIMIT", async function () {
      await expect(
        reputationSystem.getTopResearchers(101)
      ).to.be.revertedWithCustomError(reputationSystem, "LimitTooHigh");
    });

    it("Should handle three researchers correctly", async function () {
      await reputationSystem.recordApprovedSubmission(researcher1.address, 1, 0); // 1pt
      await reputationSystem.recordApprovedSubmission(researcher2.address, 3, 0); // 4pt
      await reputationSystem.recordApprovedSubmission(researcher3.address, 2, 0); // 2pt

      const [addresses, points] = await reputationSystem.getTopResearchers(3);
      expect(addresses[0]).to.equal(researcher2.address);
      expect(addresses[1]).to.equal(researcher3.address);
      expect(addresses[2]).to.equal(researcher1.address);
      expect(points[0]).to.equal(4);
      expect(points[1]).to.equal(2);
      expect(points[2]).to.equal(1);
    });
  });

  // ============================================
  // Admin Functions
  // ============================================

  describe("Admin Functions", function () {
    it("Should allow owner to change bountyBoard address", async function () {
      const newAddress = researcher1.address;
      await expect(reputationSystem.connect(owner).setBountyBoard(newAddress))
        .to.emit(reputationSystem, "BountyBoardUpdated")
        .withArgs(await bountyBoard.getAddress(), newAddress);
      expect(await reputationSystem.bountyBoard()).to.equal(newAddress);
    });

    it("Should reject setBountyBoard with zero address", async function () {
      await expect(
        reputationSystem.connect(owner).setBountyBoard(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(reputationSystem, "ZeroAddress");
    });

    it("Should reject setBountyBoard from non-owner", async function () {
      await expect(
        reputationSystem.connect(researcher1).setBountyBoard(researcher1.address)
      ).to.be.revertedWithCustomError(reputationSystem, "OwnableUnauthorizedAccount");
    });
  });
});
