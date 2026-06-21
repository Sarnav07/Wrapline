#!/usr/bin/env bash
# Register an ERC-20 ↔ ERC-7984 wrapper pair with the Zama Wrappers Registry.
#
# Requirements: Foundry (cast). https://getfoundry.sh
#   brew install foundry   # macOS
#   foundryup              # update
#
# Usage (Sepolia — default):
#   PRIVATE_KEY=0x… ERC20_ADDRESS=0x… WRAPPER_ADDRESS=0x… bash scripts/register-pair.sh
#
# Usage (Mainnet):
#   CHAIN=mainnet PRIVATE_KEY=0x… ERC20_ADDRESS=0x… WRAPPER_ADDRESS=0x… bash scripts/register-pair.sh
#
# Optional overrides:
#   SEPOLIA_RPC=https://…  — custom Sepolia RPC (default: public endpoint)
#   MAINNET_RPC=https://…  — custom Mainnet RPC (default: public endpoint)
set -euo pipefail

: "${PRIVATE_KEY:?Set PRIVATE_KEY to the deployer private key}"
: "${ERC20_ADDRESS:?Set ERC20_ADDRESS to the underlying ERC-20 address}"
: "${WRAPPER_ADDRESS:?Set WRAPPER_ADDRESS to the ERC-7984 wrapper address}"

CHAIN="${CHAIN:-sepolia}"

if [ "$CHAIN" = "mainnet" ]; then
  REGISTRY="0xeb5015fF021DB115aCe010f23F55C2591059bBA0"
  RPC="${MAINNET_RPC:-https://eth.llamarpc.com}"
else
  REGISTRY="0x2f0750Bbb0A246059d80e94c454586a7F27a128e"
  RPC="${SEPOLIA_RPC:-https://rpc.sepolia.org}"
fi

echo "Chain:   $CHAIN"
echo "Registry: $REGISTRY"
echo "ERC-20:  $ERC20_ADDRESS"
echo "Wrapper: $WRAPPER_ADDRESS"
echo ""
echo "Sending registerConfidentialToken…"

cast send \
  --rpc-url "$RPC" \
  --private-key "$PRIVATE_KEY" \
  "$REGISTRY" \
  "registerConfidentialToken(address,address)" \
  "$ERC20_ADDRESS" \
  "$WRAPPER_ADDRESS"

echo ""
echo "Done. The pair will appear in Wrapline on the next registry load."
