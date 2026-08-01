import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BootstrapOwner() {
  const status = useQuery(api.companyMembers.getBootstrapStatus, {});
  const bootstrapOwner = useMutation(api.companyMembers.bootstrapOwner);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!status?.eligible) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await bootstrapOwner({ name, email });
      if (!result.success) setError(result.error);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Owner access could not be initialized.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-5 space-y-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-left">
      <div>
        <div className="text-[12px] font-semibold text-ink">Initialize {status.tenantName}</div>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-secondary">
          Your exact Clerk identity is allowlisted as this company's first owner. This one-time path closes after creation.
        </p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="bootstrap-owner-name">Name</Label>
        <Input id="bootstrap-owner-name" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="bootstrap-owner-email">Email</Label>
        <Input id="bootstrap-owner-email" type="email" value={email} maxLength={254} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      {error ? <div role="alert" className="text-[11px] text-danger">{error}</div> : null}
      <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Initializing…" : "Initialize owner access"}</Button>
    </form>
  );
}
