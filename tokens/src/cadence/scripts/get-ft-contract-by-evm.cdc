import "FungibleTokenMetadataViews"

import "EVM"
import "FlowEVMBridge"
import "FlowEVMBridgeConfig"
import "FlowEVMBridgeUtils"

import "EVMTokenList"

access(all)
fun main(
    evmContractAddress: String,
): EVMAssetStatus? {
    if evmContractAddress.length != 42 && evmContractAddress.length != 40 {
        return nil
    }
    let addrNo0x = evmContractAddress.slice(from: 0, upTo: 2) == "0x"
            ? evmContractAddress.slice(from: 2, upTo: evmContractAddress.length)
            : evmContractAddress
    let acct = EVM.addressFromString(addrNo0x)

    let isRequires = FlowEVMBridge.evmAddressRequiresOnboarding(acct)
    if isRequires == nil {
        return nil
    }

    let isERC20 = FlowEVMBridgeUtils.isERC20(evmContractAddress: acct)
    if isERC20 == false {
        return nil
    }

    var bridgedAddress: Address? = nil
    var bridgedContractName: String? = nil
    if let type = FlowEVMBridgeConfig.getTypeAssociated(with: acct) {
        bridgedAddress = FlowEVMBridgeUtils.getContractAddress(fromType: type)
        bridgedContractName = FlowEVMBridgeUtils.getContractName(fromType: type)
    }

    var display: FungibleTokenMetadataViews.FTDisplay? = nil
    let isRegistered: Bool = EVMTokenList.isEVMAddressRegistered(acct.toString())
    if isRegistered {
        let registry = EVMTokenList.borrowRegistry()
        if let entry = registry.borrowFungibleTokenEntry(acct.toString()) {
            if let displayRef = entry.getDisplay(nil) {
                display = displayRef.display
            }
        }
    }

    return EVMAssetStatus(
        address: acct,
        isRegistered: isRegistered,
        isBridged: isRequires == false,
        bridgedAddress: bridgedAddress,
        bridgedContractName: bridgedContractName,
        display: display
    )
}

access(all) struct EVMAssetStatus {
    access(all)
    let evmAddress: String
    access(all)
    let isRegistered: Bool
    access(all)
    let isBridged: Bool
    access(all)
    let bridgedAddress: Address?
    access(all)
    let bridgedContractName: String?
    access(all)
    let display: FungibleTokenMetadataViews.FTDisplay?

    init(
        address: EVM.EVMAddress,
        isRegistered: Bool,
        isBridged: Bool,
        bridgedAddress: Address?,
        bridgedContractName: String?,
        display: FungibleTokenMetadataViews.FTDisplay?
    ) {
        self.evmAddress = address.toString()
        self.isRegistered = isRegistered
        self.isBridged = isBridged
        self.bridgedAddress = bridgedAddress
        self.bridgedContractName = bridgedContractName
        self.display = display
    }
}
