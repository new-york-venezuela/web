#!/bin/bash
# Add slug field to all blog post issues via GitHub API

set -e

REPO="new-york-venezuela/web"

echo "Adding slug field to blog post issues..."

# Get all issues with blog-post-idea label
gh issue list --repo "$REPO" --label "blog-post-idea" --state open --json number,body --jq '.[]' | jq -r '.number' | while read -r ISSUE_NUM; do
  BODY=$(gh issue view "$ISSUE_NUM" --repo "$REPO" --json body --jq '.body')

  # Check if slug field already exists
  if ! echo "$BODY" | grep -q "^slug:"; then
    echo "Processing issue #$ISSUE_NUM"

    # Extract post_id to generate slug if needed
    POST_ID=$(echo "$BODY" | grep "post_id:" | head -1 | sed 's/.*post_id: *//;s/ *#.*//' | tr -d '"')

    # Generate default slug from post_id if it exists
    if [ -n "$POST_ID" ]; then
      DEFAULT_SLUG=$(echo "$POST_ID" | tr '[:upper:]' '[:lower:]')
    else
      DEFAULT_SLUG="post-slug-${ISSUE_NUM}"
    fi

    # Insert slug field after post_id in the metadata
    UPDATED_BODY=$(echo "$BODY" | sed "/post_id:/a\\
slug: \"${DEFAULT_SLUG}\"")

    # Update issue via API (more reliable than gh issue edit)
    gh api repos/"$REPO"/issues/"$ISSUE_NUM" \
      --input - <<EOF
{
  "body": $(echo "$UPDATED_BODY" | jq -R -s .)
}
EOF

    echo "  ✓ Added slug field (slug: \"${DEFAULT_SLUG}\")"
  else
    echo "Issue #$ISSUE_NUM already has slug field, skipping"
  fi
done

echo "Done!"
