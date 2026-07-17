const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("End-to-End Integration", function () {
  let bountyBoard, reputationSystem;
  let owner, alice, bob, charlie;
  let oneWeek;

  beforeEach(async function () {
    [owner, alice, bob, charlie] = await ethers.getSigners();

    const BountyBoard = await ethers.getContractFactory("BountyBoard");
    bountyBoard = await BountyBoard.deploy();
    await bountyBoard.waitForDeployment();

    const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
    reputationSystem = await ReputationSystem.deploy(await bountyBoard.getAddress());
    await reputationSystem.waitForDeployment();

    await bountyBoard.connect(owner).setReputationSystem(await reputationSystem.getAddress());

    oneWeek = 7 * 24 * 60 * 60;
  });

  it("Full lifecycle: create -> submit -> approve -> reputation + fees", async function () {
    const deadline = (await time.latest()) + oneWeek;
    const reward = ethers.parseEther("2.0");

    // Alice creates a bounty
    await bountyBoard.connect(alice).createBounty(
      "Implement Dilithium Verification",
      "Reference implementation of CRYSTALS-Dilithium",
      "implementation",
      4, // Expert
      deadline,
      { value: reward }
    );

    expect(await bountyBoard.getBountyCount()).to.equal(1);

    // Bob submits a solution
    await bountyBoard.connect(bob).submitSolution(1, "ipfs://QmSolution123");

    const bountyAfterSub = await bountyBoard.getBounty(1);
    expect(bountyAfterSub.status).to.equal(1); // InProgress
    expect(bountyAfterSub.submissionCount).to.equal(1);

    // Alice approves Bob's submission
    const bobBalanceBefore = await ethers.provider.getBalance(bob.address);
    await bountyBoard.connect(alice).approveSubmission(1, "Excellent implementation!");
    const bobBalanceAfter = await ethers.provider.getBalance(bob.address);

    // Bob receives 95% of 2.0 = 1.9 ETH
    expect(bobBalanceAfter - bobBalanceBefore).to.equal(ethers.parseEther("1.9"));

    // Bounty is completed
    const bountyFinal = await bountyBoard.getBounty(1);
    expect(bountyFinal.status).to.equal(3); // Completed

    // Submission is approved
    const submission = await bountyBoard.getSubmission(1);
    expect(submission.status).to.equal(2); // Approved
    expect(submission.reviewComment).to.equal("Excellent implementation!");

    // Fees accumulated correctly
    expect(await bountyBoard.accumulatedFees()).to.equal(ethers.parseEther("0.1"));

    // Bob's reputation updated
    const profile = await reputationSystem.getProfile(bob.address);
    expect(profile.approvedSubmissions).to.equal(1);
    expect(profile.reputationPoints).to.equal(8); // Expert = 8 points
    expect(profile.totalEarnings).to.equal(ethers.parseEther("1.9"));

    const [level, name] = await reputationSystem.getLevel(bob.address);
    expect(name).to.equal("Novice"); // 8 pts < 10 for Researcher

    // Owner withdraws fees
    const ownerBefore = await ethers.provider.getBalance(owner.address);
    await bountyBoard.connect(owner).withdrawFees();
    const ownerAfter = await ethers.provider.getBalance(owner.address);
    expect(ownerAfter).to.be.greaterThan(ownerBefore);
    expect(await bountyBoard.accumulatedFees()).to.equal(0);
  });

  it("Full lifecycle: create -> submit -> reject -> reputation", async function () {
    const deadline = (await time.latest()) + oneWeek;

    await bountyBoard.connect(alice).createBounty(
      "Analyze KYBER Security", "Security analysis", "analysis", 2, deadline,
      { value: ethers.parseEther("0.5") }
    );

    await bountyBoard.connect(bob).submitSolution(1, "Poor analysis");
    await bountyBoard.connect(alice).rejectSubmission(1, "Insufficient depth");

    // Submission rejected but bounty still open for others
    const bounty = await bountyBoard.getBounty(1);
    expect(bounty.status).to.equal(1); // Still InProgress

    // Bob's reputation reflects the rejection
    const profile = await reputationSystem.getProfile(bob.address);
    expect(profile.rejectedSubmissions).to.equal(1);
    expect(profile.reputationPoints).to.equal(0);

    // Charlie can still submit
    await bountyBoard.connect(charlie).submitSolution(1, "Thorough analysis");
    await bountyBoard.connect(alice).approveSubmission(2, "Great work");

    const bountyFinal = await bountyBoard.getBounty(1);
    expect(bountyFinal.status).to.equal(3); // Completed

    const charlieProfile = await reputationSystem.getProfile(charlie.address);
    expect(charlieProfile.approvedSubmissions).to.equal(1);
    expect(charlieProfile.reputationPoints).to.equal(2); // Intermediate = 2
  });

  it("Multiple bounties, multiple researchers, leaderboard ranking", async function () {
    const deadline = (await time.latest()) + oneWeek;

    // Create 3 bounties
    await bountyBoard.connect(alice).createBounty("B1", "D", "c", 1, deadline, { value: ethers.parseEther("0.1") });
    await bountyBoard.connect(alice).createBounty("B2", "D", "c", 3, deadline, { value: ethers.parseEther("0.5") });
    await bountyBoard.connect(alice).createBounty("B3", "D", "c", 4, deadline, { value: ethers.parseEther("1.0") });

    // Bob completes bounty 1 (Beginner, 1pt) and bounty 3 (Expert, 8pt)
    await bountyBoard.connect(bob).submitSolution(1, "Sol");
    await bountyBoard.connect(alice).approveSubmission(1, "OK");
    await bountyBoard.connect(bob).submitSolution(3, "Sol");
    await bountyBoard.connect(alice).approveSubmission(2, "Great");

    // Charlie completes bounty 2 (Advanced, 4pt)
    await bountyBoard.connect(charlie).submitSolution(2, "Sol");
    await bountyBoard.connect(alice).approveSubmission(3, "Good");

    // Check profiles
    const bobProfile = await reputationSystem.getProfile(bob.address);
    expect(bobProfile.reputationPoints).to.equal(9); // 1 + 8

    const charlieProfile = await reputationSystem.getProfile(charlie.address);
    expect(charlieProfile.reputationPoints).to.equal(4);

    // Leaderboard: Bob (9) > Charlie (4)
    const [addresses, points] = await reputationSystem.getTopResearchers(10);
    expect(addresses[0]).to.equal(bob.address);
    expect(addresses[1]).to.equal(charlie.address);
    expect(points[0]).to.equal(9);
    expect(points[1]).to.equal(4);
  });

  it("Expired bounty reclaim preserves fee accounting", async function () {
    const deadline = (await time.latest()) + oneWeek;

    // Create 2 bounties, complete 1, let 1 expire
    await bountyBoard.connect(alice).createBounty("B1", "D", "c", 1, deadline, { value: ethers.parseEther("1.0") });
    await bountyBoard.connect(alice).createBounty("B2", "D", "c", 1, deadline, { value: ethers.parseEther("1.0") });

    // Complete bounty 1
    await bountyBoard.connect(bob).submitSolution(1, "Sol");
    await bountyBoard.connect(alice).approveSubmission(1, "Good");

    // Contract holds: 1.0 (B2 reward) + 0.05 (fee from B1)
    const contractBal1 = await ethers.provider.getBalance(await bountyBoard.getAddress());
    expect(contractBal1).to.equal(ethers.parseEther("1.05"));

    // Time passes, bounty 2 expires
    await time.increase(oneWeek + 1);

    // Alice reclaims bounty 2
    await bountyBoard.connect(alice).reclaimExpiredBounty(2);

    // Contract should still hold the 0.05 fee
    const contractBal2 = await ethers.provider.getBalance(await bountyBoard.getAddress());
    expect(contractBal2).to.equal(ethers.parseEther("0.05"));
    expect(await bountyBoard.accumulatedFees()).to.equal(ethers.parseEther("0.05"));

    // Owner can still withdraw fees
    await bountyBoard.connect(owner).withdrawFees();
    const contractBal3 = await ethers.provider.getBalance(await bountyBoard.getAddress());
    expect(contractBal3).to.equal(0);
  });

  it("Cancellation refunds exact reward amount", async function () {
    const deadline = (await time.latest()) + oneWeek;
    const reward = ethers.parseEther("3.0");

    await bountyBoard.connect(alice).createBounty("Test", "D", "c", 1, deadline, { value: reward });

    const balBefore = await ethers.provider.getBalance(alice.address);
    const tx = await bountyBoard.connect(alice).cancelBounty(1);
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed * receipt.gasPrice;
    const balAfter = await ethers.provider.getBalance(alice.address);

    expect(balAfter + gasCost - balBefore).to.equal(reward);
  });

  it("Platform fee percentage applies correctly to different rewards", async function () {
    const deadline = (await time.latest()) + oneWeek;

    // Set fee to 10%
    await bountyBoard.connect(owner).setPlatformFee(10);

    await bountyBoard.connect(alice).createBounty("B1", "D", "c", 1, deadline, { value: ethers.parseEther("10.0") });
    await bountyBoard.connect(bob).submitSolution(1, "Sol");

    const bobBefore = await ethers.provider.getBalance(bob.address);
    await bountyBoard.connect(alice).approveSubmission(1, "Good");
    const bobAfter = await ethers.provider.getBalance(bob.address);

    // Bob receives 90% of 10.0 = 9.0
    expect(bobAfter - bobBefore).to.equal(ethers.parseEther("9.0"));
    expect(await bountyBoard.accumulatedFees()).to.equal(ethers.parseEther("1.0"));
  });

  it("Zero fee works correctly", async function () {
    const deadline = (await time.latest()) + oneWeek;

    await bountyBoard.connect(owner).setPlatformFee(0);

    await bountyBoard.connect(alice).createBounty("B1", "D", "c", 1, deadline, { value: ethers.parseEther("1.0") });
    await bountyBoard.connect(bob).submitSolution(1, "Sol");

    const bobBefore = await ethers.provider.getBalance(bob.address);
    await bountyBoard.connect(alice).approveSubmission(1, "Good");
    const bobAfter = await ethers.provider.getBalance(bob.address);

    expect(bobAfter - bobBefore).to.equal(ethers.parseEther("1.0"));
    expect(await bountyBoard.accumulatedFees()).to.equal(0);
  });

  it("Admin (owner) can approve submission on behalf of creator", async function () {
    const deadline = (await time.latest()) + oneWeek;

    // Alice creates bounty, Bob submits, OWNER (admin) approves
    await bountyBoard.connect(alice).createBounty(
      "Admin Review Test", "Description", "audit", 2, deadline,
      { value: ethers.parseEther("2.0") }
    );
    await bountyBoard.connect(bob).submitSolution(1, "ipfs://QmAdminReview");

    const bobBefore = await ethers.provider.getBalance(bob.address);
    await bountyBoard.connect(owner).approveSubmission(1, "Armchain team approved");
    const bobAfter = await ethers.provider.getBalance(bob.address);

    // Bob receives 95% of 2.0 = 1.9
    expect(bobAfter - bobBefore).to.equal(ethers.parseEther("1.9"));

    const bounty = await bountyBoard.getBounty(1);
    expect(bounty.status).to.equal(3); // Completed

    const submission = await bountyBoard.getSubmission(1);
    expect(submission.status).to.equal(2); // Approved
    expect(submission.reviewComment).to.equal("Armchain team approved");

    // Reputation was updated
    const profile = await reputationSystem.getProfile(bob.address);
    expect(profile.approvedSubmissions).to.equal(1);
    expect(profile.reputationPoints).to.equal(2); // Intermediate = 2

    // Fees accumulated
    expect(await bountyBoard.accumulatedFees()).to.equal(ethers.parseEther("0.1"));
  });

  it("Admin can reject and creator can later approve another submission", async function () {
    const deadline = (await time.latest()) + oneWeek;

    await bountyBoard.connect(alice).createBounty(
      "Multi-review", "Description", "research", 3, deadline,
      { value: ethers.parseEther("1.0") }
    );

    // Bob submits, admin rejects
    await bountyBoard.connect(bob).submitSolution(1, "Bad attempt");
    await bountyBoard.connect(owner).rejectSubmission(1, "Does not meet standards");

    const bobProfile = await reputationSystem.getProfile(bob.address);
    expect(bobProfile.rejectedSubmissions).to.equal(1);

    // Charlie submits, creator (Alice) approves
    await bountyBoard.connect(charlie).submitSolution(1, "Good attempt");
    await bountyBoard.connect(alice).approveSubmission(2, "Great work!");

    const bounty = await bountyBoard.getBounty(1);
    expect(bounty.status).to.equal(3); // Completed

    const charlieProfile = await reputationSystem.getProfile(charlie.address);
    expect(charlieProfile.approvedSubmissions).to.equal(1);
  });
});
