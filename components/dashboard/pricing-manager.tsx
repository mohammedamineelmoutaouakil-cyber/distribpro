"use client";

import { Loader2, Percent, Plus, Tag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { deletePrice, saveCustomerPrice, saveGroupPrice } from "@/actions/pricing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMAD } from "@/lib/money";
import { cn } from "@/lib/utils";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  basePriceCentimes: number;
}

interface GroupOption {
  id: string;
  name: string;
}

interface CustomerOption {
  id: string;
  companyName: string;
  groupName: string | null;
}

interface GroupPriceRow {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  groupId: string;
  groupName: string;
  basePriceCentimes: number;
  priceCentimes: number;
}

interface CustomerPriceRow {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  customerId: string;
  customerName: string;
  basePriceCentimes: number;
  priceCentimes: number;
}

function discount(base: number, price: number) {
  if (base <= 0) return null;
  return ((base - price) / base) * 100;
}

function PriceCell({ base, price }: { base: number; price: number }) {
  const pct = discount(base, price);
  return (
    <div className="text-right">
      <p className="font-medium text-navy">{formatMAD(price)}</p>
      <p className={cn("text-[11px]", pct && pct > 0 ? "text-emerald-600" : pct && pct < 0 ? "text-rose-600" : "text-slate-400")}>
        {pct === null ? "—" : pct > 0 ? `−${pct.toFixed(1)}%` : pct < 0 ? `+${Math.abs(pct).toFixed(1)}%` : "Prix de base"}
      </p>
    </div>
  );
}

export function PricingManager({
  products,
  groups,
  customers,
  groupPrices,
  customerPrices,
  initialCustomerId,
}: {
  products: ProductOption[];
  groups: GroupOption[];
  customers: CustomerOption[];
  groupPrices: GroupPriceRow[];
  customerPrices: CustomerPriceRow[];
  initialCustomerId?: string;
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState(initialCustomerId ? "customer" : "group");

  const [groupForm, setGroupForm] = React.useState({
    groupId: groups[0]?.id ?? "",
    productId: "",
    price: "",
  });
  const [customerForm, setCustomerForm] = React.useState({
    customerId: initialCustomerId ?? customers[0]?.id ?? "",
    productId: "",
    price: "",
  });
  const [pending, setPending] = React.useState<string | null>(null);
  const [productSearch, setProductSearch] = React.useState("");

  const selectedGroupProduct = products.find((p) => p.id === groupForm.productId);
  const selectedCustomerProduct = products.find((p) => p.id === customerForm.productId);
  const selectedCustomer = customers.find((c) => c.id === customerForm.customerId);

  const filteredProducts = React.useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query)
    );
  }, [products, productSearch]);

  React.useEffect(() => {
    const current = tab === "group" ? groupForm : customerForm;
    const product = products.find((p) => p.id === current.productId);
    if (!product) return;
    const existing =
      tab === "group"
        ? groupPrices.find((row) => row.productId === current.productId && row.groupId === groupForm.groupId)
        : customerPrices.find((row) => row.productId === current.productId && row.customerId === customerForm.customerId);
    if (existing) {
      const next = (existing.priceCentimes / 100).toFixed(2);
      if (tab === "group" && groupForm.price !== next) setGroupForm((prev) => ({ ...prev, price: next }));
      if (tab === "customer" && customerForm.price !== next) setCustomerForm((prev) => ({ ...prev, price: next }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupForm.productId, groupForm.groupId, customerForm.productId, customerForm.customerId, tab]);

  async function saveGroup(event: React.FormEvent) {
    event.preventDefault();
    if (!groupForm.groupId || !groupForm.productId || !groupForm.price) {
      toast.error("Sélectionnez un groupe, un produit et un prix.");
      return;
    }
    setPending("group");
    const result = await saveGroupPrice(groupForm);
    setPending(null);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.success);
      setGroupForm((prev) => ({ ...prev, price: "" }));
      router.refresh();
    }
  }

  async function saveCustomer(event: React.FormEvent) {
    event.preventDefault();
    if (!customerForm.customerId || !customerForm.productId || !customerForm.price) {
      toast.error("Sélectionnez un client, un produit et un prix.");
      return;
    }
    setPending("customer");
    const result = await saveCustomerPrice(customerForm);
    setPending(null);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.success);
      setCustomerForm((prev) => ({ ...prev, price: "" }));
      router.refresh();
    }
  }

  async function remove(kind: "group" | "customer", id: string) {
    setPending(id);
    const result = await deletePrice(kind, id);
    setPending(null);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.success);
      router.refresh();
    }
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="group">Tarifs par groupe</TabsTrigger>
        <TabsTrigger value="customer">Tarifs par client</TabsTrigger>
      </TabsList>

      <TabsContent value="group" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Définir un tarif de groupe</CardTitle>
            <p className="text-xs text-slate-500">
              Le tarif de groupe s'applique à tous les clients du groupe, sauf tarif individuel.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveGroup} className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Groupe client</Label>
                <Select value={groupForm.groupId} onValueChange={(value) => setGroupForm({ ...groupForm, groupId: value })}>
                  <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Produit</Label>
                <Input
                  placeholder="Filtrer par nom ou SKU…"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  className="mb-2"
                />
                <Select value={groupForm.productId} onValueChange={(value) => setGroupForm({ ...groupForm, productId: value })}>
                  <SelectTrigger><SelectValue placeholder="Choisir un produit" /></SelectTrigger>
                  <SelectContent>
                    {filteredProducts.slice(0, 100).map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} · {product.sku}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-price">Prix (MAD)</Label>
                <div className="flex gap-2">
                  <Input
                    id="group-price"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={groupForm.price}
                    onChange={(event) => setGroupForm({ ...groupForm, price: event.target.value })}
                  />
                  <Button type="submit" disabled={pending === "group"}>
                    {pending === "group" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
                {selectedGroupProduct && (
                  <p className="text-[11px] text-slate-400">Prix de base : {formatMAD(selectedGroupProduct.basePriceCentimes)}</p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tarifs de groupe définis</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {groupPrices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Produit</TableHead>
                    <TableHead>Groupe</TableHead>
                    <TableHead className="text-right">Prix de base</TableHead>
                    <TableHead className="text-right">Tarif groupe</TableHead>
                    <TableHead className="pr-5 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupPrices.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="pl-5">
                        <p className="font-medium text-navy">{row.productName}</p>
                        <p className="font-mono text-[11px] text-slate-400">{row.sku}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline">{row.groupName}</Badge></TableCell>
                      <TableCell className="text-right text-xs text-slate-500">{formatMAD(row.basePriceCentimes)}</TableCell>
                      <TableCell><PriceCell base={row.basePriceCentimes} price={row.priceCentimes} /></TableCell>
                      <TableCell className="pr-5 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => remove("group", row.id)} disabled={pending === row.id}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <Tag className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">Aucun tarif de groupe défini.</p>
                <p className="text-xs text-slate-400">Tous les clients paient le prix de base.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="customer" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Définir un tarif client</CardTitle>
            <p className="text-xs text-slate-500">
              Le tarif individuel est prioritaire sur le tarif de groupe et le prix de base.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveCustomer} className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={customerForm.customerId} onValueChange={(value) => setCustomerForm({ ...customerForm, customerId: value })}>
                  <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>{customer.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCustomer && (
                  <p className="text-[11px] text-slate-400">Groupe : {selectedCustomer.groupName ?? "Aucun"}</p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Produit</Label>
                <Input
                  placeholder="Filtrer par nom ou SKU…"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  className="mb-2"
                />
                <Select value={customerForm.productId} onValueChange={(value) => setCustomerForm({ ...customerForm, productId: value })}>
                  <SelectTrigger><SelectValue placeholder="Choisir un produit" /></SelectTrigger>
                  <SelectContent>
                    {filteredProducts.slice(0, 100).map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} · {product.sku}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-price">Prix (MAD)</Label>
                <div className="flex gap-2">
                  <Input
                    id="customer-price"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={customerForm.price}
                    onChange={(event) => setCustomerForm({ ...customerForm, price: event.target.value })}
                  />
                  <Button type="submit" disabled={pending === "customer"}>
                    {pending === "customer" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
                {selectedCustomerProduct && (
                  <p className="text-[11px] text-slate-400">Prix de base : {formatMAD(selectedCustomerProduct.basePriceCentimes)}</p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tarifs clients définis</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {customerPrices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Produit</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Prix de base</TableHead>
                    <TableHead className="text-right">Tarif client</TableHead>
                    <TableHead className="pr-5 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerPrices.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="pl-5">
                        <p className="font-medium text-navy">{row.productName}</p>
                        <p className="font-mono text-[11px] text-slate-400">{row.sku}</p>
                      </TableCell>
                      <TableCell className="text-sm">{row.customerName}</TableCell>
                      <TableCell className="text-right text-xs text-slate-500">{formatMAD(row.basePriceCentimes)}</TableCell>
                      <TableCell><PriceCell base={row.basePriceCentimes} price={row.priceCentimes} /></TableCell>
                      <TableCell className="pr-5 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => remove("customer", row.id)} disabled={pending === row.id}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <Percent className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">Aucun tarif client individuel.</p>
                <p className="text-xs text-slate-400">Les tarifs de groupe et prix de base s'appliquent.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
