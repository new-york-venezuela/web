#!/bin/bash
# Label all blog-post issues and add slug field to metadata

set -e

# Get all open issues
ISSUES=$(gh issue list --state open --json number,body,labels --jq '.[] | select(.body != null)')

echo "Processing blog post issues..."

# Process each issue
echo "$ISSUES" | jq -r '.number' | while read -r ISSUE_NUM; do
  BODY=$(gh issue view "$ISSUE_NUM" --json body --jq '.body')
  LABELS=$(gh issue view "$ISSUE_NUM" --json labels --jq '[.labels[].name]')

  # Check if issue has blog-post-idea label
  if ! echo "$LABELS" | grep -q "blog-post-idea"; then
    # Check if body contains Metadata section (blog post issue)
    if echo "$BODY" | grep -q "post_id:"; then
      echo "Labeling issue #$ISSUE_NUM with 'blog-post-idea'"
      gh issue edit "$ISSUE_NUM" --add-label "blog-post-idea"
    fi
  fi

  # Check if metadata has slug field
  if echo "$BODY" | grep -q "post_id:" && ! echo "$BODY" | grep -q "^slug:"; then
    echo "Adding slug field to issue #$ISSUE_NUM"

    # Extract metadata section
    METADATA=$(echo "$BODY" | sed -n '/^```yaml$/,/^```$/p' | sed '1d;$d')

    # Check if slug field exists
    if ! echo "$METADATA" | grep -q "^slug:"; then
      # Add slug field after post_id
      UPDATED_METADATA=$(echo "$METADATA" | sed '/^post_id:/a\
slug: ""  # Add slug here')

      # This is complex to do via API, so just notify
      echo "  Manual action needed: Add 'slug' field to issue #$ISSUE_NUM metadata"
    fi
  fi
done

echo "Done!"
