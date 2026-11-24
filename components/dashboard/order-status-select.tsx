"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { updateOrderStatus } from "@/actions/orders";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORDER_STATUSES, ORDER_STATUS_META, type OrderStatus } from "@/lib/constants";

export function OrderStatusSelect({
  orderId,
  status,
  disabled,
}: {
  orderId: string;
  status: OrderStatus;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function change(next: string) {
    setPending(true);
    const result = await updateOrderStatus({ orderId, status: next });
    setPending(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.success);
      router.refresh();
    }
  }

  return (
    <Select value={status} onValueChange={change} disabled={pending || disabled}>
      <SelectTrigger className="h-8 w-[150px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((value) => (
          <SelectItem key={value} value={value}>
            {ORDER_STATUS_META[value].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
