"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { useWeb3 } from "@/contexts/Web3Context";
import { useContracts } from "@/contexts";

const CATEGORIES = [
  { value: "implementation", label: "Implementation" },
  { value: "cryptanalysis", label: "Cryptanalysis" },
  { value: "research", label: "Research" },
  { value: "documentation", label: "Documentation" },
  { value: "audit", label: "Security Audit" },
  { value: "optimization", label: "Optimization" },
];

const DIFFICULTIES = [
  { value: "1", label: "Beginner - Basic cryptographic concepts" },
  { value: "2", label: "Intermediate - Moderate complexity" },
  { value: "3", label: "Advanced - Deep expertise required" },
  { value: "4", label: "Expert - Cutting-edge research" },
];

export default function CreateBountyPage() {
  const router = useRouter();
  const { wallet } = useWeb3();
  const { createBounty, bountyBoardAddress } = useContracts();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "",
    reward: "",
    deadline: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 10) {
      newErrors.title = "Title must be at least 10 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 50) {
      newErrors.description = "Description must be at least 50 characters";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.difficulty) {
      newErrors.difficulty = "Difficulty is required";
    }

    if (!formData.reward) {
      newErrors.reward = "Reward is required";
    } else if (parseFloat(formData.reward) < 0.01) {
      newErrors.reward = "Minimum reward is 0.01 ARM";
    }

    if (!formData.deadline) {
      newErrors.deadline = "Deadline is required";
    } else {
      const deadlineDate = new Date(formData.deadline);
      if (deadlineDate <= new Date()) {
        newErrors.deadline = "Deadline must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const deadline = Math.floor(new Date(formData.deadline).getTime() / 1000);
      
      const success = await createBounty(
        formData.title,
        formData.description,
        formData.category,
        parseInt(formData.difficulty),
        deadline,
        formData.reward
      );

      if (success) {
        router.push("/bounties");
      } else {
        setSubmitError("Failed to create bounty. Please check your wallet and try again.");
      }
    } catch (error) {
      console.error("Failed to create bounty:", error);
      setSubmitError("Failed to create bounty. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <PageContainer
      title="Create Bounty"
      description="Post a new cryptographic challenge for the community"
    >
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Bounty Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Title"
                placeholder="e.g., Implement SPHINCS+ signature verification"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                error={errors.title}
                required
              />

              <Textarea
                label="Description"
                placeholder="Describe the challenge in detail. Include requirements, deliverables, and evaluation criteria."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                error={errors.description}
                rows={10}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  options={[{ value: "", label: "Select category..." }, ...CATEGORIES]}
                  error={errors.category}
                  required
                />

                <Select
                  label="Difficulty"
                  value={formData.difficulty}
                  onChange={(e) => handleChange("difficulty", e.target.value)}
                  options={[{ value: "", label: "Select difficulty..." }, ...DIFFICULTIES]}
                  error={errors.difficulty}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Reward (ARM)"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="1.0"
                  value={formData.reward}
                  onChange={(e) => handleChange("reward", e.target.value)}
                  error={errors.reward}
                  required
                />

                <Input
                  label="Deadline"
                  type="date"
                  min={minDate}
                  value={formData.deadline}
                  onChange={(e) => handleChange("deadline", e.target.value)}
                  error={errors.deadline}
                  required
                />
              </div>

              {/* Summary */}
              {formData.reward && (
                <div className="bg-neutral-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Bounty Reward</span>
                      <span>{formData.reward} ARM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Platform Fee (5%)</span>
                      <span>{(parseFloat(formData.reward) * 0.05).toFixed(4)} ARM</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1 mt-1">
                      <span>Winner Receives</span>
                      <span className="text-blue-600">
                        {(parseFloat(formData.reward) * 0.95).toFixed(4)} ARM
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!wallet.isConnected && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  Please connect your wallet to create a bounty.
                </div>
              )}

              {!bountyBoardAddress && wallet.isConnected && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  BountyBoard contract not deployed on this network. Please switch to a supported network.
                </div>
              )}

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                  {submitError}
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!wallet.isConnected || !bountyBoardAddress || isSubmitting}
                >
                  {isSubmitting ? "Creating..." : `Create Bounty`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
