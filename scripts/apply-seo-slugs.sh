#!/bin/bash
# Apply SEO-optimized slugs to all blog post issues

set -e

# Load the generated slugs
SLUGS_FILE=".context/seo-slugs.json"

if [ ! -f "$SLUGS_FILE" ]; then
  echo "Error: $SLUGS_FILE not found. Run generate-seo-slugs.py first."
  exit 1
fi

REPO="new-york-venezuela/web"
TOTAL=$(jq '. | length' "$SLUGS_FILE")
APPLIED=0

echo "Applying $TOTAL SEO-optimized slugs to GitHub issues..."

# Process each slug
jq -c '.[]' "$SLUGS_FILE" | while read -r issue_data; do
  ISSUE_NUM=$(echo "$issue_data" | jq -r '.number')
  NEW_SLUG=$(echo "$issue_data" | jq -r '.slug')
  POST_ID=$(echo "$issue_data" | jq -r '.post_id')

  echo "Applying: Issue #$ISSUE_NUM → slug: $NEW_SLUG"

  # Fetch current issue body
  BODY=$(gh issue view "$ISSUE_NUM" --repo "$REPO" --json body --jq '.body')

  # Check if slug field already exists
  if echo "$BODY" | grep -q "^slug:"; then
    # Replace existing slug
    UPDATED_BODY=$(echo "$BODY" | sed "s/^slug:.*$/slug: \"${NEW_SLUG}\"/")
  else
    # Add slug field after post_id
    UPDATED_BODY=$(echo "$BODY" | sed "/^post_id:/a\\
slug: \"${NEW_SLUG}\"")
  fi

  # Update issue body via API
  gh api repos/"$REPO"/issues/"$ISSUE_NUM" \
    --input - <<EOF
{
  "body": $(echo "$UPDATED_BODY" | jq -R -s .)
}
EOF

  ((APPLIED++))
  echo "  ✓ Applied"
done

echo ""
echo "✓ Applied $APPLIED/$TOTAL slugs successfully"
