import { Pool } from "../../generated/templates";
import { AddressesProviderRegistered } from "../../generated/PoolAddressesProviderRegistry/PoolAddressesProviderRegistry";

export function handleAddressesProviderRegistered(event: AddressesProviderRegistered): void {
    Pool.create(event.params.addressesProvider)
}