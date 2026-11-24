"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { updateSubscription } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PLAN_IDS,
  PLANS,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_STATUS_META,
  type PlanId,
  type SubscriptionStatus,
} from "@/lib/constants";

export function SubscriptionForm({
  companyId,
  plan,
  status,
  expiresAt,
}: {
  companyId: string;
  plan: PlanId;
  status: SubscriptionStatus;
  expiresAt: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [values, setValues] = React.useState({
    plan,
    status,
    expiresAt: new Date(expiresAt).toISOString().slice(0, 10),
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await updateSubscription({ companyId, ...values });
    setPending(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.success);
      router.refresh();
    }
  }

  const selectedPlan = PLANS[values.plan];

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Plan</Label>
          <Select
            value={values.plan}
            onValueChange={(value) => setValues({ ...values, plan: value as PlanId })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLAN_IDS.map((planId) => (
                <SelectItem key={planId} value={planId}>
                  {PLANS[planId].name} · {PLANS[planId].priceMAD} MAD/mois
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-400">
            {selectedPlan.maxProducts} produits · {selectedPlan.maxCustomers} clients
          </p>
        </div>

        <div className="space-y-2">
          <Label>Statut</Label>
          <Select
            value={values.status}
            onValueChange={(value) => setValues({ ...values, status: value as SubscriptionStatus })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUBSCRIPTION_STATUSES.map((subscriptionStatus) => (
                <SelectItem key={subscriptionStatus} value={subscriptionStatus}>
                  {SUBSCRIPTION_STATUS_META[subscriptionStatus].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="subscription-expiry">Date d'expiration</Label>
          <Input
            id="subscription-expiry"
            type="date"
            value={values.expiresAt}
            onChange={(event) => setValues({ ...values, expiresAt: event.target.value })}
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Mettre à jour l'abonnement
      </Button>
    </form>
  );
}
