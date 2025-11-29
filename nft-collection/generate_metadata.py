#!/usr/bin/env python3
"""
Generate 100 NFT metadata files for CustomNFT collection.
Each NFT references the same base image but has unique metadata.
"""

import json
import os
from pathlib import Path

# Configuration
TOTAL_NFTS = 100
METADATA_DIR = Path(__file__).parent / "metadata"
BASE_IMAGE_URI = "ipfs://bafybeig5xvfwi2e2bdai6lngjzok2aktxeyqorx6gwpw25mu5p4bjmqtaa/base.svg"  # Pinata image hash
EXTERNAL_URL = "https://blockchainintegration.dev"
METADATA_CID = "bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i"  # Metadata folder CID on Pinata

# Ensure metadata directory exists
METADATA_DIR.mkdir(exist_ok=True)

# Define rarity distribution for 100 NFTs
rarity_tiers = {
    "Mythic": (0, 5, ["Divine"]),
    "Legendary": (5, 25, ["Ethereal", "Cosmic", "Phoenix"]),
    "Epic": (25, 50, ["Mastery", "Power", "Inferno"]),
    "Rare": (50, 70, ["Sapphire", "Gold", "Silver"]),
    "Uncommon": (70, 85, ["Crystal", "Bronze", "Jade"]),
    "Common": (85, 100, ["Stone", "Glass", "Iron"]),
}

def get_rarity_and_element(token_id):
    """Determine rarity tier and element based on token ID."""
    for rarity, (min_id, max_id, elements), in rarity_tiers.items():
        if min_id <= token_id < max_id:
            element_idx = token_id % len(elements)
            return rarity, elements[element_idx]
    return "Common", "Stone"

def create_metadata(token_id):
    """Create metadata for a single NFT."""
    rarity, element = get_rarity_and_element(token_id)
    
    metadata = {
        "name": f"CustomNFT #{token_id}",
        "description": f"CustomNFT #{token_id} from the 100 piece collection. Rarity: {rarity}. Element: {element}.",
        "image": BASE_IMAGE_URI,
        "external_url": EXTERNAL_URL,
        "attributes": [
            {
                "trait_type": "Rarity",
                "value": rarity
            },
            {
                "trait_type": "Element",
                "value": element
            },
            {
                "trait_type": "Token ID",
                "value": str(token_id)
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
    
    return metadata

def main():
    """Generate all 100 metadata files."""
    print(f"Generating {TOTAL_NFTS} metadata files...")
    
    for token_id in range(TOTAL_NFTS):
        # Create metadata
        metadata = create_metadata(token_id)
        
        # Write to file
        file_path = METADATA_DIR / f"{token_id}.json"
        with open(file_path, "w") as f:
            json.dump(metadata, f, indent=2)
        
        # Progress indicator
        if (token_id + 1) % 10 == 0:
            print(f"✓ Generated {token_id + 1}/{TOTAL_NFTS} metadata files")
    
    print(f"\n✅ All {TOTAL_NFTS} metadata files created successfully!")
    print(f"📁 Location: {METADATA_DIR}")
    print(f"\nRarity Distribution:")
    print(f"  - Mythic (0-4): 5 NFTs")
    print(f"  - Legendary (5-24): 20 NFTs")
    print(f"  - Epic (25-49): 25 NFTs")
    print(f"  - Rare (50-69): 20 NFTs")
    print(f"  - Uncommon (70-84): 15 NFTs")
    print(f"  - Common (85-99): 15 NFTs")
    print(f"\nNext steps:")
    print(f"1. Upload 'images/base.svg' to Pinata → Get image IPFS hash")
    print(f"2. Update BASE_IMAGE_URI in this script with the hash")
    print(f"3. Upload 'metadata/' folder to Pinata → Get metadata IPFS hash")
    print(f"4. Use 'ipfs://METADATA_HASH/0.json' through 'ipfs://METADATA_HASH/99.json' for minting")

if __name__ == "__main__":
    main()
