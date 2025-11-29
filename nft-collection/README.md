# CustomNFT Collection - IPFS Setup Guide

## Overview

This directory contains the **CustomNFT collection** with **100 unique NFTs**:
- **1 Base Image** - Single SVG design used for all 100 NFTs
- **100 Metadata Files** - One JSON file per NFT (#0 through #99)
- **Incrementing Token IDs** - Each NFT has unique ID and attributes
- **Rarity Tiers** - Mythic, Legendary, Epic, Rare, Uncommon, Common
- **Upload guide** - Instructions for pinning to IPFS via Pinata

## Directory Structure

```
nft-collection/
├── metadata/              # 100 JSON metadata files (0-99.json)
├── images/
│   └── base.svg          # Single base image for entire collection
├── generate_metadata.py  # Script to regenerate metadata files
├── README.md             # This file
└── PINATA_GUIDE.md       # Step-by-step upload instructions
```

## NFT Collection Details

### Metadata Format

Each NFT follows the standard OpenSea/ERC-721 metadata format with unique token ID:

```json
{
  "name": "CustomNFT #0",
  "description": "CustomNFT #0 from the 100 piece collection. Rarity: Mythic. Element: Element.",
  "image": "ipfs://QmImageHash/base.svg",
  "external_url": "https://blockchainintegration.dev",
  "attributes": [
    {
      "trait_type": "Rarity",
      "value": "Mythic"
    },
    {
      "trait_type": "Element",
      "value": "Element"
    },
    {
      "trait_type": "Token ID",
      "value": "0"
    },
    {
      "trait_type": "Collection",
      "value": "CustomNFT"
    }
  ],
  "properties": {
    "category": "utility",
    "creators": [
      {
        "address": "0x",
        "share": 100
      }
    ]
  }
}
```

### Rarity Distribution

The 100 NFTs are distributed across 6 rarity tiers:

| Rarity | Token IDs | Count | Rarity Level |
|--------|-----------|-------|---|
| Mythic | 0-4 | 5 | Ultra Rare 🌟🌟🌟 |
| Legendary | 5-24 | 20 | Very Rare 🌟🌟 |
| Epic | 25-49 | 25 | Rare 🌟 |
| Rare | 50-69 | 20 | Uncommon |
| Uncommon | 70-84 | 15 | Common |
| Common | 85-99 | 15 | Standard |

**Total: 100 NFTs**

### Elements

Each rarity tier has multiple element types assigned to NFTs:
- **Mythic:** Divine
- **Legendary:** Ethereal, Cosmic, Phoenix
- **Epic:** Mastery, Power, Inferno
- **Rare:** Sapphire, Gold, Silver
- **Uncommon:** Crystal, Bronze, Jade
- **Common:** Stone, Glass, Iron

## How to Upload to IPFS via Pinata

### Step 1: Sign Up for Pinata

1. Go to **[pinata.cloud](https://pinata.cloud)**
2. Click **"Sign Up"** (free tier available)
3. Create account with email or MetaMask
4. Verify email address

### Step 2: Get API Keys

1. Go to **Account → API Keys**
2. Click **"New Key"**
3. Select **"Admin"** scope
4. Generate and save:
   - **API Key**
   - **API Secret**

### Step 3: Upload Base Image

1. Go to **Pinata Dashboard → Files**
2. Click **"Upload"** → **"File"**
3. Select `images/base.svg` (the single image for all 10,000 NFTs)
4. Click **Upload**
5. Wait for confirmation
6. **Copy the CID/Hash** (looks like: `QmXxxxxxxxxxxxx`)
7. Save this as **`IMAGE_IPFS_HASH`**

**Example:** `QmImageHash`

### Step 4: Update Metadata Files with Image Hash

1. **Open** `generate_metadata.py` in a text editor
2. **Find line:** `BASE_IMAGE_URI = "ipfs://QmImageHash/base.svg"`
3. **Replace** `QmImageHash` with your actual image hash from Step 3
4. **Save** the file
5. **Run the script:**
   ```bash
   python generate_metadata.py
   ```
   This regenerates all 100 metadata files with the correct image URI

### Step 5: Upload Metadata Folder

1. Go to **Pinata Dashboard → Files**
2. Click **"Upload"** → **"Folder"**
3. Select the `metadata/` folder (contains all 100 JSON files)
4. Click **Upload**
5. ⏳ **Wait for confirmation** (should be quick for 100 files)
6. **Copy the CID/Hash** 
7. Save this as **`METADATA_IPFS_HASH`**

**Example:** `QmMetadataHash`

## Using Collection URIs in Frontend

### Option A: Mint Individual NFTs (Recommended for Testing)

**Metadata CID:** `bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i`

Once uploaded to Pinata, use any token ID (0-99) in the frontend:

```
ipfs://bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/0.json    → CustomNFT #0 (Mythic)
ipfs://bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/10.json   → CustomNFT #10 (Legendary)
ipfs://bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/25.json   → CustomNFT #25 (Epic)
ipfs://bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/50.json   → CustomNFT #50 (Rare)
ipfs://bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/85.json   → CustomNFT #85 (Common)
ipfs://bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/99.json   → CustomNFT #99 (Common)
```

**You can mint ANY token ID from 0-99!**

### Option B: Set Base URI on Contract (Advanced)

If you want automatic URI generation:

1. Call contract function: `setBaseURI("ipfs://QmMetadataHash/")`
2. Then mint with IDs (0-11) and contract automatically generates URIs
3. Example: Minting token #100 → `ipfs://QmMetadataHash/100.json`
4. Example: Minting token #9999 → `ipfs://QmMetadataHash/9999.json`

## Pinata Gateway URLs

Once uploaded, view files via:

**Base Image:**
```
https://gateway.pinata.cloud/ipfs/QmImageHash/base.svg
```

**Metadata:**
```
https://gateway.pinata.cloud/ipfs/bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/0.json
https://gateway.pinata.cloud/ipfs/bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/50.json
https://gateway.pinata.cloud/ipfs/bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/99.json
etc. (all 100 files available)
```

## Alternative: Using Public IPFS Gateways

After Pinata upload, you can use public gateways:

```
https://ipfs.io/ipfs/QmHash/base.svg
https://dweb.link/ipfs/QmHash/0.json
https://nft.storage/ipfs/QmHash/9999.json
```

## Troubleshooting

### "File not found" when minting
- Verify IPFS hash is correct
- Check metadata file number exists (0-99)
- Ensure JSON is valid: use [JSONLint](https://jsonlint.com)
- Re-run `python generate_metadata.py` if using updated image hash

### Image URLs return 404
- Confirm base image is uploaded to Pinata
- Verify image hash is correctly in metadata files
- Use full gateway URL: `https://gateway.pinata.cloud/ipfs/...`
- IPFS might need time to propagate (wait 1-2 minutes)

### Metadata not displaying in wallets
- Ensure `name` field is present
- Ensure `image` field points to valid IPFS URL
- Verify JSON formatting is correct
- Some wallets cache metadata - try different wallet or wait

## Next Steps

1. ✅ Create metadata & images (Done)
2. ⬜ Upload to Pinata (See PINATA_GUIDE.md)
3. ⬜ Get IPFS hashes
4. ⬜ Mint NFTs using hashes from frontend
5. ⬜ View in wallet or OpenSea (once metadata is fetched)

## Resources

- **Pinata Docs:** https://docs.pinata.cloud
- **IPFS Docs:** https://docs.ipfs.io
- **ERC-721 Metadata Standard:** https://docs.opensea.io/docs/contract-level-metadata
- **OpenSea Collection Docs:** https://support.opensea.io/hc/en-us

## License

These NFTs and metadata are part of the Blockchain Integration Project demo.
